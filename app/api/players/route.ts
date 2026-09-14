// =============================================================================
// GET  /api/players   — listado paginado por cursor
// POST /api/players   — alta de jugador
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getPlayers, createPlayer } from "@/lib/services/player.service";
import {
  listPlayersQuerySchema,
  createPlayerBodySchema,
  toCreatePlayerInput,
} from "@/lib/api/schemas";
import { apiError, handleUnexpected } from "@/lib/api/respond";

export async function GET(request: NextRequest) {
  try {
    const parsed = listPlayersQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Parámetros inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();
    const result = await getPlayers(orgId, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    return handleUnexpected("GET /api/players", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createPlayerBodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();
    // Mapeo explícito wire -> dominio. Nunca un spread hacia Prisma.
    const player = await createPlayer(orgId, toCreatePlayerInput(parsed.data));

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return handleUnexpected("POST /api/players", error);
  }
}
