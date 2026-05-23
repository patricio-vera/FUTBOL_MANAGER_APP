// =============================================================================
// ROUTE HANDLER: GET /api/players/:id/metrics  |  POST /api/players/:id/metrics
// =============================================================================
// GET: público — serie de tiempo de métricas (filtro por rango de fechas)
// POST: protegido (rol: scout) — registrar métricas de un partido
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPlayerMetrics, recordMetrics } from "@/lib/services/metrics.service";

const RecordMetricsSchema = z.object({
  match_id:        z.string().uuid(),
  minutes_played:  z.number().int().min(0).max(120),
  position_played: z.string().optional(),
  metrics: z.array(
    z.object({
      metric_key:   z.string().min(1).max(100),
      metric_value: z.number(),
      recorded_at:  z.string().datetime().optional(),
    })
  ).min(1),
});

// ---------------------------------------------------------------------------
// GET /api/players/:id/metrics?metric_key=goals_per90&from=2024-01-01&to=2024-12-31
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = request.nextUrl;

  const options = {
    metric_key: searchParams.get("metric_key") ?? undefined,
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    to:   searchParams.get("to")   ? new Date(searchParams.get("to")!)   : undefined,
    limit: Number(searchParams.get("limit") ?? "100"),
  };

  try {
    const metrics = await getPlayerMetrics(params.id, options);
    return NextResponse.json({ data: metrics, count: metrics.length });
  } catch (error) {
    console.error("[GET /api/players/:id/metrics]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/players/:id/metrics — Requiere rol: scout (validado por middleware)
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = RecordMetricsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { match_id, minutes_played, position_played, metrics } = validated.data;

    const result = await recordMetrics(
      params.id,
      match_id,
      minutes_played,
      position_played,
      metrics.map((m) => ({
        metric_key:   m.metric_key,
        metric_value: m.metric_value,
        recorded_at:  m.recorded_at ? new Date(m.recorded_at) : undefined,
      }))
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/players/:id/metrics]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
