import { getPlayerById } from "@/lib/services/player.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ChevronLeft } from "lucide-react";

//  Molde estricto para indicarle a TypeScript la estructura exacta del JSON de Neon
interface RadarMetric {
  axis: string;
  value: number;
}

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

  // Extraemos el rating global
  const rating = player.aggregatedRatings?.[0]?.overallRating || "N/A";

  // Extraemos el snapshot en crudo desde Neon
  const snapshotRaw = player.aggregatedRatings?.[0]?.radarSnapshot;

  //  FUNCIÓN AYUDANTE CORREGIDA: Sin un solo 'any'. Código 100% tipado y seguro.
  const getMetricValue = (axisName: string, fallback: number): number => {
    if (!Array.isArray(snapshotRaw)) return fallback;

    // Convertimos de forma segura el JSON desconocido al molde RadarMetric[]
    const metrics = snapshotRaw as unknown as RadarMetric[];
    
    const found = metrics.find(
      (item) => item?.axis?.toLowerCase() === axisName.toLowerCase()
    );
    
    return found && typeof found.value === "number" ? found.value : fallback;
  };

  // Mapeamos los nombres exactos que descubrimos en la consola de diagnóstico
  const stats = {
    ritmo: getMetricValue("Pace", 70),
    tiro: getMetricValue("Goals/90", 65),
    pase: getMetricValue("Passing", 80),
    regate: getMetricValue("Dribbling", 75),
    defensa: getMetricValue("Pressing", 72)
  };

  // --- CONFIGURACIÓN MATEMÁTICA DEL RADAR ---
  const center = 150;     
  const maxRadius = 100;  
  const totalStats = 5;   

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / totalStats) * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  };

  // Capas concéntricas de fondo (25%, 50%, 75%, 100%)
  const levels = [25, 50, 75, 100];
  const levelPaths = levels.map((level) => {
    return Array.from({ length: totalStats }).map((_, i) => {
      const { x, y } = getCoordinates(i, level);
      return `${x},${y}`;
    }).join(" ");
  });

  // Coordenadas reales del Polígono según la Base de Datos
  const playerStatsArray = [stats.ritmo, stats.tiro, stats.pase, stats.regate, stats.defensa];
  const playerPoints = playerStatsArray.map((val, i) => {
    const { x, y } = getCoordinates(i, val);
    return `${x},${y}`;
  }).join(" ");

  // Textos exteriores con valores extraídos en tiempo real
  const labels = [
    { name: `RIT (${stats.ritmo})`, ...getCoordinates(0, 125) },
    { name: `TIR (${stats.tiro})`, ...getCoordinates(1, 120) },
    { name: `PAS (${stats.pase})`, ...getCoordinates(2, 120) },
    { name: `REG (${stats.regate})`, ...getCoordinates(3, 120) },
    { name: `DEF (${stats.defensa})`, ...getCoordinates(4, 125) },
  ];

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
          
          {/* Ficha Técnico de Identidad */}
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

            {/* Espacio del Polígono de Radar SVG Dinámico */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
              <div className="self-start mb-6">
                <h3 className="text-lg font-bold text-slate-200">Análisis del Área de Rendimiento</h3>
                <p className="text-slate-400 text-xs mt-0.5">Polígono técnico indexado directamente desde la base de datos.</p>
              </div>

              {/* CONTENEDOR DEL GRÁFICO VECTORIAL */}
              <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
                <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                  
                  {/* Rejilla de pentágonos concéntricos */}
                  {levelPaths.map((points, idx) => (
                    <polygon
                      key={idx}
                      points={points}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray={idx !== 3 ? "4 4" : "0"}
                    />
                  ))}

                  {/* Ejes de simetría */}
                  {Array.from({ length: totalStats }).map((_, i) => {
                    const { x, y } = getCoordinates(i, 100);
                    return (
                      <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke="#1e293b"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* EL POLÍGONO INTERACTIVO DINÁMICO */}
                  <polygon
                    points={playerPoints}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Nodos puntuales */}
                  {playerStatsArray.map((val, i) => {
                    const { x, y } = getCoordinates(i, val);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#60a5fa"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Textos perimetrales */}
                  {labels.map((label, i) => (
                    <text
                      key={i}
                      x={label.x}
                      y={label.y}
                      fill="#94a3b8"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="font-sans tracking-wide"
                    >
                      {label.name}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}