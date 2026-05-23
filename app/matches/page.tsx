import Link from "next/link";
import { Calendar, MapPin, ChevronLeft, Shield } from "lucide-react";

// Datos de prueba (Mocks) para visualizar el diseño
const mockMatches = [
  {
    id: "match-1",
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    date: "2026-05-28T20:00:00Z",
    competition: "Champions League - Final",
    stadium: "Wembley Stadium",
    status: "Próximo",
  },
  {
    id: "match-2",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    date: "2026-05-15T15:00:00Z",
    competition: "Premier League",
    stadium: "Emirates Stadium",
    status: "Finalizado",
    score: "2 - 1"
  },
  {
    id: "match-3",
    homeTeam: "Barcelona",
    awayTeam: "Bayern Munich",
    date: "2026-05-18T19:45:00Z",
    competition: "Amistoso Internacional",
    stadium: "Camp Nou",
    status: "Próximo",
  }
];

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera y botón de regreso */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 mb-6 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} /> Volver al Inicio
        </Link>

        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-400 mb-2">Partidos y Calendario</h1>
            <p className="text-slate-400">Análisis pre y post partido para scouting táctico.</p>
          </div>
          <div className="text-sm text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            Total registrados: {mockMatches.length}
          </div>
        </header>

        {/* Cuadrícula de Tarjetas de Partidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMatches.map((match) => (
            <div key={match.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors group relative overflow-hidden shadow-xl">
              
              {/* Etiqueta de Estado */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${match.status === 'Finalizado' ? 'bg-slate-700 text-slate-300' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}>
                {match.status}
              </div>

              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-6">
                {match.competition}
              </div>

              {/* Equipos */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col items-center gap-2 w-2/5 text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 shadow-inner">
                    <Shield size={24} />
                  </div>
                  <span className="font-bold text-sm leading-tight">{match.homeTeam}</span>
                </div>

                <div className="w-1/5 flex justify-center text-xl font-black text-slate-300">
                  {match.score ? match.score : "VS"}
                </div>

                <div className="flex flex-col items-center gap-2 w-2/5 text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 shadow-inner">
                    <Shield size={24} />
                  </div>
                  <span className="font-bold text-sm leading-tight">{match.awayTeam}</span>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar size={14} className="text-blue-400" />
                  <span>{new Date(match.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin size={14} className="text-blue-400" />
                  <span>{match.stadium}</span>
                </div>
              </div>
              
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}