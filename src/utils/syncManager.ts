import { Order } from '../types';
import { syncEventToCalendar } from '../services/googleCalendar';
import { getAccessToken } from '../services/googleAuth';

export const triggerAutomaticSync = async (
  order: Order,
  sheetsSpreadsheetId: string | null
) => {
  try {
    // 1. Sync to Google Calendar if order has credentials/expiration
    if (order.credentials?.expirationDate) {
      const accessToken = await getAccessToken();
      if (accessToken) {
        await syncEventToCalendar({
          summary: `Vencimiento: ${order.productName} - ${order.customerName}`,
          description: `Vencimiento de cuenta. Usuario: ${order.credentials.accountUser || 'N/A'}. ID Pedido: ${order.id}`,
          start: order.credentials.expirationDate,
          end: order.credentials.expirationDate,
        });
      }
    }

    // 2. Sync to Sheets (as before)
    // Note: appendOrderToSheet needs to be called here or handled elsewhere
  } catch (error) {
    console.error('Error in automatic sync:', error);
  }
};
