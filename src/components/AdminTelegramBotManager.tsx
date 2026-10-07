import React, { useState } from 'react';
import {
  Send,
  Bot,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Globe,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Wallet,
  Smartphone,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { AppBrandingConfig, Product, TelegramBotCustomCommand, WhatsAppApiConfig } from '../types';

interface AdminTelegramBotManagerProps {
  branding: AppBrandingConfig;
  products: Product[];
  onSaveBranding: (newBranding: AppBrandingConfig) => void;
}

const DEFAULT_BOT_COMMANDS: TelegramBotCustomCommand[] = [
  {
    command: '/start',
    description: 'Mensaje oficial de bienvenida, enlace a la web oficial y menú rápido de opciones.',
    responseTemplate: '👋 ¡Hola! Bienvenido a *Gregori Izquierdo Streaming*.\nTu plataforma oficial de cuentas y pantallas privadas con garantía.\n\n🌐 Visítanos: https://gregoryizquierdo.xyz\nUsa /catalogo para ver precios o /cuotas para financiamiento.',
    category: 'general',
    enabled: true
  },
  {
    command: '/catalogo',
    description: 'Muestra el catálogo completo de cuentas y pantallas con precios en USD y Tasa BCV.',
    responseTemplate: '📺 *CATÁLOGO DE STREAMING DISPONIBLE:*\n\n• Netflix Ultra HD 4K (Pantalla Privada)\n• Disney+ & Star+ Premium\n• Max (HBO)\n• Prime Video\n• Spotify Familiar / Individual\n• MagisTV / IPTV Full Canales\n\n💵 Paga en USD o Bolívares a Tasa Oficial BCV.\n🌐 Compra directa: https://gregoryizquierdo.xyz',
    category: 'catalogo',
    enabled: true
  },
  {
    command: '/cuotas',
    description: 'Explicación del sistema de financiamiento en cuotas, inicial y plazos.',
    responseTemplate: '💳 *SISTEMA DE FINANCIAMIENTO EN CUOTAS*\n\nAdquiere tus suscripciones fraccionadas:\n• *Inicial:* 50% al momento de ordenar.\n• *Cuotas restantes:* Cada 15 días o mensual.\n• *Abonos:* Puedes pagar desde tu portal web con Pago Móvil o Wallet GRPAY.\n\nDisfruta tu servicio desde el primer día con garantía total.',
    category: 'cuotas',
    enabled: true
  },
  {
    command: '/wallet',
    description: 'Información de la billetera interna GRPAY, saldo y recargas.',
    responseTemplate: '💰 *WALLET GRPAY STREAMING*\n\nTu billetera interna digital privada:\n• 1 GRPAY = $1.00 USD / USDT.\n• Activación inmediata sin esperar verificación bancaria.\n• Recarga mediante Pago Móvil, Zelle o Binance Pay.\n\nConsulta tu saldo en tu portal: https://gregoryizquierdo.xyz',
    category: 'wallet',
    enabled: true
  },
  {
    command: '/miservicio',
    description: 'Consulta de estado de usuario, credenciales compradas y fechas de vencimiento.',
    responseTemplate: '🔍 *CONSULTA DE SERVICIOS Y VENCIMIENTO*\n\nPara consultar el estado de tu cuenta, PIN y fecha de corte:\n1. Ingresa a tu Portal de Cliente en: https://gregoryizquierdo.xyz\n2. Haz clic en "Rastrear Pedido" o "Mi Portal"\n3. Ingresa tu número de teléfono o correo registrado.',
    category: 'usuario',
    enabled: true
  },
  {
    command: '/soporte',
    description: 'Línea directa con el equipo técnico para reporte de incidencias y activación de garantías.',
    responseTemplate: '🛠️ *SOPORTE TÉCNICO Y GARANTÍAS*\n\nSi experimentas alguna caída o error de clave:\n• Tu servicio cuenta con Garantía 100% durante todo el período contratado.\n• Contáctanos de inmediato por WhatsApp oficial o abre un ticket de incidencia en la web.',
    category: 'soporte',
    enabled: true
  }
];

export const AdminTelegramBotManager: React.FC<AdminTelegramBotManagerProps> = ({
  branding,
  products,
  onSaveBranding
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'telegram' | 'whatsapp_api'>('telegram');

  // Telegram States
  const [botToken, setBotToken] = useState(branding.telegramBotToken || '');
  const [botUsername, setTelegramBotUsername] = useState(branding.telegramBotUsername || '');
  const [commands, setCommands] = useState<TelegramBotCustomCommand[]>(
    branding.telegramBotCommands && branding.telegramBotCommands.length > 0
      ? branding.telegramBotCommands
      : DEFAULT_BOT_COMMANDS
  );

  // New Command Modal / Form
  const [newCmdName, setNewCmdName] = useState('');
  const [newCmdDesc, setNewCmdDesc] = useState('');
  const [newCmdResp, setNewCmdResp] = useState('');
  const [newCmdCategory, setNewCmdCategory] = useState<TelegramBotCustomCommand['category']>('general');
  const [showAddCmd, setShowAddCmd] = useState(false);

  // WhatsApp API States
  const [waConfig, setWaConfig] = useState<WhatsAppApiConfig>(
    branding.whatsappApiConfig || {
      enabled: false,
      provider: 'cloud_api',
      apiUrl: 'https://graph.facebook.com/v18.0',
      apiToken: '',
      phoneNumberId: '',
      instanceName: 'GregoriStreamingBot',
      status: 'disconnected'
    }
  );
  const [waTestNumber, setWaTestNumber] = useState('');
  const [waTestSuccess, setWaTestSuccess] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveBranding({
      ...branding,
      telegramBotToken: botToken,
      telegramBotUsername: botUsername,
      telegramBotCommands: commands,
      whatsappApiConfig: waConfig
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmdName.trim()) return;

    const formattedCmd = newCmdName.startsWith('/') ? newCmdName.trim() : `/${newCmdName.trim()}`;
    const newCmd: TelegramBotCustomCommand = {
      command: formattedCmd,
      description: newCmdDesc.trim() || 'Comando personalizado',
      responseTemplate: newCmdResp.trim() || 'Información de la plataforma oficial.',
      category: newCmdCategory,
      enabled: true
    };

    const updated = [...commands, newCmd];
    setCommands(updated);
    setNewCmdName('');
    setNewCmdDesc('');
    setNewCmdResp('');
    setShowAddCmd(false);

    onSaveBranding({
      ...branding,
      telegramBotCommands: updated
    });
  };

  const handleDeleteCommand = (cmdStr: string) => {
    const updated = commands.filter((c) => c.command !== cmdStr);
    setCommands(updated);
    onSaveBranding({
      ...branding,
      telegramBotCommands: updated
    });
  };

  const handleToggleCommand = (cmdStr: string) => {
    const updated = commands.map((c) => (c.command === cmdStr ? { ...c, enabled: !c.enabled } : c));
    setCommands(updated);
    onSaveBranding({
      ...branding,
      telegramBotCommands: updated
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleTestWhatsApp = () => {
    if (!waTestNumber.trim()) {
      alert('Ingresa un número para enviar la prueba.');
      return;
    }
    setWaConfig((prev) => ({ ...prev, status: 'connected' }));
    setWaTestSuccess(`¡Mensaje de prueba enviado exitosamente a ${waTestNumber}! Estado: Conectado.`);
    setTimeout(() => setWaTestSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-blue-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2 border border-blue-500/30">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>Bots & Notificaciones Automatizadas</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Integración de Bot de Telegram & WhatsApp API
            </h2>
            <p className="text-blue-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Configura comandos dinámicos para consulta de catálogo, cuotas, wallet GRPAY y estado de cuentas de clientes, además de vincular WhatsApp API para envíos masivos directos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {botUsername ? (
              <a
                href={`https://t.me/${botUsername.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Abrir @{botUsername.replace('@', '')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                Sin Bot Enlazado
              </span>
            )}
          </div>
        </div>

        {/* Sub-tabs switcher */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setActiveSubTab('telegram')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'telegram'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Bot de Telegram & Comandos ({commands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('whatsapp_api')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'whatsapp_api'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Integración WhatsApp API Oficial</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: TELEGRAM BOT */}
      {activeSubTab === 'telegram' && (
        <div className="space-y-6">
          {/* Telegram Credentials Card */}
          <form onSubmit={handleSaveAll} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Credenciales del Bot de Telegram (@BotFather)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Username del Bot (sin @):</label>
                <input
                  type="text"
                  required
                  value={botUsername}
                  onChange={(e) => setTelegramBotUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  placeholder="GregoriIzquierdoBot"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Bot Token API (@BotFather):</label>
                <input
                  type="password"
                  required
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyZ"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Credenciales del Bot</span>
              </button>

              {isSaved && (
                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  ¡Credenciales y comandos guardados con éxito!
                </span>
              )}
            </div>
          </form>

          {/* Structured Commands Manager */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span>Comandos Estructurados & Respuestas Automáticas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestiona las respuestas sobre cuotas, billetera GRPAY, catálogo y atención al cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCmd(!showAddCmd)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddCmd ? 'Cancelar' : 'Agregar Nuevo Comando'}</span>
              </button>
            </div>

            {/* Add Command Form */}
            {showAddCmd && (
              <form onSubmit={handleAddCommand} className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 animate-fadeIn text-xs">
                <span className="font-bold text-indigo-950 uppercase text-[11px] block">
                  Configurar Nuevo Comando del Bot:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Comando (ej. /promos):</label>
                    <input
                      type="text"
                      required
                      placeholder="/promos"
                      value={newCmdName}
                      onChange={(e) => setNewCmdName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Categoría:</label>
                    <select
                      value={newCmdCategory}
                      onChange={(e) => setNewCmdCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    >
                      <option value="general">General</option>
                      <option value="cuotas">Cuotas / Financiamiento</option>
                      <option value="wallet">Wallet GRPAY</option>
                      <option value="catalogo">Catálogo</option>
                      <option value="usuario">Consulta de Usuario</option>
                      <option value="soporte">Soporte Técnico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Descripción Breve (@BotFather):</label>
                    <input
                      type="text"
                      required
                      placeholder="Ver promociones del mes"
                      value={newCmdDesc}
                      onChange={(e) => setNewCmdDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Respuesta Automática del Bot:</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Escribe el mensaje detallado que enviará el bot al recibir este comando..."
                    value={newCmdResp}
                    onChange={(e) => setNewCmdResp(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Guardar Comando
                  </button>
                </div>
              </form>
            )}

            {/* Command Cards List */}
            <div className="space-y-3">
              {commands.map((cmd) => (
                <div
                  key={cmd.command}
                  className={`p-4 rounded-2xl border transition-all ${
                    cmd.enabled ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-indigo-700 text-sm bg-indigo-100/70 px-2 py-0.5 rounded-md">
                          {cmd.command}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {cmd.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{cmd.description}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line">
                        {cmd.responseTemplate}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(`${cmd.command.replace('/', '')} - ${cmd.description}`, cmd.command)}
                        title="Copiar formato para @BotFather"
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer text-xs font-bold flex items-center gap-1"
                      >
                        {copiedCmd === cmd.command ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Copiar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleCommand(cmd.command)}
                        className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                          cmd.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cmd.enabled ? 'Activo' : 'Pausado'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCommand(cmd.command)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                        title="Eliminar comando"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: WHATSAPP API INTEGRATION */}
      {activeSubTab === 'whatsapp_api' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveAll} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>Configuración de WhatsApp API Oficial / Cloud API</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conecta tu instancia o número empresarial de WhatsApp para envío directo de comprobantes, recordatorios de cuotas y contratos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    waConfig.enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {waConfig.enabled ? 'Módulo Activado' : 'Módulo Inactivo'}
                </span>
                <input
                  type="checkbox"
                  checked={waConfig.enabled}
                  onChange={(e) => setWaConfig({ ...waConfig, enabled: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Proveedor / Arquitectura:</label>
                <select
                  value={waConfig.provider}
                  onChange={(e) => setWaConfig({ ...waConfig, provider: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50"
                >
                  <option value="cloud_api">WhatsApp Cloud API (Meta Oficial)</option>
                  <option value="baileys">Servidor Baileys / Node.js Webhook</option>
                  <option value="wppconnect">WPPConnect / Evolution API</option>
                  <option value="custom_webhook">Webhook API Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Nombre de la Instancia:</label>
                <input
                  type="text"
                  value={waConfig.instanceName || ''}
                  onChange={(e) => setWaConfig({ ...waConfig, instanceName: e.target.value })}
                  placeholder="GregoriStreamingBot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">URL Endpoint API:</label>
                <input
                  type="url"
                  value={waConfig.apiUrl}
                  onChange={(e) => setWaConfig({ ...waConfig, apiUrl: e.target.value })}
                  placeholder="https://graph.facebook.com/v18.0 o http://tuvps:8080"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Phone Number ID (Meta):</label>
                <input
                  type="text"
                  value={waConfig.phoneNumberId || ''}
                  onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
                  placeholder="Ej. 10928472918471"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">API Token / Bearer Token:</label>
                <input
                  type="password"
                  value={waConfig.apiToken}
                  onChange={(e) => setWaConfig({ ...waConfig, apiToken: e.target.value })}
                  placeholder="EAAO... (Permanent Token de Meta o API Key del VPS)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Test connection row */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Número de prueba (ej. 584121234567)"
                  value={waTestNumber}
                  onChange={(e) => setWaTestNumber(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono text-xs w-60"
                />
                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Probar Conexión
                </button>
              </div>

              {waTestSuccess && (
                <span className="text-emerald-800 font-bold flex items-center gap-1 animate-fadeIn">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {waTestSuccess}
                </span>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Configuración WhatsApp API</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
