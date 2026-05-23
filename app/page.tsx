// =============================================================================
// HOME PAGE — PANEL PRINCIPAL DE DIRECCIONAMIENTO
// =============================================================================
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-6 text-6xl">⚽</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Scouting &amp; Performance Analytics Hub
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
            <div className="text-2xl mb-2">👤</div>
            <h2 className="font-semibold text-white">Jugadores</h2>
            <p className="text-slate-400 text-sm mt-1">Ver panel de scout</p>
          </Link>

          {/* TARJETA 2: PARTIDOS (PREPARADA PARA FRONTEND FUTURO) */}
          <Link
            href="/matches"
            className="bg-pitch-card border border-pitch-border rounded-xl p-5 hover:border-brand-500 transition-colors block text-left"
          >
            <div className="text-2xl mb-2">🏟️</div>
            <h2 className="font-semibold text-white">Partidos</h2>
            <p className="text-slate-400 text-sm mt-1">Calendario y análisis</p>
          </Link>

          {/* TARJETA 3: RANKINGS (PREPARADA PARA FRONTEND FUTURO) */}
          <Link
            href="/ratings/top"
            className="bg-pitch-card border border-pitch-border rounded-xl p-5 hover:border-brand-500 transition-colors block text-left"
          >
            <div className="text-2xl mb-2">📊</div>
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