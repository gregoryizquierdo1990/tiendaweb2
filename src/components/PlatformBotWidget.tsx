import React, { useState } from 'react';
import {
  Bot,
  X,
  Tv,
  AlertTriangle,
  CreditCard,
  FileCheck2,
  UserCheck,
  Send,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  PhoneCall,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MessageCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Product, PaymentMethod, CustomerUser, CurrencyCode, PlanDuration } from '../types';
import { formatCurrency, formatGrpay } from '../utils/formatters';

interface PlatformBotWidgetProps {
  products: Product[];
  paymentMethods: PaymentMethod[];
  activeCustomer: CustomerUser | null;
  currency: CurrencyCode;
  bcvRate: number;
  onOpenProductCheckout: (product: Product, duration: PlanDuration) => void;
  onOpenIncidentReport: () => void;
  onOpenTracker: () => void;
  onOpenCustomerAuth: () => void;
  onOpenCustomerPortal: () => void;
}

type BotMenuTab = 'menu' | 'catalogo' | 'falla' | 'metodos' | 'reportar_pago' | 'cuenta' | 'chat';

interface BotMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickAction?: {
    label: string;
    action: () => void;
  };
}

export const PlatformBotWidget: React.FC<PlatformBotWidgetProps> = ({
  products,
  paymentMethods,
  activeCustomer,
  currency,
  bcvRate,
  onOpenProductCheckout,
  onOpenIncidentReport,
  onOpenTracker,
  onOpenCustomerAuth,
  onOpenCustomerPortal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BotMenuTab>('menu');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: '¡Hola! Soy el Asistente Virtual de Gregori Izquierdo Streaming. 👋 ¿En qué te puedo ayudar hoy? Selecciona una de las opciones del menú o hazme cualquier consulta.',
      timestamp: 'Ahora'
    }
  ]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: BotMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // Generate smart context-aware response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let botResponse = '';
      let quickAction: BotMessage['quickAction'] = undefined;

      if (lower.includes('bcv') || lower.includes('tasa') || lower.includes('dolar') || lower.includes('precio')) {
        botResponse = `Nuestra tasa oficial hoy es de ${bcvRate.toFixed(2)} Bs/USD (Fuente Oficial BCV). Todos los precios en Bolívares se calculan exactamente a esta tasa sin comisiones ocultas.`;
      } else if (lower.includes('falla') || lower.includes('clave') || lower.includes('caida') || lower.includes('problema') || lower.includes('pin')) {
        botResponse = 'Lamentamos el inconveniente. Todas las cuentas tienen garantía total. Puedes reportar la falla con captura de pantalla y nuestro equipo técnico la atenderá de inmediato.';
        quickAction = {
          label: 'Reportar Falla Ahora',
          action: () => {
            setIsOpen(false);
            onOpenIncidentReport();
          }
        };
      } else if (lower.includes('metodo') || lower.includes('pago') || lower.includes('pago movil') || lower.includes('binance') || lower.includes('zinli') || lower.includes('transferencia')) {
        botResponse = 'Aceptamos Pago Móvil (Banesco, Mercantil, Venezuela), Zinli, Binance Pay USDT, PayPal, Zelle y saldo GRPAY. Puedes ver los números de cuenta en la pestaña "Métodos de pago".';
        quickAction = {
          label: 'Ver Cuentas Bancarias',
          action: () => setActiveTab('metodos')
        };
      } else if (lower.includes('catalogo') || lower.includes('netflix') || lower.includes('disney') || lower.includes('max') || lower.includes('iptv') || lower.includes('cuenta')) {
        botResponse = `Tenemos disponibles ${products.length} servicios de streaming (cuentas completas y perfiles privados con PIN). Elige el que buscas en nuestro catálogo interactivo.`;
        quickAction = {
          label: 'Explorar Catálogo',
          action: () => setActiveTab('catalogo')
        };
      } else if (lower.includes('grpay') || lower.includes('wallet') || lower.includes('saldo')) {
        botResponse = 'GRPAY es nuestra moneda interna. 1 GRPAY equivale a 1 USD o 1 USDT. Puedes abonar saldo y pagar o renovar al instante sin esperar confirmaciones bancarias.';
        quickAction = {
          label: activeCustomer ? 'Ver Mi Saldo GRPAY' : 'Iniciar Sesión',
          action: () => {
            setIsOpen(false);
            if (activeCustomer) onOpenCustomerPortal();
            else onOpenCustomerAuth();
          }
        };
      } else if (lower.includes('garantia') || lower.includes('tiempo')) {
        botResponse = 'Ofrecemos soporte técnico prioritario durante toda la vigencia contratada (10 días, 15 días, 1 mes, 3 meses, etc.). Si ocurre alguna caída de cuenta, se reemplaza o reactiva.';
      } else {
        botResponse = `Gracias por escribirnos. Para atenderte más rápido, puedes usar las opciones de nuestro menú directo o también hablar con un asesor humano por WhatsApp si lo prefieres.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponse,
          timestamp: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
          quickAction
        }
      ]);
    }, 450);
  };

  return (
    <>
      {/* Floating Trigger Button (Positioned at bottom-left) */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full text-white shadow-2xl transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'bg-slate-900 border border-slate-700 hover:bg-slate-800'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30 hover:scale-105'
          }`}
          title="Abrir Asistente Virtual GI"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700" />
          </div>
          <span className="text-xs font-bold tracking-wide">
            {isOpen ? 'Cerrar Bot' : 'Bot de Ayuda & Menú'}
          </span>
        </button>
      </div>

      {/* Main Bot Dialog Window */}
      {isOpen && (
        <div className="fixed bottom-22 left-4 sm:left-6 z-40 w-[94vw] sm:w-[410px] max-h-[82vh] h-[620px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 shrink-0 flex items-center justify-between border-b border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <Bot className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Asistente GI Streaming</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    En línea
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Tasa Oficial BCV: <strong className="text-emerald-300">{bcvRate.toFixed(2)} Bs/USD</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Minimizar Asistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Sub-Navigation / Tabs */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto text-[11px] font-bold shrink-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'menu' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              📋 Menú Principal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'catalogo' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              📺 Catálogo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metodos')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'metodos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              💳 Métodos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('falla')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'falla' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚠️ Reportar Falla
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cuenta')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                activeTab === 'cuenta' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              👤 Mi Cuenta
            </button>
          </div>

          {/* Body Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
            {/* VIEW 1: MENU PRINCIPAL (5 OPCIONES EXACTAS) */}
            {activeTab === 'menu' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>¿En qué podemos ayudarte ahora?</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Selecciona una de las 5 opciones rápidas para consultar servicios, cuentas bancarias o gestionar tu cuenta:
                  </p>
                </div>

                {/* 1. Catálogo de servicios */}
                <button
                  type="button"
                  onClick={() => setActiveTab('catalogo')}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition">
                        Catálogo de servicios
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Ver Netflix, Disney+, Max, IPTV, precios en $ y Bs. BCV
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>

                {/* 2. Reportar una falla */}
                <button
                  type="button"
                  onClick={() => setActiveTab('falla')}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-300 transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-rose-600 transition">
                        Reportar una falla
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Garantía inmediata por clave incorrecta o cuenta caída
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
                </button>

                {/* 3. Métodos de pago con sus detalles */}
                <button
                  type="button"
                  onClick={() => setActiveTab('metodos')}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition">
                        Métodos de pago con sus detalles
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Pago Móvil (Banesco/Mercantil/BDV), Binance USDT, Zinli
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </button>

                {/* 4. Reportar un pago */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reportar_pago')}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition">
                        Reportar un pago
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Enviar comprobante, número de referencia o rastrear pedido
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>

                {/* 5. Detalles de cuenta cliente */}
                <button
                  type="button"
                  onClick={() => setActiveTab('cuenta')}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-purple-600 transition">
                        Detalles de cuenta cliente
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {activeCustomer
                          ? `Hola, ${activeCustomer.name} • Saldo: ${formatGrpay(activeCustomer.grpayBalance)}`
                          : 'Consulta tus membresías activas o inicia sesión'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
                </button>

                {/* Bot Chat Prompt Button */}
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Hacer una Pregunta al Bot Asistente</span>
                </button>
              </div>
            )}

            {/* VIEW 2: CATÁLOGO DE SERVICIOS */}
            {activeTab === 'catalogo' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Tv className="w-4 h-4 text-indigo-600" />
                    <span>Catálogo de Streaming Disponible</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    ← Volver al menú
                  </button>
                </div>

                <div className="space-y-2.5">
                  {products.map((prod) => {
                    const price1m = prod.prices['1 mes']?.USD ?? 5;
                    const priceBs = price1m * bcvRate;
                    const discount = prod.discountPercent || 0;
                    const finalPriceUsd = discount > 0 ? price1m * (1 - discount / 100) : price1m;
                    const finalPriceBs = finalPriceUsd * bcvRate;

                    return (
                      <div
                        key={prod.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition shadow-xs flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{prod.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                                {prod.accountType}
                              </span>
                              {discount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{prod.tagline}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-extrabold text-indigo-700 text-xs">
                              ${finalPriceUsd.toFixed(2)} USD
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Bs. {finalPriceBs.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Garantía {prod.warrantyMonths} Mes{prod.warrantyMonths > 1 ? 'es' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenProductCheckout(prod, '1 mes');
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Comprar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: REPORTAR UNA FALLA */}
            {activeTab === 'falla' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Garantía y Reporte de Falla</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    ← Volver al menú
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950">
                  <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    Tu compra cuenta con Garantía Total
                  </h4>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Si tu contraseña cambió, la pantalla indica límite de usuarios, o la cuenta no abre, nuestro equipo te reemplaza las credenciales de inmediato.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Fallas que atendemos con prioridad:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-600">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Clave o PIN incorrecto</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Pantalla ocupada o límite de dispositivos</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Membresía pausada o caída de cuenta</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenIncidentReport();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Abrir Formulario de Reporte de Falla</span>
                  </button>

                  <a
                    href="https://wa.me/584143928410?text=Hola,%20tengo%20una%20falla%20urgente%20con%20mi%20cuenta%20de%20streaming"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contactar a Soporte por WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* VIEW 4: MÉTODOS DE PAGO CON SUS DETALLES */}
            {activeTab === 'metodos' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Métodos de Pago Activos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    ← Volver al menú
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tasa BCV Oficial</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {bcvRate.toFixed(2)} Bs / 1 USD
                    </strong>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300">
                    Sin comisiones
                  </span>
                </div>

                <div className="space-y-2.5">
                  {paymentMethods
                    .filter((m) => m.active)
                    .map((method) => (
                      <div
                        key={method.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{method.name}</span>
                            <span className="text-[10px] text-indigo-600 font-medium">{method.accountTypeLabel}</span>
                          </div>
                          {method.badge && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {method.badge}
                            </span>
                          )}
                        </div>

                        {/* Account Data with Copy Button */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="text-[10px] text-slate-400">Titular: {method.holderName}</div>
                            <div className="font-mono font-bold text-slate-800 text-xs truncate">
                              {method.accountNumber}
                            </div>
                            {method.extraDetails && (
                              <div className="text-[10px] text-slate-600">{method.extraDetails}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                method.id,
                                `${method.accountNumber}${method.extraDetails ? ' - ' + method.extraDetails : ''}`
                              )
                            }
                            className={`p-2 rounded-lg font-bold text-[10px] transition shrink-0 cursor-pointer flex items-center gap-1 ${
                              copiedId === method.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 hover:bg-indigo-600 hover:text-white text-slate-700'
                            }`}
                            title="Copiar datos al portapapeles"
                          >
                            {copiedId === method.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* VIEW 5: REPORTAR UN PAGO */}
            {activeTab === 'reportar_pago' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    <span>Reportar Pago & Comprobante</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    ← Volver al menú
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-indigo-950">¿Ya realizaste tu transferencia o pago móvil?</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Para activar tu suscripción en minutos, ingresa el número de referencia y adjunta la captura en nuestro formulario oficial.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTracker();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Consultar Estado de Mi Pedido por Código</span>
                  </button>

                  <a
                    href="https://wa.me/584143928410?text=Hola,%20acabo%20de%20realizar%20un%20pago%20para%20activar%20mi%20cuenta.%20Adjunto%20comprobante:"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Comprobante por WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* VIEW 6: DETALLES DE CUENTA CLIENTE */}
            {activeTab === 'cuenta' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>Detalles de Cuenta Cliente</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    ← Volver al menú
                  </button>
                </div>

                {activeCustomer ? (
                  <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Cliente Activo</span>
                        <h4 className="font-bold text-slate-900 text-sm">{activeCustomer.name}</h4>
                        <span className="text-[11px] text-slate-500 font-mono">{activeCustomer.email}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {activeCustomer.role === 'vendedor' ? '👔 Vendedor' : '👤 Cliente'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Saldo GRPAY Disponible</span>
                        <strong className="text-emerald-400 text-base font-extrabold font-mono">
                          {formatGrpay(activeCustomer.grpayBalance)}
                        </strong>
                      </div>
                      <span className="text-[10px] text-slate-300">1 GRPAY = 1 USD</span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onOpenCustomerPortal();
                        }}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Abrir Mi Panel de Suscripciones y Credenciales</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Aún no has iniciado sesión</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Accede con tu correo para ver tus claves de acceso, saldo GRPAY o renovar tus pantallas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenCustomerAuth();
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-200 cursor-pointer"
                    >
                      Iniciar Sesión / Registrarme
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 7: CHAT INTERACTIVO CON EL ASISTENTE */}
            {activeTab === 'chat' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Preguntas Frecuentes & Chat</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    ← Volver al menú
                  </button>
                </div>

                {/* Quick chip queries */}
                <div className="flex flex-wrap gap-1.5 pb-2">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('¿Cuál es la tasa BCV de hoy?')}
                    className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    💵 ¿Tasa BCV hoy?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('¿Qué garantía tienen las cuentas?')}
                    className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    🛡️ ¿Tienen garantía?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('¿Cómo funciona la moneda GRPAY?')}
                    className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    🪙 ¿Qué es GRPAY?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('¿Qué métodos de pago aceptan?')}
                    className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    💳 Métodos de pago
                  </button>
                </div>

                {/* Messages feed */}
                <div className="space-y-2.5">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        {msg.quickAction && (
                          <button
                            type="button"
                            onClick={msg.quickAction.action}
                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 transition cursor-pointer"
                          >
                            <span>{msg.quickAction.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Chat Bar (Available in Chat Tab or Quick Input) */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
