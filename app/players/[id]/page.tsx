import { getPlayerById } from "@/lib/services/player.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, Star, Award, ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { id } = await params;

  // Busca el jugador directamente en la base de datos usando el servicio de Prisma
  const player = await getPlayerById(id);

  if (!player) {
    notFound();
  }

  const rating = player.aggregatedRatings?.[0]?.overallRating || "N/A";

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Enlace para volver atrás */}
        <Link 
          href="/players" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 mb-8 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} /> Volver al Hub de Scouting
        </Link>

        {/* Estructura del Perfil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ficha Técnica de Identidad */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
            <div className="relative w-40 h-40 bg-slate-800 rounded-full overflow-hidden mb-4 border-2 border-slate-700">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-5xl">👤</div>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{player.fullName}</h1>
            <p className="text-blue-400 font-semibold uppercase text-xs tracking-wider mt-1">{player.position}</p>
            
            <div className="w-full border-t border-slate-800/80 my-4"></div>

            <div className="w-full space-y-3 text-sm text-left text-slate-300">
              <div className="flex justify-between"><span className="text-slate-500">Nacionalidad:</span> <span className="font-medium">{player.nationality}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Edad:</span> <span className="font-medium">{player.age} años</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Condición:</span> <span className="text-yellow-500 flex items-center gap-1 font-medium"><Star size={14} fill="currentColor"/> Elite Scout</span></div>
            </div>
          </div>

          {/* Bloque de Rendimiento y Radar */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Scouting Rating (RTG)</h2>
                <p className="text-slate-400 text-xs mt-1">Análisis algorítmico global.</p>
              </div>
              <div className="bg-blue-600/10 border border-blue-500/30 text-blue-400 text-3xl font-black px-5 py-3 rounded-xl">
                {rating}
              </div>
            </div>

            {/* Espacio reservado para renderizar el Polígono de Radar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[350px] text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-blue-400 mb-4">
                <Activity size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-200">Análisis del Área de Rendimiento</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-2">
                Aquí renderizaremos el polígono técnico usando gráficos SVG dinámicos.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-full border border-slate-700/50">
                <Award size={14} /> Próximo paso: Estructuración del Radar SVG
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}