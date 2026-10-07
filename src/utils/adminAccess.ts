/**
 * Control de acceso del panel de administración.
 *
 * Los correos autorizados se definen en la variable de entorno VITE_ADMIN_EMAILS
 * (separados por coma). Ejemplo: VITE_ADMIN_EMAILS=tucorreo@gmail.com,otro@gmail.com
 *
 * La identidad la verifica Firebase Authentication (inicio de sesión con Google).
 */
const raw = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || '';

export const ADMIN_EMAILS: string[] = raw
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};
