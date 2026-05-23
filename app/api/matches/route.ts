// =============================================================================
// ROUTE HANDLER: GET /api/matches  |  POST /api/matches
// =============================================================================
// GET: público (rol: guest) — lista de partidos con paginación
// POST: protegido (rol: scout) — registrar nuevo partido
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const CreateMatchSchema = z.object({
  home_team:   z.string().min(2).max(100),
  away_team:   z.string().min(2).max(100),
  match_date:  z.string().datetime(),
  competition: z.string().max(100).optional(),
  season:      z.string().max(20).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/matches?page=1&limit=20&season=2024-25&competition=LaLiga
// SQL equiv: SELECT * FROM matches WHERE season = @season ORDER BY match_date DESC
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page  = Number(searchParams.get("page")  ?? "1");
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const season      = searchParams.get("season") ?? undefined;
  const competition = searchParams.get("competition") ?? undefined;

  try {
    const where: Record<string, unknown> = {};
    if (season)      where.season = season;
    if (competition) where.competition = competition;

    const [matches, total] = await prisma.$transaction([
      prisma.match.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { match_date: "desc" },
        include: {
          _count: { select: { player_matches: true } }, // cuántos jugadores registrados
        },
      }),
      prisma.match.count({ where }),
    ]);

    return NextResponse.json({
      data: matches,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/matches]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/matches — Requiere rol: scout (validado por middleware)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateMatchSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        ...validated.data,
        match_date: new Date(validated.data.match_date),
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("[POST /api/matches]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
