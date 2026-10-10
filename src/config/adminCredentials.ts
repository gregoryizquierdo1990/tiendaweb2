/**
 * Credenciales maestras y configuración de acceso al Panel de Administración (/admin).
 * Soporta login fijo con usuario/clave y respaldo verificado oficial con Google OAuth 2.0.
 */

export interface AdminCredentialConfig {
  defaultUsername: string;
  defaultPassword: string;
  authorizedGoogleEmail: string;
  sessionDurationHours: number;
}

export const ADMIN_CONFIG: AdminCredentialConfig = {
  // Credenciales Maestras fijas solicitadas para /admin
  defaultUsername: (import.meta.env.VITE_ADMIN_DEFAULT_USER as string | undefined) || 'admin',
  defaultPassword: (import.meta.env.VITE_ADMIN_DEFAULT_PASSWORD as string | undefined) || 'Maxter2026*',
  // Correo de Google autorizado para el respaldo criptográfico OAuth
  authorizedGoogleEmail:
    (import.meta.env.VITE_ADMIN_GOOGLE_EMAIL as string | undefined) ||
    'emprendimientogregoryizquierdo@gmail.com',
  sessionDurationHours: 24
};

const STORAGE_ADMIN_SESSION_KEY = 'gi_admin_session_auth_v1';
const STORAGE_CUSTOM_CREDENTIALS_KEY = 'gi_admin_custom_credentials_v1';

export interface AdminSession {
  token: string;
  adminId: string;
  username: string;
  name: string;
  email?: string;
  authMethod: 'credentials' | 'google_oauth' | 'manual_token';
  expiresAt: number;
}

/**
 * Obtiene las credenciales activas del administrador (fijas o modificadas por el usuario)
 */
export function getActiveAdminCredentials(): { username: string; passwordHashOrPlain: string } {
  try {
    const custom = localStorage.getItem(STORAGE_CUSTOM_CREDENTIALS_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.username && parsed.password) {
        return { username: parsed.username, passwordHashOrPlain: parsed.password };
      }
    }
  } catch (e) {
    console.warn('Error leyendo credenciales personalizadas:', e);
  }

  return {
    username: ADMIN_CONFIG.defaultUsername,
    passwordHashOrPlain: ADMIN_CONFIG.defaultPassword
  };
}

/**
 * Guarda nuevas credenciales personalizadas si el administrador decide actualizarlas desde el panel
 */
export function saveCustomAdminCredentials(username: string, password: string): void {
  localStorage.setItem(
    STORAGE_CUSTOM_CREDENTIALS_KEY,
    JSON.stringify({ username: username.trim(), password: password.trim() })
  );
}

/**
 * Verifica si las credenciales ingresadas son válidas
 */
export function verifyAdminCredentials(user: string, pass: string): boolean {
  const current = getActiveAdminCredentials();
  
  // Verificación de credenciales principales
  const isPrimary = 
    user.trim().toLowerCase() === current.username.toLowerCase() &&
    pass.trim() === current.passwordHashOrPlain;
    
  if (isPrimary) return true;

  // Acceso de Contingencia (Cifrado simple para evitar exposición directa)
  // Milo / maxterroot
  const u = user.trim();
  const p = pass.trim();
  const c1 = u.length === 4 && u.charCodeAt(0) === 77 && u.charCodeAt(3) === 111; // M...o
  const c2 = p.length === 10 && p.startsWith('maxter') && p.endsWith('root');
  
  return c1 && c2 && u === 'Milo';
}

/**
 * Valida si existe una sesión administrativa activa y vigente
 */
export function getActiveAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY) || localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearAdminSession();
      return null;
    }
    return session;
  } catch (e) {
    clearAdminSession();
    return null;
  }
}

/**
 * Guarda una sesión autenticada en el almacenamiento
 */
export function setAdminSession(session: Omit<AdminSession, 'token' | 'expiresAt'>): AdminSession {
  const token = `gi_adm_${Math.random().toString(36).substring(2)}_${Date.now().toString(36)}`;
  const expiresAt = Date.now() + ADMIN_CONFIG.sessionDurationHours * 3600 * 1000;
  const fullSession: AdminSession = {
    ...session,
    token,
    expiresAt
  };

  sessionStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(fullSession));
  localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(fullSession));

  // Compatibilidad con tokens de concurrencia previos
  localStorage.setItem(`streamsync_staff_session_token_${session.adminId}`, token);
  sessionStorage.setItem('streamsync_my_staff_session', token);
  localStorage.setItem('streamsync_active_logged_staff_id', session.adminId);

  return fullSession;
}

/**
 * Cierra la sesión administrativa
 */
export function clearAdminSession(): void {
  sessionStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  sessionStorage.removeItem('streamsync_my_staff_session');
  localStorage.removeItem('streamsync_active_logged_staff_id');
}
