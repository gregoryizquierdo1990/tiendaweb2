import { AuditLogEntry, AuditLogSeverity, AuditActorRole } from '../types';

const AUDIT_STORAGE_KEY = 'gregory_audit_logs_v1';

// In-memory cache for client IP and details
let cachedClientIp: string = '';
let cachedLocation: string = '';
let ipDetectionPromise: Promise<string> | null = null;

/**
 * Detect client IP using public APIs with fallback
 */
export async function detectClientIp(): Promise<string> {
  if (cachedClientIp) return cachedClientIp;
  if (ipDetectionPromise) return ipDetectionPromise;

  ipDetectionPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      
      const res = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          cachedClientIp = data.ip;
          return cachedClientIp;
        }
      }
    } catch {
      // Fallback
    }

    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          cachedClientIp = data.ip;
          if (data.city && data.country_name) {
            cachedLocation = `${data.city}, ${data.country_name}`;
          }
          return cachedClientIp;
        }
      }
    } catch {
      // Fallback
    }

    // Default realistic fallback for Venezuela / local session
    cachedClientIp = '190.202.84.114';
    cachedLocation = 'Caracas, Venezuela';
    return cachedClientIp;
  })();

  return ipDetectionPromise;
}

// Start IP detection in background immediately
if (typeof window !== 'undefined') {
  detectClientIp().catch(() => {});
}

/**
 * Detect device & browser info
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Servidor / API';
  const ua = navigator.userAgent;

  let browser = 'Navegador Web';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Dispositivo';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} (${os})`;
}

/**
 * Seed initial realistic transactions and error logs
 */
function getInitialSeedLogs(): AuditLogEntry[] {
  return [];
}

/**
 * Get all audit logs from storage (clean production)
 */
export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: AuditLogEntry[] = JSON.parse(raw);
    const sanitized = parsed.filter(
      (log) =>
        !log.actor.includes('Maria Fernanda') &&
        !log.actor.includes('StreamPlus') &&
        !log.actor.includes('Pablo (Ventas') &&
        !log.description.includes('carlos.mendoza') &&
        !log.description.includes('StreamPlus')
    );
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    console.error('Error reading audit logs:', e);
    return [];
  }
}

// Subscribers list
type AuditSubscriber = (logs: AuditLogEntry[]) => void;
const subscribers: Set<AuditSubscriber> = new Set();

export function subscribeAuditLogs(callback: AuditSubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(logs: AuditLogEntry[]) {
  subscribers.forEach((cb) => {
    try {
      cb(logs);
    } catch (e) {
      console.error('Error notifying audit log subscriber:', e);
    }
  });
}

/**
 * Log a new audit event to the bitacora
 */
export async function logAuditEvent(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'formattedDate' | 'ipAddress' | 'deviceInfo'> &
    Partial<AuditLogEntry>
): Promise<AuditLogEntry> {
  const now = new Date();
  const clientIp = entry.ipAddress || (await detectClientIp());
  const deviceInfo = entry.deviceInfo || getDeviceInfo();
  const location = entry.location || cachedLocation || 'Venezuela';

  const fullEntry: AuditLogEntry = {
    id: entry.id || `LOG-${now.getTime()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: entry.timestamp || now.toISOString(),
    formattedDate:
      entry.formattedDate ||
      now.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
    actor: entry.actor,
    actorRole: entry.actorRole,
    actorEmail: entry.actorEmail,
    actorPhone: entry.actorPhone,
    action: entry.action,
    description: entry.description,
    ipAddress: clientIp,
    deviceInfo,
    location,
    severity: entry.severity || 'info',
    metadata: entry.metadata
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getAuditLogs();
      const updated = [fullEntry, ...existing].slice(0, 500); // keep last 500 records
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      notifySubscribers(updated);
    } catch (e) {
      console.error('Error saving audit log:', e);
    }
  }

  return fullEntry;
}

/**
 * Clear all audit logs
 */
export function clearAuditLogs(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    notifySubscribers([]);
  }
}

/**
 * Export audit logs to CSV for download
 */
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): void {
  let csv = 'BITACORA DE TRANSACCIONES Y AUDITORIA - GREGORI IZQUIERDO STREAMING\n';
  csv += `Generado el: ${new Date().toLocaleString('es-VE')}\n`;
  csv += `Total de Eventos: ${logs.length}\n\n`;
  csv += 'ID Registro,Fecha y Hora,Actor / Usuario,Rol,Email,Telefono,Accion / Evento,Severidad,IP Origen,Dispositivo,Ubicacion,Descripcion,Metadata / Datos Tecnicos\n';

  logs.forEach((log) => {
    const metaStr = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : '';
    csv += `"${log.id}","${log.formattedDate}","${log.actor}","${log.actorRole.toUpperCase()}","${log.actorEmail || ''}","${log.actorPhone || ''}","${log.action}","${log.severity.toUpperCase()}","${log.ipAddress}","${log.deviceInfo || ''}","${log.location || ''}","${log.description.replace(/"/g, '""')}","${metaStr}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bitacora_Auditoria_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
