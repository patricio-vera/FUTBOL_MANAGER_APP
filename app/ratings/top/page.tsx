import Link from "next/link";
import { Trophy, Star, ChevronLeft, User, TrendingUp } from "lucide-react";

// Datos de prueba (Mocks) para visualizar el ranking
const topPlayers = [
  { id: "player-vini", name: "Vinícius Jr.", position: "LW", rating: 88.4, team: "Real Madrid" },
  { id: "player-saka", name: "Bukayo Saka", position: "RW", rating: 82.0, team: "Arsenal" },
  { id: "player-yamal", name: "Lamine Yamal", position: "RW", rating: 83.7, team: "Barcelona" },
  { id: "player-pedri", name: "Pedri", position: "CM", rating: 85.1, team: "Barcelona" },
  { id: "player-rodri", name: "Rodri", position: "DM", rating: 80.3, team: "Man City" },
];

// Ordenar por rating de mayor a menor
const sortedPlayers = [...topPlayers].sort((a, b) => b.rating - a.rating);

export default function RankingsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navegación */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 mb-6 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} /> Volver al Inicio
        </Link>

        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 mb-4 shadow-lg shadow-yellow-500/5">
            <Trophy size={32} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Global Scouting Rankings</h1>
          <p className="text-slate-400">Los jugadores con mejor rendimiento bajo nuestro algoritmo de análisis.</p>
        </header>

        {/* LISTA DE RANKING */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 font-semibold">Pos</th>
                  <th className="px-6 py-4 font-semibold">Jugador</th>
                  <th className="px-6 py-4 font-semibold text-center">RTG</th>
                  <th className="px-6 py-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedPlayers.map((player, index) => (
                  <tr key={player.id} className="hover:bg-blue-600/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20' : 
                          index === 1 ? 'bg-slate-300 text-slate-900' : 
                          index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}
                      `}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 border border-slate-700">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{player.name}</p>
                          <p className="text-xs text-slate-500 uppercase font-semibold">{player.position} • {player.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-blue-600/10 text-blue-400 px-3 py-1 rounded-lg font-black border border-blue-500/20">
                        {player.rating}
                        <TrendingUp size={14} className="opacity-50" />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        href={`/players/${player.id}`}
                        className="text-xs bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg font-bold transition-all"
                      >
                        Ver Perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
            <Star size={12} className="text-yellow-500" /> Los ratings se actualizan según el rendimiento en los últimos 5 partidos.
          </p>
        </footer>

      </div>
    </div>
  );
}