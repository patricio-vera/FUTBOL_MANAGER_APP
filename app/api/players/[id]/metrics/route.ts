// =============================================================================
// GET  /api/players/:id/metrics  — participaciones del jugador
// POST /api/players/:id/metrics  — registrar la participación de un partido
// =============================================================================
// Este archivo es el que peor estaba: consultaba `player_match`, `player_id`,
// `metric_key`, `recorded_at` y un índice compuesto `player_id_match_id`,
// ninguno de los cuales existía en el modelo.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getPlayerAppearances, recordAppearance } from "@/lib/services/metrics.service";
import {
  playerAppearancesQuerySchema,
  recordAppearanceBodySchema,
  toAppearanceInput,
} from "@/lib/api/schemas";
import { apiError, handleUnexpected } from "@/lib/api/respond";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteContext) {
  const params = await props.params;
  try {
    const parsed = playerAppearancesQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Parámetros inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();
    const appearances = await getPlayerAppearances(orgId, params.id, parsed.data);

    return NextResponse.json({ data: appearances, count: appearances.length });
  } catch (error) {
    return handleUnexpected("GET /api/players/:id/metrics", error);
  }
}

export async function POST(request: NextRequest, props: RouteContext) {
  const params = await props.params;
  try {
    const parsed = recordAppearanceBodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();
    const result = await recordAppearance(orgId, params.id, toAppearanceInput(parsed.data));

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleUnexpected("POST /api/players/:id/metrics", error);
  }
}
