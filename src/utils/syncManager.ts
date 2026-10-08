import { Order } from '../types';
import { syncEventToCalendar } from '../services/googleCalendar';
import { getAccessToken } from '../services/googleAuth';

/**
 * Sincroniza un pedido aprobado, modificado o renovado hacia Google Calendar en tiempo real.
 */
export const triggerAutomaticSync = async (
  order: Order,
  sheetsSpreadsheetId: string | null
) => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.info('Sincronización a Google Calendar omitida: No se encontró sesión activa de Google.');
      return;
    }

    // 1. Sincronizar membresía si tiene fecha de vencimiento
    if (order.credentials?.expirationDate) {
      const expShort = order.credentials.expirationDate.split('T')[0];
      if (expShort && /^\d{4}-\d{2}-\d{2}$/.test(expShort)) {
        await syncEventToCalendar({
          summary: `Vencimiento: ${order.productName} - ${order.customerName}`,
          description: `Vencimiento de cuenta.\nCliente: ${order.customerName}\nServicio: ${order.productName}\nUsuario: ${order.credentials.accountUser || 'N/A'}\nID Pedido: ${order.id}\nSoporte: 04241983648`,
          start: expShort,
          end: expShort,
        }).catch(err => {
          console.warn('Fallo en sincronización de membresía a Google Calendar:', err.message || err);
        });
      }
    }

    // 2. Sincronizar pago a crédito/cuota si tiene fecha límite de cobro
    if (order.creditDueDate) {
      const dueShort = order.creditDueDate.split('T')[0];
      if (dueShort && /^\d{4}-\d{2}-\d{2}$/.test(dueShort)) {
        await syncEventToCalendar({
          summary: `Cobro Cuota/Crédito: ${order.productName} - ${order.customerName}`,
          description: `Límite de pago de cuota para el servicio de streaming.\nCliente: ${order.customerName}\nTeléfono: ${order.customerPhone}\nMonto: $${order.total.toFixed(2)} USD\nID Pedido: ${order.id}`,
          start: dueShort,
          end: dueShort,
        }).catch(err => {
          console.warn('Fallo en sincronización de cuota a Google Calendar:', err.message || err);
        });
      }
    }
  } catch (error: any) {
    console.error('Error general en triggerAutomaticSync:', error?.message || error);
  }
};
