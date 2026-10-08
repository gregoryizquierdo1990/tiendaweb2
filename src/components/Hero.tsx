import React from 'react';
import {
  Search,
  ShieldCheck,
  Zap,
  Headphones,
  CheckCircle,
  Tv,
  Film,
  Music,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';
import { ServiceCategory } from '../types';
import { useAppStore } from '../store/useAppStore';

interface HeroProps {
  selectedCategory: ServiceCategory;
  onSelectCategory: (category: ServiceCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalProductsCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalProductsCount
}) => {
  const branding = useAppStore((state) => state.branding);

  const categories: { id: ServiceCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'todos', label: 'Todos los Servicios', icon: <Layers className="w-4 h-4" /> },
    { id: 'series_peliculas', label: 'Películas & Series', icon: <Film className="w-4 h-4" /> },
    { id: 'musica', label: 'Música & Audio', icon: <Music className="w-4 h-4" /> },
    { id: 'deportes_tv', label: 'Deportes & IPTV', icon: <Tv className="w-4 h-4" /> },
    { id: 'combos', label: 'Combos & Promos', icon: <Sparkles className="w-4 h-4" /> }
  ];

  // Dynamic styling based on branding state
  const alignmentClass =
    branding?.heroAlignment === 'left'
      ? 'text-left max-w-3xl mr-auto'
      : branding?.heroAlignment === 'right'
      ? 'text-right max-w-3xl ml-auto'
      : 'text-center max-w-3xl mx-auto';

  const titleSizeClass =
    branding?.heroFontSize === 'lg'
      ? 'text-xl sm:text-2xl lg:text-3xl'
      : branding?.heroFontSize === 'xl'
      ? 'text-2xl sm:text-3xl lg:text-4xl'
      : branding?.heroFontSize === '2xl'
      ? 'text-3xl sm:text-4xl lg:text-4xl'
      : branding?.heroFontSize === '4xl'
      ? 'text-4xl sm:text-5xl lg:text-6xl'
      : 'text-3xl sm:text-4xl lg:text-5xl'; // default 3xl

  const badgeText = branding?.heroBadgeText || 'Entrega Inmediata & Garantía Total de Duración';
  const heroTitle = branding?.heroTitle || 'Tus suscripciones de streaming favoritas con un';
  const heroGradient = branding?.heroTitleGradient || 'diseño claro y precio justo';
  const heroSubtitle =
    branding?.heroSubtitle ||
    'Perfiles privados con PIN y cuentas completas en 4K Ultra HD. Paga con Pago Móvil a tasa oficial BCV, Binance Pay, Cuenta en EEUU (Zelle/ACH), Airtm, Pichincha Ecuador, Wally, Zinli, UglyCash, TDC Banesco Conecta o saldo Zeny.';

  return (
    <section
      className="relative overflow-hidden pt-8 pb-10 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/60"
      style={{ fontFamily: branding?.heroFontFamily || branding?.fontFamily || 'inherit' }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-100/40 via-sky-50/50 to-purple-100/30 blur-3xl -z-10 pointer-events-none" />

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${branding?.containerMaxWidth || 'max-w-7xl'}`}>
        <div className={`${alignmentClass} mb-8 sm:mb-10`}>

          <h1 className={`${titleSizeClass} font-extrabold text-slate-900 tracking-tight leading-tight`}>
            {heroTitle} {heroGradient}
          </h1>
          <div className="mt-4 w-full max-w-sm mx-auto overflow-hidden rounded-full bg-indigo-600 shadow-sm">
            <div className="animate-marquee whitespace-nowrap text-white text-xs font-bold px-3 py-2">
              Promociones con pagos en Billetera
            </div>
          </div>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto">
            {heroSubtitle}
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-indigo-700 text-xs font-bold font-mono shadow-sm">
            <span>1 ZenyPoint = $1.00 USD</span>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm font-semibold text-slate-700 p-4 bg-slate-100 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>100% Garantia</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Activacion Directa</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-indigo-600" />
              <span>Soporte por WhatsApp 7 Dias</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar servicio (ej. Netflix, Disney+, Spotify, MagisTV, Combo...)"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200/90 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Minimal Category Navigation Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 scale-102'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
