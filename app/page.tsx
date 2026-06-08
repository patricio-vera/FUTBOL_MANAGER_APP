// =============================================================================
// HOME PAGE — PANEL PRINCIPAL DE DIRECCIONAMIENTO
// =============================================================================
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-6 flex justify-center text-emerald-400">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M12 17V5" />
            <path d="M6 17v-4" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Mister Manager &amp; Metrics
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Plataforma de análisis de rendimiento de fútbol profesional.
          Acceso de invitado habilitado — consulta estadísticas de jugadores sin
          necesidad de registro.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* TARJETA 1: JUGADORES (CORREGIDA PARA IR AL FRONTEND) */}
          <Link
            href="/players"
            className="bg-pitch-card border border-pitch-border rounded-xl p-5 hover:border-brand-500 transition-colors block text-left"
          >
            <div className="text-2xl mb-2"></div>
            <h2 className="font-semibold text-white">Jugadores</h2>
            <p className="text-slate-400 text-sm mt-1">Ver panel de scout</p>
          </Link>

          {/* TARJETA 2: PARTIDOS (PREPARADA PARA FRONTEND FUTURO) */}
          <Link
            href="/matches"
            className="bg-pitch-card border border-pitch-border rounded-xl p-5 hover:border-brand-500 transition-colors block text-left"
          >
            <div className="text-2xl mb-2"></div>
            <h2 className="font-semibold text-white">Partidos</h2>
            <p className="text-slate-400 text-sm mt-1">Calendario y análisis</p>
          </Link>

          {/* TARJETA 3: RANKINGS (PREPARADA PARA FRONTEND FUTURO) */}
          <Link
            href="/ratings/top"
            className="bg-pitch-card border border-pitch-border rounded-xl p-5 hover:border-brand-500 transition-colors block text-left"
          >
            <div className="text-2xl mb-2"></div>
            <h2 className="font-semibold text-white">Rankings</h2>
            <p className="text-slate-400 text-sm mt-1">
              Líderes de rendimiento
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}