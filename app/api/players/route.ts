// =============================================================================
// PLAYERS API ROUTE — Endpoint corregido según estructura de carpetas
// =============================================================================
import { NextResponse } from "next/server";
// Bajamos 3 niveles para salir de api/players/app y entrar en lib/services
import { getPlayers, createPlayer } from "../../../lib/services/player.service";
import { z } from "zod";

const playerSchema = z.object({
  fullName: z.string().min(3),
  position: z.string(),
  nationality: z.string().optional(),
  age: z.number().optional(),
  photoUrl: z.string().url().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      position: searchParams.get("position") || undefined,
      name: searchParams.get("name") || undefined,
    };
    const result = await getPlayers(filters);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Fallo en DB" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = playerSchema.parse(body);
    const player = await createPlayer(validatedData);
    return NextResponse.json(player);
  } catch (error) {
    console.error("Error en POST:", error);
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}