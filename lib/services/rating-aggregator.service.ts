// =============================================================================
// RATING AGGREGATOR SERVICE — Optimizado y Corregido
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import { getAverageMetric } from "./metrics.service";

export interface RadarDataPoint {
  axis: string;       
  value: number;      
  maxValue: number;   
}

const POSITION_METRIC_CONFIG: Record<
  string,
  Array<{ metric_key: string; label: string; weight: number }>
> = {
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
  CM: [
    { metric_key: "key_passes",         label: "Passing",   weight: 0.9 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.8 },
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.6 },
    { metric_key: "goals_per90",        label: "Shooting",  weight: 0.5 },
    { metric_key: "tackles_won",        label: "Defending", weight: 0.6 },
    { metric_key: "vision_score",       label: "Vision",    weight: 0.9 },
  ],
  DM: [
    { metric_key: "tackles_won",        label: "Defending", weight: 0.95 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.85 },
    { metric_key: "key_passes",         label: "Passing",   weight: 0.7 },
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.4 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.9 },
    { metric_key: "aerial_duels",       label: "Aerial",    weight: 0.7 },
  ],
  ST: [
    { metric_key: "goals_per90",        label: "Shooting",  weight: 0.95 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.9 },
    { metric_key: "pace_score",         label: "Pace",      weight: 0.7 },
    { metric_key: "aerial_duels",       label: "Aerial",    weight: 0.75 },
    { metric_key: "dribbles_completed", label: "Dribbling", weight: 0.5 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.5 },
  ],
  CB: [
    { metric_key: "tackles_won",        label: "Defending", weight: 0.95 },
    { metric_key: "aerial_duels",       label: "Aerial",    weight: 0.9 },
    { metric_key: "positioning",        label: "Positioning", weight: 0.9 },
    { metric_key: "pace_score",         label: "Pace",      weight: 0.5 },
    { metric_key: "key_passes",         label: "Passing",   weight: 0.4 },
    { metric_key: "pressing_score",     label: "Pressing",  weight: 0.5 },
  ],
};

const DEFAULT_METRICS = POSITION_METRIC_CONFIG.CM;

export async function computeAndPersistRating(
  playerId: string,
  position: string,
  season: string
): Promise<void> {
  const metricConfig = POSITION_METRIC_CONFIG[position] ?? DEFAULT_METRICS;

  const radarData: RadarDataPoint[] = await Promise.all(
    metricConfig.map(async (config) => {
      const avgValue = await getAverageMetric(playerId, config.metric_key, season);
      const normalizedValue = Math.min(Math.round(avgValue), 100);

      return {
        axis: config.label,
        value: normalizedValue,
        maxValue: 100,
      };
    })
  );

  const totalWeight = metricConfig.reduce((sum, m) => sum + m.weight, 0);
  const weightedSum = radarData.reduce((sum, point, i) => {
    return sum + point.value * metricConfig[i].weight;
  }, 0);
  const overallRating = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;

 // ── Guardar o actualizar en la base de datos con el "pase libre" (as any)
  await prisma.aggregatedRating.upsert({
    where: {
      playerId_season_position: { playerId, season, position },
    } as any, // ← El cambio va exactamente aquí, antes de la coma
    update: {
      overallRating: overallRating,
      radarSnapshot: radarData as unknown as object[],
      computedAt: new Date(),
    },
    create: {
      playerId: playerId,
      season,
      position,
      overallRating: overallRating,
      radarSnapshot: radarData as unknown as object[],
    },
  });
}

export async function getTopRatings(
  position?: string,
  season?: string,
  limit = 10
) {
  // ── CORREGIDO: Mapeo de campos de consulta y relaciones del Player
  return prisma.aggregatedRating.findMany({
    where: {
      ...(position ? { position } : {}),
      ...(season ? { season } : {}),
    },
    include: {
      player: {
        select: { id: true, fullName: true, nationality: true, photoUrl: true },
      },
    },
    orderBy: { overallRating: "desc" },
    take: limit,
  });
}