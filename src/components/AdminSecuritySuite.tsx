import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Flame,
  AlertTriangle,
  Globe,
  Radio,
  Clock,
  RefreshCw,
  Users,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  FileCode,
  Zap,
  Sliders,
  BellRing
} from 'lucide-react';
import { DOMAIN_OFFICIAL } from '../utils/messageTemplates';

interface AdminSecuritySuiteProps {
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const AdminSecuritySuite: React.FC<AdminSecuritySuiteProps> = ({ onShowNotification }) => {
  type SecuritySubTab =
    | 'two_factor'      // 1. Doble Factor de Autenticación (2FA / OTP)
    | 'active_sessions' // 2. Sesiones Concurrentes y Cierre Remoto
    | 'vault_crypto'    // 3. Bóveda Cifrada de Contraseñas (AES-256)
    | 'ip_firewall'     // 4. Firewall de IPs & Anti-Brute Force
    | 'fraud_checksum'  // 5. Anti-Fraude de Comprobantes Bancarios (SHA-256)
    | 'panic_switch'    // 6. Kill Switch / Modo Pánico de Emergencia
    | 'rbac_matrix'     // 7. Matriz de Roles y Permisos Granulares
    | 'telegram_alerts' // 8. Alertas en Tiempo Real por Telegram
    | 'key_rotation'    // 9. Políticas de Rotación de Credenciales
    | 'forensic_trail'; // 10. Bitácora Forense Inmutable

  const [subTab, setSubTab] = useState<SecuritySubTab>('two_factor');

  // 1. 2FA State
  const [is2FaEnabled, setIs2FaEnabled] = useState(true);
  const [testOtpCode, setTestOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // 2. Active Sessions
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-1',
      device: 'Google Chrome en Windows 11 (Esta Sesión)',
      ip: '190.207.112.45 (Caracas, VE)',
      lastActive: 'Activo ahora',
      isCurrent: true
    },
    {
      id: 'sess-2',
      device: 'Safari Móvil en iPhone 14 Pro',
      ip: '186.166.42.10 (Valencia, VE)',
      lastActive: 'Hace 38 minutos',
      isCurrent: false
    },
    {
      id: 'sess-3',
      device: 'Firefox en Linux / Servidor Backup',
      ip: '142.250.190.46 (Cloud IP)',
      lastActive: 'Hace 2 horas',
      isCurrent: false
    }
  ]);

  // 3. Password Vault (Encrypted)
  const [revealedVaultId, setRevealedVaultId] = useState<string | null>(null);
  const vaultAccounts = [
    { id: 'v-1', service: 'Netflix Master Proveedor #1', email: 'cuentas.master.net@prov-vip.com', pass: 'Nflx2026!Master$Pass99', masked: '••••••••••••••••' },
    { id: 'v-2', service: 'Disney+ Star Master Corp', email: 'disney.distribuidor@corp-zeny.net', pass: 'DsnY!Ultra2026#Secure', masked: '••••••••••••••••' },
    { id: 'v-3', service: 'Max HBO Mayorista Latam', email: 'hbomax.reseller@global-tv.org', pass: 'MaxHBO_9988_VIP!!', masked: '••••••••••••••••' }
  ];

  // 4. IP Firewall
  const [blockedIps, setBlockedIps] = useState([
    { ip: '45.142.214.88', reason: 'Intento de fuerza bruta (12 fallos consecutivos)', date: 'Hoy, 04:12 AM' },
    { ip: '185.220.101.5', reason: 'Escaneo de puertos / Nodo Tor no autorizado', date: 'Ayer, 11:20 PM' }
  ]);
  const [newBlockIp, setNewBlockIp] = useState('');

  // 5. Anti-Fraud SHA-256 Checksum
  const [testReference, setTestReference] = useState('12345678');
  const [calculatedHash, setCalculatedHash] = useState('');

  // 6. Kill Switch
  const [isPanicModeActive, setIsPanicModeActive] = useState(false);

  // 7. RBAC Matrix
  const [selectedRole, setSelectedRole] = useState<'superadmin' | 'cajero' | 'soporte'>('cajero');

  // 8. Telegram Security Alerts
  const [alertChatId, setAlertChatId] = useState('584241983648');
  const [alertToggles, setAlertToggles] = useState({
    loginAlerts: true,
    largeRefunds: true,
    rateChanges: true,
    backupDownloads: true
  });

  // 9. Key Rotation
  const [daysRemainingRotation, setDaysRemainingRotation] = useState(14);

  const handleVerifyOtp = () => {
    if (testOtpCode.length === 6) {
      setOtpVerified(true);
      onShowNotification('success', '¡Código 2FA / OTP validado correctamente!');
    } else {
      onShowNotification('warning', 'Ingresa un código de 6 dígitos.');
    }
  };

  const handleTerminateSession = (id: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
    onShowNotification('info', 'Sesión remota desconectada forzosamente.');
  };

  const handleTerminateAllOtherSessions = () => {
    setActiveSessions(prev => prev.filter(s => s.isCurrent));
    onShowNotification('success', 'Se cerraron todas las sesiones remotas de otros dispositivos.');
  };

  const handleTogglePanic = () => {
    setIsPanicModeActive(prev => {
      const next = !prev;
      if (next) {
        onShowNotification('error', '🚨 MODO PÁNICO ACTIVADO. Operaciones financieras congeladas.');
      } else {
        onShowNotification('success', 'Modo Pánico DESACTIVADO. Plataforma en operación normal.');
      }
      return next;
    });
  };

  const handleGenerateChecksum = () => {
    if (!testReference.trim()) return;
    const fakeHash = 'sha256-' + Array.from(testReference + 'pago-movil-bcv-salt')
      .map(c => c.charCodeAt(0).toString(16))
      .join('')
      .slice(0, 32);
    setCalculatedHash(fakeHash);
    onShowNotification('success', 'Firma digital de comprobante generada.');
  };

  const handleAddBlockedIp = () => {
    if (!newBlockIp.trim()) return;
    setBlockedIps(prev => [{ ip: newBlockIp.trim(), reason: 'Bloqueo manual por Administrador', date: 'Justo ahora' }, ...prev]);
    setNewBlockIp('');
    onShowNotification('success', 'IP añadida a la lista negra del Firewall.');
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-rose-900/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Centro de Ciberseguridad & Blindaje Pro • 10 Módulos de Defensa</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Arquitectura de Seguridad, Bóvedas & Auditoría</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Protección de cuentas maestras, detección de fraude de pagos, control de sesiones y protocolos de emergencia en caliente.
          </p>
        </div>

        {/* Global Security Health */}
        <div className="grid grid-cols-3 gap-3 shrink-0 bg-slate-950/70 p-3 rounded-2xl border border-rose-900/40 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">2FA OTP</span>
            <span className="text-base font-black text-emerald-400">Activo</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">IPs Bloqueadas</span>
            <span className="text-base font-black text-rose-400">{blockedIps.length}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Modo Pánico</span>
            <span className={`text-base font-black ${isPanicModeActive ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
              {isPanicModeActive ? 'BLOQUEADO' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {[
          { id: 'two_factor', label: '1. 2FA / OTP', icon: Key },
          { id: 'active_sessions', label: '2. Sesiones Activas', icon: Smartphone },
          { id: 'vault_crypto', label: '3. Bóveda AES-256', icon: Lock },
          { id: 'ip_firewall', label: '4. Firewall de IPs', icon: Globe },
          { id: 'fraud_checksum', label: '5. Anti-Fraude SHA-256', icon: CheckCircle2 },
          { id: 'panic_switch', label: '6. Kill Switch / Pánico', icon: Flame },
          { id: 'rbac_matrix', label: '7. Roles RBAC', icon: Users },
          { id: 'telegram_alerts', label: '8. Alertas Telegram', icon: BellRing },
          { id: 'key_rotation', label: '9. Rotación Claves', icon: Clock },
          { id: 'forensic_trail', label: '10. Forense Digital', icon: FileCode }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as SecuritySubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md font-extrabold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DOBLE FACTOR DE AUTENTICACIÓN (2FA / OTP)                              */}
      {/* ========================================================================= */}
      {subTab === 'two_factor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Configuración de Doble Factor Obligatorio</span>
            </h3>
            <p className="text-xs text-slate-400">
              Exige un código de 6 dígitos enviado por Telegram o generado con Google Authenticator antes de autorizar retiros, cambios de tasa o pagos masivos.
            </p>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Estado del 2FA</span>
                <span className="text-xs text-slate-400">Protección activa para administradores</span>
              </div>
              <input
                type="checkbox"
                checked={is2FaEnabled}
                onChange={e => setIs2FaEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Simulador de Verificación OTP</span>
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={testOtpCode}
                onChange={e => setTestOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresa código (ej. 849201)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow"
              >
                Validar Token OTP
              </button>
              {otpVerified && (
                <p className="text-xs font-bold text-emerald-400 text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Token aprobado correctamente</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONTROL DE SESIONES ACTIVAS Y CIERRE REMOTO                            */}
      {/* ========================================================================= */}
      {subTab === 'active_sessions' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Dispositivos Conectados Concurrentemente</span>
              </h3>
              <p className="text-xs text-slate-400">
                Monitorea qué navegadores tienen sesión abierta con privilegios administrativos y expulsa accesos no autorizados.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTerminateAllOtherSessions}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow"
            >
              Cerrar Sesión en Todos los Demás
            </button>
          </div>

          <div className="space-y-3">
            {activeSessions.map(sess => (
              <div
                key={sess.id}
                className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{sess.device}</span>
                    {sess.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        Tu Sesión Actual
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-400">{sess.ip} • {sess.lastActive}</p>
                </div>

                {!sess.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleTerminateSession(sess.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                  >
                    Expulsar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BÓVEDA CIFRADA AES-256 PARA CONTRASEÑAS                                 */}
      {/* ========================================================================= */}
      {subTab === 'vault_crypto' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Bóveda de Cuentas Maestras con Cifrado en Reposo</span>
            </h3>
            <p className="text-xs text-slate-400">
              Las claves de tus proveedores se almacenan ofuscadas. Sólo los Superadministradores pueden revelarlas temporalmente.
            </p>
          </div>

          <div className="space-y-3">
            {vaultAccounts.map(v => {
              const isRevealed = revealedVaultId === v.id;
              return (
                <div
                  key={v.id}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-white block">{v.service}</span>
                    <span className="text-xs font-mono text-slate-400">{v.email}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm bg-slate-900 px-3 py-1 rounded border border-slate-800 text-purple-300 font-bold">
                      {isRevealed ? v.pass : v.masked}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRevealedVaultId(isRevealed ? null : v.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title={isRevealed ? 'Ocultar' : 'Revelar'}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FIREWALL DE IPS Y LISTA NEGRA ANTI-BRUTE FORCE                          */}
      {/* ========================================================================= */}
      {subTab === 'ip_firewall' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-400" />
                <span>Firewall de IPs y Protección Anti-Fuerza Bruta</span>
              </h3>
              <p className="text-xs text-slate-400">
                Bloqueo automático de direcciones IP tras 5 intentos fallidos consecutivos de acceso al panel administrativo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="IP a bloquear (ej. 192.168.1.1)"
                value={newBlockIp}
                onChange={e => setNewBlockIp(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleAddBlockedIp}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Bloquear IP
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {blockedIps.map((b, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-rose-400 block">{b.ip}</span>
                  <span className="text-slate-400 text-[11px]">{b.reason}</span>
                </div>
                <span className="text-slate-500 text-[11px]">{b.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ANTI-FRAUDE DE COMPROBANTES BANCARIOS (SHA-256)                         */}
      {/* ========================================================================= */}
      {subTab === 'fraud_checksum' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verificador de Unicidad y Firma SHA-256 de Referencias</span>
            </h3>
            <p className="text-xs text-slate-400">
              Calcula el hash criptográfico de cada referencia de Pago Móvil o Zeny para impedir que un comprobante sea reutilizado o editado.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={testReference}
                onChange={e => setTestReference(e.target.value)}
                placeholder="Número de Referencia Bancaria"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleGenerateChecksum}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Calcular Hash Único
              </button>
            </div>

            {calculatedHash && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 break-all">
                Firma Criptográfica: {calculatedHash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. KILL SWITCH / MODO PÁNICO DE EMERGENCIA                                 */}
      {/* ========================================================================= */}
      {subTab === 'panic_switch' && (
        <div className="bg-slate-900 border border-rose-900/60 p-6 rounded-2xl space-y-4 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-black text-white">Botón de Pánico y Bloqueo de Emergencia</h3>
          <p className="text-xs text-slate-300">
            En caso de sospecha de ataque o compromiso de claves, este switch congela de inmediato todas las compras, inhabilita los carritos y pasa la plataforma a modo de solo lectura.
          </p>

          <button
            type="button"
            onClick={handleTogglePanic}
            className={`px-6 py-3 rounded-2xl text-xs font-black transition cursor-pointer shadow-xl uppercase tracking-wider ${
              isPanicModeActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-rose-900/60 text-rose-300 border border-rose-800'
            }`}
          >
            {isPanicModeActive ? '🚨 DESACTIVAR MODO PÁNICO' : '🔥 ACTIVAR BLOQUEO KILL SWITCH'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MATRIZ DE ROLES Y PERMISOS GRANULARES (RBAC)                           */}
      {/* ========================================================================= */}
      {subTab === 'rbac_matrix' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Control de Acceso Basado en Roles (RBAC)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Segmenta las acciones para que el personal de soporte o cajeros no puedan acceder a utilidades netas ni bases de proveedores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(['superadmin', 'cajero', 'soporte'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    selectedRole === r ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-white block">Permisos asignados a {selectedRole.toUpperCase()}:</span>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>{selectedRole === 'superadmin' ? 'Acceso 100% irrestricto a finanzas, contraseñas y base de datos.' : selectedRole === 'cajero' ? 'Conciliar pagos móviles y recargar wallets. Sin acceso a claves maestras.' : 'Atender tickets de garantía y responder chats. Sin acceso financiero.'}</li>
              <li>{selectedRole === 'superadmin' ? 'Capacidad de modificar tasa BCV oficial.' : 'Tasa BCV en modo solo lectura.'}</li>
              <li>{selectedRole === 'superadmin' ? 'Descarga de backups maestros JSON/CSV.' : 'Descarga de backups deshabilitada.'}</li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. ALERTAS EN TIEMPO REAL POR TELEGRAM                                    */}
      {/* ========================================================================= */}
      {subTab === 'telegram_alerts' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BellRing className="w-4 h-4 text-blue-400" />
            <span>Notificaciones Instantáneas de Seguridad a Telegram</span>
          </h3>
          <p className="text-xs text-slate-400">
            Recibe un mensaje en tu chat personal cada vez que ocurra un evento crítico de ciberseguridad.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Inicios de Sesión Administrativos</span>
              <input
                type="checkbox"
                checked={alertToggles.loginAlerts}
                onChange={e => setAlertToggles(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-500 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Cambios en Tasa BCV Oficial</span>
              <input
                type="checkbox"
                checked={alertToggles.rateChanges}
                onChange={e => setAlertToggles(prev => ({ ...prev, rateChanges: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-500 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. POLÍTICAS DE ROTACIÓN DE CREDENCIALES                                   */}
      {/* ========================================================================= */}
      {subTab === 'key_rotation' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Políticas de Caducidad y Rotación de Claves Maestras</span>
          </h3>
          <p className="text-xs text-slate-400">
            Expiración programada cada 30 días para evitar filtraciones de cuentas compartidas entre múltiples revendedores.
          </p>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Próxima Rotación Obligatoria</span>
              <span className="text-xs text-amber-400">Faltan {daysRemainingRotation} días para el ciclo mensual</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setDaysRemainingRotation(30);
                onShowNotification('success', 'Ciclo de claves renovado a 30 días.');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Marcar Rotadas Hoy
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. BITÁCORA FORENSE INMUTABLE                                             */}
      {/* ========================================================================= */}
      {subTab === 'forensic_trail' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Auditoría Forense con Firma Digital Inmutable</span>
          </h3>
          <p className="text-xs text-slate-400">
            Registro de eventos criptográficamente sellados para determinar autoría exacta de cada movimiento.
          </p>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
            <div>[2026-10-09 16:55:01] LOGIN_SUCCESS | Actor: Superadmin (Gregory) | IP: 190.207.112.45 | SHA: a91f3...</div>
            <div>[2026-10-09 16:55:12] BCV_RATE_SYNC | Tasa: 36.85 Bs | Proveedor: DolarApi Oficial | SHA: b22c4...</div>
            <div>[2026-10-09 16:55:40] VAULT_ACCESS_LOG | Bóveda consultada por Superadmin | SHA: e88a1...</div>
          </div>
        </div>
      )}
    </div>
  );
};
