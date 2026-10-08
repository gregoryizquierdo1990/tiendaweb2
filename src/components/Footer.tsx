import React from 'react';
import { Sparkles, MessageCircle, ShieldCheck, Heart, FileSpreadsheet, Lock } from 'lucide-react';
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
  const description = branding?.footerDescription || 'Plataforma de suscripciones y perfiles de streaming con pasarela de pago manual y sincronización en Google Sheets.';
  const guarantee = branding?.footerGuaranteeText || 'Garantía 100% de duración';
  
  const platforms = branding?.footerPlatforms || [
    'Netflix Ultra HD 4K',
    'Disney+ con ESPN en Vivo',
    'Max (HBO Max) Platino',
    'Spotify Premium & Familiar',
    'YouTube Premium sin anuncios',
    'Magis TV & IPTV Internacional'
  ];

  const paymentMethods = branding?.footerPaymentMethods || [
    'Cuenta en EEUU (Zelle / ACH)',
    'Airtm',
    'Pago Móvil (Tasa BCV)',
    'Binance Pay (USDT)',
    'Banco Pichincha (Ecuador)',
    'Wally & Zinli',
    'UglyCash',
    'TDC Banesco Conecta',
    'Wallet Privada Zeny'
  ];

  const whatsAppUrl = branding?.footerWhatsAppUrl || 'https://wa.me/584241983648?text=Hola,%20tengo%20una%20consulta%20sobre%20las%20cuentas%20de%20streaming';

  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
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
              Pasarela de Pago Manual ({paymentMethods.length} Métodos)
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
          </div>

          {/* Enlaces de Utilidad */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Gestión & Soporte
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={onOpenTracker}
                  className="hover:text-indigo-600 transition cursor-pointer font-medium flex items-center"
                >
                  Rastrear Estado de Pedido
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSheets}
                  className="hover:text-indigo-600 transition cursor-pointer flex items-center gap-1.5 font-medium"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Base de Datos Google Sheets</span>
                </button>
              </li>
              <li>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600 transition flex items-center gap-1 font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Soporte por WhatsApp</span>
                </a>
              </li>
            </ul>
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
