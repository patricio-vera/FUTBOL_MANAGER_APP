// =============================================================================
// GET    /api/players/:id
// PUT    /api/players/:id
// DELETE /api/players/:id   — baja LÓGICA, no física
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getActiveOrgId } from "@/lib/auth/active-org";
import {
  getPlayerById,
  updatePlayer,
  softDeletePlayer,
} from "@/lib/services/player.service";
import { updatePlayerBodySchema, toUpdatePlayerInput } from "@/lib/api/schemas";
import { apiError, handleUnexpected } from "@/lib/api/respond";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const orgId = await getActiveOrgId();
    const player = await getPlayerById(orgId, params.id);

    if (!player) {
      return apiError("NOT_FOUND", "Jugador no encontrado");
    }

    return NextResponse.json(player);
  } catch (error) {
    return handleUnexpected("GET /api/players/:id", error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const parsed = updatePlayerBodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();
    const updated = await updatePlayer(orgId, params.id, toUpdatePlayerInput(parsed.data));

    if (!updated) {
      return apiError("NOT_FOUND", "Jugador no encontrado");
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleUnexpected("PUT /api/players/:id", error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const orgId = await getActiveOrgId();
    const deleted = await softDeletePlayer(orgId, params.id);

    if (!deleted) {
      return apiError("NOT_FOUND", "Jugador no encontrado");
    }

    return NextResponse.json({ id: params.id, deleted: true });
  } catch (error) {
    return handleUnexpected("DELETE /api/players/:id", error);
  }
}
