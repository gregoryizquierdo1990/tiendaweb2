import { MessageTemplate, PlatformActionTrigger, ActionTemplateMapping } from '../types';

export const DOMAIN_OFFICIAL = 'https://gregoryizquierdo.xyz';

export interface ActionDefinition {
  id: PlatformActionTrigger;
  name: string;
  category: 'entrega' | 'cobro' | 'fidelizacion' | 'soporte';
  description: string;
  defaultTemplateId: string;
}

export const PLATFORM_ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    id: 'entrega_regular',
    name: '1. Entrega de Credenciales (Web / Regular)',
    category: 'entrega',
    description: 'Se envía cuando el administrador concilia y aprueba un pedido de la tienda web.',
    defaultTemplateId: 'entrega_pedido_regular'
  },
  {
    id: 'entrega_credito',
    name: '2. Entrega a Crédito (3era Edad & Confianza)',
    category: 'entrega',
    description: 'Se envía al asignar un servicio a crédito con fecha de pago diferida.',
    defaultTemplateId: 'entrega_credito_senior'
  },
  {
    id: 'cobro_credito',
    name: '3. Recordatorio Amable de Cobro (Crédito)',
    category: 'cobro',
    description: 'Se envía al presionar "Cobrar WhatsApp" en la cartera de créditos pendientes o vencidos.',
    defaultTemplateId: 'cobro_credito_cordial'
  },
  {
    id: 'aviso_vencimiento',
    name: '4. Aviso de Vencimiento / Renovación',
    category: 'cobro',
    description: 'Se envía desde el Calendario de Vencimientos o recordatorios previos al corte.',
    defaultTemplateId: 'aviso_vencimiento_24h'
  },
  {
    id: 'bienvenida_cliente',
    name: '5. Bienvenida a Nuevos Clientes',
    category: 'fidelizacion',
    description: 'Se envía al registrar un cliente por primera vez (manual o desde la web).',
    defaultTemplateId: 'bienvenida_cliente_oficial'
  },
  {
    id: 'recarga_wallet',
    name: '6. Notificación de Saldo GRPAY Acreditado',
    category: 'fidelizacion',
    description: 'Se envía al aprobar una recarga de saldo o regalo en la Wallet GRPAY.',
    defaultTemplateId: 'recarga_wallet_exitosa'
  },
  {
    id: 'soporte_falla',
    name: '7. Respuesta a Incidencias & Garantía',
    category: 'soporte',
    description: 'Mensaje automático o de soporte cuando un cliente reporta una caída o falla técnica.',
    defaultTemplateId: 'bot_falla_soporte'
  }
];

export const DEFAULT_ACTION_MAPPING: ActionTemplateMapping = {
  entrega_regular: 'entrega_pedido_regular',
  entrega_credito: 'entrega_credito_senior',
  cobro_credito: 'cobro_credito_cordial',
  aviso_vencimiento: 'aviso_vencimiento_24h',
  bienvenida_cliente: 'bienvenida_cliente_oficial',
  recarga_wallet: 'recarga_wallet_exitosa',
  soporte_falla: 'bot_falla_soporte',
  personalizado: ''
};

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'entrega_credito_senior',
    title: 'Entrega a Crédito (3era Edad & Confianza)',
    category: 'whatsapp',
    description: 'Mensaje de entrega con letra clara, respetuoso y con las credenciales y plazo de pago pactado.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{tipo_cuenta}',
      '{duracion}',
      '{usuario}',
      '{clave}',
      '{perfil}',
      '{pin}',
      '{monto_usd}',
      '{monto_bs}',
      '{fecha_limite}',
      '{tasa_bcv}',
      '{dominio}'
    ],
    content: `*GREGORI IZQUIERDO STREAMING*
Estimado(a) *{cliente}*,

Le hemos activado su suscripción en condición de *Crédito / Confianza*:

📺 *Servicio:* {servicio} ({tipo_cuenta})
⏳ *Duración:* {duracion}

🔑 *SUS DATOS DE ACCESO:*
👤 *Usuario:* {usuario}
🔒 *Clave:* {clave}
🏷️ *Perfil:* {perfil}
🔢 *PIN:* {pin}

💵 *Monto Acordado a Cancelar:* \${monto_usd} USD (o Bs. {monto_bs} a Tasa Oficial BCV: {tasa_bcv} Bs/USD)
🗓️ *Fecha límite de pago pactada:* {fecha_limite}

🌐 *Plataforma:* {dominio}

Muchas gracias por su preferencia y confianza. Cualquier duda, estamos a su completa orden.`
  },
  {
    id: 'cobro_credito_cordial',
    title: 'Recordatorio Amable de Cobro (Crédito)',
    category: 'whatsapp',
    description: 'Recordatorio cordial para clientes con pago pendiente, indicando monto en $ y Bs al BCV y datos bancarios.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{monto_usd}',
      '{monto_bs}',
      '{fecha_limite}',
      '{tasa_bcv}',
      '{banco}',
      '{pago_movil}',
      '{cedula}',
      '{dominio}'
    ],
    content: `*GREGORI IZQUIERDO STREAMING*
Hola *{cliente}*, esperamos que se encuentre muy bien y disfrutando su servicio de *{servicio}*.

Le escribimos cordialmente para recordarle el saldo pendiente en condición de crédito:
💵 *Monto:* \${monto_usd} USD (Bs. {monto_bs} a Tasa Oficial BCV {tasa_bcv} Bs/USD)
🗓️ *Fecha acordada:* {fecha_limite}

💳 *Datos para Pago Móvil / Transferencia:*
• Banco: {banco}
• Teléfono: {pago_movil}
• C.I.: {cedula}

Cuando le sea posible, por favor nos envía el comprobante por este medio o por nuestra web {dominio}. ¡Muchas gracias por su confianza!`
  },
  {
    id: 'entrega_pedido_regular',
    title: 'Entrega de Credenciales (Web / Regular)',
    category: 'whatsapp',
    description: 'Mensaje estándar de entrega de cuenta tras confirmación de pago en la plataforma.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{tipo_cuenta}',
      '{duracion}',
      '{usuario}',
      '{clave}',
      '{perfil}',
      '{pin}',
      '{fecha_vencimiento}',
      '{dominio}'
    ],
    content: `🎉 *¡Tu suscripción está lista! - Gregori Izquierdo Streaming*

Hola *{cliente}*, tu orden ha sido procesada con éxito:
📺 *Servicio:* {servicio} ({tipo_cuenta})
⏳ *Duración:* {duracion}
📅 *Vigencia hasta:* {fecha_vencimiento}

🔑 *TUS DATOS DE ACCESO:*
• *Usuario:* {usuario}
• *Clave:* {clave}
• *Perfil:* {perfil}
• *PIN:* {pin}

⚠️ *Normas:* No modificar correo, clave ni pantallas ajenas para conservar tu garantía.
🌐 Visítanos siempre en: {dominio}`
  },
  {
    id: 'aviso_vencimiento_24h',
    title: 'Aviso de Vencimiento (1 Día Antes)',
    category: 'whatsapp',
    description: 'Notificación anticipada para renovación de pantallas.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{fecha_vencimiento}',
      '{monto_renovacion_usd}',
      '{monto_renovacion_bs}',
      '{dominio}'
    ],
    content: `⏰ *Recordatorio de Renovación - Gregori Izquierdo Streaming*

Hola *{cliente}*, te recordamos que tu suscripción de *{servicio}* vence el día *{fecha_vencimiento}*.

💵 *Renovación:* \${monto_renovacion_usd} USD (Bs. {monto_renovacion_bs} a Tasa Oficial BCV)

Para renovar al instante sin perder tu perfil ni historial, ingresa a {dominio} o responde a este mensaje para activar tu Pago Móvil.`
  },
  {
    id: 'bienvenida_cliente_oficial',
    title: 'Bienvenida a Gregori Izquierdo Streaming',
    category: 'whatsapp',
    description: 'Mensaje de agradecimiento y bienvenida al registrar a un cliente en la plataforma.',
    variables: [
      '{cliente}',
      '{dominio}'
    ],
    content: `👋 *¡Bienvenido(a) a Gregori Izquierdo Streaming!*

Estimado(a) *{cliente}*, nos complace tenerte con nosotros.

En nuestra plataforma podrás disfrutar de las mejores cuentas y perfiles de streaming (Netflix, Disney+, Max, Prime, IPTV y más) con garantía 100% y atención personalizada.

🌐 *Portal Oficial:* {dominio}
🤖 Dispones también de nuestro bot interactivo 24/7 en la web para consultas y solicitudes de soporte.

¡Gracias por tu preferencia!`
  },
  {
    id: 'recarga_wallet_exitosa',
    title: 'Recarga de Saldo GRPAY Exitosa',
    category: 'whatsapp',
    description: 'Notificación cuando se aprueba una recarga de saldo en la billetera virtual del cliente.',
    variables: [
      '{cliente}',
      '{monto_usd}',
      '{saldo_actual}',
      '{dominio}'
    ],
    content: `💳 *¡Recarga Aprobada en Gregori Izquierdo Streaming!*

Hola *{cliente}*, tu recarga de saldo GRPAY ha sido acreditada con éxito:
💰 *Monto Recargado:* \${monto_usd} USD
⭐ *Nuevo Saldo Disponible:* \${saldo_actual} GRPAY

Puedes usar tu saldo directamente en {dominio} para renovar o comprar pantallas sin esperar confirmación bancaria.`
  },
  {
    id: 'confirmacion_pago_cuota_portal',
    title: 'Confirmación de Pago de Cuota (Desde Portal)',
    category: 'whatsapp',
    description: 'Notificación enviada al cliente cuando registra el abono de una cuota a través de su portal.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{cuota_numero}',
      '{monto_usd}',
      '{monto_bs}',
      '{fecha_limite}',
      '{dominio}'
    ],
    content: `✨ *¡Abono de Cuota Recibido! - Gregori Izquierdo Streaming*

Hola *{cliente}*, hemos registrado exitosamente tu abono para el servicio *{servicio}*:

📌 *Cuota Procesada:* Cuota N° {cuota_numero}
💵 *Monto Abonado:* \${monto_usd} USD (Bs. {monto_bs})
🗓️ *Próxima Fecha Límite:* {fecha_limite}

Puedes consultar tu estado de cuotas actualizado en tu portal: {dominio}. ¡Gracias por mantener tu servicio al día!`
  },
  {
    id: 'conciliacion_manual_cuota_admin',
    title: 'Conciliación Manual de Cuota (Administrador)',
    category: 'whatsapp',
    description: 'Notificación cuando el administrador registra manualmente el pago de una cuota.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{cuota_numero}',
      '{monto_usd}',
      '{monto_bs}',
      '{metodo_pago}',
      '{referencia}',
      '{fecha_limite}',
      '{dominio}'
    ],
    content: `✅ *¡Cuota Conciliada con Éxito! - Gregori Izquierdo Streaming*

Hola *{cliente}*, tu pago de cuota ha sido verificado y conciliado por nuestro equipo:

📺 *Servicio:* {servicio}
📌 *Cuota:* N° {cuota_numero}
💵 *Monto:* \${monto_usd} USD (Bs. {monto_bs})
💳 *Método:* {metodo_pago} (Ref: {referencia})
🗓️ *Siguiente Vencimiento:* {fecha_limite}

Tu servicio se mantiene activo y con garantía en {dominio}. ¡Muchas gracias!`
  },
  {
    id: 'comprobante_reverso_devolucion',
    title: 'Comprobante Digital de Reverso / Devolución',
    category: 'whatsapp',
    description: 'Comprobante digital enviado al cliente cuando se procesa un reembolso o devolución.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{monto_usd}',
      '{motivo}',
      '{metodo_reembolso}',
      '{dominio}'
    ],
    content: `💸 *COMPROBANTE DE REVERSO Y DEVOLUCIÓN - Gregori Izquierdo Streaming*
━━━━━━━━━━━━━━━━━━━━
Hola *{cliente}*, confirmamos que se ha procesado el reverso/devolución de tu servicio:

📺 *Servicio:* {servicio}
💵 *Monto Reembolsado:* \${monto_usd} USD
📋 *Motivo:* {motivo}
💳 *Método de Reembolso:* {metodo_reembolso}

Agradecemos tu preferencia y estamos a tu completa disposición en {dominio}.`
  },
  {
    id: 'bot_falla_soporte',
    title: 'Respuesta del Bot ante Falla / Soporte',
    category: 'bot',
    description: 'Respuesta automática del bot cuando el cliente reporta una caída o problema técnico.',
    variables: [
      '{cliente}',
      '{servicio}',
      '{tiempo_atencion}',
      '{dominio}'
    ],
    content: `Lamentamos el inconveniente. Tu cuenta cuenta con Garantía Total. Hemos recibido tu reporte y nuestro soporte técnico lo revisará en menos de {tiempo_atencion}. Puedes hacer seguimiento en {dominio}.`
  },
  {
    id: 'confirmacion_abono_master_a_franquicia',
    title: 'Confirmación de Abono (Master Admin a Franquicia)',
    category: 'whatsapp',
    description: 'Enviado por Gregori al Franquiciado al verificar y acreditar un abono en su cuenta central.',
    variables: [
      '{franquicia}',
      '{titular_franquicia}',
      '{monto_usd}',
      '{monto_bs}',
      '{banco}',
      '{referencia}',
      '{saldo_total_disponible}',
      '{billetera_nombre}',
      '{cliente_destino}',
      '{dominio}'
    ],
    content: `*GREGORI IZQUIERDO STREAMING — ACREDITACIÓN MASTER*
Hola *{titular_franquicia}* (*{franquicia}*),

Tu reporte de abono ha sido verificado y acreditado exitosamente en tu pool de franquicia:
💵 *Monto Acreditado:* \${monto_usd} USD (Bs. {monto_bs})
🏦 *Método / Banco:* {banco}
🔢 *Nro. de Referencia:* {referencia}
👤 *Destinado a:* {cliente_destino}

💼 *Billetera:* {billetera_nombre}
💰 *Nuevo Saldo Total Disponible:* \${saldo_total_disponible} USD

Ya puedes asignar o utilizar este saldo con tu cliente final en tu plataforma:
🌐 {dominio}

¡Gracias por tu compromiso y crecimiento!`
  },
  {
    id: 'confirmacion_abono_franquicia_a_cliente',
    title: 'Confirmación de Abono (Franquicia a Cliente Final)',
    category: 'whatsapp',
    description: 'Enviado por el Franquiciado a su cliente final confirmando la recarga en su billetera personalizada.',
    variables: [
      '{cliente}',
      '{franquicia}',
      '{billetera_nombre}',
      '{monto_usd}',
      '{monto_bs}',
      '{saldo_actual}',
      '{referencia}',
      '{dominio}'
    ],
    content: `*RECARGA EXITOSA EN {billetera_nombre}*
Hola *{cliente}*, te confirmamos que tu abono ha sido validado y acreditado con éxito.

💵 *Monto Recargado:* \${monto_usd} USD (Bs. {monto_bs})
🔢 *Referencia:* {referencia}
💼 *Billetera:* {billetera_nombre}
💰 *Tu Saldo Disponible:* \${saldo_actual} USD

Ya puedes usar tu saldo para activar o renovar cualquiera de nuestros servicios de streaming en:
🌐 {dominio}

¡Gracias por confiar en *{franquicia}*!`
  }
];

export const getActiveTemplate = (
  action: PlatformActionTrigger,
  templates: MessageTemplate[],
  mapping?: ActionTemplateMapping
): MessageTemplate => {
  const currentMapping = mapping || DEFAULT_ACTION_MAPPING;
  const targetId = currentMapping[action];
  if (targetId) {
    const found = templates.find((t) => t.id === targetId);
    if (found) return found;
  }
  const defaultTargetId = DEFAULT_ACTION_MAPPING[action];
  return (
    templates.find((t) => t.id === defaultTargetId) ||
    DEFAULT_MESSAGE_TEMPLATES.find((t) => t.id === defaultTargetId) ||
    templates[0] ||
    DEFAULT_MESSAGE_TEMPLATES[0]
  );
};

export const renderTemplate = (
  templateContent: string,
  variables: Record<string, string | number | undefined>
): string => {
  let result = templateContent;
  for (const [key, val] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const replacement = val !== undefined && val !== null ? String(val) : '';
    result = result.split(placeholder).join(replacement);
  }
  // Guarantee domain default
  if (!variables.dominio) {
    result = result.split('{dominio}').join(DOMAIN_OFFICIAL);
  }
  return result;
};

export const generateTelegramUrl = (text: string, usernameOrPhone?: string): string => {
  if (usernameOrPhone && usernameOrPhone.trim().startsWith('@')) {
    const cleanUser = usernameOrPhone.trim().replace('@', '');
    return `https://t.me/${cleanUser}?text=${encodeURIComponent(text)}`;
  }
  return `https://t.me/share/url?url=${encodeURIComponent(DOMAIN_OFFICIAL)}&text=${encodeURIComponent(text)}`;
};
