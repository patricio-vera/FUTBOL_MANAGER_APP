import Link from "next/link";

export default function RecruiterPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
            Verificación Oficial
          </span>
          {/* Título exacto solicitado */}
          <h2 className="text-2xl font-bold text-white tracking-tight mt-3">
            Regístrate si eres Reclutador
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            El acceso a datos sensibles requiere una licencia vigente verificada por la FIFA.
          </p>
        </div>

        <form className="space-y-5">
          {/* Fila: Nombre y Club */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Ej: Juan Pérez" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Club / Agencia</label>
              <input 
                type="text" 
                placeholder="Ej: Real Madrid, Gestifute..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>
          </div>

          {/* CAMPO DE SEGURIDAD CRÍTICO: Licencia FIFA con diseño de advertencia perimetral */}
          <div>
            <label className="block text-xs font-semibold uppercase text-amber-400 mb-2 flex items-center gap-1">
              <span>⚠️ N° de Licencia de Agente / Scout FIFA</span>
            </label>
            <input 
              type="text" 
              placeholder="Ej: FIFA-2026-XXXXX" 
              className="w-full bg-slate-950 border border-amber-500/30 rounded-lg px-4 py-2.5 text-sm text-amber-200 placeholder-amber-700/50 focus:outline-none focus:border-amber-500 transition-colors font-mono" 
              required 
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Esta credencial será validada manualmente antes de otorgar acceso a los contratos de los jugadores.
            </p>
          </div>

          {/* Correo Electrónico Institucional */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Correo Institucional</label>
            <input 
              type="email" 
              placeholder="scout@tuclub.com" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" 
              required 
            />
          </div>

          {/* Motivo del Análisis */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Motivo del Análisis</label>
            <textarea 
              rows={2} 
              placeholder="¿Qué categorías o perfiles estás buscando evaluar?" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none" 
            />
          </div>

          {/* Botón de envío con estética premium esmeralda */}
          <button 
            type="submit" 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/10"
          >
            Enviar Solicitud de Verificación
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  );
}