// =============================================================================
// PERFIL DE JUGADOR
// =============================================================================
// Cambios respecto al Ciclo 1:
//  - El radar se dibuja con los ejes REALES del snapshot del rating, cuyo
//    número varía según la posición. Antes eran cinco ejes fijos alimentados
//    con valores de relleno (?? 70, ?? 65, ?? 80) que se mostraban como si
//    fueran mediciones.
//  - Si no hay rating calculado, la pantalla lo dice.
//  - `params` deja de estar tipado como Promise: ese es el contrato de Next 15+,
//    y el proyecto corre sobre Next 14. MM-003 lo unifica al migrar.
//
// TODO(MM-019): sustituir este SVG a mano por components/PlayerRadar.tsx.
// =============================================================================

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getPlayerById } from "@/lib/services/player.service";
import { parseRadarSnapshot } from "@/lib/services/rating-aggregator.service";
import { isOptimizableImageUrl } from "@/lib/domain/images";

// Depende de la organización activa por-request (hoy DEV_ORG_ID, mañana la
// sesión de Auth.js vía MM-008): nunca se puede pre-renderizar como estática.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage(props: PageProps) {
  const params = await props.params;
  const orgId = await getActiveOrgId();
  const player = await getPlayerById(orgId, params.id);

  if (!player) {
    notFound();
  }

  const rating = player.latestRating;
  const axes = rating ? parseRadarSnapshot(rating.radarSnapshot) : [];

  // --- Geometría del polígono, para el número de ejes que realmente haya ---
  const center = 150;
  const maxRadius = 100;
  const axisCount = axes.length;

  const coordinatesAt = (index: number, value: number) => {
    const angle = ((Math.PI * 2) / axisCount) * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const gridRings = [25, 50, 75, 100].map((level) =>
    Array.from({ length: axisCount })
      .map((_, index) => {
        const { x, y } = coordinatesAt(index, level);
        return `${x},${y}`;
      })
      .join(" ")
  );

  const shapePoints = axes
    .map((axis, index) => {
      const { x, y } = coordinatesAt(index, axis.percentile);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 mb-8 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} /> Volver al Hub de Scouting
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ---------------- Identidad ---------------- */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
            <div className="relative w-40 h-40 bg-slate-800 rounded-full overflow-hidden mb-4 border-2 border-slate-700">
              {isOptimizableImageUrl(player.photoUrl) ? (
                <Image
                  src={player.photoUrl}
                  alt={player.fullName}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-5xl">
                  —
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{player.fullName}</h1>
            <p className="text-blue-400 font-semibold uppercase text-xs tracking-wider mt-1">
              {player.position}
              {player.altPosition ? ` / ${player.altPosition}` : ""}
            </p>

            <div className="w-full border-t border-slate-800/80 my-4" />

            <dl className="w-full space-y-3 text-sm text-left text-slate-300">
              <div className="flex justify-between">
                <dt className="text-slate-500">Nacionalidad</dt>
                <dd className="font-medium">{player.nationality ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Edad</dt>
                <dd className="font-medium">
                  {player.age !== null ? `${player.age} años` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Pie</dt>
                <dd className="font-medium">{player.foot ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Altura</dt>
                <dd className="font-medium">
                  {player.heightCm !== null ? `${player.heightCm} cm` : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* ---------------- Rendimiento ---------------- */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Scouting Rating</h2>
                <p className="text-slate-400 text-xs mt-1">
                  {rating
                    ? `${rating.sampleMatches} partidos · ${rating.sampleMinutes} minutos · temporada ${rating.season}`
                    : "Aún no hay minutos suficientes registrados para calcularlo."}
                </p>
              </div>
              {rating ? (
                <div className="bg-blue-600/10 border border-blue-500/30 text-blue-400 text-3xl font-black px-5 py-3 rounded-xl tabular-nums">
                  {Number(rating.overallRating).toFixed(1)}
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 text-slate-400 text-sm px-5 py-3 rounded-xl">
                  sin calcular
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl min-h-[420px]">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-200">Perfil de rendimiento</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Cada eje es el percentil del jugador frente a los de su misma posición.
                </p>
              </div>

              {axes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-3 py-12 border border-dashed border-slate-700 rounded-xl">
                  <Info size={22} className="text-slate-500" />
                  <p className="text-slate-300 font-medium">Sin datos suficientes</p>
                  <p className="text-slate-500 text-sm max-w-sm">
                    El radar aparece cuando el jugador acumula los minutos mínimos que exige
                    el modelo de rating y se recalculan las métricas de la temporada.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-[300px] aspect-square">
                    <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                      {gridRings.map((points, index) => (
                        <polygon
                          key={points}
                          points={points}
                          fill="none"
                          stroke="#334155"
                          strokeWidth="1"
                          strokeDasharray={index !== gridRings.length - 1 ? "4 4" : "0"}
                        />
                      ))}

                      {axes.map((axis, index) => {
                        const { x, y } = coordinatesAt(index, 100);
                        return (
                          <line
                            key={axis.metricKey}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="#1e293b"
                            strokeWidth="1.5"
                          />
                        );
                      })}

                      <polygon
                        points={shapePoints}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                      />

                      {axes.map((axis, index) => {
                        const { x, y } = coordinatesAt(index, axis.percentile);
                        return (
                          <circle
                            key={axis.metricKey}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#60a5fa"
                            stroke="#0f172a"
                            strokeWidth="1.5"
                          />
                        );
                      })}

                      {axes.map((axis, index) => {
                        const { x, y } = coordinatesAt(index, 128);
                        return (
                          <text
                            key={axis.metricKey}
                            x={x}
                            y={y}
                            fill="#94a3b8"
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {`${axis.axisLabel} (${Math.round(axis.percentile)})`}
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  {rating ? (
                    <p className="text-slate-500 text-[11px] mt-6 text-center">
                      Modelo {rating.ratingModel?.name} v{rating.ratingModel?.version} ·
                      calculado el {rating.computedAt.toLocaleDateString("es-CL")}
                      {rating.isProvisional ? " · provisional (muestra corta)" : ""}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
