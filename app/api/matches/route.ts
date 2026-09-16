// =============================================================================
// GET  /api/matches  — listado paginado por cursor
// POST /api/matches  — alta de partido
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getMatches, createMatch } from "@/lib/services/match.service";
import {
  listMatchesQuerySchema,
  createMatchBodySchema,
  toCreateMatchInput,
} from "@/lib/api/schemas";
import { apiError, handleUnexpected } from "@/lib/api/respond";

export async function GET(request: NextRequest) {
  try {
    const parsed = listMatchesQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Parámetros inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();
    const result = await getMatches(orgId, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    return handleUnexpected("GET /api/matches", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createMatchBodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
    }

    const orgId = await getActiveOrgId();
    const match = await createMatch(orgId, toCreateMatchInput(parsed.data));

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    return handleUnexpected("POST /api/matches", error);
  }
}
