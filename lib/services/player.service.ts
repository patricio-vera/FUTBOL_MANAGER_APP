// =============================================================================
// PLAYER SERVICE — capa de negocio
// =============================================================================
// Reglas de esta capa (ver CLAUDE.md):
//  - Toda función recibe `orgId` como primer argumento. No hay consulta de
//    negocio sin organización: es la base del aislamiento multi-tenant.
//  - Los nombres de campo son SIEMPRE los del cliente Prisma (camelCase).
//    El mapeo desde el JSON snake_case de la API vive en los route handlers.
//  - Nada de `any`, `as any` ni `@ts-ignore`.
// =============================================================================

import { Prisma, Position, Foot } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ageFromDateOfBirth, isMinorAt } from "@/lib/domain/age";

// ---------------------------------------------------------------------------
// Tipos de dominio (independientes del formato de la API)
// ---------------------------------------------------------------------------

export interface PlayerFilters {
  position?: Position;
  nationality?: string;
  name?: string;
  cursor?: string;
  limit?: number;
}

export interface CreatePlayerInput {
  fullName: string;
  position: Position;
  knownAs?: string;
  dateOfBirth?: Date;
  nationality?: string;
  foot?: Foot;
  heightCm?: number;
  photoUrl?: string;
}

export type UpdatePlayerInput = Partial<CreatePlayerInput>;

/** Proyección pública: los campos que pueden viajar al navegador. */
const publicPlayerSelect = {
  id: true,
  fullName: true,
  knownAs: true,
  position: true,
  altPosition: true,
  nationality: true,
  dateOfBirth: true,
  foot: true,
  heightCm: true,
  photoUrl: true,
  isMinor: true,
  createdAt: true,
  ratings: {
    orderBy: { computedAt: "desc" },
    take: 1,
    select: {
      overallRating: true,
      radarSnapshot: true,
      season: true,
      sampleMinutes: true,
      sampleMatches: true,
      isProvisional: true,
      computedAt: true,
      ratingModel: { select: { name: true, version: true } },
    },
  },
} satisfies Prisma.PlayerSelect;

type PlayerRow = Prisma.PlayerGetPayload<{ select: typeof publicPlayerSelect }>;

/** Lo que consume la interfaz: la edad viene derivada, no almacenada. */
export type PlayerView = Omit<PlayerRow, "ratings"> & {
  age: number | null;
  latestRating: PlayerRow["ratings"][number] | null;
};

function toView(row: PlayerRow): PlayerView {
  const { ratings, ...rest } = row;
  return {
    ...rest,
    age: ageFromDateOfBirth(rest.dateOfBirth),
    latestRating: ratings[0] ?? null,
  };
}

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

// ---------------------------------------------------------------------------
// Listado paginado por cursor
// ---------------------------------------------------------------------------
export async function getPlayers(
  orgId: string,
  filters: PlayerFilters = {}
): Promise<{ data: PlayerView[]; nextCursor: string | null }> {
  const take = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  const where: Prisma.PlayerWhereInput = {
    organizationId: orgId,
    deletedAt: null,
    ...(filters.position ? { position: filters.position } : {}),
    ...(filters.nationality ? { nationality: filters.nationality } : {}),
    // TODO(MM-018): sustituir por búsqueda apoyada en el índice GIN pg_trgm.
    ...(filters.name ? { fullName: { contains: filters.name, mode: "insensitive" } } : {}),
  };

  const rows = await prisma.player.findMany({
    where,
    select: publicPlayerSelect,
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  return {
    data: page.map(toView),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

// ---------------------------------------------------------------------------
// Ficha individual
// ---------------------------------------------------------------------------
export async function getPlayerById(orgId: string, id: string): Promise<PlayerView | null> {
  const row = await prisma.player.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    select: publicPlayerSelect,
  });

  return row ? toView(row) : null;
}

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------
export async function createPlayer(
  orgId: string,
  input: CreatePlayerInput
): Promise<PlayerView> {
  const row = await prisma.player.create({
    data: {
      organizationId: orgId,
      fullName: input.fullName,
      knownAs: input.knownAs,
      position: input.position,
      dateOfBirth: input.dateOfBirth,
      nationality: input.nationality,
      foot: input.foot,
      heightCm: input.heightCm,
      photoUrl: input.photoUrl,
      isMinor: isMinorAt(input.dateOfBirth ?? null),
    },
    select: publicPlayerSelect,
  });

  return toView(row);
}

// ---------------------------------------------------------------------------
// Modificación
// ---------------------------------------------------------------------------
export async function updatePlayer(
  orgId: string,
  id: string,
  input: UpdatePlayerInput
): Promise<PlayerView | null> {
  // updateMany fuerza el filtro por organización: un update por id a secas
  // permitiría modificar la fila de otro club.
  const { count } = await prisma.player.updateMany({
    where: { id, organizationId: orgId, deletedAt: null },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.knownAs !== undefined ? { knownAs: input.knownAs } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.nationality !== undefined ? { nationality: input.nationality } : {}),
      ...(input.foot !== undefined ? { foot: input.foot } : {}),
      ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
      ...(input.dateOfBirth !== undefined
        ? { dateOfBirth: input.dateOfBirth, isMinor: isMinorAt(input.dateOfBirth) }
        : {}),
    },
  });

  if (count === 0) return null;
  return getPlayerById(orgId, id);
}

// ---------------------------------------------------------------------------
// Baja LÓGICA
// ---------------------------------------------------------------------------
// El DELETE físico anterior, combinado con ON DELETE CASCADE, destruía el
// historial completo de partidos y métricas del jugador sin dejar rastro.
export async function softDeletePlayer(orgId: string, id: string): Promise<boolean> {
  const { count } = await prisma.player.updateMany({
    where: { id, organizationId: orgId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return count > 0;
}
