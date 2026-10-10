import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { CustomerUser } from '../types';
import { 
  registerWithEmailPassword, 
  loginWithEmailPassword, 
  loginWithGooglePopup 
} from '../services/firebaseAuthService';
import { logAuditEvent } from '../services/auditLogger';

interface CustomerAuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: CustomerUser) => void;
  onRegister?: (newUser: Omit<CustomerUser, 'id' | 'grpayBalance' | 'createdAt'>) => Promise<CustomerUser>;
  existingUsers: CustomerUser[];
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  onClose,
  onLoginSuccess,
  existingUsers
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGooglePopup();
      
      logAuditEvent({
        actor: user.name,
        actorRole: 'customer',
        actorEmail: user.email,
        actorPhone: user.phone,
        action: 'LOGIN_GOOGLE',
        description: `Inicio de sesión exitoso con Google.`,
        severity: 'success',
        metadata: { method: 'google_popup' }
      });

      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn('Google Sign-In Error:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Inicio de sesión con Google cancelado.');
      } else {
        setErrorMessage(err?.message || 'Error al conectar con Google. Intenta con correo y contraseña.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Ingresa un correo electrónico válido para tu cuenta');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      try {
        setIsLoading(true);
        // Firebase Auth registration - Default role 'cliente' assigned automatically in Firestore 'users'
        const registeredUser = await registerWithEmailPassword(
          email.trim(),
          password,
          name.trim(),
          phone.trim()
        );

        logAuditEvent({
          actor: registeredUser.name,
          actorRole: 'customer',
          actorEmail: registeredUser.email,
          actorPhone: registeredUser.phone,
          action: 'REGISTRO_NUEVO',
          description: `Nueva cuenta de cliente registrada exitosamente.`,
          severity: 'success',
          metadata: { name, email, phone }
        });

        onLoginSuccess(registeredUser);
        onClose();
      } catch (err: any) {
        console.warn('Registration Error:', err);
        const code = err?.code || '';
        if (code === 'auth/email-already-in-use') {
          setErrorMessage('Este correo ya está registrado en Firebase. Por favor inicia sesión.');
        } else if (code === 'auth/weak-password') {
          setErrorMessage('La contraseña es muy débil. Usa al menos 6 caracteres.');
        } else if (code === 'auth/invalid-email') {
          setErrorMessage('El formato de correo no es válido.');
        } else {
          setErrorMessage(err?.message || 'Error al registrar la cuenta en Firebase Auth.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login with Email and Password
      if (!email.trim() || !password) {
        setErrorMessage('Ingresa tu correo electrónico y contraseña');
        return;
      }

      try {
        setIsLoading(true);
        const cleanEmail = email.trim();
        // If user typed a phone number, attempt match in existing users or append domain
        const emailToLogin = cleanEmail.includes('@') 
          ? cleanEmail 
          : `${(cleanEmail || '').replace(/\D/g, '')}@cliente.gregoryizquierdo.xyz`;

        const loggedUser = await loginWithEmailPassword(emailToLogin, password);

        logAuditEvent({
          actor: loggedUser.name,
          actorRole: 'customer',
          actorEmail: loggedUser.email,
          actorPhone: loggedUser.phone,
          action: 'LOGIN_EMAIL',
          description: `Inicio de sesión exitoso con correo electrónico.`,
          severity: 'success'
        });

        onLoginSuccess(loggedUser);
        onClose();
      } catch (err: any) {
        console.warn('Login Error:', err);
        // Fallback check against existing local users if Firebase login fails
        const cleanInput = email.trim().toLowerCase();
        const foundLocal = existingUsers.find(
          (u) => (u.email.toLowerCase() === cleanInput || u.phone.trim() === email.trim()) &&
                 (u.password ? u.password === password : true)
        );

        if (foundLocal) {
          onLoginSuccess(foundLocal);
          onClose();
          return;
        }

        const code = err?.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          setErrorMessage('Correo o contraseña incorrectos. Verifica tus datos o regístrate.');
        } else {
          setErrorMessage(err?.message || 'Error al iniciar sesión con Firebase Auth.');
        }
      } finally {
        setIsLoading(false);
      }
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
                {isRegisterMode ? 'Crear Cuenta' : 'Área de Clientes'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRegisterMode
                  ? 'Registro oficial con Firebase Auth (Rol: Cliente)'
                  : 'Ingresa para gestionar tus suscripciones y compras'}
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
          {/* Quick Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continuar con Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">o con tu correo</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <>
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
                      placeholder="Ej. Carlos Silva"
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
                      placeholder="+58 412 000 0000"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

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
                  placeholder="Mínimo 6 caracteres"
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
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Crear Cuenta (Cliente)' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
                  Regístrate como cliente
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
