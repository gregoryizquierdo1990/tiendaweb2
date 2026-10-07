import React from 'react';
import { AlertCircle, LifeBuoy, ShieldAlert, Sparkles } from 'lucide-react';

interface FloatingIncidentButtonProps {
  onClick: () => void;
  openIncidentsCount?: number;
}

export const FloatingIncidentButton: React.FC<FloatingIncidentButtonProps> = ({
  onClick,
  openIncidentsCount = 0
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Reportar falla o incidencia técnica en tu servicio de streaming"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 group cursor-pointer select-none transition-all duration-300 hover:-translate-x-1 focus:outline-hidden"
      aria-label="Reporte Incidencia"
    >
      <div className="relative flex items-center bg-gradient-to-l from-rose-600 via-rose-500 to-amber-500 text-white pl-3.5 pr-2.5 py-3 rounded-l-2xl shadow-xl shadow-rose-500/25 border-y border-l border-white/20 backdrop-blur-md">
        {/* Subtle pulsating beacon */}
        <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300 border-2 border-white"></span>
        </span>

        {/* Content layout */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors shadow-2xs">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>

          <div className="flex flex-col text-left leading-none pr-1">
            <span className="text-[10px] uppercase tracking-wider font-black text-rose-100 flex items-center gap-1">
              <span>Soporte</span>
              {openIncidentsCount > 0 && (
                <span className="bg-amber-300 text-slate-900 px-1 py-0.2 rounded-full font-black text-[9px]">
                  {openIncidentsCount}
                </span>
              )}
            </span>
            <span className="text-xs font-black tracking-tight text-white whitespace-nowrap drop-shadow-xs">
              Reporte Incidencia
            </span>
          </div>
        </div>

        {/* Edge highlight */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-none" />
      </div>
    </button>
  );
};
