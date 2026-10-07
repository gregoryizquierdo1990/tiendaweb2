import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { CustomerUser } from '../types';
import { logAuditEvent } from '../services/auditLogger';

interface CustomerAuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: CustomerUser) => void;
  onRegister: (newUser: Omit<CustomerUser, 'id' | 'grpayBalance' | 'createdAt'>) => Promise<CustomerUser>;
  existingUsers: CustomerUser[];
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  onClose,
  onLoginSuccess,
  onRegister,
  existingUsers
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'cliente' | 'vendedor'>('cliente');
  const [sellerCode, setSellerCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isRegisterMode) {
      if (!name.trim()) {
        setErrorMessage('Por favor ingresa tu Nombre y Apellido');
        return;
      }
      if (!phone.trim()) {
        setErrorMessage('Ingresa tu número de WhatsApp / Teléfono');
        return;
      }
      if (email.trim() && !email.includes('@')) {
        setErrorMessage('Ingresa un correo electrónico válido o déjalo en blanco si no posees');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const finalEmail = email.trim()
        ? email.trim().toLowerCase()
        : `${cleanPhone || 'cliente' + Math.floor(1000 + Math.random() * 9000)}@cliente.gregoryizquierdo.xyz`;

      // Check if email or phone already registered
      const exists = existingUsers.some(
        (u) =>
          u.email.toLowerCase() === finalEmail ||
          (cleanPhone.length >= 7 && u.phone.replace(/\D/g, '') === cleanPhone)
      );
      if (exists) {
        setErrorMessage('Este teléfono o correo ya está registrado. Por favor inicia sesión.');
        return;
      }

      try {
        setIsLoading(true);
        const createdUser = await onRegister({
          name: name.trim(),
          email: finalEmail,
          password,
          phone: phone.trim(),
          role,
          sellerCode: role === 'vendedor' ? (sellerCode.trim() || `VEND-${Math.floor(100 + Math.random() * 900)}`) : undefined
        });
        logAuditEvent({
          actor: createdUser.name,
          actorRole: createdUser.role === 'vendedor' ? 'seller' : 'customer',
          actorEmail: createdUser.email,
          actorPhone: createdUser.phone,
          action: 'REGISTRO_USUARIO',
          description: `Nuevo usuario registrado como ${(createdUser.role || 'cliente').toUpperCase()}. WhatsApp: ${createdUser.phone}`,
          severity: 'success'
        });
        onLoginSuccess(createdUser);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al registrar usuario');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login by Email or Phone
      if (!email.trim() || !password) {
        setErrorMessage('Ingresa tu teléfono o correo y contraseña');
        return;
      }

      const cleanInput = email.trim().toLowerCase();
      const cleanPhoneInput = email.replace(/\D/g, '');

      const found = existingUsers.find(
        (u) =>
          (u.email.toLowerCase() === cleanInput ||
           (cleanPhoneInput.length >= 7 && u.phone.replace(/\D/g, '') === cleanPhoneInput) ||
           u.phone.trim() === email.trim()) &&
          (u.password ? u.password === password : true)
      );

      if (!found) {
        logAuditEvent({
          actor: email.trim(),
          actorRole: 'system',
          action: 'ERROR_AUTENTICACION',
          description: `Intento fallido de inicio de sesión para el identificador: ${email.trim()}`,
          severity: 'error'
        });
        setErrorMessage('Teléfono/correo o contraseña incorrectos. Si no tienes cuenta, regístrate.');
        return;
      }

      logAuditEvent({
        actor: found.name,
        actorRole: found.role === 'vendedor' ? 'seller' : 'customer',
        actorEmail: found.email,
        actorPhone: found.phone,
        action: 'INICIO_SESION',
        description: `Inicio de sesión exitoso como ${(found.role || 'cliente').toUpperCase()}.`,
        severity: 'info'
      });

      onLoginSuccess(found);
      onClose();
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isRegisterMode ? 'Crear Cuenta de Cliente' : 'Área de Clientes'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRegisterMode
                  ? 'Gestiona tus suscripciones y tu wallet GRPAY'
                  : 'Ingresa para ver tus compras y saldo GRPAY'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Cuenta en la Plataforma *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('cliente')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        role === 'cliente'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Soy Cliente Final</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('vendedor')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        role === 'vendedor'
                          ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Soy Vendedor / Revendedor</span>
                    </button>
                  </div>
                </div>

                {role === 'vendedor' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código de Vendedor / Identificador (Opcional)
                    </label>
                    <input
                      type="text"
                      value={sellerCode}
                      onChange={(e) => setSellerCode(e.target.value)}
                      placeholder="Ej. VEND-03 o GREGORI-VIP"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/30 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-[10px] text-purple-600 mt-1">
                      Te identificará como vendedor autorizado para asignarte ventas en la conciliación.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Juan Mendoza"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+58 414 000 0000"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com (Opcional)"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    No es obligatorio para registrarte. Solo si deseas recibir respaldos por email.
                  </p>
                </div>
              </>
            )}

            {!isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico o WhatsApp / Teléfono *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com o +58 414..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isRegisterMode ? 'Crear mi Cuenta' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle between register and login */}
          <div className="mt-5 text-center text-xs text-slate-500">
            {isRegisterMode ? (
              <span>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMessage(null);
                  }}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Inicia sesión aquí
                </button>
              </span>
            ) : (
              <span>
                ¿No tienes cuenta aún?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMessage(null);
                  }}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Regístrate gratis
                </button>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
