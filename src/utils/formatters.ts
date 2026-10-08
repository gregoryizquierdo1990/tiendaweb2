import { CurrencyCode, Order, PlanDuration } from '../types';

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  if (currency === 'BS') {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  // USD
  return `$${amount.toFixed(2)} USD`;
}

export function formatGrpay(amount?: number | null): string {
  const safe = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${safe.toFixed(2)} Zeny`;
}

export function generateOrderId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `GI-${randomNum}`;
}

export function generateTopupId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `WAL-${randomNum}`;
}

export function safeFormatDate(
  dateValue?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '-'
): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('es-VE', options);
  } catch {
    return fallback;
  }
}

export function safeIsoDate(dateVal?: any): string {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function calculateExpirationDate(arg1: string, arg2?: string): string {
  // Support both (startDate, duration) and (duration, startDate)
  let dateInput = arg1;
  let durationInput = arg2 || '1 mes';

  const isDurationString = (val?: string) =>
    Boolean(val && (/d[ií]as?|mes(es)?|a[ñn]os?|semanas?/i.test(val) || ['10 días', '15 días', '1 mes', '3 meses', '6 meses', '12 meses'].includes(val)));

  if (isDurationString(arg1) && !isDurationString(arg2)) {
    durationInput = arg1;
    dateInput = arg2 || new Date().toISOString();
  } else if (!isDurationString(arg1) && isDurationString(arg2)) {
    dateInput = arg1;
    durationInput = arg2 || '1 mes';
  }

  let start = new Date(dateInput);
  if (isNaN(start.getTime())) {
    start = new Date();
  }

  let daysToAdd = 30;
  const durLower = String(durationInput).toLowerCase();
  if (durLower.includes('10')) daysToAdd = 10;
  else if (durLower.includes('15')) daysToAdd = 15;
  else if (durLower.includes('1 mes') || durLower === '30 días' || durLower === '30 dias') daysToAdd = 30;
  else if (durLower.includes('3 mes')) daysToAdd = 90;
  else if (durLower.includes('6 mes')) daysToAdd = 180;
  else if (durLower.includes('12 mes') || durLower.includes('año') || durLower.includes('ano')) daysToAdd = 365;

  start.setDate(start.getDate() + daysToAdd);
  return isNaN(start.getTime()) ? new Date().toISOString() : start.toISOString();
}

export function calculateDiscountedPrice(
  originalPrice: number,
  productDiscountPercent?: number,
  userDiscountPercent?: number,
  userRole?: string
): { finalPrice: number; discountPercent: number; savings: number } {
  // Base product discount
  let totalPercent = productDiscountPercent || 0;

  // Additional user / reseller discount
  if (userDiscountPercent && userDiscountPercent > 0) {
    totalPercent = Math.max(totalPercent, userDiscountPercent);
  } else if (userRole === 'vendedor') {
    // Default reseller discount if not specifically overridden
    totalPercent = Math.max(totalPercent, 15);
  }

  // Cap at 90%
  totalPercent = Math.min(90, Math.max(0, totalPercent));
  const savings = Number(((originalPrice * totalPercent) / 100).toFixed(2));
  const finalPrice = Number(Math.max(0, originalPrice - savings).toFixed(2));

  return {
    finalPrice,
    discountPercent: totalPercent,
    savings
  };
}

export function getDaysRemaining(expirationDate?: string): {
  days: number;
  isExpired: boolean;
  isNearExpiry: boolean;
  isOneDayBefore: boolean;
} {
  if (!expirationDate) return { days: 0, isExpired: false, isNearExpiry: false, isOneDayBefore: false };
  try {
    const expObj = new Date(expirationDate);
    if (isNaN(expObj.getTime())) {
      return { days: 0, isExpired: false, isNearExpiry: false, isOneDayBefore: false };
    }
    const now = new Date().getTime();
    const exp = expObj.getTime();
    const diffTime = exp - now;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: Math.max(0, days),
      isExpired: days <= 0,
      isNearExpiry: days > 0 && days <= 5,
      isOneDayBefore: days === 1 || (days > 0 && days <= 1.5)
    };
  } catch {
    return { days: 0, isExpired: false, isNearExpiry: false, isOneDayBefore: false };
  }
}

export function buildFormattedCredentialsText(order: Order): string {
  const creds = order.credentials;
  const expFormatted = safeFormatDate(
    creds?.expirationDate,
    { year: 'numeric', month: 'long', day: 'numeric' },
    'Según duración del plan'
  );

  return `🎉 *¡Tu suscripción en Gregori Izquierdo Streaming está lista y activa!*

Hola *${order.customerName}*, tu compra para el pedido *#${order.id}* ha sido confirmada con éxito.

📺 *Servicio:* ${order.productName} (${order.duration})
📌 *Tipo:* ${order.accountType}
📅 *Fecha de Corte / Vencimiento:* ${expFormatted}
🧑‍💼 *Atendido por Asesor:* ${order.assignedSellerName || 'Gregori Izquierdo (Principal)'}

🔑 *Tus Credenciales de Acceso:*
• *Correo / Usuario:* ${creds?.accountUser || order.customerEmail}
• *Clave:* ${creds?.accountPass || 'Acceso directo'}
${creds?.pin ? `• *PIN de Seguridad:* ${creds.pin}` : ''}
${creds?.profileName ? `• *Perfil (Nombre):* ${creds.profileName}` : ''}

📌 *Reglas de Garantía:*
${creds?.instructions || 'Por favor no modificar el nombre del perfil ni la clave para conservar la garantía de duración.'}

🌐 Web: https://gregoryizquierdo.xyz
Recuerda que te avisaremos 1 día antes de tu fecha de corte para que no pierdas tu servicio. ¡Gracias por tu compra!`;
}

export function buildWhatsAppCredentialsUrl(order: Order): string {
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  const message = buildFormattedCredentialsText(order);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildTelegramCredentialsUrl(order: Order): string {
  const message = buildFormattedCredentialsText(order);
  return `https://t.me/share/url?url=${encodeURIComponent('https://gregoryizquierdo.xyz')}&text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppReminderUrl(order: Order): string {
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  const creds = order.credentials;
  const expFormatted = safeFormatDate(
    creds?.expirationDate,
    { year: 'numeric', month: 'long', day: 'numeric' },
    'Mañana'
  );

  const message = `🔔 *Recordatorio de Vencimiento - Gregori Izquierdo Streaming*

Hola *${order.customerName}*, te informamos que tu suscripción a *${order.productName}* (#${order.id}) vencerá el día *${expFormatted}* (mañana).

Si deseas renovar sobre tu mismo perfil y no perder tu configuración ni historial, por favor respóndenos a este mensaje o ingresa en https://gregoryizquierdo.xyz para renovar con tus métodos de pago habituales o tu saldo Zeny.

¡Quedamos atentos para mantener tu servicio activo!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildTelegramReminderUrl(order: Order): string {
  const creds = order.credentials;
  const expFormatted = safeFormatDate(
    creds?.expirationDate,
    { year: 'numeric', month: 'long', day: 'numeric' },
    'Mañana'
  );

  const message = `🔔 Recordatorio: Tu suscripción a ${order.productName} vence mañana ${expFormatted}. Renueva en https://gregoryizquierdo.xyz para mantener tu perfil activo sin interrupciones.`;
  return `https://t.me/share/url?url=${encodeURIComponent('https://gregoryizquierdo.xyz')}&text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppPaymentUrl(order: Order, storePhoneNumber: string = '584141234567'): string {
  const cleanPhone = storePhoneNumber.replace(/[^0-9]/g, '');
  const message = `👋 Hola Gregori, acabo de realizar un pedido en *Gregori Izquierdo Streaming*!

📋 *Detalles del Pedido:*
• *ID Pedido:* #${order.id}
• *Servicio:* ${order.productName} (${order.duration})
• *Tipo:* ${order.accountType}
• *Total:* ${formatCurrency(order.total, order.currency)}
• *Método:* ${order.paymentMethodName}
• *Referencia/Comprobante:* ${order.referenceNumber || 'Adjunto comprobante'}
${order.paidWithGrpay ? '• *Pago con Saldo Zeny Wallet*' : ''}

👤 *Mis Datos:*
• *Nombre:* ${order.customerName}
• *Correo:* ${order.customerEmail}
• *WhatsApp:* ${order.customerPhone}
${order.customerNotes ? `• *Nota:* ${order.customerNotes}` : ''}

Por favor conciliar mi pago y entregar mis credenciales de acceso. ¡Gracias!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppTopupUrl(topup: any, storePhoneNumber: string = '584141234567'): string {
  const cleanPhone = storePhoneNumber.replace(/[^0-9]/g, '');
  const message = `👋 Hola Gregori, solicité una recarga de saldo *Zeny* en mi cuenta de *Gregori Izquierdo Streaming*!

💳 *Detalles de Recarga:*
• *ID Recarga:* #${topup.id}
• *Cliente:* ${topup.customerName} (${topup.customerEmail})
• *Monto Zeny:* ${formatGrpay(topup.amountZeny)}
• *Monto Transferido:* ${formatCurrency(topup.amountPaid, topup.currency)}
• *Método:* ${topup.paymentMethodName}
• *Referencia:* ${topup.referenceNumber}

Por favor validar la entrada y acreditar el saldo en mi wallet Zeny para mis compras. ¡Gracias!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export type IncidentStatusMessageType = 'received' | 'in_progress' | 'resolved';

export function buildFormattedIncidentStatusText(
  incident: {
    id: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    issueType: string;
    adminNotes?: string;
    solution?: string;
  },
  statusType: IncidentStatusMessageType,
  customNoteOrSolution?: string
): string {
  if (statusType === 'received') {
    return (
      `👋 *Hola ${incident.customerName}!*\n` +
      `Te escribe el equipo de *Gregori Izquierdo Streaming*.\n\n` +
      `Confirmamos que hemos *recibido tu reporte técnico #${incident.id}*.\n` +
      `📺 *Servicio:* ${incident.serviceName}\n` +
      `⚠️ *Incidencia:* ${incident.issueType}\n\n` +
      `🔍 Nuestro personal técnico ya está al tanto de tu caso y trabajando en la validación / reposición inmediata.\n` +
      `En breve te contactaremos por este mismo medio con la solución. ¡Gracias por tu paciencia y confianza!`
    );
  }

  if (statusType === 'in_progress') {
    const detail = customNoteOrSolution || incident.adminNotes || 'En gestión con el proveedor / servidor';
    return (
      `⏳ *ACTUALIZACIÓN DE TICKET #${incident.id} - Gregori Izquierdo Streaming*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Hola *${incident.customerName}*, tu reporte para *${incident.serviceName}* se encuentra actualmente *EN ATENCIÓN TÉCNICA*.\n\n` +
      `📋 *Estado Actual:* ${detail}\n\n` +
      `Estamos finalizando los ajustes para entregarte tu acceso restablecido en breve. ¡Te avisamos en cuanto esté al 100%!`
    );
  }

  // Resolved
  const solutionText = customNoteOrSolution || incident.solution || incident.adminNotes || 'Se ha reestablecido el acceso y PIN de tu servicio.';
  return (
    `✅ *¡CASO RESUELTO! - Gregori Izquierdo Streaming*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Hola *${incident.customerName}*, nos complace informarte que tu ticket *#${incident.id}* para el servicio *${incident.serviceName}* ha sido *RESUELTO CON ÉXITO*.\n\n` +
    `🛠️ *Solución Aplicada:*\n` +
    `${solutionText}\n\n` +
    `✨ Ya puedes ingresar a disfrutar de tu cuenta. Por favor verifica el acceso en tu dispositivo.\n` +
    `Cualquier novedad adicional, estamos siempre a tu orden para hacer valer tu garantía.\n` +
    `🌐 https://gregoryizquierdo.xyz`
  );
}

export function buildWhatsAppIncidentStatusUrl(
  incident: {
    id: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    issueType: string;
    adminNotes?: string;
    solution?: string;
  },
  statusType: IncidentStatusMessageType,
  customNoteOrSolution?: string
): string {
  const cleanPhone = incident.customerPhone.replace(/[^0-9]/g, '');
  const msg = buildFormattedIncidentStatusText(incident, statusType, customNoteOrSolution);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

export function buildTelegramIncidentStatusUrl(
  incident: {
    id: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    issueType: string;
    adminNotes?: string;
    solution?: string;
  },
  statusType: IncidentStatusMessageType,
  customNoteOrSolution?: string
): string {
  const msg = buildFormattedIncidentStatusText(incident, statusType, customNoteOrSolution);
  return `https://t.me/share/url?url=${encodeURIComponent('https://gregoryizquierdo.xyz')}&text=${encodeURIComponent(msg)}`;
}

