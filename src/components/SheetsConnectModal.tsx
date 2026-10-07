import React from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { SheetsConnectionState, GoogleUser } from '../types';

interface SheetsConnectModalProps {
  sheetsState: SheetsConnectionState;
  user: GoogleUser | null;
  onClose: () => void;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onCreateNewSheet: () => Promise<void>;
  onSelectExistingSheet: (id: string, name: string) => Promise<void>;
  availableDriveSheets: { id: string; name: string }[];
  isLoadingDriveSheets: boolean;
  onFetchDriveSheets: () => Promise<void>;
  onPerformFullSync?: () => Promise<void>;
  isSyncingFull?: boolean;
  onSearchAndLinkFile?: (fileName: string) => Promise<void>;
}

export const SheetsConnectModal: React.FC<SheetsConnectModalProps> = ({
  sheetsState,
  user,
  onClose,
  onSignInGoogle,
  onSignOutGoogle,
  onCreateNewSheet,
  onSelectExistingSheet,
  availableDriveSheets,
  isLoadingDriveSheets,
  onFetchDriveSheets,
  onPerformFullSync,
  isSyncingFull = false,
  onSearchAndLinkFile
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Base de Datos en Google Sheets & Drive
              </h2>
              <p className="text-xs text-slate-500">
                Almacena pedidos, clientes y conciliaciones en tu propio Google Drive
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

        <div className="p-6 space-y-6">
          {/* User Sign In State */}
          {!user ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Conecta tu Cuenta de Google
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Para guardar y sincronizar los pedidos en tiempo real en tu Google Sheet personal, inicia sesión con Google.
                </p>
              </div>

              {/* Official Google Sign-in button */}
              <button
                type="button"
                onClick={onSignInGoogle}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center justify-center gap-3 transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Acceder con Google</span>
              </button>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (onSearchAndLinkFile) {
                      await onSearchAndLinkFile('streaming_gregory');
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border border-indigo-700"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>🔍 Buscar y Vincular "streaming_gregory" en mi Google Drive</span>
                </button>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="O ingresa ID / URL de la hoja..."
                    id="nonAuthSheetInput"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('nonAuthSheetInput') as HTMLInputElement;
                      if (input && input.value.trim() && onSearchAndLinkFile) {
                        onSearchAndLinkFile(input.value.trim());
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Vincular
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account info pill */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt="Google avatar"
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                  )}
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">{user.displayName || 'Cuenta Google'}</div>
                    <div className="text-slate-500">{user.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSignOutGoogle}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>

              {/* Connected Sheet Status */}
              {sheetsState.isConnected ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Sincronización Activa con Drive</span>
                    </div>
                    {sheetsState.spreadsheetUrl && (
                      <a
                        href={sheetsState.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Ver en Google Sheets</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Nombre del archivo:</div>
                    <div className="font-bold text-slate-900">{sheetsState.spreadsheetName}</div>
                    {sheetsState.lastSyncedAt && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Última actualización: {new Date(sheetsState.lastSyncedAt).toLocaleString('es-CO')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Aún no has vinculado una hoja de cálculo.</span>
                    <p className="mt-0.5 text-amber-800/90">
                      Crea una nueva en un clic o vincula una hoja existente de tu Drive abajo.
                    </p>
                  </div>
                </div>
              )}

              {/* Sincronización Total Manual y Estado de Autoguardado */}
              {sheetsState.isConnected && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      <span>Sincronización Total & Autoguardado</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Cada 5 min Activo
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                    Respalda en un clic todos los pedidos, clientes, facturas, compras y gastos hacia tu Google Drive.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (onPerformFullSync) {
                        await onPerformFullSync();
                      }
                    }}
                    disabled={isSyncingFull}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingFull ? 'animate-spin' : ''}`} />
                    <span>{isSyncingFull ? 'Sincronizando Todo con Drive...' : '🔄 Sincronización Total a Google Drive Ahora'}</span>
                  </button>
                </div>
              )}

              {/* Sheet Actions */}
              <div className="space-y-3 pt-2">
                {/* Botón directo para streaming_gregory */}
                <button
                  type="button"
                  onClick={async () => {
                    if (onSearchAndLinkFile) {
                      await onSearchAndLinkFile('streaming_gregory');
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border border-indigo-700"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>🔍 Buscar y Vincular "streaming_gregory" en mi Google Drive</span>
                </button>

                <button
                  type="button"
                  onClick={onCreateNewSheet}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nueva Hoja "StreamSync - Base de Datos" en mi Drive</span>
                </button>

                <div className="relative py-1 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative px-3 bg-white text-[10px] text-slate-400 uppercase font-semibold">
                    o seleccionar o escribir ID manual
                  </span>
                </div>

                {/* Input manual de ID o Nombre */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Vincular por ID, URL o Nombre de archivo:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. streaming_gregory o ID de Google Sheet..."
                      id="manualSheetInput"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && onSearchAndLinkFile) onSearchAndLinkFile(val);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('manualSheetInput') as HTMLInputElement;
                        if (input && input.value.trim() && onSearchAndLinkFile) {
                          onSearchAndLinkFile(input.value.trim());
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Vincular
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      Seleccionar de mi Google Drive:
                    </span>
                    <button
                      type="button"
                      onClick={onFetchDriveSheets}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      {isLoadingDriveSheets ? 'Buscando...' : 'Escanear Drive'}
                    </button>
                  </div>

                  <select
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => {
                      const sel = availableDriveSheets.find((s) => s.id === e.target.value);
                      if (sel) {
                        onSelectExistingSheet(sel.id, sel.name);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      -- Seleccionar archivo de hoja de cálculo --
                    </option>
                    {availableDriveSheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Guarantee info */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tus datos pertenecen a tu cuenta de Google. Sin servidores intermediarios.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

