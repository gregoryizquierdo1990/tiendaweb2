import React, { useState } from 'react';
import { Palette, Sparkles, Check, Globe, FileText, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { AppBrandingConfig } from '../types';

interface AdminBrandingManagerProps {
  currentBranding: AppBrandingConfig;
  onSaveBranding: (newBranding: AppBrandingConfig) => void;
  isFranchiseMode?: boolean;
  franchiseName?: string;
}

export const AdminBrandingManager: React.FC<AdminBrandingManagerProps> = ({
  currentBranding,
  onSaveBranding,
  isFranchiseMode = false,
  franchiseName = ''
}) => {
  const [projectName, setProjectName] = useState(currentBranding.projectName || 'Gregori Izquierdo Streaming');
  const [rif, setRif] = useState(currentBranding.rif || 'J-50123456-7');
  const [slogan, setSlogan] = useState(currentBranding.slogan || 'Tu plataforma de streaming de alta gama 24/7');
  const [logoUrl, setLogoUrl] = useState(currentBranding.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(currentBranding.primaryColor || '#6366f1');
  const [secondaryColor, setSecondaryColor] = useState(currentBranding.secondaryColor || '#8b5cf6');
  const [fontFamily, setFontFamily] = useState(currentBranding.fontFamily || 'Inter');
  const [savedNotice, setSavedNotice] = useState(false);

  const [contactPhoneInput, setContactPhoneInput] = useState((currentBranding.contactPhones || ['+58 412 1234567']).join(', '));
  const [contactEmailInput, setContactEmailInput] = useState((currentBranding.contactEmails || ['soporte@gregoryizquierdo.xyz']).join(', '));
  const [telegramBotToken, setTelegramBotToken] = useState(currentBranding.telegramBotToken || '');
  const [telegramBotUsername, setTelegramBotUsername] = useState(currentBranding.telegramBotUsername || '');

  // Announcement Banner States
  const [bannerEnabled, setBannerEnabled] = useState(currentBranding.announcementBanner?.enabled ?? true);
  const [bannerAnim, setBannerAnim] = useState<'marquee' | 'fade' | 'slide'>(currentBranding.announcementBanner?.animationType || 'marquee');
  const [bannerSpeed, setBannerSpeed] = useState<number>(currentBranding.announcementBanner?.speedSeconds || 5);
  const [bannerBg, setBannerBg] = useState(currentBranding.announcementBanner?.backgroundColor || '#1e1b4b');
  const [bannerColor, setBannerColor] = useState(currentBranding.announcementBanner?.textColor || '#ffffff');
  const [bannerBadge, setBannerBadge] = useState(currentBranding.announcementBanner?.badgeText || '🔥 OFERTAS 2026');
  const [bannerMessages, setBannerMessages] = useState<string[]>(
    currentBranding.announcementBanner?.messages || [
      'Entrega inmediata en menos de 15 minutos con garantía total durante todo el mes.',
      'Financiamiento disponible: Paga en cuotas al 50% inicial con Pago Móvil o Wallet GRPAY.',
      'Tasa Oficial BCV actualizada en vivo y sin comisiones ocultas.'
    ]
  );
  const [newMessageText, setNewMessageText] = useState('');

  const handleAddBannerMessage = () => {
    if (!newMessageText.trim()) return;
    setBannerMessages([...bannerMessages, newMessageText.trim()]);
    setNewMessageText('');
  };

  const handleDeleteBannerMessage = (idx: number) => {
    setBannerMessages(bannerMessages.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phones = contactPhoneInput.split(',').map((p) => p.trim()).filter(Boolean);
    const emails = contactEmailInput.split(',').map((e) => e.trim()).filter(Boolean);

    onSaveBranding({
      ...currentBranding,
      projectName,
      rif,
      slogan,
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      contactPhones: phones,
      contactEmails: emails,
      telegramBotToken,
      telegramBotUsername,
      announcementBanner: {
        enabled: bannerEnabled,
        animationType: bannerAnim,
        speedSeconds: bannerSpeed,
        backgroundColor: bannerBg,
        textColor: bannerColor,
        badgeText: bannerBadge,
        messages: bannerMessages
      }
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    setProjectName('Gregori Izquierdo Streaming');
    setRif('J-50123456-7');
    setSlogan('Tu plataforma de streaming de alta gama 24/7');
    setLogoUrl('');
    setPrimaryColor('#6366f1');
    setSecondaryColor('#8b5cf6');
    setFontFamily('Inter');
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Palette className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white">
                {isFranchiseMode ? `Personalización de Tienda - ${franchiseName}` : 'Personalización de Marca & Estilos (Branding)'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configura el nombre, logo, RIF, eslogan, paleta de colores y tipografía de la plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Valores</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>¡Personalización de marca guardada y aplicada con éxito en tiempo real!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nombre del Proyecto / Tienda:
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:border-indigo-500 outline-none"
              placeholder="Ej. Streaming Plus Venezuela"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              RIF / Cédula Jurídica (Opcional):
            </label>
            <input
              type="text"
              value={rif}
              onChange={(e) => setRif(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none"
              placeholder="Ej. J-50123456-7"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Eslogan o Subtítulo Comercial:
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
              placeholder="Ej. Entretenimiento sin límites al mejor precio"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              URL del Logo o Imagen de Marca (Opcional):
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                placeholder="https://ejemplo.com/logo.png"
              />
              {logoUrl ? (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center p-1">
                  <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Color Principal (Acentos y Botones):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer p-1"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Color Secundario / Gradientes:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer p-1"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipografía / Fuente del Sistema:
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none font-medium"
            >
              <option value="Inter">Inter (Moderna & Limpia)</option>
              <option value="Outfit">Outfit (Moderna & Geométrica)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Corporativa)</option>
              <option value="monospace">Monospace (Técnica / Código)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Teléfonos de Atención / Envío y Recepción (Separados por coma):
            </label>
            <input
              type="text"
              value={contactPhoneInput}
              onChange={(e) => setContactPhoneInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
              placeholder="+58 412 1234567, +58 424 9876543"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correos de Soporte / Notificación (Separados por coma):
            </label>
            <input
              type="text"
              value={contactEmailInput}
              onChange={(e) => setContactEmailInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
              placeholder="soporte@gregoryizquierdo.xyz, ventas@gregoryizquierdo.xyz"
            />
          </div>

          <div className="md:col-span-2 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-3">
            <h4 className="font-extrabold text-sm text-indigo-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Integración y Enlace de Bot Oficial de Telegram</span>
            </h4>
            <p className="text-xs text-slate-300">
              Conecta tu Bot Token otorgado por @BotFather para sincronizar comandos automáticos (/start, /catalogo, /cuotas, /soporte).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Username del Bot (sin @):
                </label>
                <input
                  type="text"
                  value={telegramBotUsername}
                  onChange={(e) => setTelegramBotUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  placeholder="GregoriIzquierdoBot"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Bot Token API (@BotFather):
                </label>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyZ"
                />
              </div>
            </div>
          </div>

          {/* BANNER PUBLICITARIO SUPERIOR (Configuración, Mensajes y Animación) */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-700/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-extrabold text-sm text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Banner Publicitario Superior (Marquesina / Anuncios)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Muestra avisos dinámicos en la cabecera de la tienda: promociones, tasa BCV, financiamiento o avisos importantes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${bannerEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {bannerEnabled ? 'Banner Activo ✓' : 'Banner Oculto'}
                </span>
                <input
                  type="checkbox"
                  checked={bannerEnabled}
                  onChange={(e) => setBannerEnabled(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {bannerEnabled && (
              <div className="space-y-4 animate-fadeIn text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Tipo de Animación / Transición:</label>
                    <select
                      value={bannerAnim}
                      onChange={(e) => setBannerAnim(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
                    >
                      <option value="marquee">Marquesina Continua Deslizante (Marquee)</option>
                      <option value="slide">Carrusel Deslizante por Tiempo (Slide)</option>
                      <option value="fade">Desvanecimiento Suave (Fade)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Intervalo / Velocidad (Segundos):</label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={bannerSpeed}
                      onChange={(e) => setBannerSpeed(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Texto del Distintivo (Badge):</label>
                    <input
                      type="text"
                      value={bannerBadge}
                      onChange={(e) => setBannerBadge(e.target.value)}
                      placeholder="🔥 OFERTAS 2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Color de Fondo del Banner:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bannerBg}
                        onChange={(e) => setBannerBg(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={bannerBg}
                        onChange={(e) => setBannerBg(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Color del Texto del Banner:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bannerColor}
                        onChange={(e) => setBannerColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={bannerColor}
                        onChange={(e) => setBannerColor(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* List of Messages */}
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-slate-300">
                    Mensajes Publicitarios Activos ({bannerMessages.length}):
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un nuevo mensaje promocional o aviso..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBannerMessage();
                        }
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddBannerMessage}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shrink-0"
                    >
                      + Añadir Mensaje
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {bannerMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-200">
                          <strong className="text-indigo-400 mr-2">#{idx + 1}</strong>
                          {msg}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBannerMessage(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Banner Preview */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    Vista Previa del Banner:
                  </span>
                  <div
                    className="p-2.5 rounded-xl flex items-center gap-3 overflow-hidden text-xs font-semibold shadow-inner"
                    style={{ backgroundColor: bannerBg, color: bannerColor }}
                  >
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider shrink-0">
                      {bannerBadge}
                    </span>
                    <span className="truncate">
                      {bannerMessages.length > 0 ? bannerMessages[0] : 'Sin mensajes definidos'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vista Previa de Marca</span>
          <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg text-white">
                {projectName.charAt(0)}
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">{projectName}</h4>
                <p className="text-white/80 text-xs">{slogan}</p>
                {rif && <span className="text-[10px] text-white/70 font-mono">RIF: {rif}</span>}
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-white text-slate-950 font-bold text-xs shadow-md">
              Activo
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Guardar & Aplicar Personalización</span>
          </button>
        </div>
      </form>
    </div>
  );
};
