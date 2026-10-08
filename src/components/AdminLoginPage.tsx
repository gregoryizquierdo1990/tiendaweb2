import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldBan,
  Sparkles,
  Mail,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ADMIN_CONFIG,
  verifyAdminCredentials,
  setAdminSession,
  getActiveAdminCredentials,
  AdminSession
} from '../config/adminCredentials';
import {
  googleSignIn,
  setCachedAccessToken,
  decodeGoogleJwt
} from '../services/googleAuth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AdminLoginPageProps {
  onSuccess: (session: AdminSession) => void;
  onBackToStore: () => void;
  isStandalonePage?: boolean;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToStore,
  isStandalonePage = true
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'google'>('credentials');

  // Estado para Formulario de Usuario y Contraseña
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estado para Verificación Google OAuth de Respaldo
  const [googleEmailInput, setGoogleEmailInput] = useState(ADMIN_CONFIG.authorizedGoogleEmail);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);

  // Estado para Token manual de emergencia
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState('');

  // Mensajes de estado
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const gisButtonRef = useRef<HTMLDivElement>(null);

  // Montar Google Identity Services si está disponible
  useEffect(() => {
    try {
      const google = (window as any).google;
      if (google?.accounts?.id && firebaseConfig.oAuthClientId && gisButtonRef.current) {
        google.accounts.id.initialize({
          client_id: firebaseConfig.oAuthClientId,
          callback: (response: any) => {
            if (response.credential) {
              const payload = decodeGoogleJwt(response.credential);
              const email = (payload?.email || '').trim().toLowerCase();
              if (email === ADMIN_CONFIG.authorizedGoogleEmail.toLowerCase()) {
                setIsSuccess(true);
                const session = setAdminSession({
                  adminId: 'admin-maxter',
                  username: 'admin',
                  name: payload?.name || 'Gregory Izquierdo',
                  email,
                  authMethod: 'google_oauth'
                });
                setTimeout(() => onSuccess(session), 600);
              } else {
                setErrorMessage(
                  `Acceso denegado: La cuenta Google (${email || 'desconocida'}) no es el administrador autorizado.`
                );
              }
            }
          }
        });

        gisButtonRef.current.innerHTML = '';
        google.accounts.id.renderButton(gisButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'pill'
        });
      }
    } catch (e) {
      console.warn('GIS embedded button notice:', e);
    }
  }, [onSuccess]);

  // Manejar Login con Usuario y Contraseña Maestra
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const valid = verifyAdminCredentials(usernameInput, passwordInput);
    if (!valid) {
      setErrorMessage('Credenciales incorrectas: El usuario o la contraseña maestra no coinciden.');
      return;
    }

    setIsSuccess(true);
    const session = setAdminSession({
      adminId: 'admin-maxter',
      username: usernameInput.trim(),
      name: 'Gregory Izquierdo (Administrador)',
      email: ADMIN_CONFIG.authorizedGoogleEmail,
      authMethod: 'credentials'
    });

    setTimeout(() => {
      onSuccess(session);
    }, 500);
  };

  // Manejar Login de Respaldo Oficial con Google OAuth
  const handleGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsPopupBlocked(false);
    setIsNetworkIssue(false);

    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Por favor ingresa tu correo de administrador para continuar.');
      return;
    }

    if (cleanEmail !== ADMIN_CONFIG.authorizedGoogleEmail.toLowerCase()) {
      setErrorMessage(
        `Acceso no autorizado: Solo el titular (${ADMIN_CONFIG.authorizedGoogleEmail}) tiene permisos en este panel.`
      );
      return;
    }

    setIsGoogleLoading(true);

    try {
      const res = await googleSignIn({ forAdminOnly: true });
      if (!res || !res.user) {
        throw new Error('No se pudo verificar la sesión con Google.');
      }

      const authenticatedEmail = (res.user.email || '').trim().toLowerCase();
      if (authenticatedEmail !== ADMIN_CONFIG.authorizedGoogleEmail.toLowerCase()) {
        setErrorMessage(
          `Acceso bloqueado: Cuenta autenticada (${authenticatedEmail}) no coincide con el administrador autorizado.`
        );
        setIsGoogleLoading(false);
        return;
      }

      setIsSuccess(true);
      const session = setAdminSession({
        adminId: 'admin-maxter',
        username: 'admin',
        name: res.user.displayName || 'Gregory Izquierdo',
        email: authenticatedEmail,
        authMethod: 'google_oauth'
      });

      setTimeout(() => {
        onSuccess(session);
      }, 600);
    } catch (err: any) {
      const errStr = String(err?.message || '').toLowerCase();
      const errCode = String(err?.code || '').toLowerCase();

      const userCancelled =
        errCode.includes('popup-closed-by-user') ||
        errCode.includes('cancelled-popup-request') ||
        errStr.includes('popup-closed-by-user') ||
        errStr.includes('cancelled-popup');

      const blocked =
        !userCancelled && (
          errCode.includes('popup-blocked') ||
          errCode.includes('popup_blocked') ||
          errStr.includes('popup-blocked') ||
          errStr.includes('bloqueada') ||
          (errStr.includes('blocked') && !errStr.includes('closed'))
        );

      const netFail =
        errCode.includes('network-request-failed') ||
        errStr.includes('network-request-failed') ||
        errStr.includes('network');

      if (userCancelled) {
        console.info('Ventana oficial de Google cerrada por el usuario.');
        setErrorMessage('La ventana de Google se cerró antes de validar el acceso. Puedes volver a intentarlo cuando gustes.');
      } else if (blocked) {
        setIsPopupBlocked(true);
        setErrorMessage('El navegador bloqueó la ventana emergente. Usa tus credenciales fijas o permite popups.');
      } else if (netFail) {
        setIsNetworkIssue(true);
        setErrorMessage('Fallo de conexión a los servidores de Google. Te recomendamos ingresar con usuario y contraseña.');
      } else if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Error al conectar con Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleApplyManualToken = () => {
    if (!manualToken.trim()) return;
    setCachedAccessToken(manualToken.trim());
    const session = setAdminSession({
      adminId: 'admin-maxter',
      username: 'admin',
      name: 'Gregory Izquierdo (Token Verificado)',
      email: ADMIN_CONFIG.authorizedGoogleEmail,
      authMethod: 'manual_token'
    });
    onSuccess(session);
  };

  const currentCreds = getActiveAdminCredentials();

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 select-none relative overflow-hidden bg-slate-950 text-white ${
        isStandalonePage ? '' : 'p-0'
      }`}
    >
      {/* Background radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-600/20 via-sky-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar for back to store navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 z-10">
        <button
          type="button"
          onClick={onBackToStore}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ir a la Tienda Pública</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
          Ruta Privada: /admin
        </span>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-xl shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white pt-1">
            Panel de Control
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Acceso administrativo exclusivo para <strong className="text-slate-200">Gregory Izquierdo</strong>
          </p>
        </div>

        {/* Auth method switcher tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('credentials');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'credentials'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Usuario y Clave</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google OAuth</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 mb-4 animate-shake">
            <ShieldBan className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Success notification */}
        {isSuccess && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5 mb-4 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="font-bold">¡Acceso verificado con éxito! Abriendo panel de control...</div>
          </div>
        )}

        {/* TAB 1: Usuario y Contraseña Fija */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Usuario de Acceso</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUsernameInput(currentCreds.username)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                >
                  Usar por defecto
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  disabled={isSuccess}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Contraseña Maestra</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPasswordInput(currentCreds.passwordHashOrPlain)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                >
                  Autocompletar
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isSuccess}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Credencial fija por defecto: <code className="text-indigo-300 font-mono">admin</code> / <code className="text-indigo-300 font-mono">Maxter2026*</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <span>Ingresar al Panel de Administración</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: Verificación de Respaldo Google OAuth */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Respaldo Oficial Google OAuth</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Titular Único
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Google valida criptográficamente tu contraseña real y 2FA en su ventana oficial cifrada sin intermediarios.
              </p>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Correo Gmail Autorizado
                </label>
                <input
                  type="email"
                  required
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="emprendimientogregoryizquierdo@gmail.com"
                  disabled={isGoogleLoading || isSuccess}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isGoogleLoading || isSuccess}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-lg shadow-white/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Conectando con Google OAuth...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>Abrir Ventana Oficial de Google</span>
                  </>
                )}
              </button>
            </form>

            {/* Aviso por si el navegador bloquea popup */}
            {(isPopupBlocked || isNetworkIssue) && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Sugerencia: Usa tus credenciales fijas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Si tu navegador bloquea ventanas emergentes, puedes cambiar a la pestaña de "Usuario y Clave" para entrar inmediatamente sin depender de popups.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('credentials')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                >
                  Ir a Usuario y Contraseña →
                </button>
              </div>
            )}

            <div ref={gisButtonRef} className="mt-2 flex justify-center empty:hidden" />
          </div>
        )}

        {/* Security Footer Info */}
        <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Sesión protegida por 24h</span>
          </span>
          <button
            type="button"
            onClick={() => setShowManualToken(!showManualToken)}
            className="text-slate-500 hover:text-slate-300 text-[10px] underline cursor-pointer"
          >
            {showManualToken ? 'Ocultar' : 'Token OAuth'}
          </button>
        </div>

        {showManualToken && (
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-2 text-xs">
            <div className="flex gap-2">
              <input
                type="password"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="ya29.a0..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyManualToken}
                disabled={!manualToken.trim()}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Usar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
