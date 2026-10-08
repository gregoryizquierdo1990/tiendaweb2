import React from 'react';
import {
  SlidersHorizontal,
  Clock,
  User,
  LogIn,
  TrendingUp,
  RefreshCw,
  Tv,
  ExternalLink,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { CurrencyCode, SheetsConnectionState, CustomerUser } from '../types';
import { formatGrpay } from '../utils/formatters';

interface HeaderProps {
  currency: CurrencyCode;
  onCurrencyChange: (curr: CurrencyCode) => void;
  bcvRate: number;
  onRefreshBcv: () => void;
  isBcvLoading: boolean;
  sheetsState: SheetsConnectionState;
  customerUser: CustomerUser | null;
  onOpenCustomerModal: () => void;
  onOpenCustomerAuth: () => void;
  onOpenSheetsModal?: () => void;
  onOpenTrackerModal: () => void;
  onOpenAdminModal?: () => void;
  onOpenInstallModal?: () => void;
  pendingOrdersCount: number;
  pendingTopupsCount: number;
  branding?: import('../types').AppBrandingConfig;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onCurrencyChange,
  bcvRate,
  onRefreshBcv,
  isBcvLoading,
  sheetsState,
  customerUser,
  onOpenCustomerModal,
  onOpenCustomerAuth,
  onOpenSheetsModal,
  onOpenTrackerModal,
  onOpenAdminModal,
  onOpenInstallModal,
  pendingOrdersCount,
  pendingTopupsCount,
  branding
}) => {
  const banner = branding?.announcementBanner;
  const isBannerEnabled = banner?.enabled ?? true;
  const messages = banner?.messages && banner.messages.length > 0
    ? banner.messages
    : [
        'Entrega inmediata en menos de 15 minutos con garantía total durante todo el mes.',
        'Financiamiento disponible: Paga en cuotas al 50% inicial con Pago Móvil o Wallet Zeny.',
        'Tasa Oficial BCV actualizada en vivo y sin comisiones ocultas.'
      ];

  const [activeMsgIdx, setActiveMsgIdx] = React.useState(0);

  React.useEffect(() => {
    if (!isBannerEnabled || messages.length <= 1) return;
    const intervalTime = (banner?.speedSeconds || 5) * 1000;
    const timer = setInterval(() => {
      setActiveMsgIdx((prev) => (prev + 1) % messages.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isBannerEnabled, messages.length, banner?.speedSeconds]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      {/* Dynamic Customizable Announcement Banner */}
      {isBannerEnabled && (
        <div
          className="py-1.5 px-3 sm:px-6 text-xs font-semibold overflow-hidden transition-all flex items-center justify-center relative select-none"
          style={{
            backgroundColor: banner?.backgroundColor || '#1e1b4b',
            color: banner?.textColor || '#ffffff'
          }}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden mx-auto text-center">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider shrink-0">
                {banner?.badgeText || '🔥 OFERTAS 2026'}
              </span>

              {banner?.animationType === 'marquee' ? (
                <div className="overflow-hidden whitespace-nowrap flex items-center">
                  <div className="inline-block animate-marquee">
                    {messages.map((m, i) => (
                      <span key={i} className="mx-4 text-xs font-medium">
                        {m} <span className="opacity-40">•</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <span
                  key={activeMsgIdx}
                  className={`text-xs font-medium transition-all duration-500 truncate ${
                    banner?.animationType === 'fade' ? 'animate-fadeIn' : 'animate-slideInRight'
                  }`}
                >
                  {messages[activeMsgIdx]}
                </span>
              )}
            </div>

            {messages.length > 1 && banner?.animationType !== 'marquee' && (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {messages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveMsgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      activeMsgIdx === i ? 'bg-white w-3' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top micro banner with Prominent BCV Rate */}
      <div className="bg-slate-950 text-slate-100 py-2 px-3 sm:px-6 border-b border-slate-800 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Prominent BCV Rate Container */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 bg-slate-900 px-3 sm:px-4 py-1.5 rounded-xl border border-emerald-500/50 shadow-sm shadow-emerald-950/50">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-semibold text-xs sm:text-sm">Tasa Oficial BCV:</span>
                  <strong className="text-emerald-400 font-mono font-black text-sm sm:text-base md:text-lg tracking-tight tabular-nums">
                    {bcvRate} Bs/USD
                  </strong>
                </div>
                <span className="text-slate-300 font-semibold text-xs sm:text-sm">
                  Fecha Valor: {new Date().toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={onRefreshBcv}
                title="Actualizar tasa BCV oficial en vivo"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBcvLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
            <span className="hidden xl:inline text-slate-500 text-xs">•</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-slate-300 ml-auto">
            <button
              type="button"
              onClick={onOpenTrackerModal}
              className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rastrear Pedido</span>
            </button>
            {onOpenInstallModal && (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                title="Instalar tienda en tu teléfono para comprar rápido"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
                <span>Instalar App</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 sm:py-3.5 gap-2 sm:gap-4">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#" className="flex items-center gap-2 group">
              {/* Logo Image with Focused Circular Crop and Sutil Elegant Border - Mayor tamaño para lectura de detalle */}
              <div className="w-22 h-22 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center rounded-full overflow-hidden border-2 border-indigo-600/30 shadow-md bg-white p-0.5 transition-transform duration-300 group-hover:scale-105">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover object-center rounded-full scale-[1.15]" />
              </div>

              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                    Emprendimiento Gregory Izquierdo
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600">
                  J-50639379-4
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold text-slate-500 flex items-center gap-1 truncate">
                  <span>Streaming · Cuentas & Servicios</span>
                </span>
              </div>
            </a>
          </div>

          {/* Action Bar - Aligned Right */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 px-2">
            {/* Currency selector: USD / BS */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => onCurrencyChange('USD')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer ${
                  currency === 'USD' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('BS')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer ${
                  currency === 'BS' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                BS (Bs.)
              </button>
            </div>

            {/* Prominent Customer Login Icon / Portal */}
            {customerUser ? (
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 transition cursor-pointer"
                title="Ver mis suscripciones y wallet Zeny"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {customerUser.name.substring(0, 1)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {customerUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-extrabold text-indigo-700 font-mono">
                    {formatGrpay(customerUser.zenyBalance)}
                  </div>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCustomerAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                title="Iniciar Sesión / Registro de Clientes"
              >
                <User className="w-4 h-4" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-bold">Ingresar</span>
                  <span className="text-[8px] sm:text-[10px] opacity-90 font-medium">Clientes</span>
                </div>
              </button>
            )}

            {/* Admin Reconciliation Button (Oculto en tienda pública según preferencia de seguridad) */}
            {onOpenAdminModal && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="relative hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Acceso Administración"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden md:inline">Admin</span>
                {(pendingOrdersCount > 0 || pendingTopupsCount > 0) && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 animate-pulse">
                    {pendingOrdersCount + pendingTopupsCount}
                  </span>
                )}
              </button>
            )}

            {/* WhatsApp Support Button */}
            <a
              href="https://wa.me/584241983648?text=Hola,%20necesito%20Soporte/Asesoria"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Soporte WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Soporte</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
