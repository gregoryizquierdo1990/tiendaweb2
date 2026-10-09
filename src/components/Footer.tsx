import React from 'react';
import { Sparkles, ShieldCheck, Heart, Lock } from 'lucide-react';
import { AppBrandingConfig } from '../types';

interface FooterProps {
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onOpenSheets: () => void;
  projectName?: string;
  branding?: AppBrandingConfig;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTracker,
  onOpenAdmin,
  onOpenSheets,
  projectName = 'Gregory Izquierdo Streaming',
  branding
}) => {
  const oldDefault = 'Plataforma de suscripciones y perfiles de streaming con pasarela de pago manual y sincronización en Google Sheets.';
  const defaultDesc = 'Plataformas de Servicios : Perfiles, Cuentas Completas; dispositivos y Aplicaciones a tu disposicion y con Pasarela de Pago Manual';
  const description = (!branding?.footerDescription || branding?.footerDescription === oldDefault)
    ? defaultDesc
    : branding.footerDescription;
  const guarantee = branding?.footerGuaranteeText || 'Garantía 100% de duración';
  
  const platforms = branding?.footerPlatforms || [
    'Netflix Ultra HD 4K',
    'Disney+ con ESPN en Vivo',
    'Max (HBO Max) Platino',
    'Spotify Premium & Familiar',
    'YouTube Premium sin anuncios',
    'Magis TV & IPTV Internacional'
  ];

  const defaultPaymentMethods = [
    'Cuenta en EEUU',
    'Airtm',
    'Pago Móvil (Tasa BCV)',
    'Binance Pay (USDT)',
    'Banco Guayaquil (Ecuador)',
    'Wally & Zinli',
    'Apolopay-Uglycash',
    'TDC Banesco Conecta',
    '• Wallet Privada Zeny'
  ];

  const hasOldDefaults = branding?.footerPaymentMethods?.some(
    pm => pm.includes('Pichincha') || pm === 'UglyCash' || pm.includes('Zelle / ACH')
  );

  const paymentMethods = (!branding?.footerPaymentMethods || hasOldDefaults)
    ? defaultPaymentMethods
    : branding.footerPaymentMethods;

  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900 truncate max-w-[180px]">
                {branding?.projectName || projectName}
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              {description}
            </p>
            {guarantee && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{guarantee}</span>
              </div>
            )}
          </div>

          {/* Servicios Populares */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Plataformas
            </h4>
            <ul className="space-y-2 text-slate-500">
              {platforms.map((p, i) => (
                <li key={i} className="hover:text-slate-750 transition-colors">{p}</li>
              ))}
            </ul>
          </div>

          {/* Formas de Pago */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Pasarela de Pago Manual a tu Elección
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              {paymentMethods.map((pm, i) => {
                const isSpecial = pm.toLowerCase().includes('wallet') || pm.toLowerCase().includes('zeny');
                return (
                  <li key={i} className={isSpecial ? 'text-indigo-600 font-bold' : 'hover:text-slate-750 transition-colors'}>
                    {isSpecial ? `• ${pm}` : pm}
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-amber-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>enviar comprobante de pago para conciliacion</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} {branding?.projectName || projectName}. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Transacciones Seguras</span>
            </span>
            <span>•</span>
            <span>Entrega Garantizada</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
