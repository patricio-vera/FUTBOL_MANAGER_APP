// =============================================================================
// RATING AGGREGATOR SERVICE
// =============================================================================
// Calcula el overall_rating ponderado por posición y persiste el
// radar_snapshot en aggregated_ratings (tabla de optimización JSONB).
//
// Estrategia híbrida (según el Arquitecto):
//   - Se recalcula en background (cron diario o post-partido trigger)
//   - El endpoint GET lo sirve directo desde aggregated_ratings → cero cómputo
//   - Solo se recalcula en tiempo real si el usuario pide rango custom de fechas
//
// SQL Server analogy: equivale a una tabla de reportes materializada que se
// actualiza con un SQL Agent Job periódico (similar a una Indexed View).
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import { getAverageMetric } from "./metrics.service";

// ---------------------------------------------------------------------------
// Tipos para el Radar Chart (Recharts RadarChart acepta este formato)
// ---------------------------------------------------------------------------
export interface RadarDataPoint {
  axis: string;       // Nombre de la métrica (eje del radar)
  value: number;      // Valor del jugador (0-100)
  maxValue: number;   // Valor máximo posible (siempre 100 en nuestro caso)
}

// ---------------------------------------------------------------------------
// Definición de métricas por posición con sus pesos
// Equivale a los datos en la tabla position_weights
// ---------------------------------------------------------------------------
const POSITION_METRIC_CONFIG: Record<
  string,
  Array<{ metric_key: string; label: string; weight: number }>
> = {
  // Extremo izquierdo/derecho
  LW: [
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.9 },
    { metric_key: "pace_score",         label: "Pace",      weight: 0.9 },
    { metric_key: "goals_per90",        label: "Shooting",  weight: 0.7 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.6 },
    { metric_key: "key_passes",         label: "Passing",   weight: 0.6 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.7 },
  ],
  RW: [
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.9 },
    { metric_key: "pace_score",         label: "Pace",      weight: 0.9 },
    { metric_key: "goals_per90",        label: "Shooting",  weight: 0.7 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.6 },
    { metric_key: "key_passes",         label: "Passing",   weight: 0.6 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.7 },
  ],
  // Centrocampista
  CM: [
    { metric_key: "key_passes",         label: "Passing",   weight: 0.9 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.8 },
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.6 },
    { metric_key: "goals_per90",        label: "Shooting",  weight: 0.5 },
    { metric_key: "tackles_won",        label: "Defending", weight: 0.6 },
    { metric_key: "vision_score",       label: "Vision",    weight: 0.9 },
  ],
  // Mediocampista defensivo
  DM: [
    { metric_key: "tackles_won",        label: "Defending", weight: 0.95 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.85 },
    { metric_key: "key_passes",         label: "Passing",   weight: 0.7 },
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.4 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.9 },
    { metric_key: "aerial_duels",       label: "Aerial",    weight: 0.7 },
  ],
  // Delantero centro
  ST: [
    { metric_key: "goals_per90",        label: "Shooting",  weight: 0.95 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.9 },
    { metric_key: "pace_score",         label: "Pace",      weight: 0.7 },
    { metric_key: "aerial_duels",       label: "Aerial",    weight: 0.75 },
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.5 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.5 },
  ],
  // Defensa central
  CB: [
    { metric_key: "tackles_won",        label: "Defending", weight: 0.95 },
    { metric_key: "aerial_duels",       label: "Aerial",    weight: 0.9 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.9 },
    { metric_key: "pace_score",         label: "Pace",      weight: 0.5 },
    { metric_key: "key_passes",         label: "Passing",   weight: 0.4 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.5 },
  ],
};

// Fallback para posiciones no configuradas explícitamente
const DEFAULT_METRICS = POSITION_METRIC_CONFIG.CM;

// ---------------------------------------------------------------------------
// Función principal: calcula y persiste el rating de un jugador para una temporada
// Usada en el seed y en el cron job diario.
//
// SQL Server analogy:
//   UPDATE aggregated_ratings
//   SET overall_rating = @rating, radar_snapshot = @json, computed_at = GETDATE()
//   WHERE player_id = @id AND season = @season
//   IF @@ROWCOUNT = 0
//     INSERT INTO aggregated_ratings ...
// ---------------------------------------------------------------------------
export async function computeAndPersistRating(
  playerId: string,
  position: string,
  season: string
): Promise<void> {
  const metricConfig =
    POSITION_METRIC_CONFIG[position] ?? DEFAULT_METRICS;

  // 1. Para cada métrica, obtenemos el promedio del jugador en la temporada
  const radarData: RadarDataPoint[] = await Promise.all(
    metricConfig.map(async (config) => {
      const avgValue = await getAverageMetric(playerId, config.metric_key, season);

      // Normalizamos a 0-100 (algunos valores como goals_per90 ya vienen en esa escala)
      // En producción se aplicaría una normalización z-score contra el pool de jugadores
      const normalizedValue = Math.min(Math.round(avgValue), 100);

      return {
        axis: config.label,
        value: normalizedValue,
        maxValue: 100,
      };
    })
  );

  // 2. Calculamos el overall_rating ponderado:
  //    Σ(value × weight) / Σ(weight)
  const totalWeight = metricConfig.reduce((sum, m) => sum + m.weight, 0);
  const weightedSum = radarData.reduce((sum, point, i) => {
    return sum + point.value * metricConfig[i].weight;
  }, 0);
  const overallRating = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 10) / 10
    : 0;

  // 3. Upsert en aggregated_ratings — idempotente (si ya existe, actualiza)
  await prisma.aggregatedRating.upsert({
    where: {
      player_id_season_position: { player_id: playerId, season, position },
    },
    update: {
      overall_rating: overallRating,
      // Cast necesario: Prisma's InputJsonValue no infiere arrays tipados
      // En runtime funciona perfectamente — JSONB acepta arrays de objetos
      radar_snapshot: radarData as unknown as object[],
      computed_at: new Date(),
    },
    create: {
      player_id: playerId,
      season,
      position,
      overall_rating: overallRating,
      radar_snapshot: radarData as unknown as object[],
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/ratings/top — Top jugadores por posición y temporada
// SQL equiv: SELECT TOP 10 p.full_name, ar.overall_rating, ar.radar_snapshot
//            FROM aggregated_ratings ar JOIN players p ON p.id = ar.player_id
//            WHERE ar.position = @pos AND ar.season = @season
//            ORDER BY ar.overall_rating DESC
// ---------------------------------------------------------------------------
export async function getTopRatings(
  position?: string,
  season?: string,
  limit = 10
) {
  return prisma.aggregatedRating.findMany({
    where: {
      ...(position ? { position } : {}),
      ...(season ? { season } : {}),
    },
    include: {
      player: {
        select: { id: true, full_name: true, nationality: true, photo_url: true },
      },
    },
    orderBy: { overall_rating: "desc" },
    take: limit,
  });
}
