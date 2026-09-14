// =============================================================================
// PLAYERS PAGE — Hub de Scouting
// =============================================================================
// Antes: este componente importaba Prisma y consultaba la base directamente,
// con dos `@ts-ignore` encima, saltándose la capa de servicios que el propio
// proyecto declaraba obligatoria. Ahora pasa por player.service como el resto.
// =============================================================================

import Link from "next/link";
import Image from "next/image";
import { User, Activity, Clock } from "lucide-react";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getPlayers } from "@/lib/services/player.service";
import { isOptimizableImageUrl } from "@/lib/domain/images";

// Depende de la organización activa por-request (hoy DEV_ORG_ID, mañana la
// sesión de Auth.js vía MM-008): nunca se puede pre-renderizar como estática.
// Sin esto, `next build` intenta congelarla en build-time, donde
// getActiveOrgId() se niega a resolver (a propósito) porque no hay sesión.
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const orgId = await getActiveOrgId();
  const { data: players } = await getPlayers(orgId, { limit: 24 });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-400 mb-2">Scouting &amp; Performance Hub</h1>
            <p className="text-slate-400">
              Análisis de rendimiento basado en métricas registradas en partido.
            </p>
          </div>
          <div className="text-sm text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            Jugadores en esta página: {players.length}
          </div>
        </header>

        {players.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-12 text-center">
            <h2 className="text-lg font-semibold text-slate-200">Todavía no hay jugadores</h2>
            <p className="text-slate-400 text-sm mt-2">
              Registra el primero para empezar a acumular métricas de partido.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const rating = player.latestRating;

              return (
                <div
                  key={player.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all group"
                >
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    {isOptimizableImageUrl(player.photoUrl) ? (
                      <Image
                        src={player.photoUrl}
                        alt={player.fullName}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <User size={64} className="text-slate-700" />
                      </div>
                    )}

                    {/* Sin rating calculado no se inventa un número: se dice que no lo hay. */}
                    {rating ? (
                      <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded-full font-bold shadow-lg text-sm">
                        RTG {Number(rating.overallRating).toFixed(1)}
                        {rating.isProvisional ? "*" : ""}
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-slate-700/80 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                        sin rating
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-bold mb-1 truncate">
                      {player.knownAs ?? player.fullName}
                    </h2>
                    <p className="text-blue-400 text-sm mb-4 font-medium uppercase tracking-wider">
                      {player.position}
                      {player.nationality ? ` · ${player.nationality}` : ""}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-700/50 pt-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Activity size={16} className="text-blue-400" />
                        <span>{player.age !== null ? `${player.age} años` : "edad no registrada"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={16} />
                        <span>
                          {rating ? `${rating.sampleMatches} partidos` : "sin partidos"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/players/${player.id}`}
                      className="block text-center w-full mt-4 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white py-2 rounded-lg font-semibold transition-all text-xs"
                    >
                      Ver informe completo
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
