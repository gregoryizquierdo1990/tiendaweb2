import React, { useState } from 'react';
import { Bell, Sparkles, X, Phone, Mail, Megaphone } from 'lucide-react';

interface AnnouncementBannerProps {
  customMessage?: string;
  companyPhone?: string;
  companyEmail?: string;
  thickness?: 'compact' | 'normal' | 'spacious';
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  customMessage = '¡Bienvenidos a nuestra plataforma de streaming oficial! Soporte 24/7 y recargas inmediatas vía WhatsApp y Telegram.',
  companyPhone = '04241983648 / +584241983648',
  companyEmail = 'emprendimientogregoryizquierdo@gmail.com',
  thickness = 'normal'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const paddingClass =
    thickness === 'compact'
      ? 'py-1.5'
      : thickness === 'spacious'
      ? 'py-4 sm:py-5'
      : 'py-2.5';

  return (
    <div className={`w-full bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 border-b border-indigo-500/30 text-white px-4 ${paddingClass} shadow-md relative z-40 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            <Megaphone className="w-4 h-4" />
          </span>
          <p className="font-medium text-slate-200 leading-snug">
            {customMessage}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          <a
            href={`https://wa.me/584241983648?text=${encodeURIComponent('Hola, necesito información o soporte con mi cuenta streaming.')}`}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition"
            title="Atención vía WhatsApp y Telegram"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{companyPhone}</span>
          </a>

          <a
            href={`mailto:${companyEmail}`}
            className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold hidden md:flex items-center gap-1.5 transition"
            title="Correo de la empresa"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{companyEmail}</span>
          </a>

          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

