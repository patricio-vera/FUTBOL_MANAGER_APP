// =============================================================================
// ROUTE HANDLER: GET /api/ratings/top
// =============================================================================
// Público (rol: guest) — Top 10 jugadores por posición y temporada.
// Sirve directamente desde aggregated_ratings → cero cómputo por request.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getTopRatings } from "@/lib/services/rating-aggregator.service";

// ---------------------------------------------------------------------------
// GET /api/ratings/top?position=LW&season=2024-25&limit=10
// SQL equiv: SELECT TOP 10 ... FROM aggregated_ratings ORDER BY overall_rating DESC
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const position = searchParams.get("position") ?? undefined;
  const season   = searchParams.get("season")   ?? undefined;
  const limit    = Math.min(Number(searchParams.get("limit") ?? "10"), 50);

  try {
    const ratings = await getTopRatings(position, season, limit);
    return NextResponse.json({ data: ratings, count: ratings.length });
  } catch (error) {
    console.error("[GET /api/ratings/top]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
