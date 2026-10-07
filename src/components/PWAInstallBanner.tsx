import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenAppGuide?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // If already installed, don't show
    if (isInstalled) return;

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('streamsync_pwa_dismissed');
    if (!dismissed) {
      // Delay presentation slightly so user can see page first
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('streamsync_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        setShowBanner(false);
      }
    } else {
      // Show general guide
      setShowIOSGuide(true);
    }
  };

  if (isInstalled || !showBanner) {
    return (
      <>
        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  return (
    <>
      {/* Floating Bottom App Installation Banner */}
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-subtle">
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-black text-indigo-300 text-xs">
                GI
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                  Instala la App en tu teléfono
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Rápido
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-1">
                Compras en 1 clic y acceso directo a tus pantallas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

export const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Instalar en tu iPhone o Android</h3>
              <p className="text-[11px] text-slate-500">Acceso instantáneo a la tienda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs">
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              1
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Presiona el botón Compartir</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                En Safari de iOS, toca el icono de compartir <Share className="inline w-3.5 h-3.5 text-indigo-600" /> en la barra inferior del navegador.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              2
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Selecciona "Agregar a inicio"</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Desplaza hacia abajo y selecciona <PlusSquare className="inline w-3.5 h-3.5 text-indigo-600" /> <strong>Agregar a pantalla de inicio</strong> (Add to Home Screen).
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5 text-emerald-800 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Listo! La tienda se abrirá a pantalla completa como una App nativa.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
