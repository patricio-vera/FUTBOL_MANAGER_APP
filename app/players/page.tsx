// =============================================================================
// PLAYERS PAGE — Vista principal del Hub de Scouting
// =============================================================================
// Renderiza las tarjetas de los jugadores obtenidas directamente de la DB.
// Objetivo: Mostrar un portafolio de alto nivel con UI/UX moderna.
// =============================================================================

import { prisma } from "../../lib/db/prisma";
import Link from "next/link";
import { User, Activity, Star } from "lucide-react";

// Estructura de datos para TypeScript
interface PlayerWithRatings {
  id: string;
  fullName: string;
  photoUrl: string | null;
  position: string;
  nationality: string;
  age: number;
  aggregatedRatings: {
    overallRating: number;
  }[];
}

export default async function PlayersPage() {
  // SQL: SELECT p.*, ar.overallRating FROM players p JOIN aggregatedRatings ar...
  // @ts-ignore
  const playersData = await prisma.player.findMany({
    include: {
      // @ts-ignore
      aggregatedRatings: { take: 1, orderBy: { computedAt: 'desc' } },
    },
    orderBy: { fullName: 'asc' }
  }) as unknown as PlayerWithRatings[];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-blue-400 mb-2">Scouting & Performance Hub</h1>
            <p className="text-slate-400">Análisis de rendimiento basado en métricas reales de campo.</p>
          </div>
          <div className="text-sm text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            Total jugadores: {playersData.length}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playersData.map((player) => {
            const rating = player.aggregatedRatings?.[0]?.overallRating || "N/A";
            
            return (
              <div key={player.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all group">
                {/* Cabecera de la tarjeta con Imagen */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  {player.photoUrl ? (
                    <img 
                      src={player.photoUrl} 
                      alt={player.fullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <User size={64} className="text-slate-700" />
                    </div>
                  )}
                  {/* Badge de Rating (como en FIFA/EAFC) */}
                  <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded-full font-bold shadow-lg text-sm">
                    RTG: {rating}
                  </div>
                </div>
                
                {/* Cuerpo de la tarjeta */}
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-1 truncate">{player.fullName}</h2>
                  <p className="text-blue-400 text-sm mb-4 font-medium uppercase tracking-wider">
                    {player.position} | {player.nationality}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-700/50 pt-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity size={16} className="text-blue-400" />
                      <span>{player.age} años</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span>Perfil Elite</span>
                    </div>
                  </div>
                  <Link 
  href={`/players/${player.id}`} 
  className="block text-center w-full mt-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white py-2 rounded-lg font-semibold transition-all text-xs"
>
  Ver Informe completo
</Link>
       
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}