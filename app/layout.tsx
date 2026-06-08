import type { Metadata } from "next";
import Link from "next/link"; 
import "./globals.css";

export const metadata: Metadata = {
  title: "ManagerMetrics", 
  description: "Plataforma de análisis de rendimiento y scouting de fútbol profesional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-white min-h-screen flex flex-col">
        
        {/* INICIO DE LA BARRA DE NAVEGACIÓN */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            
            {/* Logo e Identidad (Izquierda) */}
            <div className="flex items-center space-x-2">
              <Link href="/" className="font-bold text-lg text-emerald-400 tracking-wider">
                MANAGER<span className="text-white font-light">METRICS</span>
              </Link>
            </div>

            {/* Botones de Acción (Derecha) */}
            <div className="flex items-center space-x-4">
              {/* Cambiado: Texto actualizado para mejorar la seguridad y el filtro de usuarios */}
              <Link 
                href="/reclutamiento" 
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Regístrate si eres Reclutador
              </Link>
              <Link 
                href="/login" 
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
              >
                Iniciar Sesión
              </Link>
            </div>

          </div>
        </header>
        {/* FIN DE LA BARRA DE NAVEGACIÓN */}

        {/* Contenido dinámico de las páginas */}
        <div className="flex-1">
          {children}
        </div>

      </body>
    </html>
  );
}