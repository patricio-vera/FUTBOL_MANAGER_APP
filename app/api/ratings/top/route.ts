// =============================================================================
// GET /api/ratings/top — ranking servido desde player_ratings
// =============================================================================
// Cero cómputo por request: el motor de rating (MM-014) publica en la tabla,
// este endpoint solo lee. Los ratings provisionales quedan fuera salvo que se
// pidan explícitamente.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getTopRatings } from "@/lib/services/rating-aggregator.service";
import { topRatingsQuerySchema } from "@/lib/api/schemas";
import { apiError, handleUnexpected } from "@/lib/api/respond";

export async function GET(request: NextRequest) {
  try {
    const parsed = topRatingsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Parámetros inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();

    const ratings = await getTopRatings(orgId, {
      season: parsed.data.season,
      position: parsed.data.position,
      limit: parsed.data.limit,
      includeProvisional: parsed.data.include_provisional,
    });

    return NextResponse.json({ data: ratings, count: ratings.length });
  } catch (error) {
    return handleUnexpected("GET /api/ratings/top", error);
  }
}
