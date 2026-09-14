// =============================================================================
// METRICS SERVICE — participaciones y métricas de rendimiento
// =============================================================================
// Cambio estructural respecto al Ciclo 1:
//
//   ANTES: todo era EAV (`performance_metrics`), y cada eje del radar disparaba
//          su propio `aggregate`. Seis consultas independientes para pintar una
//          tarjeta, sobre una tabla que crece por jugador × partido × métrica.
//
//   AHORA: las métricas del hot-path (las que alimentan radar y ranking) son
//          columnas tipadas de `Appearance`, y una sola consulta agregada
//          devuelve la temporada completa de un jugador. El EAV
//          (`MetricObservation`) queda para la cola larga de eventos, acotado
//          por el catálogo `MetricDefinition`.
// =============================================================================

import { Prisma, Position } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { CORE_METRIC_COLUMNS, type CoreMetricColumn } from "@/lib/domain/metrics";

export { CORE_METRIC_COLUMNS };
export type { CoreMetricColumn };


export interface AppearanceInput {
  matchId: string;
  minutesPlayed: number;
  positionPlayed: Position;
  startedMatch?: boolean;
  /** Totales del partido para las columnas tipadas. */
  core?: Partial<Record<CoreMetricColumn, number>>;
  /** Métricas de la cola larga; la clave debe existir en MetricDefinition. */
  observations?: Array<{ metricKey: string; metricValue: number }>;
  recordedById?: string;
}

export interface SeasonTotals {
  playerId: string;
  season: string;
  matches: number;
  minutesPlayed: number;
  /** Posición en la que jugó más minutos en la temporada. */
  primaryPosition: Position | null;
  totals: Record<CoreMetricColumn, number>;
}

// ---------------------------------------------------------------------------
// Registrar la participación de un jugador en un partido (idempotente).
// ---------------------------------------------------------------------------
export async function recordAppearance(
  orgId: string,
  playerId: string,
  input: AppearanceInput
): Promise<{ appearanceId: string; observationsWritten: number }> {
  return prisma.$transaction(async (tx) => {
    // El partido y el jugador deben pertenecer a la misma organización.
    const [player, match] = await Promise.all([
      tx.player.findFirst({ where: { id: playerId, organizationId: orgId }, select: { id: true } }),
      tx.match.findFirst({
        where: { id: input.matchId, organizationId: orgId },
        select: { id: true },
      }),
    ]);

    if (!player) throw new Error(`Jugador ${playerId} no encontrado en esta organización.`);
    if (!match) throw new Error(`Partido ${input.matchId} no encontrado en esta organización.`);

    // Este spread SÍ es seguro, a diferencia del `...validated.data` que rompió
    // el Ciclo 1: las claves son la unión literal `CoreMetricColumn`, así que el
    // compilador las contrasta contra el input de Prisma. Lo prohibido es
    // esparcir datos del wire, cuyas claves el compilador no conoce.
    const coreData: Partial<Record<CoreMetricColumn, number>> = input.core ?? {};

    const appearance = await tx.appearance.upsert({
      where: { playerId_matchId: { playerId, matchId: input.matchId } },
      update: {
        minutesPlayed: input.minutesPlayed,
        positionPlayed: input.positionPlayed,
        startedMatch: input.startedMatch ?? true,
        ...coreData,
        recordedById: input.recordedById,
      },
      create: {
        organizationId: orgId,
        playerId,
        matchId: input.matchId,
        minutesPlayed: input.minutesPlayed,
        positionPlayed: input.positionPlayed,
        startedMatch: input.startedMatch ?? true,
        ...coreData,
        recordedById: input.recordedById,
      },
      select: { id: true },
    });

    let observationsWritten = 0;

    if (input.observations?.length) {
      // Una observación por (appearance, métrica): reenviar el mismo partido
      // corrige el valor en vez de duplicarlo.
      for (const observation of input.observations) {
        await tx.metricObservation.upsert({
          where: {
            appearanceId_metricKey: {
              appearanceId: appearance.id,
              metricKey: observation.metricKey,
            },
          },
          update: { metricValue: observation.metricValue, recordedAt: new Date() },
          create: {
            organizationId: orgId,
            appearanceId: appearance.id,
            metricKey: observation.metricKey,
            metricValue: observation.metricValue,
          },
        });
        observationsWritten += 1;
      }
    }

    return { appearanceId: appearance.id, observationsWritten };
  });
}

// ---------------------------------------------------------------------------
// Serie de participaciones de un jugador (para gráficos de evolución).
// ---------------------------------------------------------------------------
export async function getPlayerAppearances(
  orgId: string,
  playerId: string,
  options: { season?: string; from?: Date; to?: Date; limit?: number } = {}
) {
  const { season, from, to, limit = 100 } = options;

  const matchFilter: Prisma.MatchWhereInput = {
    ...(season ? { season } : {}),
    ...(from || to
      ? { kickoffAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const appearances = await prisma.appearance.findMany({
    where: {
      organizationId: orgId,
      playerId,
      ...(Object.keys(matchFilter).length > 0 ? { match: matchFilter } : {}),
    },
    select: {
      id: true,
      minutesPlayed: true,
      positionPlayed: true,
      goals: true,
      assists: true,
      shots: true,
      keyPasses: true,
      dribblesCompleted: true,
      tacklesWon: true,
      interceptions: true,
      pressures: true,
      match: {
        select: { id: true, kickoffAt: true, competition: true, season: true, tier: true },
      },
    },
    orderBy: { match: { kickoffAt: "asc" } },
    take: Math.min(limit, 500),
  });

  return appearances;
}

// ---------------------------------------------------------------------------
// Totales de temporada — UNA sola consulta agregada.
// Es la entrada del motor de rating (MM-014).
// ---------------------------------------------------------------------------
export async function getSeasonTotals(
  orgId: string,
  playerId: string,
  season: string
): Promise<SeasonTotals | null> {
  const where: Prisma.AppearanceWhereInput = {
    organizationId: orgId,
    playerId,
    match: { season },
  };

  const [aggregate, byPosition] = await Promise.all([
    prisma.appearance.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        minutesPlayed: true,
        goals: true,
        assists: true,
        shots: true,
        keyPasses: true,
        passesAttempted: true,
        passesCompleted: true,
        progressivePasses: true,
        dribblesAttempted: true,
        dribblesCompleted: true,
        tacklesWon: true,
        interceptions: true,
        aerialDuelsWon: true,
        aerialDuelsTotal: true,
        pressures: true,
      },
    }),
    prisma.appearance.groupBy({
      by: ["positionPlayed"],
      where,
      _sum: { minutesPlayed: true },
      orderBy: { _sum: { minutesPlayed: "desc" } },
      take: 1,
    }),
  ]);

  if (aggregate._count._all === 0) return null;

  const sums = aggregate._sum;

  const totals = CORE_METRIC_COLUMNS.reduce(
    (acc, column) => {
      acc[column] = sums[column] ?? 0;
      return acc;
    },
    {} as Record<CoreMetricColumn, number>
  );

  return {
    playerId,
    season,
    matches: aggregate._count._all,
    minutesPlayed: sums.minutesPlayed ?? 0,
    primaryPosition: byPosition[0]?.positionPlayed ?? null,
    totals,
  };
}
