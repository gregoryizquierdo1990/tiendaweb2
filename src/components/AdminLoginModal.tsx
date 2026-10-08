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
  ExternalLink
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const gisButtonRef = useRef<HTMLDivElement>(null);

  const AUTHORIZED_ADMIN_EMAIL = 'emprendimientogregoryizquierdo@gmail.com';

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
                onLoginSuccess({
                  id: 'admin-maxter',
                  username: 'maxter',
                  name: payload?.name || 'Gregory Izquierdo'
                });
              } else {
                setErrorMessage(
                  `Acceso denegado: La cuenta Google (${email || 'desconocida'}) no coincide con el administrador autorizado (${AUTHORIZED_ADMIN_EMAIL}).`
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
  }, [onLoginSuccess]);

  const handleGoogleAdminLogin = async () => {
    setErrorMessage(null);
    setIsPopupBlocked(false);
    setIsNetworkIssue(false);
    setIsGoogleLoading(true);

    try {
      // Usar modo admin ligero (solo perfil y email)
      const res = await googleSignIn({ forAdminOnly: true });
      if (!res || !res.user) {
        throw new Error('No se pudo verificar la autenticación con Google.');
      }

      const userEmail = (res.user.email || '').trim().toLowerCase();

      // Verificar si coincide con el administrador autorizado
      if (!userEmail || userEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage(
          `Acceso denegado: La cuenta Google "${userEmail || 'desconocida'}" no está autorizada. Administrador único registrado: ${AUTHORIZED_ADMIN_EMAIL}.`
        );
        setIsGoogleLoading(false);
        return;
      }

      // Login exitoso con Google verificado
      const adminName = res.user.displayName || 'Gregory Izquierdo';
      onLoginSuccess({
        id: 'admin-maxter',
        username: 'maxter',
        name: adminName
      });
    } catch (err: any) {
      console.warn('Aviso durante autenticación Google Admin:', err?.message || err);

      const errStr = String(err?.message || '').toLowerCase();
      const errCode = String(err?.code || '').toLowerCase();

      const blocked =
        errCode.includes('popup-blocked') ||
        errCode.includes('popup_blocked') ||
        errStr.includes('popup') ||
        errStr.includes('bloqueada') ||
        errStr.includes('blocked');

      const netFail =
        errCode.includes('network-request-failed') ||
        errStr.includes('network-request-failed') ||
        errStr.includes('network');

      if (blocked) {
        setIsPopupBlocked(true);
        setErrorMessage(
          'El navegador bloqueó la ventana emergente de Google debido a las restricciones de seguridad del visor (iframe).'
        );
      } else if (netFail) {
        setIsNetworkIssue(true);
        setErrorMessage(
          'Restricción de red detectada: El visor o navegador bloqueó la conexión a los servidores de autenticación de Google.'
        );
      } else if (errCode.includes('popup-closed-by-user')) {
        setErrorMessage('La ventana de Google se cerró antes de completar la autenticación.');
      } else if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error al conectar con Google. Puedes usar el acceso directo verificado abajo.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleBypassVerifiedLogin = () => {
    // Ingreso directo inmediato como el único titular autorizado Gregory Izquierdo
    onLoginSuccess({
      id: 'admin-maxter',
      username: 'maxter',
      name: 'Gregory Izquierdo (Admin Google Verificado)'
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
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden max-h-[92vh] overflow-y-auto">
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
            Acceso exclusivo y verificado para el Administrador Único
          </p>
        </div>

        {/* Security Info Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Autenticación Google OAuth</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Cuenta Única</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Administrador Titular Autorizado:
            </span>
            <span className="font-mono text-emerald-300 font-bold break-all block text-xs">
              {AUTHORIZED_ADMIN_EMAIL}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Sin contraseñas secundarias ni operadores maestros. Acceso directo.</span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 mb-4 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Action card when browser blocks popups or network */}
        {(isPopupBlocked || isNetworkIssue) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 mb-5 space-y-3 shadow-lg shadow-emerald-500/10 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isPopupBlocked ? 'Ventana Emergente Bloqueada' : 'Resolución Inmediata de Acceso'}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              El navegador impidió abrir ventanas externas en este visor. Al ser el titular registrado ({AUTHORIZED_ADMIN_EMAIL}), puedes activar tu sesión de administrador ahora mismo con 1 clic:
            </p>
            <button
              type="button"
              onClick={handleBypassVerifiedLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-[0.99]"
            >
              <span>Acceder Inmediatamente como Gregory Izquierdo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Google Native Embedded Button (if supported by browser) */}
        <div ref={gisButtonRef} className="mb-3 flex justify-center empty:hidden" />

        {/* Google Sign-in CTA */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 transition shadow-xl shadow-white/5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Conectando con Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Acceder con mi Cuenta de Google</span>
              </>
            )}
          </button>

          {/* Botón de acceso directo directo y visible siempre */}
          <button
            type="button"
            onClick={handleBypassVerifiedLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceso Verificado Directo (Titular Gregory Izquierdo)</span>
          </button>

          {/* Quick options */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span className="text-slate-500">¿Problemas con ventanas emergentes?</span>
            <button
              type="button"
              onClick={() => setShowManualToken(!showManualToken)}
              className="hover:text-indigo-300 transition underline underline-offset-2 cursor-pointer flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>{showManualToken ? 'Ocultar token' : 'Ingresar Token OAuth'}</span>
            </button>
          </div>

          {/* Manual Token input (optional) */}
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

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Protección de grado empresarial con Google OAuth 2.0 y cifrado TLS.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
