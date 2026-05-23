// =============================================================================
// METRICS SERVICE — Series de tiempo y registro de métricas por partido
// =============================================================================
// Gestiona el patrón EAV (Entity-Attribute-Value) de performance_metrics.
// SQL Server analogy: consultas con PIVOT o CTEs para series de tiempo.
// =============================================================================

import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface MetricInput {
  metric_key: string;
  metric_value: number;
  recorded_at?: Date;
}

export interface MetricTimeSeriesPoint {
  recorded_at: Date;
  metric_value: number;
  match_date?: Date;
}

// ---------------------------------------------------------------------------
// GET /api/players/:id/metrics — Serie de tiempo de una métrica específica
// Parámetros opcionales: from, to (rango de fechas), metric_key
//
// SQL Server equiv:
//   SELECT pm.metric_key, pm.metric_value, pm.recorded_at
//   FROM performance_metrics pm
//   JOIN player_matches plm ON plm.id = pm.player_match_id
//   WHERE plm.player_id = @playerId
//     AND pm.metric_key = @metricKey
//     AND pm.recorded_at BETWEEN @from AND @to
//   ORDER BY pm.recorded_at ASC
// ---------------------------------------------------------------------------
export async function getPlayerMetrics(
  playerId: string,
  options: {
    metric_key?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  } = {}
) {
  const { metric_key, from, to, limit = 100 } = options;

  // Construimos el filtro de fecha para recorded_at
  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;

  const metrics = await prisma.performanceMetric.findMany({
    where: {
      player_match: {
        player_id: playerId,  // Filtra por jugador a través de la relación
      },
      ...(metric_key ? { metric_key } : {}),
      ...(Object.keys(dateFilter).length > 0
        ? { recorded_at: dateFilter }
        : {}),
    },
    include: {
      player_match: {
        include: {
          match: {
            select: { match_date: true, competition: true, season: true },
          },
        },
      },
    },
    orderBy: { recorded_at: "asc" },
    take: limit,
  });

  return metrics.map((m) => ({
    metric_key: m.metric_key,
    metric_value: m.metric_value,
    recorded_at: m.recorded_at,
    match_date: m.player_match.match?.match_date,
    competition: m.player_match.match?.competition,
  }));
}

// ---------------------------------------------------------------------------
// POST /api/players/:id/metrics — Registrar nuevas métricas (rol: scout)
// Primero encuentra o crea el player_match, luego inserta las métricas.
//
// SQL Server equiv: 
//   BEGIN TRANSACTION
//   IF NOT EXISTS (SELECT 1 FROM player_matches WHERE player_id=@pid AND match_id=@mid)
//     INSERT INTO player_matches ...
//   INSERT INTO performance_metrics (metric_key, metric_value, ...) VALUES (...)
//   COMMIT
// ---------------------------------------------------------------------------
export async function recordMetrics(
  playerId: string,
  matchId: string,
  minutesPlayed: number,
  positionPlayed: string | undefined,
  metrics: MetricInput[]
) {
  // Upsert del player_match (transacción implícita via Prisma)
  const playerMatch = await prisma.playerMatch.upsert({
    where: {
      player_id_match_id: { player_id: playerId, match_id: matchId },
    },
    update: { minutes_played: minutesPlayed, position_played: positionPlayed },
    create: {
      player_id: playerId,
      match_id: matchId,
      minutes_played: minutesPlayed,
      position_played: positionPlayed,
    },
  });

  // Insertar todas las métricas en lote — equivale a bulk INSERT en SQL Server
  const created = await prisma.performanceMetric.createMany({
    data: metrics.map((m) => ({
      player_match_id: playerMatch.id,
      metric_key: m.metric_key,
      metric_value: m.metric_value,
      recorded_at: m.recorded_at ?? new Date(),
    })),
  });

  return { player_match_id: playerMatch.id, metrics_created: created.count };
}

// ---------------------------------------------------------------------------
// Helper: obtiene el promedio de una métrica para un jugador en una temporada
// SQL Server equiv: SELECT AVG(metric_value) FROM performance_metrics ... GROUP BY metric_key
// ---------------------------------------------------------------------------
export async function getAverageMetric(
  playerId: string,
  metricKey: string,
  season?: string
): Promise<number> {
  const result = await prisma.performanceMetric.aggregate({
    where: {
      metric_key: metricKey,
      player_match: {
        player_id: playerId,
        ...(season ? { match: { season } } : {}),
      },
    },
    _avg: { metric_value: true },
  });

  return result._avg.metric_value ?? 0;
}
