// =============================================================================
// ROUTE HANDLER: GET /api/players/:id  |  PUT /api/players/:id  |  DELETE /api/players/:id
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPlayerById, updatePlayer, deletePlayer,} from "@/lib/services/player.service";

const UpdatePlayerSchema = z.object({
  full_name:   z.string().min(2).max(255).optional(),
  nationality: z.string().max(100).optional(),
  age:         z.number().int().min(14).max(50).optional(),
  position:    z.enum(["GK","CB","LB","RB","DM","CM","LW","RW","SS","ST"]).optional(),
  photo_url:   z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/players/:id — público (rol: guest) — perfil completo + radar snapshot
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await getPlayerById(params.id);
    if (!player) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error) {
    console.error("[GET /api/players/:id]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/players/:id — Requiere rol: admin
// ---------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = UpdatePlayerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updatePlayer(params.id, validated.data);
    if (!updated) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/players/:id]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/players/:id — Requiere rol: admin
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deletePlayer(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: "Jugador eliminado correctamente" });
  } catch (error) {
    console.error("[DELETE /api/players/:id]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
