import React, { useState } from 'react';
import {
  Sliders,
  X,
  Type,
  Layout,
  Maximize2,
  Minimize2,
  RotateCcw,
  Check,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AppBrandingConfig } from '../types';

interface VisualUIEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Moderna / Editorial)' },
  { id: 'Inter', label: 'Inter (Tecnológica / Limpia)' },
  { id: 'Outfit', label: 'Outfit (Geométrica / Premium)' },
  { id: 'Poppins', label: 'Poppins (Amigable / Dinámica)' },
  { id: 'Montserrat', label: 'Montserrat (Imponente / Comercial)' },
  { id: 'Cinzel', label: 'Cinzel (Lujosa / Clásica)' }
];

const COLOR_PRESETS = [
  { name: 'Indigo Real', primary: '#4f46e5', secondary: '#7c3aed' },
  { name: 'Azul Eléctrico', primary: '#2563eb', secondary: '#0284c7' },
  { name: 'Púrpura Neón', primary: '#9333ea', secondary: '#c026d3' },
  { name: 'Esmeralda', primary: '#059669', secondary: '#10b981' },
  { name: 'Ámbar Dorado', primary: '#d97706', secondary: '#b45309' },
  { name: 'Oscuro Cyber', primary: '#334155', secondary: '#0f172a' }
];

const DEFAULT_BRANDING: Partial<AppBrandingConfig> = {
  heroTitle: 'Tus suscripciones de streaming favoritas con un',
  heroTitleGradient: 'diseño claro y precio justo',
  heroSubtitle: 'Perfiles privados con PIN y cuentas completas en 4K Ultra HD. Paga con Pago Móvil a tasa oficial BCV, Binance Pay, Zelle, Airtm, Pichincha, Zinli o saldo GRPAY.',
  heroBadgeText: 'Entrega Inmediata & Garantía Total de Duración',
  heroFontSize: '3xl',
  heroFontFamily: 'Plus Jakarta Sans',
  heroAlignment: 'center',
  bannerPlacement: 'below_hero',
  bannerThickness: 'normal',
  bannerMessage: '¡Bienvenidos a nuestra plataforma de streaming oficial! Soporte 24/7 y recargas inmediatas vía WhatsApp y Telegram.',
  bannerPhone: '04241983648 / +584241983648',
  bannerEmail: 'emprendimientogregoryizquierdo@gmail.com',
  cardRadius: 'rounded-2xl',
  containerMaxWidth: 'max-w-7xl',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6'
};

export const VisualUIEditor: React.FC<VisualUIEditorProps> = ({ isOpen, onClose }) => {
  const branding = useAppStore((state) => state.branding);
  const setBranding = useAppStore((state) => state.setBranding);

  const [activeTab, setActiveTab] = useState<'hero' | 'banner' | 'estilo' | 'colores'>('hero');
  const [isMinimized, setIsMinimized] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen) return null;

  const updateBranding = (updates: Partial<AppBrandingConfig>) => {
    const updated = { ...branding, ...updates };
    setBranding(updated);
  };

  const handleReset = () => {
    if (window.confirm('¿Restablecer los valores visuales por defecto de la plataforma?')) {
      updateBranding(DEFAULT_BRANDING);
      triggerSaveNotification();
    }
  };

  const triggerSaveNotification = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 shadow-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl ${
        isMinimized
          ? 'bottom-6 right-6 w-72 p-3'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[450px] max-h-[85vh] flex flex-col overflow-hidden'
      }`}
      style={{
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.15)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Editor Visual de Interfaz</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-mono">En Vivo</span>
            </h3>
            <p className="text-[11px] text-slate-500">Personaliza textos, tamaños y posiciones</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Cerrar editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* When minimized */}
      {isMinimized ? (
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-600 font-medium">Editor pausado</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Abrir controles
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-100 bg-white px-2 pt-1 gap-1 text-xs">
            <button
              onClick={() => setActiveTab('hero')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition ${
                activeTab === 'hero'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Bienvenida (Hero)</span>
            </button>
            <button
              onClick={() => setActiveTab('banner')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition ${
                activeTab === 'banner'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Banner & Barra</span>
            </button>
            <button
              onClick={() => setActiveTab('colores')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition ${
                activeTab === 'colores'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Colores</span>
            </button>
            <button
              onClick={() => setActiveTab('estilo')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition ${
                activeTab === 'estilo'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cajones & Layout</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Insignia Superior (Badge Promocional)
                  </label>
                  <input
                    type="text"
                    value={branding.heroBadgeText || ''}
                    onChange={(e) => updateBranding({ heroBadgeText: e.target.value })}
                    placeholder="Ej. Entrega Inmediata & Garantía Total"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Titular Principal (Línea 1)
                  </label>
                  <input
                    type="text"
                    value={branding.heroTitle || ''}
                    onChange={(e) => updateBranding({ heroTitle: e.target.value })}
                    placeholder="Ej. Tus suscripciones de streaming favoritas con un"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Titular Destacado (Gradiente / Color)
                  </label>
                  <input
                    type="text"
                    value={branding.heroTitleGradient || ''}
                    onChange={(e) => updateBranding({ heroTitleGradient: e.target.value })}
                    placeholder="Ej. diseño claro y precio justo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subtítulo / Mensaje de Bienvenida
                  </label>
                  <textarea
                    rows={3}
                    value={branding.heroSubtitle || ''}
                    onChange={(e) => updateBranding({ heroSubtitle: e.target.value })}
                    placeholder="Describe los beneficios principales de tu plataforma..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Typography & Size */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Fuente del Titular
                    </label>
                    <select
                      value={branding.heroFontFamily || 'Plus Jakarta Sans'}
                      onChange={(e) => updateBranding({ heroFontFamily: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px]"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tamaño del Titular
                    </label>
                    <div className="flex items-center gap-1">
                      {(['lg', 'xl', '2xl', '3xl', '4xl'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateBranding({ heroFontSize: sz })}
                          className={`flex-1 py-1.5 rounded-lg border font-bold uppercase text-[10px] transition ${
                            (branding.heroFontSize || '3xl') === sz
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alignment */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Alineación del Texto de Bienvenida
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateBranding({ heroAlignment: 'left' })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border font-semibold transition ${
                        branding.heroAlignment === 'left'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Izquierda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBranding({ heroAlignment: 'center' })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border font-semibold transition ${
                        (branding.heroAlignment || 'center') === 'center'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>Centrado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBranding({ heroAlignment: 'right' })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border font-semibold transition ${
                        branding.heroAlignment === 'right'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                      <span>Derecha</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'banner' && (
              <div className="space-y-4">
                {/* Banner Placement */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Ubicación del Banner en la Página
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateBranding({ bannerPlacement: 'below_hero' })}
                      className={`p-3 rounded-2xl border text-left transition ${
                        (branding.bannerPlacement || 'below_hero') === 'below_hero'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">Debajo del Mensaje</div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        Colocado directamente tras el mensaje de bienvenida
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateBranding({ bannerPlacement: 'top' })}
                      className={`p-3 rounded-2xl border text-left transition ${
                        branding.bannerPlacement === 'top'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">Arriba en Cabecera</div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        Ubicado en la parte superior sobre el contenido
                      </div>
                    </button>
                  </div>
                </div>

                {/* Banner Thickness */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Grosor y Altura del Banner
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', label: 'Delgado', desc: 'py-1.5 (Discreto)' },
                      { id: 'normal', label: 'Estándar', desc: 'py-2.5 (Equilibrado)' },
                      { id: 'spacious', label: 'Amplio', desc: 'py-4.5 (Destacado)' }
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => updateBranding({ bannerThickness: th.id as any })}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          (branding.bannerThickness || 'normal') === th.id
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{th.label}</div>
                        <div className="text-[9px] opacity-80">{th.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Texto del Mensaje del Banner
                  </label>
                  <textarea
                    rows={2}
                    value={branding.bannerMessage || ''}
                    onChange={(e) => updateBranding({ bannerMessage: e.target.value })}
                    placeholder="Texto de aviso a mostrar..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Contact info in banner */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Teléfono Banner
                    </label>
                    <input
                      type="text"
                      value={branding.bannerPhone || ''}
                      onChange={(e) => updateBranding({ bannerPhone: e.target.value })}
                      placeholder="04241983648"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Correo Banner
                    </label>
                    <input
                      type="text"
                      value={branding.bannerEmail || ''}
                      onChange={(e) => updateBranding({ bannerEmail: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colores' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-2">
                    Paletas Predefinidas Recomendadas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => updateBranding({ primaryColor: p.primary, secondaryColor: p.secondary })}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white text-left transition"
                      >
                        <div className="flex -space-x-1 shrink-0">
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: p.primary }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: p.secondary }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Color Primario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.primaryColor || '#6366f1'}
                        onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor || '#6366f1'}
                        onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Color Secundario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.secondaryColor || '#8b5cf6'}
                        onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor || '#8b5cf6'}
                        onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'estilo' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Curvatura de Cajones y Tarjetas
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'rounded-xl', label: 'Suave (xl)' },
                      { id: 'rounded-2xl', label: 'Moderno (2xl)' },
                      { id: 'rounded-3xl', label: 'Orgánico (3xl)' }
                    ].map((rad) => (
                      <button
                        key={rad.id}
                        type="button"
                        onClick={() => updateBranding({ cardRadius: rad.id as any })}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                          (branding.cardRadius || 'rounded-2xl') === rad.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {rad.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Ancho Máximo del Contenido Central
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'max-w-6xl', label: 'Compacto' },
                      { id: 'max-w-7xl', label: 'Estándar' },
                      { id: 'max-w-full', label: 'Fluido' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => updateBranding({ containerMaxWidth: w.id as any })}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                          (branding.containerMaxWidth || 'max-w-7xl') === w.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fuente General de la Plataforma
                  </label>
                  <select
                    value={branding.fontFamily || 'Plus Jakarta Sans'}
                    onChange={(e) => updateBranding({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition text-[11px] font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <div className="flex items-center gap-2">
              {saveToast && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> ¡Guardado!
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  triggerSaveNotification();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar y Cerrar</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
