import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Shield, 
  ShoppingBag, 
  Building2, 
  FileText, 
  Layers, 
  ArrowLeft, 
  Sparkles,
  Share2
} from 'lucide-react';
import { ACTIVE_SYSTEM_ROUTES, RouteItem } from '../config/routesDirectory';
import { DOMAIN_OFFICIAL } from '../utils/messageTemplates';

interface OfficialRoutesDirectoryProps {
  onBackToStore: () => void;
  onNavigateToRoute?: (path: string) => void;
}

export const OfficialRoutesDirectory: React.FC<OfficialRoutesDirectoryProps> = ({
  onBackToStore,
  onNavigateToRoute
}) => {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'publico' | 'administrativo' | 'franquicia' | 'utilidad'>('all');

  const handleCopyUrl = (url: string, path: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleCopyAllSummary = () => {
    const textSummary = `🌐 RUTAS OFICIALES Y ACTIVAS EN ${DOMAIN_OFFICIAL} 🌐\n\n` +
      ACTIVE_SYSTEM_ROUTES.map((r, i) => 
        `${i + 1}. ${r.name.toUpperCase()}\n` +
        `🔗 URL: ${r.fullUrl}\n` +
        `🎯 Propósito: ${r.purpose}\n` +
        `👤 Acceso: ${r.accessRole}\n` +
        `📝 Detalle: ${r.description}\n`
      ).join('\n---\n\n') +
      `\nTodos los derechos reservados © ${new Date().getFullYear()} ${DOMAIN_OFFICIAL.replace('https://', '')}`;

    navigator.clipboard.writeText(textSummary);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const filteredRoutes = filterCategory === 'all' 
    ? ACTIVE_SYSTEM_ROUTES 
    : ACTIVE_SYSTEM_ROUTES.filter(r => r.category === filterCategory);

  const getCategoryBadge = (cat: RouteItem['category']) => {
    switch (cat) {
      case 'administrativo':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Panel Administrativo
          </span>
        );
      case 'publico':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" /> Tienda Pública
          </span>
        );
      case 'franquicia':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Red Franquicias
          </span>
        );
      case 'utilidad':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Utilidad del Sistema
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Volver a la tienda"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Tienda</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Directorio de Rutas Oficiales
                </h1>
                <p className="text-xs text-indigo-600 font-semibold font-mono">
                  {DOMAIN_OFFICIAL}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAllSummary}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedAll ? '¡Copiado al portapapeles!' : 'Copiar Todas las Rutas'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Banner Explanatory */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mapa de Navegación Oficial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Rutas Activas en {DOMAIN_OFFICIAL.replace('https://', '')}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              A continuación tienes el listado completo y actualizado de todas las URLs configuradas en tu dominio oficial, indicando la función exacta de cada una, el tipo de acceso requerido y botones de enlace directo y copia rápida.
            </p>
          </div>
          {/* Subtle Background Accent */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <span className="text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Filtrar:
          </span>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas ({ACTIVE_SYSTEM_ROUTES.length})
          </button>
          <button
            onClick={() => setFilterCategory('publico')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterCategory === 'publico'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Públicas
          </button>
          <button
            onClick={() => setFilterCategory('administrativo')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterCategory === 'administrativo'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Administrativas
          </button>
          <button
            onClick={() => setFilterCategory('franquicia')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterCategory === 'franquicia'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Franquicias
          </button>
          <button
            onClick={() => setFilterCategory('utilidad')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterCategory === 'utilidad'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Utilidades
          </button>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 gap-5">
          {filteredRoutes.map((route, idx) => {
            const isCopied = copiedPath === route.path;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4"
              >
                {/* Header of card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {route.name}
                      </h3>
                      {getCategoryBadge(route.category)}
                    </div>
                    <p className="text-xs text-indigo-700 font-bold">
                      🎯 {route.purpose}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyUrl(route.fullUrl, route.path)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Copiar URL completa"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{isCopied ? '¡Copiado!' : 'Copiar URL'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (route.path.includes(':')) {
                          // Dynamic route example
                          const sampleUrl = '/invoice/FACT-DEMO-01';
                          if (onNavigateToRoute) onNavigateToRoute(sampleUrl);
                          else window.location.pathname = sampleUrl;
                        } else if (onNavigateToRoute) {
                          onNavigateToRoute(route.path);
                        } else {
                          window.location.pathname = route.path;
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{route.path.includes(':') ? 'Ver Ejemplo' : 'Abrir Ruta'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* URL Badge Box */}
                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs flex items-center justify-between gap-3 overflow-x-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold">URL:</span>
                    <span className="text-white select-all font-semibold">
                      {route.fullUrl}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">
                    Acceso: {route.accessRole}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {route.description}
                </p>

                {/* Key Features */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Funcionalidades de esta ruta:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    {route.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Reference Summary Box */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <h4 className="font-bold flex items-center gap-2 text-sm">
            <span>💡 Resumen Rápido para Clientes y Franquicias:</span>
          </h4>
          <p className="leading-relaxed">
            Puedes compartir estas URLs en tus mensajes de WhatsApp, redes sociales o contratos:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-amber-950">
            <li><strong>{DOMAIN_OFFICIAL}</strong> : Para tus clientes finales que desean comprar cuentas y pantallas.</li>
            <li><strong>{DOMAIN_OFFICIAL}/admin</strong> : Tu acceso exclusivo como dueño para gestionar pedidos, cuentas y finanzas.</li>
            <li><strong>{DOMAIN_OFFICIAL}/solicitud-franquicia</strong> : Para captar nuevos revendedores o personas que quieren su propia franquicia.</li>
            <li><strong>{DOMAIN_OFFICIAL}/rutas</strong> : Este mapa interactivo con todas las rutas activas de tu plataforma.</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Plataforma Oficial {DOMAIN_OFFICIAL} • Diseñado para Alta Disponibilidad & Streaming
      </footer>
    </div>
  );
};
