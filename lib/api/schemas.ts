// =============================================================================
// CONTRATO DE LA API (wire) Y MAPEO EXPLÍCITO AL DOMINIO
// =============================================================================
// La API pública habla snake_case; el dominio y Prisma hablan camelCase.
// Esa traducción es AHORA una función con nombre y tipos, nunca un spread.
//
// El bug que esto elimina: `prisma.match.create({ data: { ...validated.data } })`
// pasaba `home_team`, `away_team`, `match_date` directamente a Prisma, campos
// que no existen en el modelo. Un spread hace que el compilador no pueda
// protegerte; un mapeo explícito sí.
// =============================================================================

import { z } from "zod";
import { Position, Foot } from "@prisma/client";
import type { CreatePlayerInput, UpdatePlayerInput } from "@/lib/services/player.service";
import type { AppearanceInput } from "@/lib/services/metrics.service";
import { CORE_METRIC_COLUMNS, toWireKey } from "@/lib/domain/metrics";

const positionSchema = z.nativeEnum(Position);
const footSchema = z.nativeEnum(Foot);
/** Temporada canónica: "2024-25". Antes se aceptaba 2024/25, 24-25 y 2024-25. */
const seasonSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Formato de temporada: "2024-25"');

// ---------------------------------------------------------------------------
// Query params: validados, no convertidos a NaN a la brava.
// `Number(searchParams.get("limit"))` producía NaN y Prisma devolvía un 500.
// ---------------------------------------------------------------------------
export const listPlayersQuerySchema = z.object({
  position: positionSchema.optional(),
  nationality: z.string().length(2).optional(),
  name: z.string().min(1).max(100).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listMatchesQuerySchema = z.object({
  season: seasonSchema.optional(),
  competition: z.string().min(1).max(100).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const topRatingsQuerySchema = z.object({
  season: seasonSchema.optional(),
  position: positionSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  include_provisional: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const playerAppearancesQuerySchema = z.object({
  season: seasonSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

// ---------------------------------------------------------------------------
// Cuerpos de petición
// ---------------------------------------------------------------------------
export const createPlayerBodySchema = z.object({
  full_name: z.string().min(2).max(255),
  position: positionSchema,
  known_as: z.string().max(120).optional(),
  date_of_birth: z.coerce.date().optional(),
  nationality: z.string().length(2).optional(),
  foot: footSchema.optional(),
  height_cm: z.number().int().min(120).max(230).optional(),
  photo_url: z.string().url().optional(),
});

export const updatePlayerBodySchema = createPlayerBodySchema.partial();

export const createMatchBodySchema = z.object({
  home_team: z.string().min(2).max(100),
  away_team: z.string().min(2).max(100),
  kickoff_at: z.coerce.date(),
  competition: z.string().min(1).max(100),
  season: seasonSchema,
  tier: z.number().int().min(1).max(10).optional(),
  home_score: z.number().int().min(0).max(30).optional(),
  away_score: z.number().int().min(0).max(30).optional(),
  venue: z.string().max(150).optional(),
});

const coreMetricsShape = CORE_METRIC_COLUMNS.reduce<Record<string, z.ZodOptional<z.ZodNumber>>>(
  (shape, column) => {
    const wireKey = toWireKey(column);
    shape[wireKey] = z.number().int().min(0).max(1000).optional();
    return shape;
  },
  {}
);

export const recordAppearanceBodySchema = z.object({
  match_id: z.string().min(1),
  minutes_played: z.number().int().min(0).max(130),
  position_played: positionSchema,
  started_match: z.boolean().optional(),
  core: z.object(coreMetricsShape).optional(),
  observations: z
    .array(
      z.object({
        metric_key: z.string().min(1).max(100),
        metric_value: z.number(),
      })
    )
    .max(200)
    .optional(),
});

// ---------------------------------------------------------------------------
// Mapeos wire -> dominio
// ---------------------------------------------------------------------------

export function toCreatePlayerInput(
  body: z.infer<typeof createPlayerBodySchema>
): CreatePlayerInput {
  return {
    fullName: body.full_name,
    position: body.position,
    knownAs: body.known_as,
    dateOfBirth: body.date_of_birth,
    nationality: body.nationality,
    foot: body.foot,
    heightCm: body.height_cm,
    photoUrl: body.photo_url,
  };
}

export function toUpdatePlayerInput(
  body: z.infer<typeof updatePlayerBodySchema>
): UpdatePlayerInput {
  const input: UpdatePlayerInput = {};
  if (body.full_name !== undefined) input.fullName = body.full_name;
  if (body.position !== undefined) input.position = body.position;
  if (body.known_as !== undefined) input.knownAs = body.known_as;
  if (body.date_of_birth !== undefined) input.dateOfBirth = body.date_of_birth;
  if (body.nationality !== undefined) input.nationality = body.nationality;
  if (body.foot !== undefined) input.foot = body.foot;
  if (body.height_cm !== undefined) input.heightCm = body.height_cm;
  if (body.photo_url !== undefined) input.photoUrl = body.photo_url;
  return input;
}

export interface CreateMatchInput {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;
  competition: string;
  season: string;
  tier: number;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
}

export function toCreateMatchInput(
  body: z.infer<typeof createMatchBodySchema>
): CreateMatchInput {
  return {
    homeTeam: body.home_team,
    awayTeam: body.away_team,
    kickoffAt: body.kickoff_at,
    competition: body.competition,
    season: body.season,
    tier: body.tier ?? 3,
    homeScore: body.home_score,
    awayScore: body.away_score,
    venue: body.venue,
  };
}

export function toAppearanceInput(
  body: z.infer<typeof recordAppearanceBodySchema>
): AppearanceInput {
  const core: AppearanceInput["core"] = {};

  if (body.core) {
    for (const column of CORE_METRIC_COLUMNS) {
      const wireKey = toWireKey(column);
      const value = body.core[wireKey];
      if (typeof value === "number") core[column] = value;
    }
  }

  return {
    matchId: body.match_id,
    minutesPlayed: body.minutes_played,
    positionPlayed: body.position_played,
    startedMatch: body.started_match,
    core,
    observations: body.observations?.map((observation) => ({
      metricKey: observation.metric_key,
      metricValue: observation.metric_value,
    })),
  };
}
