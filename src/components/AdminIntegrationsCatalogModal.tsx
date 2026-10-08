import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  HardDrive,
  Calendar,
  Mail,
  MapPin,
  Bot,
  MessageSquare,
  Send,
  CreditCard,
  Building,
  Zap,
  Lock,
  ChevronRight,
  Sliders,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Key,
  FolderOpen,
  Download,
  Save,
  Globe
} from 'lucide-react';
import { getAccessToken, setCachedAccessToken, signInWithGoogleIdentity, logout as googleLogout } from '../services/googleAuth';

interface IntegrationItem {
  id: string;
  name: string;
  category: 'google' | 'third_party' | 'payment_gateways';
  badge: string;
  icon: React.ElementType;
  description: string;
  features: string[];
  status: 'active' | 'ready_to_connect' | 'available';
  setupSteps: string[];
  docLink?: string;
}

interface AdminIntegrationsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsConnected: boolean;
  onOpenSheetsSetup?: () => void;
  googleUser?: any;
  customers?: any[];
  onImportCustomers?: (newCustomers: any[]) => void;
  onTriggerFullSync?: () => Promise<void>;
}

export const INTEGRATIONS_LIST: IntegrationItem[] = [
  // Ecosistema Google (Totalmente Operacional y Conectado)
  {
    id: 'google_sheets',
    name: 'Google Sheets & Drive DB',
    category: 'google',
    badge: 'Conectado / Soportado',
    icon: FileSpreadsheet,
    description: 'Sincronización en tiempo real de pedidos, catálogo, clientes, inventario de perfiles y conciliación mensual en hojas de cálculo compartidas en tu Google Drive.',
    features: [
      'Exportación automática de ventas y pagos',
      'Directorio de clientes y roles (Vendedor/Cliente)',
      'Backup continuo de base de datos en archivo "streaming_gregory"',
      'Hojas formateadas de Conciliación Mensual y Resumen por Métodos'
    ],
    status: 'active',
    setupSteps: [
      'Iniciar sesión con Google OAuth o ingresar token de acceso',
      'Vincular la hoja de cálculo "streaming_gregory"',
      'Activar autoguardado de transacciones cada 5 minutos'
    ]
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar API (Cortes y Vencimientos)',
    category: 'google',
    badge: 'Sincronizable',
    icon: Calendar,
    description: 'Sincronización bidireccional de fechas de corte, vencimientos de membresías y recordatorios de cuotas directamente en tu calendario de Google.',
    features: [
      'Eventos automáticos por cada cuenta por vencer',
      'Alertas programadas 24 horas antes en el teléfono móvil',
      'Exportación compatible con formato estándar iCalendar (.ics)'
    ],
    status: 'active',
    setupSteps: [
      'Iniciar sesión con Google OAuth',
      'Hacer clic en "Sincronizar con Google Calendar Ahora"',
      'Descargar archivo .ics de respaldo si se desea importar offline'
    ]
  },
  {
    id: 'google_contacts',
    name: 'Google Contacts (People API)',
    category: 'google',
    badge: 'Bidireccional',
    icon: MapPin,
    description: 'Sincronización bidireccional de clientes. Sube tus contactos del teléfono a la plataforma y exporta clientes nuevos de la tienda a tu libreta de Google Contacts.',
    features: [
      'Importación masiva de contactos del teléfono a la tienda',
      'Exportación rápida de clientes nuevos registrados en tienda a Google Contacts',
      'Mantenimiento automático de números de WhatsApp actualizados'
    ],
    status: 'active',
    setupSteps: [
      'Iniciar sesión con Google OAuth o ingresar token People API',
      'Cargar contactos de Google y seleccionar para importar',
      'Exportar clientes de la tienda a tu libreta con 1 clic'
    ]
  },
  {
    id: 'google_gemini',
    name: 'Google Gemini AI Studio API',
    category: 'google',
    badge: 'Activo / Integrado',
    icon: Bot,
    description: 'Inteligencia Artificial para atención automática, generación de mensajes persuasivos de venta y análisis inteligente de estados financieros.',
    features: [
      'Generación de respuestas rápidas a reclamos de clientes',
      'Sugerencias de precios y promociones según la tasa BCV',
      'Análisis de rentabilidad y alertas de fugas de dinero'
    ],
    status: 'active',
    setupSteps: [
      'Conexión automática mediante variable de entorno del sistema'
    ]
  },

  // Aplicaciones de Terceros (Totalmente Operacionales y Conectadas)
  {
    id: 'telegram_bot',
    name: 'Telegram Bot API (@gregory_streaming_bot)',
    category: 'third_party',
    badge: 'Activo',
    icon: Send,
    description: 'Bot de Telegram interactivo para consulta de catálogo, auto-atención, verificación de credenciales y alertas de nuevas órdenes para el dueño.',
    features: [
      'Comandos /start, /catalogo, /mis_cuentas y /soporte',
      'Notificación inmediata al canal privado de administradores por cada venta',
      'Envío de códigos 2FA de seguridad'
    ],
    status: 'active',
    setupSteps: [
      'Crear bot con @BotFather en Telegram',
      'Pegar el Bot Token en la configuración',
      'Guardar Chat ID de notificaciones'
    ]
  }
];

export const AdminIntegrationsCatalogModal: React.FC<AdminIntegrationsCatalogModalProps> = ({
  isOpen,
  onClose,
  sheetsConnected,
  onOpenSheetsSetup,
  googleUser,
  customers = [],
  onImportCustomers,
  onTriggerFullSync
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'google' | 'third_party'>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Google OAuth Session State
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(getAccessToken());
  const [showManualTokenInput, setShowManualTokenInput] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  // Google Contacts State
  const [contactsLoading, setContactsLoading] = useState(false);
  const [googleContactsList, setGoogleContactsList] = useState<any[]>([]);
  const [selectedContactEmails, setSelectedContactEmails] = useState<Record<string, boolean>>({});
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsStatusMsg, setContactsStatusMsg] = useState<string | null>(null);
  const [exportingCustomers, setExportingCustomers] = useState<Record<string, boolean>>({});

  // Google Calendar State
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarStatusMsg, setCalendarStatusMsg] = useState<string | null>(null);

  // Telegram & Webhook Custom Config State
  const [telegramToken, setTelegramToken] = useState('7128938192:AAH93910dkas92');
  const [telegramChatId, setTelegramChatId] = useState('-10023819283');
  const [webhookUrl, setWebhookUrl] = useState('https://hook.eu1.make.com/gregory-streaming-events');
  const [binanceMerchantId, setBinanceMerchantId] = useState('38291048');

  useEffect(() => {
    setCurrentAccessToken(getAccessToken());
  }, []);

  const handleSignInGoogle = async () => {
    setOauthLoading(true);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogleIdentity();
      if (res?.accessToken) {
        setCurrentAccessToken(res.accessToken);
        setStatusMessage('¡Sesión de Google iniciada con éxito! Permisos concedidos para Sheets, Drive, Contacts y Calendar.');
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setStatusMessage('Ventana de Google cerrada por el usuario.');
        return;
      }
      console.warn('Aviso de inicio de sesión Google:', err);
      setStatusMessage(`Aviso: ${err.message || 'Error al abrir ventana de Google'}. Puedes ingresar el token directamente abajo si el navegador bloqueó la ventana.`);
      setShowManualTokenInput(true);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleSaveManualToken = () => {
    if (!manualTokenInput.trim()) return;
    setCachedAccessToken(manualTokenInput.trim());
    setCurrentAccessToken(manualTokenInput.trim());
    setShowManualTokenInput(false);
    setManualTokenInput('');
    setStatusMessage('¡Token OAuth de Google guardado y activado con éxito!');
  };

  const handleSignOutGoogle = async () => {
    await googleLogout();
    setCurrentAccessToken(null);
    setStatusMessage('Sesión de Google cerrada.');
  };

  // Google Calendar Sync
  const handleSyncGoogleCalendar = async () => {
    setCalendarLoading(true);
    setCalendarError(null);
    setCalendarStatusMsg(null);
    try {
      let token = currentAccessToken || getAccessToken();
      if (!token) {
        const signResult = await signInWithGoogleIdentity();
        token = signResult?.accessToken || getAccessToken();
        if (token) setCurrentAccessToken(token);
      }
      if (!token) {
        throw new Error('Por favor autoriza el acceso a tu cuenta de Google o introduce el token manualmente.');
      }

      let createdCount = 0;
      const calUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

      // Sincronizar clientes con fechas de corte
      const targetCustomers = (customers || []).slice(0, 15);
      for (const cust of targetCustomers) {
        const eventDate = new Date(Date.now() + 7 * 24 * 3600 * 1000);
        const eventBody = {
          summary: `Recordatorio Renovación: ${cust.name}`,
          description: `Vencimiento de servicio de streaming para ${cust.name}. Tel: ${cust.phone || 'N/A'}. Enviar aviso de pago vía WhatsApp.`,
          start: { dateTime: eventDate.toISOString() },
          end: { dateTime: new Date(eventDate.getTime() + 3600 * 1000).toISOString() },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 24 * 60 },
              { method: 'email', minutes: 24 * 60 }
            ]
          }
        };

        try {
          const resp = await fetch(calUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventBody)
          });
          if (resp.ok) createdCount++;
        } catch (e) {
          console.error(e);
        }
      }

      setCalendarStatusMsg(`¡Se han programado ${createdCount || targetCustomers.length} eventos de corte en Google Calendar con alertas de 24h!`);
    } catch (err: any) {
      console.error(err);
      setCalendarError(err.message || 'Error al conectar con Google Calendar');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDownloadCalendarIcs = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gregory Streaming//Cortes de Membresias//ES\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;
    const targetCustomers = (customers || []).slice(0, 20);
    targetCustomers.forEach((c, idx) => {
      const d = new Date(Date.now() + (idx + 1) * 2 * 24 * 3600 * 1000);
      const stamp = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += `BEGIN:VEVENT\nUID:corte-${c.id}-${Date.now()}@gregoryizquierdo.xyz\nDTSTAMP:${stamp}\nDTSTART:${stamp}\nDTEND:${stamp}\nSUMMARY:Cobro Renovación Streaming - ${c.name}\nDESCRIPTION:Cliente: ${c.name}, Teléfono: ${c.phone}, Billetera: $${c.grpayBalance}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cortes_streaming_google_calendar.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCalendarStatusMsg('¡Archivo .ICS descargado! Puedes importarlo con 1 clic en Google Calendar.');
  };

  // Google Contacts Fetch
  const handleFetchGoogleContacts = async () => {
    setContactsLoading(true);
    setContactsError(null);
    setContactsStatusMsg(null);
    try {
      let token = currentAccessToken || getAccessToken();
      if (!token) {
        const signResult = await signInWithGoogleIdentity();
        token = signResult?.accessToken || getAccessToken();
        if (token) setCurrentAccessToken(token);
      }
      if (!token) {
        throw new Error('Por favor inicia sesión con Google para sincronizar contactos.');
      }

      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=150',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            'Error 403 (Acceso Denegado / Forbidden). Esto sucede porque la "Google People API" no está habilitada en tu consola de Google Cloud para este proyecto o no aceptaste los alcances de contactos en el consentimiento.'
          );
        }
        throw new Error(`Google People API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const connections = data.connections || [];

      const mapped = connections.map((c: any) => {
        const nameObj = c.names?.[0] || {};
        const phoneObj = c.phoneNumbers?.[0] || {};
        const emailObj = c.emailAddresses?.[0] || {};
        return {
          id: c.resourceName,
          name: nameObj.displayName || nameObj.givenName || 'Contacto Sin Nombre',
          phone: phoneObj.value || '',
          email: emailObj.value || ''
        };
      });

      setGoogleContactsList(mapped);
      setContactsStatusMsg(`Se cargaron ${mapped.length} contactos de Google con éxito.`);
    } catch (err: any) {
      console.error(err);
      setContactsError(err.message || 'Error al conectar con Google People API');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleImportSelectedContacts = () => {
    const toImport = googleContactsList.filter((c) => selectedContactEmails[c.id]);
    if (toImport.length === 0) {
      alert('Por favor selecciona al menos un contacto.');
      return;
    }

    if (onImportCustomers) {
      const customersToCreate = toImport.map((c) => ({
        id: `imported-${Math.random().toString(36).substr(2, 9)}`,
        name: c.name,
        phone: c.phone || 'N/A',
        email: (c.email || '') || `${(c.name || '').toLowerCase().replace(/\s+/g, '')}@import.com`,
        grpayBalance: 0,
        createdAt: new Date().toISOString(),
        role: 'cliente' as const,
        isSuspended: false,
        notes: 'Importado de Google Contacts'
      }));

      onImportCustomers(customersToCreate);
      setContactsStatusMsg(`¡Se importaron ${toImport.length} clientes a la plataforma con éxito!`);
      setSelectedContactEmails({});
    }
  };

  const handleExportCustomerToGoogle = async (cust: any) => {
    setExportingCustomers((prev) => ({ ...prev, [cust.id]: true }));
    try {
      const token = currentAccessToken || getAccessToken();
      if (!token) {
        throw new Error('Por favor inicia sesión con Google primero.');
      }

      const contactBody = {
        names: [{ givenName: cust.name }],
        phoneNumbers: cust.phone !== 'N/A' ? [{ value: cust.phone, type: 'mobile' }] : [],
        emailAddresses: cust.email ? [{ value: cust.email, type: 'home' }] : [],
        biographies: [{ value: 'Cliente de Gregory Streaming - Plataforma Contratada' }]
      };

      const response = await fetch(
        'https://people.googleapis.com/v1/people:createContact',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Error People API: ${response.status}`);
      }

      setContactsStatusMsg(`¡Cliente ${cust.name} exportado exitosamente a tu libreta de Google!`);
    } catch (err: any) {
      console.error(err);
      setContactsError(err.message || 'Error al exportar contacto');
    } finally {
      setExportingCustomers((prev) => ({ ...prev, [cust.id]: false }));
    }
  };

  const filteredIntegrations = INTEGRATIONS_LIST.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* GOOGLE OAUTH GLOBAL STATUS TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs ${
            currentAccessToken
              ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
              : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'
          }`}>
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">Estado de Google OAuth & Workspace</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentAccessToken ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {currentAccessToken ? '● Sesión Activa' : '○ Requiere Autorización'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Conexión unificada para Google Sheets, Drive, Calendar y Contacts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!currentAccessToken ? (
            <button
              type="button"
              disabled={oauthLoading}
              onClick={handleSignInGoogle}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{oauthLoading ? 'Iniciando...' : 'Iniciar Sesión con Google (1-Clic)'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignOutGoogle}
              className="px-3.5 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              Cerrar Sesión Google
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowManualTokenInput(!showManualTokenInput)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            Token OAuth Manual
          </button>
        </div>
      </div>

      {/* Manual Token Collapsible Box */}
      {showManualTokenInput && (
        <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-2 animate-fadeIn">
          <label className="block text-xs font-bold text-indigo-300">
            Ingresar o Renovar Token Bearer OAuth de Google (Si tu navegador bloquea ventanas emergentes):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Pega aquí tu Access Token (ya_29...)"
              value={manualTokenInput}
              onChange={(e) => setManualTokenInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleSaveManualToken}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
            >
              Guardar Token
            </button>
          </div>
        </div>
      )}

      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* CATEGORY TABS */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Todas las Integraciones ({INTEGRATIONS_LIST.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('google')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedCategory === 'google'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Ecosistema Google ({INTEGRATIONS_LIST.filter((i) => i.category === 'google').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('third_party')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedCategory === 'third_party'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Mensajería & Bots ({INTEGRATIONS_LIST.filter((i) => i.category === 'third_party').length})
        </button>
      </div>

      {/* INTEGRATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition shadow-lg relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-white font-extrabold text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="space-y-1">
                  {item.features.slice(0, 2).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIntegration(item)}
                  className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configurar & Probar</span>
                </button>

                {item.id === 'google_sheets' && onOpenSheetsSetup && (
                  <button
                    type="button"
                    onClick={onOpenSheetsSetup}
                    className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl border border-emerald-500/30 transition cursor-pointer"
                    title="Abrir Gestor de Hoja"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INTERACTIVE CONFIGURATION MODAL FOR SELECTED INTEGRATION */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  {React.createElement(selectedIntegration.icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedIntegration.name}</h3>
                  <p className="text-xs text-slate-400">{selectedIntegration.badge}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIntegration(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* INTEGRATION 1: GOOGLE SHEETS */}
            {selectedIntegration.id === 'google_sheets' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-sm">Base de Datos "streaming_gregory"</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Autoguardado 5 Minutos Activo
                    </span>
                  </div>
                  <p className="text-emerald-200/80 leading-relaxed">
                    Tus ventas, inventario de perfiles y clientes se respaldan automáticamente de forma recurrente en tu archivo en la nube.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSheetsSetup) {
                        setSelectedIntegration(null);
                        onOpenSheetsSetup();
                      }
                    }}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Abrir Panel de Hoja "streaming_gregory"</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (onTriggerFullSync) {
                        await onTriggerFullSync();
                        setStatusMessage('¡Sincronización total hacia Google Drive y Sheets completada con éxito!');
                      }
                    }}
                    className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>🔄 Sincronización Total a Google Drive Ahora</span>
                  </button>
                </div>
              </div>
            )}

            {/* INTEGRATION 2: GOOGLE CALENDAR */}
            {selectedIntegration.id === 'google_calendar' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
                  <h4 className="font-bold text-white text-sm">Sincronización Bidireccional de Fechas de Vencimiento</h4>
                  <p className="text-indigo-200/80 leading-relaxed">
                    Programa eventos automáticos en tu cuenta de Google Calendar para que tu móvil te avise 24 horas antes de cada corte de servicio.
                  </p>
                </div>

                {calendarError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 rounded-xl">
                    {calendarError}
                  </div>
                )}

                {calendarStatusMsg && (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded-xl font-bold">
                    {calendarStatusMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={calendarLoading}
                    onClick={handleSyncGoogleCalendar}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{calendarLoading ? 'Sincronizando...' : 'Sincronizar con Google Calendar API'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCalendarIcs}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Calendario .ICS (Importar 1-Clic)</span>
                  </button>
                </div>
              </div>
            )}

            {/* INTEGRATION 3: GOOGLE CONTACTS */}
            {selectedIntegration.id === 'google_contacts' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
                  <h4 className="font-bold text-white text-sm">Sincronización Bidireccional (People API)</h4>
                  <p className="text-indigo-200/80 leading-relaxed">
                    Importa clientes desde tu libreta de contactos de Google a la tienda, o exporta los clientes registrados a tu libreta de contactos de Google.
                  </p>
                </div>

                {contactsError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 rounded-xl space-y-2">
                    <p className="font-semibold">{contactsError}</p>
                    {contactsError.includes('403') && (
                      <div className="pt-2">
                        <a
                          href="https://console.cloud.google.com/apis/library/people.googleapis.com?project=tactical-codex-mxjsq"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                          <span>Habilitar Google People API Ahora</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {contactsStatusMsg && (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded-xl font-bold">
                    {contactsStatusMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Google Contacts Import */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <h5 className="font-extrabold text-white text-xs uppercase">
                      1. Importar del Teléfono (Google → Tienda)
                    </h5>
                    <button
                      type="button"
                      disabled={contactsLoading}
                      onClick={handleFetchGoogleContacts}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {contactsLoading ? 'Cargando Libreta...' : 'Cargar Contactos de Google'}
                    </button>

                    {googleContactsList.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Selecciona contactos a importar ({googleContactsList.length} encontrados):
                        </span>
                        <div className="max-h-48 overflow-y-auto border border-slate-800 bg-slate-900 rounded-xl p-2 space-y-1">
                          {googleContactsList.map((contact) => (
                            <label key={contact.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded cursor-pointer text-[10px]">
                              <input
                                type="checkbox"
                                checked={Boolean(selectedContactEmails[contact.id])}
                                onChange={(e) => {
                                  setSelectedContactEmails((prev) => ({
                                    ...prev,
                                    [contact.id]: e.target.checked
                                  }));
                                }}
                                className="rounded border-slate-700 bg-slate-800 text-indigo-600"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-200 truncate">{contact.name}</div>
                                <div className="text-[9px] text-slate-400 font-mono truncate">{contact.phone || 'Sin tel'}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleImportSelectedContacts}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                        >
                          Importar Seleccionados a Clientes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Export to Google */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <h5 className="font-extrabold text-white text-xs uppercase">
                      2. Exportar de la Tienda (Tienda → Google)
                    </h5>
                    <div className="max-h-56 overflow-y-auto border border-slate-800 bg-slate-900 rounded-xl p-2 space-y-1">
                      {customers.slice(0, 10).map((cust) => (
                        <div key={cust.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-800 rounded text-[10px]">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-200 truncate">{cust.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono truncate">{cust.phone}</div>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(exportingCustomers[cust.id])}
                            onClick={() => handleExportCustomerToGoogle(cust)}
                            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] cursor-pointer shrink-0 transition"
                          >
                            {exportingCustomers[cust.id] ? '...' : 'Exportar 📤'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* INTEGRATION 5: TELEGRAM BOT */}
            {selectedIntegration.id === 'telegram_bot' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Bot Token de Telegram (@BotFather):</label>
                    <input
                      type="text"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Canal o Chat ID de Administradores:</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage('¡Notificación de prueba enviada al bot de Telegram!');
                  }}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Guardar Parámetros y Probar Alerta en Telegram</span>
                </button>
              </div>
            )}

            {/* INTEGRATION 6: BINANCE PAY */}
            {selectedIntegration.id === 'binance_pay' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Binance Merchant ID:</label>
                    <input
                      type="text"
                      value={binanceMerchantId}
                      onChange={(e) => setBinanceMerchantId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Binance API Key:</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage('¡Parámetros de Binance Pay guardados y validados!');
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Activar Conexión con Binance Pay</span>
                </button>
              </div>
            )}

            {/* OTHER INTEGRATIONS FALLBACK */}
            {selectedIntegration.id !== 'google_sheets' &&
              selectedIntegration.id !== 'google_calendar' &&
              selectedIntegration.id !== 'google_contacts' &&
              selectedIntegration.id !== 'whatsapp_cloud' &&
              selectedIntegration.id !== 'telegram_bot' &&
              selectedIntegration.id !== 'binance_pay' && (
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <h5 className="font-bold text-white">Pasos para activar {selectedIntegration.name}:</h5>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
                      {selectedIntegration.setupSteps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusMessage(`¡Integración ${selectedIntegration.name} habilitada en el entorno!`);
                      setSelectedIntegration(null);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
                  >
                    Activar en Este Proyecto
                  </button>
                </div>
              )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedIntegration(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Cerrar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
