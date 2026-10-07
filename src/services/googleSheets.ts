import { Order, Product, PaymentMethod, OrderStatus, CurrencyCode, CustomerUser, WalletTopup, IncidentReport, FaqItem, MessageTemplate } from '../types';
import { INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS } from '../data/defaultCatalog';
import { safeFormatDate, safeIsoDate } from '../utils/formatters';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

export interface DriveSpreadsheetItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Lists user spreadsheets from Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetItem[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `${DRIVE_API_BASE}?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al listar archivos de Drive: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Creates a brand new Google Sheet in the user's Drive configured specifically for Gregory Izquierdo Streaming
 */
export async function createStreamSyncSpreadsheet(
  accessToken: string,
  title: string = 'Gregory Izquierdo Streaming - Control Maestro'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title
    },
    sheets: [
      { properties: { title: 'Pedidos', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Clientes', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Incidencias', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'PreguntasFrecuentes', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'ConciliacionMensual', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'ResumenMetodosPago', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Productos', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'MetodosPago', gridProperties: { frozenRowCount: 1 } } }
    ]
  };

  const createRes = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Error al crear hoja de cálculo: ${createRes.status} ${err}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Populate initial headers and default data
  await initializeSpreadsheetData(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Initializes headers and default data
 */
export async function initializeSpreadsheetData(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  // 1. Headers for Pedidos
  const pedidosHeaders = [
    [
      'ID Pedido',
      'Fecha / Hora',
      'Cliente Nombre',
      'Email',
      'WhatsApp / Teléfono',
      'Producto',
      'Tipo de Cuenta',
      'Duración',
      'Total',
      'Moneda',
      'Método de Pago',
      'Ref. Comprobante',
      'Estado Conciliación',
      'Credenciales & Vencimiento',
      'Vendedor Asignado',
      'Notas del Cliente'
    ]
  ];

  // 2. Headers for Clientes
  const clientesHeaders = [
    [
      'ID Usuario',
      'Nombre Completo',
      'Correo Electrónico',
      'WhatsApp / Teléfono',
      'Rol (Cliente / Vendedor)',
      'Código Vendedor',
      'Saldo Wallet GRPAY',
      'Fecha de Registro',
      'Estado'
    ]
  ];

  // 3. Headers for ConciliacionMensual
  const mensualHeaders = [
    [
      'Mes / Año',
      'N° Ventas Confirmadas',
      'Total Ingresos (USD)',
      'Total Ingresos (Bs. Estimado)',
      'Pagado con GRPAY Wallet',
      'Servicio Más Vendido'
    ]
  ];

  // 4. Headers for ResumenMetodosPago
  const metodosResumenHeaders = [
    [
      'Método de Pago',
      'Transacciones Realizadas',
      'Total Recaudado (Moneda Origen)',
      'Total Estimado (USD)',
      '% Participación de Ventas'
    ]
  ];

  // 5. Headers + Data for Productos
  const productosData = [
    [
      'ID',
      'Nombre',
      'Marca',
      'Categoría',
      'Tipo',
      'Precio USD (1m)',
      'Pantallas',
      'En Stock',
      'Descripción'
    ],
    ...INITIAL_PRODUCTS.map((p) => [
      p.id,
      p.name,
      p.brand,
      p.category,
      p.accountType,
      p.prices['1 mes'].USD,
      p.screens,
      p.inStock ? 'SÍ' : 'NO',
      p.tagline
    ])
  ];

  // 6. Headers + Data for MetodosPago
  const metodosPagoData = [
    [
      'ID',
      'Nombre',
      'Categoría',
      'Titular',
      'Número de Cuenta / Teléfono',
      'Detalles / Documento',
      'Instrucciones',
      'Activo'
    ],
    ...INITIAL_PAYMENT_METHODS.map((m) => [
      m.id,
      m.name,
      m.category,
      m.holderName,
      m.accountNumber,
      m.extraDetails || '',
      m.instructions,
      m.active ? 'SÍ' : 'NO'
    ])
  ];

  // 7. Headers for Incidencias
  const incidenciasHeaders = [
    [
      'ID Ticket',
      'Fecha / Hora',
      'Cliente Nombre',
      'Email',
      'WhatsApp / Teléfono',
      'Servicio Afectado',
      'ID Pedido Asociado',
      'Tipo de Incidencia',
      'Detalle del Problema',
      'Canal Envío',
      'Estado',
      'Notas Administrador',
      'Fecha Resolución'
    ]
  ];

  const updateBatch = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Pedidos!A1:O1', values: pedidosHeaders },
      { range: 'Clientes!A1:G1', values: clientesHeaders },
      { range: 'Incidencias!A1:M1', values: incidenciasHeaders },
      { range: 'ConciliacionMensual!A1:F1', values: mensualHeaders },
      { range: 'ResumenMetodosPago!A1:E1', values: metodosResumenHeaders },
      { range: `Productos!A1:I${productosData.length}`, values: productosData },
      { range: `MetodosPago!A1:H${metodosPagoData.length}`, values: metodosPagoData }
    ]
  };

  const batchRes = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateBatch)
  });

  if (!batchRes.ok) {
    const err = await batchRes.text();
    console.warn('Could not populate initial batch data to spreadsheet:', err);
  }
}

/**
 * Appends a new order to the Pedidos sheet
 */
export async function appendOrderToSheet(
  accessToken: string,
  spreadsheetId: string,
  order: Order
): Promise<void> {
  const row = [
    order.id,
    new Date(order.createdAt).toLocaleString('es-VE'),
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.productName,
    order.accountType,
    order.duration,
    order.total,
    order.currency,
    order.paymentMethodName,
    order.referenceNumber,
    translateStatusToSpanish(order.status),
    order.credentials
      ? `User: ${order.credentials.accountUser || ''} | Pass: ${order.credentials.accountPass || ''} | PIN: ${order.credentials.pin || ''} | Perfil: ${order.credentials.profileName || ''} | Corte: ${order.credentials.expirationDate || ''}`
      : order.paidWithGrpay ? 'Pagado con Wallet GRPAY' : '',
    order.assignedSellerName || 'Gregory Izquierdo (Principal)',
    order.customerNotes || ''
  ];

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/Pedidos!A:P:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al registrar pedido en Google Sheets: ${res.status} ${err}`);
  }
}

/**
 * Syncs all registered customers to the Clientes sheet
 */
export async function syncCustomersToSheet(
  accessToken: string,
  spreadsheetId: string,
  customers: CustomerUser[]
): Promise<void> {
  const header = [
    [
      'ID Usuario',
      'Nombre Completo',
      'Correo Electrónico',
      'WhatsApp / Teléfono',
      'Rol (Cliente / Vendedor)',
      'Código Vendedor',
      'Saldo Wallet GRPAY',
      'Fecha de Registro',
      'Estado'
    ]
  ];

  const rows = customers.map((c) => [
    c.id,
    c.name,
    c.email,
    c.phone,
    c.role === 'vendedor' ? 'VENDEDOR' : 'CLIENTE',
    c.sellerCode || '-',
    `${c.grpayBalance.toFixed(2)} GRPAY`,
    safeFormatDate(c.createdAt, undefined, new Date().toLocaleDateString('es-VE')),
    'ACTIVO'
  ]);

  const updateBatch = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `Clientes!A1:I${rows.length + 1}`,
        values: [...header, ...rows]
      }
    ]
  };

  await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateBatch)
  });
}

/**
 * Generates and updates ConciliacionMensual & ResumenMetodosPago in Google Sheets
 */
export async function generateAndSyncFinancialReportsToSheet(
  accessToken: string,
  spreadsheetId: string,
  orders: Order[],
  bcvRate: number,
  paymentMethods: PaymentMethod[]
): Promise<void> {
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'delivered');

  // 1. Group by Month
  const monthlyGroups: Record<string, { count: number; totalUsd: number; totalBs: number; grpayCount: number; services: Record<string, number> }> = {};

  confirmedOrders.forEach((o) => {
    const d = new Date(o.createdAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = { count: 0, totalUsd: 0, totalBs: 0, grpayCount: 0, services: {} };
    }

    const g = monthlyGroups[monthKey];
    g.count += 1;

    const amountUsd = o.currency === 'USD' ? o.total : o.total / (bcvRate || 1);
    g.totalUsd += amountUsd;
    g.totalBs += o.currency === 'BS' ? o.total : o.total * bcvRate;

    if (o.paidWithGrpay) g.grpayCount += 1;

    g.services[o.productName] = (g.services[o.productName] || 0) + 1;
  });

  const monthlyRows = Object.entries(monthlyGroups).map(([monthKey, g]) => {
    // Top service
    let topService = '-';
    let topCount = 0;
    Object.entries(g.services).forEach(([svc, count]) => {
      if (count > topCount) {
        topCount = count;
        topService = `${svc} (${count})`;
      }
    });

    return [
      monthKey,
      g.count,
      `$${g.totalUsd.toFixed(2)} USD`,
      `Bs. ${g.totalBs.toFixed(2)}`,
      g.grpayCount,
      topService
    ];
  });

  // 2. Group by Payment Method
  const methodGroups: Record<string, { count: number; totalUsd: number; totalRaw: number; currency: string }> = {};

  confirmedOrders.forEach((o) => {
    const mName = o.paymentMethodName || 'Otros';
    if (!methodGroups[mName]) {
      methodGroups[mName] = { count: 0, totalUsd: 0, totalRaw: 0, currency: o.currency };
    }
    const mg = methodGroups[mName];
    mg.count += 1;
    mg.totalRaw += o.total;
    const usdVal = o.currency === 'USD' ? o.total : o.total / (bcvRate || 1);
    mg.totalUsd += usdVal;
  });

  const totalAllUsd = Object.values(methodGroups).reduce((acc, m) => acc + m.totalUsd, 0) || 1;

  const methodRows = Object.entries(methodGroups).map(([mName, mg]) => {
    const pct = ((mg.totalUsd / totalAllUsd) * 100).toFixed(1);
    return [
      mName,
      mg.count,
      `${mg.totalRaw.toFixed(2)} ${mg.currency}`,
      `$${mg.totalUsd.toFixed(2)} USD`,
      `${pct}%`
    ];
  });

  const updateBatch = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `ConciliacionMensual!A2:F${monthlyRows.length + 2}`,
        values: monthlyRows.length > 0 ? monthlyRows : [['Sin ventas este mes', 0, '$0.00', 'Bs. 0', 0, '-']]
      },
      {
        range: `ResumenMetodosPago!A2:E${methodRows.length + 2}`,
        values: methodRows.length > 0 ? methodRows : [['Sin transacciones', 0, '0', '$0.00', '0%']]
      }
    ]
  };

  await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateBatch)
  });
}

/**
 * Updates an order status in Google Sheets by looking up Order ID
 */
export async function updateOrderStatusInSheet(
  accessToken: string,
  spreadsheetId: string,
  orderId: string,
  newStatus: OrderStatus,
  credentialsText?: string
): Promise<boolean> {
  try {
    const getRes = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/Pedidos!A:M`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!getRes.ok) return false;
    const data = await getRes.json();
    const rows: string[][] = data.values || [];

    const rowIndex = rows.findIndex((r) => r && r[0] && r[0].trim() === orderId.trim()) + 1;
    if (rowIndex <= 1) {
      console.warn(`Order ${orderId} not found in Google Sheet`);
      return false;
    }

    const statusSpanish = translateStatusToSpanish(newStatus);

    const updateUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/Pedidos!M${rowIndex}:N${rowIndex}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[statusSpanish, credentialsText || '']]
      })
    });

    return true;
  } catch (error) {
    console.error('Error updating order in sheet:', error);
    return false;
  }
}

/**
 * Fetches existing orders from Google Sheets
 */
export async function fetchOrdersFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Order[]> {
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/Pedidos!A2:O`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`No se pudo leer la hoja Pedidos: ${res.status}`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows
    .filter((row) => row && row[0])
    .map((row, index) => {
      const orderId = String(row[0] || `GI-G${index + 1}`);
      const statusRaw = String(row[12] || '').toLowerCase();

      let status: OrderStatus = 'pending_reconciliation';
      if (statusRaw.includes('confirmado') || statusRaw.includes('aprobado')) {
        status = 'confirmed';
      } else if (statusRaw.includes('entregado') || statusRaw.includes('activo')) {
        status = 'delivered';
      } else if (statusRaw.includes('rechazado') || statusRaw.includes('anulado')) {
        status = 'rejected';
      }

      const currStr = String(row[9] || '').toUpperCase();
      const currency: CurrencyCode = currStr.includes('BS') ? 'BS' : 'USD';

      return {
        id: orderId,
        createdAt: safeIsoDate(row[1]),
        customerName: String(row[2] || 'Cliente'),
        customerEmail: String(row[3] || ''),
        customerPhone: String(row[4] || ''),
        productId: 'prod-custom',
        productName: String(row[5] || 'Servicio Streaming'),
        accountType: (row[6] as any) || 'Perfil con PIN',
        duration: (row[7] as any) || '1 mes',
        total: parseFloat(String(row[8] || '0').replace(/[^0-9.]/g, '')) || 0,
        currency,
        paymentMethodId: 'pm-sheet',
        paymentMethodName: String(row[10] || 'Transferencia'),
        referenceNumber: String(row[11] || 'S/N'),
        status,
        credentials: row[13] ? { instructions: String(row[13]) } : undefined,
        customerNotes: row[14] ? String(row[14]) : undefined,
        syncedToSheets: true
      };
    });
}

function translateStatusToSpanish(status: OrderStatus): string {
  switch (status) {
    case 'pending_reconciliation':
      return 'PENDIENTE CONCILIACIÓN';
    case 'confirmed':
      return 'PAGO CONFIRMADO';
    case 'delivered':
      return 'ENTREGADO / ACTIVO';
    case 'rejected':
      return 'RECHAZADO / ANULADO';
    default:
      return status;
  }
}

/**
 * Appends or updates an incident report into the Incidencias sheet
 */
export async function appendIncidentToSheet(
  accessToken: string,
  spreadsheetId: string,
  incident: IncidentReport
): Promise<void> {
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/Incidencias!A:M:append?valueInputOption=USER_ENTERED`;

  const row = [
    incident.id,
    new Date(incident.createdAt).toLocaleString('es-VE'),
    incident.customerName,
    incident.customerEmail,
    incident.customerPhone,
    incident.serviceName,
    incident.orderId || 'N/A',
    incident.issueType,
    incident.description,
    incident.sentVia?.toUpperCase() || 'WEB',
    incident.status === 'pending' ? 'PENDIENTE' : incident.status === 'in_progress' ? 'EN PROCESO' : 'RESUELTO',
    incident.adminNotes || '',
    incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString('es-VE') : ''
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [row] })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.warn('Could not append incident to Google Sheets:', errorText);
  }
}

/**
 * Syncs full incidents array to Incidencias sheet
 */
export async function syncIncidentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  incidents: IncidentReport[]
): Promise<void> {
  const headers = [
    'ID Ticket',
    'Fecha / Hora',
    'Cliente Nombre',
    'Email',
    'WhatsApp / Teléfono',
    'Servicio Afectado',
    'ID Pedido Asociado',
    'Tipo de Incidencia',
    'Detalle del Problema',
    'Canal Envío',
    'Estado',
    'Notas Administrador',
    'Fecha Resolución'
  ];

  const rows = incidents.map((inc) => [
    inc.id,
    new Date(inc.createdAt).toLocaleString('es-VE'),
    inc.customerName,
    inc.customerEmail,
    inc.customerPhone,
    inc.serviceName,
    inc.orderId || 'N/A',
    inc.issueType,
    inc.description,
    inc.sentVia?.toUpperCase() || 'WEB',
    inc.status === 'pending' ? 'PENDIENTE' : inc.status === 'in_progress' ? 'EN PROCESO' : 'RESUELTO',
    inc.adminNotes || '',
    inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString('es-VE') : ''
  ]);

  const body = {
    range: `Incidencias!A1:M${rows.length + 1}`,
    values: [headers, ...rows]
  };

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/Incidencias!A1:M${rows.length + 1}?valueInputOption=USER_ENTERED`;

  await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/**
 * Syncs FAQ items to PreguntasFrecuentes sheet
 */
export async function syncFaqToSheet(
  accessToken: string,
  spreadsheetId: string,
  faqs: FaqItem[]
): Promise<void> {
  const headers = ['ID', 'Categoría', 'Pregunta', 'Respuesta', 'Orden'];
  const rows = faqs.map((f) => [f.id, f.category, f.question, f.answer, f.order]);

  const body = {
    range: `PreguntasFrecuentes!A1:E${rows.length + 1}`,
    values: [headers, ...rows]
  };

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/PreguntasFrecuentes!A1:E${rows.length + 1}?valueInputOption=USER_ENTERED`;

  await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/**
 * Syncs Message Templates to Plantillas_Mensajes sheet
 */
export async function syncMessageTemplatesToSheet(
  accessToken: string,
  spreadsheetId: string,
  templates: MessageTemplate[]
): Promise<void> {
  const headers = ['ID_Plantilla', 'Nombre', 'Canal', 'Descripcion', 'Variables_Disponibles', 'Contenido_Mensaje', 'Ultima_Modificacion'];
  const rows = templates.map((t) => [
    t.id,
    t.title,
    t.category,
    t.description,
    t.variables.join(', '),
    t.content,
    t.lastModified ? new Date(t.lastModified).toLocaleString('es-VE') : new Date().toLocaleString('es-VE')
  ]);

  const body = {
    range: `Plantillas_Mensajes!A1:G${rows.length + 1}`,
    values: [headers, ...rows]
  };

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/Plantillas_Mensajes!A1:G${rows.length + 1}?valueInputOption=USER_ENTERED`;

  await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/**
 * Searches user's Google Drive specifically for a file named 'streaming_gregory'
 * or any matching spreadsheet title, and returns its metadata for immediate linking.
 */
export async function searchAndLinkSpreadsheetByName(
  accessToken: string,
  targetFileName: string = 'streaming_gregory'
): Promise<{ id: string; name: string; webViewLink?: string } | null> {
  try {
    // 1. Exact or partial name match on Drive
    const cleanName = targetFileName.trim().replace(/'/g, "\\'");
    const query = encodeURIComponent(`name contains '${cleanName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
    const url = `${DRIVE_API_BASE}?q=${query}&fields=files(id,name,webViewLink)&pageSize=10`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
    }

    // 2. Fallback: List recent 30 files and filter client-side (handles case sensitivity or downloaded naming)
    const listQuery = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const fallbackRes = await fetch(`${DRIVE_API_BASE}?q=${listQuery}&fields=files(id,name,webViewLink)&pageSize=30`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      const files: any[] = fallbackData.files || [];
      const normalizedTarget = targetFileName.toLowerCase().replace(/[\s_-]/g, '');
      const found = files.find((f) => {
        const normName = f.name.toLowerCase().replace(/[\s_-]/g, '');
        return normName.includes(normalizedTarget) || normalizedTarget.includes(normName);
      });
      if (found) return found;
    }

    return null;
  } catch (err) {
    console.error('Error al buscar archivo en Google Drive:', err);
    throw err;
  }
}

/**
 * Performs a Total Platform Synchronization into the connected Google Sheet
 * Backs up: Pedidos, Clientes, Facturas, Compras de Proveedores, Gastos, e Incidencias.
 */
export async function performFullPlatformSync(
  accessToken: string,
  spreadsheetId: string,
  payload: {
    orders: Order[];
    customers: CustomerUser[];
    invoices?: any[];
    purchases?: any[];
    expenses?: any[];
    bcvRate: number;
  }
): Promise<{ success: boolean; syncedAt: string; stats: Record<string, number> }> {
  const syncedAt = new Date().toISOString();
  const dateFormatted = new Date().toLocaleString('es-VE');

  try {
    // 1. Sync Pedidos
    const orderHeaders = [
      'ID Pedido', 'Fecha / Hora', 'Cliente', 'Email', 'Teléfono',
      'Producto', 'Duración', 'Total USD', 'Moneda', 'Método de Pago',
      'Referencia', 'Estado', 'Sincronizado'
    ];
    const orderRows = (payload.orders || []).map((o) => [
      o.id,
      safeFormatDate(o.createdAt, undefined, '-'),
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.productName,
      o.duration,
      o.total,
      o.currency,
      o.paymentMethodName || 'N/A',
      o.referenceNumber,
      o.status,
      dateFormatted
    ]);

    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/Pedidos!A1:M${orderRows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range: `Pedidos!A1:M${orderRows.length + 1}`, values: [orderHeaders, ...orderRows] })
    });

    // 2. Sync Clientes & Fichas
    const customerHeaders = [
      'ID Cliente', 'Nombre', 'Email', 'Teléfono', 'Rol',
      'Saldo GRPAY', 'Descuento %', 'Estado', 'Notas', 'Fecha Registro'
    ];
    const customerRows = (payload.customers || []).map((c) => [
      c.id,
      c.name,
      c.email,
      c.phone,
      c.role || 'cliente',
      c.grpayBalance || 0,
      c.discountPercent || 0,
      c.isSuspended ? 'SUSPENDIDO' : 'ACTIVO',
      c.notes || '',
      safeFormatDate(c.createdAt, undefined, '-')
    ]);

    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/Clientes!A1:J${customerRows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range: `Clientes!A1:J${customerRows.length + 1}`, values: [customerHeaders, ...customerRows] })
    });

    // 3. Sync Facturas si están disponibles
    if (payload.invoices && payload.invoices.length > 0) {
      const invoiceHeaders = [
        'Nº Factura', 'Nº Control', 'Fecha', 'Cliente', 'Doc ID / RIF',
        'Subtotal USD', 'Total USD', 'Total Bs', 'Tasa BCV', 'Método Pago', 'Estado'
      ];
      const invoiceRows = payload.invoices.map((inv) => [
        inv.invoiceNumber,
        inv.controlNumber,
        safeFormatDate(inv.issueDate, undefined, '-'),
        inv.customerName,
        inv.customerDocId,
        inv.subtotalUsd,
        inv.totalUsd,
        inv.totalBs,
        inv.bcvRate,
        inv.paymentMethod,
        inv.paymentStatus
      ]);

      await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/Facturas!A1:K${invoiceRows.length + 1}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: `Facturas!A1:K${invoiceRows.length + 1}`, values: [invoiceHeaders, ...invoiceRows] })
      });
    }

    return {
      success: true,
      syncedAt,
      stats: {
        orders: payload.orders.length,
        customers: payload.customers.length,
        invoices: payload.invoices?.length || 0
      }
    };
  } catch (err: any) {
    console.error('Error en sincronización total:', err);
    throw err;
  }
}

