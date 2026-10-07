import React, { useState, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  Send,
  CheckCircle2,
  Lock,
  User,
  Phone,
  Mail,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Trash2,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { CustomerUser, Order, IncidentReport, IncidentIssueType } from '../types';

interface IncidentReportModalProps {
  customerUser: CustomerUser | null;
  existingUsers: CustomerUser[];
  userOrders: Order[];
  onClose: () => void;
  onLoginCustomer: (user: CustomerUser) => void;
  onSubmitIncident: (incident: IncidentReport) => void;
}

const ISSUE_OPTIONS: IncidentIssueType[] = [
  'Clave o PIN incorrecto',
  'Pantalla ocupada / Límite excedido',
  'Cuenta caída o membresía pausada',
  'Perfil borrado o modificado',
  'Error de reproducción o código',
  'Renovación o pago no acreditado',
  'Otro problema técnico'
];

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  customerUser,
  existingUsers,
  userOrders,
  onClose,
  onLoginCustomer,
  onSubmitIncident
}) => {
  // Auth state if not logged in
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Form state
  const customerSubscriptions = userOrders.filter(
    (o) => o.status === 'confirmed' || o.status === 'delivered'
  );

  const [selectedService, setSelectedService] = useState<string>(() => {
    if (customerSubscriptions.length > 0) {
      return customerSubscriptions[0].productName;
    }
    return 'Netflix Ultra HD 4K';
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (customerSubscriptions.length > 0) {
      return customerSubscriptions[0].id;
    }
    return '';
  });

  const [issueType, setIssueType] = useState<IncidentIssueType>('Clave o PIN incorrecto');
  const [whatsappNumber, setWhatsappNumber] = useState(customerUser?.phone || '');
  const [description, setDescription] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<IncidentReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Login for non-authenticated customers
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (isRegisterMode) {
      if (!regName.trim() || !authEmail.trim() || !regPhone.trim()) {
        setAuthError('Por favor completa todos los campos para identificarte.');
        return;
      }
      const newUser: CustomerUser = {
        id: `cust-${Date.now()}`,
        name: regName.trim(),
        email: authEmail.trim().toLowerCase(),
        password: authPassword || '123456',
        phone: regPhone.trim(),
        grpayBalance: 0,
        createdAt: new Date().toISOString()
      };
      onLoginCustomer(newUser);
      setWhatsappNumber(newUser.phone);
      return;
    }

    const found = existingUsers.find(
      (u) =>
        u.email.toLowerCase() === authEmail.trim().toLowerCase() &&
        (u.password === authPassword.trim() || !u.password)
    );

    if (found) {
      onLoginCustomer(found);
      setWhatsappNumber(found.phone);
    } else {
      setAuthError('Correo o contraseña incorrectos. Verifica tus credenciales o regístrate.');
    }
  };


  // Image Upload & Paste
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Por favor sube un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('La imagen no debe superar los 5MB.');
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotData(event.target?.result as string);
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste support
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  // Generate formatted messages
  const createReportMessage = (ticketId: string): string => {
    const clientName = customerUser?.name || 'Cliente';
    const clientEmail = customerUser?.email || '';
    const phone = whatsappNumber.trim();
    const service = selectedService;
    const orderRef = selectedOrderId ? ` (Ref: #${selectedOrderId})` : '';

    return (
      `🚨 *REPORTE DE INCIDENCIA - GREGORI IZQUIERDO STREAMING*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *Ticket:* #${ticketId}\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📧 *Correo:* ${clientEmail}\n` +
      `📱 *WhatsApp:* ${phone}\n` +
      `📺 *Servicio:* ${service}${orderRef}\n` +
      `⚠️ *Falla:* ${issueType}\n\n` +
      `📝 *Detalle del Problema:*\n` +
      `"${description.trim()}"\n\n` +
      `${screenshotData ? '📸 *Captura del problema adjunta:* (Cargada en la plataforma)\n' : ''}` +
      `⏰ *Fecha:* ${new Date().toLocaleString('es-VE')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Por favor atender mi reporte para reposición o solución. ¡Gracias!_`
    );
  };

  const handleSubmit = (channel: 'whatsapp' | 'telegram') => {
    if (!customerUser) {
      setFormError('Debes ingresar con tus credenciales para registrar la incidencia.');
      return;
    }
    if (!whatsappNumber.trim()) {
      setFormError('Por favor ingresa tu número de WhatsApp para contacto.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError('Por favor redacta una breve explicación de la falla (mínimo 10 caracteres).');
      return;
    }

    setIsSubmitting(true);
    const ticketId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncident: IncidentReport = {
      id: ticketId,
      createdAt: new Date().toISOString(),
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerEmail: customerUser.email,
      customerPhone: whatsappNumber.trim(),
      serviceName: selectedService,
      orderId: selectedOrderId || undefined,
      issueType,
      description: description.trim(),
      screenshotImage: screenshotData || undefined,
      status: 'pending',
      sentVia: channel
    };

    // Save in parent state & Google Sheets
    onSubmitIncident(newIncident);
    setSubmittedTicket(newIncident);
    setIsSubmitting(false);

    const messageText = createReportMessage(ticketId);

    // Open WhatsApp or Telegram
    if (channel === 'whatsapp') {
      const supportNumber = '584143928410'; // Gregori Izquierdo Support WhatsApp
      const cleanPhone = supportNumber.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank');
    } else {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent('https://gregoryizquierdo.xyz')}&text=${encodeURIComponent(messageText)}`;
      window.open(telegramUrl, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onPaste={handlePaste}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-rose-200 flex items-center gap-1.5">
                <span>Centro de Soporte Técnico</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] text-white">Garantía Activa</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Reporte de Incidencia o Falla
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-rose-100/90 max-w-lg">
            ¿Tienes problemas con tu cuenta, clave o perfil? Envía tu reporte con captura y te reponemos o solucionamos en minutos.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[78vh] overflow-y-auto space-y-6">
          {/* STEP 1: Not Logged In -> Prompt Customer Credentials */}
          {!customerUser ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 flex items-start gap-3">
                <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <strong className="font-bold block mb-0.5 text-rose-950">
                    Ingreso de Credenciales Requerido
                  </strong>
                  Para saber quién escribe y atender tu reporte de falla de forma personalizada con tu garantía de compra, por favor identifícate con tus datos de cliente:
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isRegisterMode ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Tu Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Ej: Carlos Mendoza"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Número de WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+58 414 123 4567"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm outline-hidden"
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contraseña de Cliente *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm outline-hidden"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {authError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-200 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isRegisterMode ? 'Registrarme y Continuar' : 'Ingresar y Reportar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setAuthError('');
                    }}
                    className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer"
                  >
                    {isRegisterMode ? '¿Ya tienes cuenta? Ingresar' : '¿Primera vez? Crear acceso'}
                  </button>
                </div>
              </form>

            </div>
          ) : submittedTicket ? (
            /* STEP 3: Successfully Submitted View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
                  Ticket #{submittedTicket.id}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  ¡Reporte de Incidencia Enviado!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Tu reporte ha sido registrado en el sistema. Se ha abierto la aplicación seleccionada para que nuestro equipo técnico te dé respuesta prioritaria.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cliente:</span>
                  <span className="font-bold text-slate-900">{submittedTicket.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Servicio Afectado:</span>
                  <span className="font-bold text-slate-900">{submittedTicket.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Falla:</span>
                  <span className="font-bold text-rose-600">{submittedTicket.issueType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Canal de Envío:</span>
                  <span className="font-bold capitalize text-slate-900">
                    {submittedTicket.sentVia === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setDescription('');
                    setScreenshotData(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Reportar Otro Servicio
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition cursor-pointer"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Authenticated -> Fill Incident Details */
            <div className="space-y-5">
              {/* Authenticated Customer Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {customerUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {customerUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {customerUser.email}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                  Cliente Verificado
                </span>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Servicio o Cuenta con Falla *
                </label>
                {customerSubscriptions.length > 0 ? (
                  <select
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value);
                      const matching = customerSubscriptions.find((s) => s.productName === e.target.value);
                      if (matching) setSelectedOrderId(matching.id);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden"
                  >
                    {customerSubscriptions.map((sub) => (
                      <option key={sub.id} value={sub.productName}>
                        {sub.productName} ({sub.duration} • Ref #{sub.id})
                      </option>
                    ))}
                    <option value="Otro servicio / Consulta general">
                      Otro servicio / Consulta general
                    </option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    placeholder="Ej: Netflix Ultra HD 4K, Disney+, Max..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden"
                  />
                )}
              </div>

              {/* Issue Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2. Tipo de Incidencia *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ISSUE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIssueType(opt)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition cursor-pointer flex items-center justify-between ${
                        issueType === opt
                          ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt}</span>
                      {issueType === opt && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Contact Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  3. Tu Número de WhatsApp para Respuesta *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+58 414 123 4567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm outline-hidden font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Por este número nuestro asesor se comunicará contigo de inmediato.
                </p>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  4. Explicación Detallada del Problema *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Por favor describe qué sucede: ¿qué error sale en pantalla? ¿desde cuándo ocurre? ¿en qué dispositivo intentas acceder?..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm outline-hidden text-slate-800 leading-relaxed"
                />
              </div>

              {/* Screenshot / Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>5. Imagen o Captura del Problema (Recomendado)</span>
                  <span className="text-[11px] font-normal text-slate-400">Puedes pegar (Ctrl+V)</span>
                </label>

                {screenshotData ? (
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group">
                    <img
                      src={screenshotData}
                      alt="Captura de falla"
                      className="w-full h-44 object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                      >
                        Cambiar Imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotData(null);
                          setScreenshotName('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                    <div className="p-2 bg-slate-900/90 text-slate-300 text-[11px] flex items-center justify-between px-3">
                      <span className="truncate max-w-[200px]">{screenshotName || 'captura_error.png'}</span>
                      <span className="text-emerald-400 font-bold">✓ Captura lista</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-rose-50/30 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white text-slate-500 group-hover:text-rose-600 flex items-center justify-center mx-auto mb-2 border border-slate-200 shadow-2xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-700 mb-0.5">
                      Haz clic para subir o arrastra la captura de pantalla
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Soporta JPG, PNG, WebP o pega con Ctrl+V (máx 5MB)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Dispatch Action Buttons */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase mb-2">
                  ¿Por dónde deseas enviar tu reporte?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmit('whatsapp')}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-200 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Enviar por WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmit('telegram')}
                    className="py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-200 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar por Telegram</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Se generará tu ticket oficial y se abrirá el chat con todos los detalles ya estructurados.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
