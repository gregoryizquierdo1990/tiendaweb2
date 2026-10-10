import React, { useState, useEffect, useMemo } from 'react';
import {
  AuditLogEntry,
  AuditLogSeverity,
  AuditActorRole
} from '../types';
import {
  subscribeAuditLogs,
  logAuditEvent,
  clearAuditLogs,
  exportAuditLogsToCsv,
  detectClientIp,
  getDeviceInfo
} from '../services/auditLogger';
import { useAppStore } from '../store/useAppStore';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Globe,
  Smartphone,
  Laptop,
  Clock,
  User,
  Building,
  Key,
  Database,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface AdminAuditLogManagerProps {
  onClose?: () => void;
}

export const AdminAuditLogManager: React.FC<AdminAuditLogManagerProps> = () => {
  const auditLogs = useAppStore((state) => state.auditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [currentIp, setCurrentIp] = useState<string>('Detectando...');
  const [currentDevice, setCurrentDevice] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Detect local environment info on mount
  useEffect(() => {
    detectClientIp().then((ip) => setCurrentIp(ip));
    setCurrentDevice(getDeviceInfo());
  }, []);

  const showToast = (type: 'success' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.actorPhone && log.actorPhone.includes(searchTerm)) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;
      const matchesRole = selectedRole === 'ALL' || log.actorRole === selectedRole;

      return matchesSearch && matchesSeverity && matchesRole;
    });
  }, [auditLogs, searchTerm, selectedSeverity, selectedRole]);

  // Metric counts
  const totalLogs = auditLogs.length;
  const errorLogsCount = auditLogs.filter((l) => l.severity === 'error').length;
  const warningLogsCount = auditLogs.filter((l) => l.severity === 'warning').length;
  const successLogsCount = auditLogs.filter((l) => l.severity === 'success').length;
  const uniqueIpsCount = new Set(auditLogs.map((l) => l.ipAddress)).size;

  // Simulate a new test event with current IP
  const handleSimulateTestLog = async (role: AuditActorRole, severity: AuditLogSeverity) => {
    setIsSimulating(true);
    const ip = await detectClientIp();
    const dev = getDeviceInfo();

    let actor = 'Gregori Izquierdo';
    let action = 'PRUEBA_SISTEMA';
    let description = 'Prueba de registro y captura de IP desde el Panel de Administración.';

    if (role === 'customer') {
      actor = 'Cliente Prueba (Web)';
      action = 'CONSULTA_CATALOGO';
      description = 'El cliente navegó por los combos de streaming y consultó la tasa BCV.';
    } else if (role === 'seller') {
      actor = 'Vendedor Equipo';
      action = 'VALIDACION_ORDEN';
      description = 'Verificó referencia bancaria #REF-8891 de orden activa.';
    } else if (role === 'franchise') {
      actor = 'Franquiciado Aliado';
      action = 'ACCESO_CALENDARIO';
      description = 'Consultó el calendario de vencimientos de sus pantallas asociadas.';
    } else if (severity === 'error') {
      actor = 'Cliente Desconocido';
      action = 'FALLA_VERIFICACION';
      description = 'Error 403: Intento de acceso a zona restringida sin autorización válida.';
    }

    await logAuditEvent({
      actor,
      actorRole: role,
      action,
      description,
      severity,
      ipAddress: ip,
      deviceInfo: dev,
      metadata: {
        simulatedAt: new Date().toISOString(),
        testSessionId: `TEST-${Math.floor(1000 + Math.random() * 9000)}`
      }
    });

    setIsSimulating(false);
    showToast('success', `¡Evento registrado con tu IP (${ip}) correctamente!`);
  };

  const handleClearLogs = () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar toda la bitácora de auditoría? Esta acción no se puede deshacer.')) {
      clearAuditLogs();
      showToast('info', 'Bitácora vaciada.');
    }
  };

  const getSeverityBadge = (severity: AuditLogSeverity) => {
    switch (severity) {
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>ERROR</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>AVISO</span>
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>ÉXITO</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" />
            <span>INFO</span>
          </span>
        );
    }
  };

  const getRoleBadge = (role: AuditActorRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800">
            👑 Admin
          </span>
        );
      case 'seller':
      case 'team':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800">
            👥 Equipo / Vendedor
          </span>
        );
      case 'franchise':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
            🏢 Franquicia
          </span>
        );
      case 'customer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            🛒 Cliente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700">
            ⚙️ Sistema
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-800">
      {/* Toast Alert */}
      {notification && (
        <div className="p-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in">
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Banner with Current Detected IP */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <h3 className="text-xl font-black text-white">
                Bitácora de Transacciones & Auditoría General
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Registro inalterable de cada evento, cambio de estado, compra, entrega de credenciales, abono de saldo y detección de fallas o errores con captura de <strong>Dirección IP</strong>, dispositivo y marca de tiempo.
            </p>
          </div>

          {/* Current IP & Environment Badge */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-700/80 backdrop-blur-md flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium">Tu IP Origen Actual:</span>
              <span className="flex items-center gap-1 font-mono font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {currentIp}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium">Dispositivo:</span>
              <span className="text-slate-200 font-medium text-[11px] truncate max-w-[180px]">
                {currentDevice}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Estado Auditoría:</span>
              <span className="text-indigo-400 font-bold">Activo (Tiempo Real)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-800 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportAuditLogsToCsv(filteredLogs)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Exportar archivo CSV con todos los registros filtrados"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Bitácora (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                showToast('info', 'Registros sincronizados con la nube');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Actualizar</span>
            </button>

            {/* Test action triggers */}
            <div className="relative inline-flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-300 font-bold px-2">Probar Evento:</span>
              <button
                type="button"
                onClick={() => handleSimulateTestLog('admin', 'success')}
                disabled={isSimulating}
                className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[11px] transition cursor-pointer"
              >
                + Admin
              </button>
              <button
                type="button"
                onClick={() => handleSimulateTestLog('customer', 'info')}
                disabled={isSimulating}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer"
              >
                + Cliente
              </button>
              <button
                type="button"
                onClick={() => handleSimulateTestLog('system', 'error')}
                disabled={isSimulating}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition cursor-pointer"
              >
                + Error
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearLogs}
            className="px-3.5 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Vaciar Historial</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Transacciones</span>
            <strong className="text-lg font-black text-slate-900">{totalLogs}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Errores Registrados</span>
            <strong className="text-lg font-black text-rose-600">{errorLogsCount}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Operaciones Exitosas</span>
            <strong className="text-lg font-black text-emerald-600">{successLogsCount}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">IPs Únicas Registradas</span>
            <strong className="text-lg font-black text-amber-600">{uniqueIpsCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, IP, acción, descripción o ID de registro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-slate-400 font-bold shrink-0">Severidad:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'error', label: `🔴 Errores (${errorLogsCount})` },
              { id: 'warning', label: `🟡 Avisos (${warningLogsCount})` },
              { id: 'success', label: `🟢 Éxitos (${successLogsCount})` },
              { id: 'info', label: '🔵 Info' }
            ].map((sev) => (
              <button
                key={sev.id}
                type="button"
                onClick={() => setSelectedSeverity(sev.id)}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                  selectedSeverity === sev.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
          <span className="text-slate-400 font-bold shrink-0">Actor / Rol:</span>
          {[
            { id: 'ALL', label: 'Todos los Roles' },
            { id: 'admin', label: '👑 Administrador' },
            { id: 'seller', label: '👥 Equipo / Vendedor' },
            { id: 'customer', label: '🛒 Clientes' },
            { id: 'franchise', label: '🏢 Franquicias' },
            { id: 'system', label: '⚙️ Sistema' }
          ].map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer whitespace-nowrap ${
                selectedRole === role.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No se encontraron registros en la bitácora</h4>
            <p className="text-xs text-slate-400">
              No hay eventos que coincidan con los filtros aplicados. Puedes pulsar "Probar Evento" para generar uno.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Fecha y Hora</th>
                  <th className="p-3.5">Actor / Usuario</th>
                  <th className="p-3.5">Acción & Severidad</th>
                  <th className="p-3.5">Dirección IP & Dispositivo</th>
                  <th className="p-3.5">Descripción de la Operación</th>
                  <th className="p-3.5 text-center">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-slate-50/80 transition ${log.severity === 'error' ? 'bg-rose-50/20' : ''}`}>
                        {/* Timestamp */}
                        <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.formattedDate}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{log.id}</span>
                        </td>

                        {/* Actor & Role */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div>
                              <strong className="block text-slate-900 font-bold text-xs">{log.actor}</strong>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {getRoleBadge(log.actorRole)}
                                {log.actorPhone && (
                                  <span className="text-[10px] text-slate-400 font-mono">{log.actorPhone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action & Severity */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="space-y-1">
                            {getSeverityBadge(log.severity)}
                            <span className="block font-mono text-[11px] font-bold text-slate-800">
                              {log.action}
                            </span>
                          </div>
                        </td>

                        {/* IP & Device */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-800 font-mono font-bold text-[11px]">
                              <Globe className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{log.ipAddress}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Laptop className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{log.deviceInfo || 'Navegador Web'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="p-3.5 max-w-md">
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {log.description}
                          </p>
                          {log.location && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              📍 {log.location}
                            </span>
                          )}
                        </td>

                        {/* Expand / Details */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            title="Ver detalles técnicos y parámetros"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Technical Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-900 text-white">
                          <td colSpan={6} className="p-4 space-y-3 font-mono text-[11px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="font-bold text-indigo-400">Parámetros Técnicos & Metadata del Evento:</span>
                              <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                            </div>
                            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 overflow-x-auto text-[10px] leading-relaxed">
                              {JSON.stringify(
                                {
                                  id: log.id,
                                  actor: log.actor,
                                  role: log.actorRole,
                                  action: log.action,
                                  ipAddress: log.ipAddress,
                                  deviceInfo: log.deviceInfo,
                                  location: log.location,
                                  severity: log.severity,
                                  description: log.description,
                                  metadata: log.metadata || {}
                                },
                                null,
                                2
                              )}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
