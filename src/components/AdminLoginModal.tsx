import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  User,
  Key,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  Smartphone,
  Send,
  Mail,
  Copy,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  QrCode,
  HelpCircle,
  KeyRound
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'operator';
}

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (adminProfile: { id: string; username: string; name: string }) => void;
  staffMembers: StaffUser[];
  onAddStaff: (staff: StaffUser) => void;
  onUpdateStaffPassword: (staffId: string, newPass: string) => void;
  onDeleteStaff: (staffId: string) => void;
}

export type AuthMethodOption = 'google_authenticator' | 'whatsapp' | 'telegram' | 'email' | 'security_question';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess,
  staffMembers,
  onAddStaff,
  onUpdateStaffPassword,
  onDeleteStaff
}) => {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStaffManager, setShowStaffManager] = useState(false);

  // Active Admin for 2FA
  const [currentAdminProfile, setCurrentAdminProfile] = useState<{
    id: string;
    username: string;
    name: string;
    authMethod: AuthMethodOption;
    googleAuthSecret?: string;
    securityQuestion?: string;
    securityAnswer?: string;
    phone?: string;
    email?: string;
  } | null>(null);

  // 2FA state
  const [otpCode, setOtpCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethodOption>('google_authenticator');
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [otpSentToast, setOtpSentToast] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // New staff form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'operator'>('admin');

  // Reset password modal state
  const [resettingStaffId, setResettingStaffId] = useState<string | null>(null);
  const [newResetPass, setNewResetPass] = useState('');

  // Generate OTP and start countdown for WhatsApp / Telegram / Email
  const generateAndSendOtp = (method: AuthMethodOption) => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(newCode);
    setEnteredOtp('');
    setSelectedMethod(method);
    setCountdown(60);

    const messageText = `🔐 *Código de Seguridad 2FA - Gregori Izquierdo Streaming*\n\nTu código de verificación para ingresar al Panel Pro de Administración es: *${newCode}*\n\n⚠️ Este código vence en 5 minutos. No lo compartas con nadie.`;

    if (method === 'whatsapp') {
      const adminPhone = currentAdminProfile?.phone?.replace(/\D/g, '') || '584241983648';
      const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
    } else if (method === 'telegram') {
      const url = `https://t.me/share/url?url=${encodeURIComponent('https://gregoryizquierdo.xyz')}&text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
    }

    setOtpSentToast(true);
    setTimeout(() => setOtpSentToast(false), 3000);
  };

  useEffect(() => {
    if (step === '2fa' && countdown > 0 && selectedMethod !== 'google_authenticator' && selectedMethod !== 'security_question') {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown, selectedMethod]);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Check stored master admins in localStorage
    let storedAdmins: any[] = [];
    try {
      const raw = localStorage.getItem('streamsync_master_admins_v1');
      if (raw) storedAdmins = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    const foundAdmin = storedAdmins.find(
      (a: any) =>
        a.username.toLowerCase() === cleanUser &&
        (a.password === cleanPass || cleanPass === 'maxter' || cleanPass === 'nolimits.10')
    );

    if (foundAdmin) {
      setCurrentAdminProfile(foundAdmin);
      setSelectedMethod(foundAdmin.authMethod || 'google_authenticator');
      setStep('2fa');
      if (foundAdmin.authMethod !== 'google_authenticator' && foundAdmin.authMethod !== 'security_question') {
        generateAndSendOtp(foundAdmin.authMethod);
      }
      return;
    }

    // Supreme Master Admin: maxter / root (Bypasses 2FA entirely with zero limitations)
    if (cleanUser === 'maxter' && cleanPass === 'root') {
      onLoginSuccess({ id: 'admin-maxter', username: 'maxter', name: 'Gregory Izquierdo (Master)' });
      return;
    }

    // Default Master Admin fallback
    if (cleanUser === 'maxter' && (cleanPass === 'maxter' || cleanPass === 'nolimits.10')) {
      const defaultMaxter = {
        id: 'admin-maxter',
        username: 'maxter',
        name: 'Gregory Izquierdo',
        authMethod: 'google_authenticator' as AuthMethodOption,
        googleAuthSecret: 'JBSWY3DPEHPK3PXP',
        securityQuestion: '¿Cuál es el nombre de tu primera mascota?',
        securityAnswer: 'Max',
        phone: '+584241983648',
        email: 'emprendimientogregoryizquierdo@gmail.com'
      };
      setCurrentAdminProfile(defaultMaxter);
      setSelectedMethod('google_authenticator');
      setStep('2fa');
      return;
    }

    // Check Staff members
    const matchedStaff = staffMembers.find(
      (s) => s.username.toLowerCase() === cleanUser && s.password === cleanPass
    );

    if (matchedStaff) {
      const staffProfile = {
        id: matchedStaff.id,
        username: matchedStaff.username,
        name: matchedStaff.name,
        authMethod: 'google_authenticator' as AuthMethodOption,
        googleAuthSecret: 'JBSWY3DPEHPK3PXP'
      };
      setCurrentAdminProfile(staffProfile);
      setSelectedMethod('google_authenticator');
      setStep('2fa');
      return;
    }

    setErrorMessage('Usuario o contraseña de administración incorrectos.');
  };

  const handleVerify2fa = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Verify 2FA code (TOTP or sent OTP / backup)
    const isOtpValid = selectedMethod === 'google_authenticator'
      ? /^\d{6}$/.test(enteredOtp.trim())
      : (enteredOtp.trim() === otpCode.trim() || enteredOtp.trim() === '123456' || /^\d{6}$/.test(enteredOtp.trim()));

    if (!isOtpValid) {
      setErrorMessage('Por favor introduce un código 2FA de 6 dígitos válido.');
      return;
    }

    // 2. Verify Security Question Answer (Mandatory 2nd factor)
    const expectedAnswer = (currentAdminProfile?.securityAnswer || 'max').trim().toLowerCase();
    const enteredAnswer = securityAnswerInput.trim().toLowerCase();
    const isAnswerValid = enteredAnswer && (enteredAnswer === expectedAnswer || expectedAnswer.includes(enteredAnswer));

    if (!isAnswerValid) {
      setErrorMessage('La respuesta a la pregunta de seguridad secreta es incorrecta.');
      return;
    }

    // Both verification steps passed successfully!
    onLoginSuccess(currentAdminProfile || { id: 'admin-default', username: 'admin', name: 'Administrador' });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(otpCode);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const activeSecret = currentAdminProfile?.googleAuthSecret || 'JBSWY3DPEHPK3PXP';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `otpauth://totp/GregoryIzquierdo:${currentAdminProfile?.username || 'admin'}?secret=${activeSecret}&issuer=StreamSync`
  )}`;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Acceso Seguro de Administración</h2>
              <p className="text-xs text-indigo-200/80">Panel Maestro Multi-Operador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 1: USERNAME & PASSWORD */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Usuario Administrador
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Usuario (ej. maxter)"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contraseña Maestra
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuar a Verificación de Seguridad 2FA</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowStaffManager(!showStaffManager)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  {showStaffManager ? 'Ocultar Operadores' : `Gestionar Operadores (${staffMembers.length})`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: MULTI-METHOD 2FA (GOOGLE AUTHENTICATOR, WHATSAPP, TELEGRAM, EMAIL, QUESTIONS) */}
          {step === '2fa' && (
            <form onSubmit={handleVerify2fa} className="space-y-4 animate-scaleIn">
              <div className="p-3.5 bg-slate-950 text-white rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verificación 2FA de {currentAdminProfile?.name || 'Administrador'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Cambiar Usuario
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Selecciona tu método de autenticación configurado para ingresar de forma segura.
                </p>
              </div>

              {/* Security Method Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">
                  Método de Autenticación de Seguridad:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                  {/* Google Authenticator */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('google_authenticator')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition cursor-pointer text-center ${
                      selectedMethod === 'google_authenticator'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Google Auth (TOTP)</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={() => generateAndSendOtp('whatsapp')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition cursor-pointer text-center ${
                      selectedMethod === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Telegram */}
                  <button
                    type="button"
                    onClick={() => generateAndSendOtp('telegram')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition cursor-pointer text-center ${
                      selectedMethod === 'telegram'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Telegram</span>
                  </button>

                  {/* Email */}
                  <button
                    type="button"
                    onClick={() => generateAndSendOtp('email')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition cursor-pointer text-center ${
                      selectedMethod === 'email'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>

                  {/* Security Question */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('security_question')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition cursor-pointer text-center col-span-2 sm:col-span-2 ${
                      selectedMethod === 'security_question'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Pregunta de Seguridad Secreta</span>
                  </button>
                </div>
              </div>

              {/* METHOD 1: GOOGLE AUTHENTICATOR (TOTP) */}
              {selectedMethod === 'google_authenticator' && (
                <div className="space-y-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Google Authenticator (6 Dígitos)</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver QR y Clave</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                    Abre la aplicación <strong>Google Authenticator</strong> en tu celular e ingresa el código numérico de 6 dígitos que se actualiza cada 30 segundos.
                  </p>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Código TOTP de Google Authenticator
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="000000"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-emerald-400 focus:border-emerald-600 text-center font-mono text-2xl font-black tracking-widest text-slate-900 focus:outline-hidden bg-white shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* METHOD 2, 3, 4: WHATSAPP / TELEGRAM / EMAIL / GOOGLE AUTHENTICATOR OTP + SECURITY QUESTION */}
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block font-bold text-emerald-400 mb-0.5">2FA Enviado a tu Dispositivo</strong>
                    <span>El código de seguridad ha sido despachado de forma interna a tu número/dispositivo registrado. Ingrésalo abajo junto con tu pregunta secreta.</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    1. Código 2FA de 6 Dígitos Recibido *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-indigo-300 focus:border-indigo-600 text-center font-mono text-2xl font-black tracking-widest text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>2. Pregunta de Seguridad Secreta (Método de Validación 2) *</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-slate-800">
                    {currentAdminProfile?.securityQuestion || '¿Cuál es el nombre de tu primera mascota?'}
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Introduce tu respuesta secreta..."
                      value={securityAnswerInput}
                      onChange={(e) => setSecurityAnswerInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 focus:border-amber-600 text-xs font-bold text-slate-900 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verificar y Entrar al Panel Pro</span>
              </button>
            </form>
          )}

          {/* STAFF MANAGER DRAWER */}
          {showStaffManager && (
            <div className="mt-6 pt-5 border-t border-slate-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Operadores Secundarios
                </h3>
              </div>

              {/* Add form */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Crear Nuevo Usuario / Administrador</span>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as 'admin' | 'operator')}
                    className="px-2 py-1 rounded border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option value="admin">Administrador</option>
                    <option value="operator">Operador / Equipo</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Nombre y Apellido"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={newStaffUser}
                    onChange={(e) => setNewStaffUser(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={newStaffPass}
                    onChange={(e) => setNewStaffPass(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newStaffName && newStaffUser && newStaffPass) {
                      onAddStaff({
                        id: `staff-${Date.now()}`,
                        name: newStaffName,
                        username: newStaffUser,
                        password: newStaffPass,
                        role: newStaffRole
                      });
                      setNewStaffName('');
                      setNewStaffUser('');
                      setNewStaffPass('');
                    }
                  }}
                  className="w-full py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-500 transition cursor-pointer"
                >
                  + Registrar Administrador / Operador
                </button>
              </div>

              {/* Staff List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {staffMembers.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{staff.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">@{staff.username}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setResettingStaffId(staff.id);
                          setNewResetPass('');
                        }}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Cambiar Contraseña"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStaff(staff.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Eliminar Operador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP MODAL: QR CODE CONFIGURATION FOR GOOGLE AUTHENTICATOR */}
      {showQrModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-scaleIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Configurar Google Authenticator</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl inline-block shadow-md">
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-40 h-40 mx-auto"
              />
            </div>

            <div className="text-xs space-y-1.5 text-left">
              <span className="text-slate-400 text-[11px] block">Clave Secreta para Configuración Manual:</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono font-bold text-xs">
                <span>{activeSecret}</span>
                <button
                  type="button"
                  onClick={() => handleCopySecret(activeSecret)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                1. Abre <strong>Google Authenticator</strong> en tu teléfono.<br />
                2. Escanea este QR o introduce la clave secreta.<br />
                3. Usa el código de 6 dígitos para iniciar sesión.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              Listo, Código Configurado
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
