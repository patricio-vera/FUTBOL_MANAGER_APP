// =============================================================================
// MATCH SERVICE
// =============================================================================
// El route handler anterior consultaba Prisma directamente, saltándose la capa
// de servicios que el propio proyecto declaraba como norma — y con nombres de
// campo (`match_date`, `player_matches`) que no existían en el modelo.
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CreateMatchInput } from "@/lib/api/schemas";

export interface MatchFilters {
  season?: string;
  competition?: string;
  cursor?: string;
  limit?: number;
}

const matchSelect = {
  id: true,
  homeTeam: true,
  awayTeam: true,
  homeScore: true,
  awayScore: true,
  kickoffAt: true,
  competition: true,
  season: true,
  tier: true,
  venue: true,
  _count: { select: { appearances: true } },
} satisfies Prisma.MatchSelect;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Paginación por cursor en vez de OFFSET: el `skip: (page - 1) * limit`
 * anterior obliga a Postgres a recorrer y descartar todas las filas previas,
 * y se degrada linealmente al avanzar de página.
 */
export async function getMatches(orgId: string, filters: MatchFilters = {}) {
  const take = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  const rows = await prisma.match.findMany({
    where: {
      organizationId: orgId,
      ...(filters.season ? { season: filters.season } : {}),
      ...(filters.competition ? { competition: filters.competition } : {}),
    },
    select: matchSelect,
    orderBy: [{ kickoffAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  return {
    data: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function createMatch(orgId: string, input: CreateMatchInput) {
  return prisma.match.create({
    data: {
      organizationId: orgId,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      kickoffAt: input.kickoffAt,
      competition: input.competition,
      season: input.season,
      tier: input.tier,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      venue: input.venue,
    },
    select: matchSelect,
  });
}
