// =============================================================================
// RATING SERVICE — lectura de ratings publicados
// =============================================================================
// NOTA DE ALCANCE (MM-001).
//
// La función `computeAndPersistRating` del Ciclo 1 se ha ELIMINADO, no migrado.
// Motivos, en orden de gravedad:
//
//   1. No se invocaba desde ningún punto del código, así que la tabla de
//      ratings estuvo siempre vacía.
//   2. Su matemática era inválida: `Math.min(Math.round(valorCrudo), 100)`
//      convierte `goals_per90 = 0.8` en `1`, y sumaba métricas con unidades
//      incompatibles (conteos, tasas y scores) ponderadas con pesos que sumaban
//      4,4 en lugar de 1,0.
//   3. Sus pesos vivían en una constante de TypeScript que contradecía los
//      pesos sembrados en la base para las mismas posiciones.
//
// El cálculo correcto (per-90 -> percentil contra cohorte -> media ponderada con
// pesos que suman 1,0, leídos de `RatingModel`) es el ticket MM-014. Este
// archivo solo LEE lo que ese motor publique.
// =============================================================================

import { Prisma, Position } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Forma de cada eje dentro de `PlayerRating.radarSnapshot`.
 * El motor de MM-014 debe escribir exactamente esta estructura.
 */
export interface RadarAxis {
  metricKey: string;
  axisLabel: string;
  /** Valor normalizado a 90 minutos. */
  per90: number;
  /** Posición del jugador en su cohorte, 0–100. Es lo que se dibuja. */
  percentile: number;
  /** Tamaño de la cohorte contra la que se comparó. */
  sampleSize: number;
}

/** Convierte el JSON de Prisma en ejes tipados, descartando lo que no encaje. */
export function parseRadarSnapshot(snapshot: Prisma.JsonValue | null): RadarAxis[] {
  if (!Array.isArray(snapshot)) return [];

  return snapshot.flatMap((entry): RadarAxis[] => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];

    const axis = entry as Record<string, unknown>;
    const { metricKey, axisLabel, per90, percentile, sampleSize } = axis;

    if (typeof metricKey !== "string" || typeof axisLabel !== "string") return [];
    if (typeof per90 !== "number" || typeof percentile !== "number") return [];

    return [
      {
        metricKey,
        axisLabel,
        per90,
        percentile,
        sampleSize: typeof sampleSize === "number" ? sampleSize : 0,
      },
    ];
  });
}

export interface TopRatingsOptions {
  season?: string;
  position?: Position;
  limit?: number;
  /** Incluir ratings provisionales (muestra por debajo del umbral de minutos). */
  includeProvisional?: boolean;
}

/**
 * Ranking servido directamente desde `player_ratings`: cero cómputo por request.
 * Los ratings provisionales quedan fuera por defecto — publicar el rating de un
 * jugador con 40 minutos junto al de uno con 2.700 es engañoso.
 */
export async function getTopRatings(orgId: string, options: TopRatingsOptions = {}) {
  const { season, position, limit = 10, includeProvisional = false } = options;

  return prisma.playerRating.findMany({
    where: {
      organizationId: orgId,
      ...(season ? { season } : {}),
      ...(position ? { position } : {}),
      ...(includeProvisional ? {} : { isProvisional: false }),
      player: { deletedAt: null },
    },
    select: {
      id: true,
      season: true,
      position: true,
      overallRating: true,
      sampleMinutes: true,
      sampleMatches: true,
      isProvisional: true,
      computedAt: true,
      ratingModel: { select: { name: true, version: true } },
      player: {
        select: { id: true, fullName: true, knownAs: true, nationality: true, photoUrl: true },
      },
    },
    orderBy: { overallRating: "desc" },
    take: Math.min(limit, 50),
  });
}

/** Rating vigente de un jugador en una temporada, si existe. */
export async function getPlayerRating(orgId: string, playerId: string, season: string) {
  return prisma.playerRating.findFirst({
    where: { organizationId: orgId, playerId, season },
    select: {
      overallRating: true,
      radarSnapshot: true,
      sampleMinutes: true,
      sampleMatches: true,
      isProvisional: true,
      computedAt: true,
      ratingModel: { select: { name: true, version: true } },
    },
    orderBy: { computedAt: "desc" },
  });
}
