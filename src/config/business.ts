/**
 * Datos de contacto y marca del negocio, centralizados.
 * Se pueden sobreescribir con variables de entorno en Vercel (ver .env.example).
 */
const digits = (v: string) => v.replace(/\D/g, '');

export const BUSINESS = {
  name: 'EMPRENDIMIENTO GREGORY IZQUIERDO',
  siteUrl: 'https://www.gregoryizquierdo.xyz',
  // Número de WhatsApp en formato internacional, solo dígitos (sin +)
  whatsapp: digits((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '584241983648'),
  email:
    (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ||
    'emprendimientogregoryizquierdo@gmail.com'
};

export const whatsappLink = (text?: string): string =>
  `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
