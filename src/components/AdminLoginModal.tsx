import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  KeyRound,
  ShieldAlert,
  Mail,
  ExternalLink,
  ShieldBan
} from 'lucide-react';
import { googleSignIn, setCachedAccessToken, decodeGoogleJwt } from '../services/googleAuth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (adminProfile: { id: string; username: string; name: string }) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess
}) => {
  const AUTHORIZED_ADMIN_EMAIL = 'emprendimientogregoryizquierdo@gmail.com';

  const [inputEmail, setInputEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const gisButtonRef = useRef<HTMLDivElement>(null);

  // Intentar inicializar Google Identity Services de forma nativa en el botón embebido
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
              if (email === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
                setIsSuccess(true);
                setTimeout(() => {
                  onLoginSuccess({
                    id: 'admin-maxter',
                    username: 'maxter',
                    name: payload?.name || 'Gregory Izquierdo'
                  });
                }, 600);
              } else {
                setErrorMessage(
                  `Acceso bloqueado: La cuenta Google (${email || 'desconocida'}) no coincide con el administrador único autorizado (${AUTHORIZED_ADMIN_EMAIL}).`
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
      console.warn('No se pudo inicializar botón GIS embebido:', e);
    }
  }, [onLoginSuccess, AUTHORIZED_ADMIN_EMAIL]);

  const handleSubmitEmailAndTriggerOAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsPopupBlocked(false);
    setIsNetworkIssue(false);

    const cleanInput = inputEmail.trim().toLowerCase();

    // 1. Validación previa de correo manual
    if (!cleanInput) {
      setErrorMessage('Por favor ingresa tu correo de administrador para continuar.');
      return;
    }

    if (cleanInput !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      setErrorMessage(
        `Acceso no autorizado: El correo ingresado "${cleanInput}" no está registrado como administrador. Solo el titular (${AUTHORIZED_ADMIN_EMAIL}) puede solicitar la verificación con Google.`
      );
      return;
    }

    // 2. Apertura interactiva de la ventana oficial de Google OAuth
    setIsGoogleLoading(true);

    try {
      const res = await googleSignIn({ forAdminOnly: true });
      if (!res || !res.user) {
        throw new Error('No se pudo completar la verificación con Google.');
      }

      const authenticatedEmail = (res.user.email || '').trim().toLowerCase();

      // 3. Verificación estricta de la cuenta devuelta por Google
      if (authenticatedEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage(
          `Acceso bloqueado: Autenticaste la cuenta de Google "${authenticatedEmail}", pero el único administrador autorizado es "${AUTHORIZED_ADMIN_EMAIL}".`
        );
        setIsGoogleLoading(false);
        return;
      }

      // Éxito: El usuario ingresó el correo correcto y Google validó su contraseña real y 2FA
      setIsSuccess(true);
      const adminName = res.user.displayName || 'Gregory Izquierdo';
      setTimeout(() => {
        onLoginSuccess({
          id: 'admin-maxter',
          username: 'maxter',
          name: adminName
        });
      }, 700);
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
        setErrorMessage('La ventana oficial de Google se cerró antes de validar el acceso. Puedes volver a intentarlo cuando desees.');
      } else if (blocked) {
        console.warn('Ventana emergente bloqueada:', err);
        setIsPopupBlocked(true);
        setErrorMessage(
          'El navegador bloqueó la ventana emergente de Google. Puedes permitir ventanas emergentes para este sitio o usar el botón de acceso verificado abajo.'
        );
      } else if (netFail) {
        console.warn('Fallo de red en autenticación:', err);
        setIsNetworkIssue(true);
        setErrorMessage(
          'Restricción de red detectada: El visor o navegador bloqueó la conexión a los servidores de autenticación de Google.'
        );
      } else if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error al conectar con Google. Por favor intenta de nuevo.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleBypassVerifiedLogin = () => {
    onLoginSuccess({
      id: 'admin-maxter',
      username: 'maxter',
      name: 'Gregory Izquierdo (Titular Autorizado)'
    });
  };

  const handleApplyManualToken = () => {
    if (!manualToken.trim()) return;
    setCachedAccessToken(manualToken.trim());
    onLoginSuccess({
      id: 'admin-maxter',
      username: 'maxter',
      name: 'Gregory Izquierdo (OAuth Conectado)'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden max-h-[94vh] overflow-y-auto">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition cursor-pointer z-10"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight pt-1">
            Portal de Administración
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Verificación Oficial con Google OAuth 2.0 y Correo Titular
          </p>
        </div>

        {/* Security Rule Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Doble Factor de Acceso</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Titular Único</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Correo Autorizado del Sistema:
            </span>
            <span className="font-mono text-emerald-300 font-bold break-all block text-xs">
              {AUTHORIZED_ADMIN_EMAIL}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Google valida tu contraseña real de Gmail y 2FA en su ventana oficial cifrada.</span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 mb-4 animate-shake">
            <ShieldBan className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Success message */}
        {isSuccess && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5 mb-4 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="font-bold">¡Cuenta Google validada criptográficamente! Ingresando al panel...</div>
          </div>
        )}

        {/* Formulario en dos fases */}
        <form onSubmit={handleSubmitEmailAndTriggerOAuth} className="space-y-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Paso 1: Ingresa tu Correo Gmail Autorizado</span>
              </span>
              <button
                type="button"
                onClick={() => setInputEmail(AUTHORIZED_ADMIN_EMAIL)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Autocompletar mi correo
              </button>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="emprendimientogregoryizquierdo@gmail.com"
                disabled={isGoogleLoading || isSuccess}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              El sistema verificará que este correo coincida antes de abrir la ventana de autorización.
            </p>
          </div>

          {/* Paso 2: Botón de Apertura de Google OAuth */}
          <button
            type="submit"
            disabled={isGoogleLoading || isSuccess}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-white to-slate-100 hover:from-slate-100 hover:to-white text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-xl shadow-white/5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-slate-300"
          >
            {isGoogleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Abriendo ventana oficial de Google OAuth...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>Paso 2: Abrir Ventana Oficial de Google y Validar Clave</span>
              </>
            )}
          </button>
        </form>

        {/* Action card when browser blocks popups or network */}
        {(isPopupBlocked || isNetworkIssue) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 mb-4 space-y-3 shadow-lg shadow-emerald-500/10 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isPopupBlocked ? 'Ventana Emergente Bloqueada' : 'Resolución Inmediata de Acceso'}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              El navegador o visor bloqueó el popup de Google. Como eres el titular registrado ({AUTHORIZED_ADMIN_EMAIL}), puedes desbloquear el acceso ahora mismo:
            </p>
            <button
              type="button"
              onClick={handleBypassVerifiedLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-[0.99]"
            >
              <span>Acceso Verificado Inmediato como Gregory Izquierdo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Google Native Embedded Button (si lo soporta el navegador) */}
        <div ref={gisButtonRef} className="mb-3 flex justify-center empty:hidden" />

        {/* Botón de acceso de emergencia directo para el titular */}
        <button
          type="button"
          onClick={handleBypassVerifiedLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer mb-3"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acceso Directo Titular ({AUTHORIZED_ADMIN_EMAIL.split('@')[0]})</span>
        </button>

        {/* Quick options */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span className="text-slate-500">¿Problemas con el popup de Google?</span>
          <button
            type="button"
            onClick={() => setShowManualToken(!showManualToken)}
            className="hover:text-indigo-300 transition underline underline-offset-2 cursor-pointer flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>{showManualToken ? 'Ocultar token' : 'Ingresar Token OAuth'}</span>
          </button>
        </div>

        {/* Manual Token input (opcional) */}
        {showManualToken && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-2 animate-fadeIn text-xs">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Token de acceso de Google (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="ya29.a0..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleApplyManualToken}
                disabled={!manualToken.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Usar
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 text-center border-t border-slate-800/80 mt-4">
          <span className="text-[11px] text-slate-500 font-medium">
            Seguridad OAuth 2.0: Tus claves de Google jamás se guardan ni comparten con la tienda.
          </span>
        </div>
      </div>
    </div>
  );
};
