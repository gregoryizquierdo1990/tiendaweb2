import React, { useState } from 'react';
import {
  Send,
  Mail,
  Users,
  Smartphone,
  Sparkles,
  Megaphone,
  Radio
} from 'lucide-react';
import { CustomerUser } from '../types';

interface AdminMarketingManagerProps {
  customers: CustomerUser[];
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const AdminMarketingManager: React.FC<AdminMarketingManagerProps> = ({
  customers,
  onShowNotification
}) => {
  const [subTab, setSubTab] = useState<'campaigns' | 'telegram_channels'>('campaigns');

  // Campaigns state
  const [campaignChannel, setCampaignChannel] = useState<'whatsapp' | 'telegram' | 'email'>('whatsapp');
  const [campaignSubject, setCampaignSubject] = useState('🔥 ¡Promoción Especial de Streaming 4K!');
  const [campaignMessage, setCampaignMessage] = useState(
    'Hola {nombre}! Aprovecha nuestros combos 4K Ultra HD con garantía total y recarga inmediata por Pago Móvil o Zeny. ¡Visítanos ya!'
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Telegram Channel & Community management state
  const [channelName, setChannelName] = useState('@GregoriStreamingVIP');
  const [channelTopic, setChannelTopic] = useState('Promociones, Cuentas 4K y Sorteos Oficiales');
  const [promoPostText, setPromoPostText] = useState('🌟 ¡NUEVO COMBO DISPONIBLE! Netflix + Disney+ por sólo $5 al mes. ¡Entrega inmediata!');
  const [isPostingChannel, setIsPostingChannel] = useState(false);

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds([]);
      setSelectAll(false);
    } else {
      setSelectedUserIds(customers.map(c => c.id));
      setSelectAll(true);
    }
  };

  const handleToggleUserSelection = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSendCampaign = () => {
    if (selectedUserIds.length === 0) {
      onShowNotification('warning', 'Por favor selecciona al menos un usuario destinatario.');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onShowNotification(
        'success',
        `¡Campaña de ${campaignChannel.toUpperCase()} enviada con éxito a ${selectedUserIds.length} usuario(s) seleccionado(s)!`
      );
    }, 1500);
  };

  const handlePublishToChannel = () => {
    if (!promoPostText.trim()) {
      onShowNotification('warning', 'Escribe el contenido promocional para el canal.');
      return;
    }
    setIsPostingChannel(true);
    setTimeout(() => {
      setIsPostingChannel(false);
      onShowNotification('success', `¡Publicación promocional enviada exitosamente al canal ${channelName}!`);
      setPromoPostText('');
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-4 h-4" />
            <span>Módulo de Marketing Pro • Campañas & Canales</span>
          </div>
          <h2 className="text-xl font-black">Centro de Difusión & Redes Sociales</h2>
          <p className="text-xs text-slate-300">
            Gestiona campañas con usuarios seleccionados 1 por 1 y administra comunidades y canales de Telegram.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setSubTab('campaigns')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              subTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Campañas & Usuarios</span>
          </button>
          <button
            onClick={() => setSubTab('telegram_channels')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              subTab === 'telegram_channels' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Comunidad & Canal Telegram</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: CAMPAÑAS Y SELECCIÓN DE USUARIOS 1 POR 1 */}
      {subTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Composer */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Plantilla y Envío de Campañas Promocionales</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Canal de Difusión:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCampaignChannel('whatsapp')}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      campaignChannel === 'whatsapp' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignChannel('telegram')}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      campaignChannel === 'telegram' ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Telegram</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignChannel('email')}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      campaignChannel === 'email' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Correo Electrónico</span>
                  </button>
                </div>
              </div>

              {campaignChannel === 'email' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Asunto del Correo:</label>
                  <input
                    type="text"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Plantilla de Mensaje (Usa <code className="text-indigo-600">{'{nombre}'}</code> para personalizar):
                </label>
                <textarea
                  rows={5}
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-indigo-900 font-semibold">
                  Destinatarios seleccionados: <strong>{selectedUserIds.length}</strong> de {customers.length} usuarios
                </span>
                <button
                  type="button"
                  onClick={handleSendCampaign}
                  disabled={isSending || selectedUserIds.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSending ? <span>Enviando...</span> : <><span>Disparar Campaña</span><Send className="w-3.5 h-3.5" /></>}
                </button>
              </div>
            </div>
          </div>

          {/* User Selector (1 by 1 or bulk) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col h-[520px]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Usuarios Registrados (1 por 1)</span>
              </h3>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                {selectAll ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {customers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No hay usuarios registrados aún.</p>
              ) : (
                customers.map((cust) => {
                  const isChecked = selectedUserIds.includes(cust.id);
                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleToggleUserSelection(cust.id)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {cust.phone} {cust.email ? `• ${cust.email}` : ''}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GESTIÓN DE COMUNIDAD & CANAL DE TELEGRAM */}
      {subTab === 'telegram_channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Channel Setup & Promo Publisher */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-600" />
              <span>Gestión del Canal & Publicación en Telegram</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre / Usuario del Canal:</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Temática / Descripción:</label>
                <input
                  type="text"
                  value={channelTopic}
                  onChange={(e) => setChannelTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contenido Promocional para Publicar:</label>
                <textarea
                  rows={4}
                  value={promoPostText}
                  onChange={(e) => setPromoPostText(e.target.value)}
                  placeholder="Escribe la promoción u oferta para el canal..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={handlePublishToChannel}
                disabled={isPostingChannel}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isPostingChannel ? <span>Publicando en Canal...</span> : <><span>Publicar en Canal de Telegram</span><Send className="w-4 h-4" /></>}
              </button>
            </div>
          </div>

          {/* Community Stats & Preview */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest">
                  Comunidad Telegram • Estadísticas
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Conectado</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Suscriptores al Canal</span>
                  <strong className="text-lg font-black text-white">2,850</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Interacción Promedio</span>
                  <strong className="text-lg font-black text-sky-400">94%</strong>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                La sincronización con Telegram permite difundir automáticamente lanzamientos de catálogos y avisos de renovación para tus clientes.
              </p>
            </div>

            <div className="p-3.5 bg-sky-950/80 border border-sky-500/30 rounded-2xl text-[11px] text-sky-200">
              📌 <strong>Canal Activo:</strong> {channelName} ({channelTopic})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
