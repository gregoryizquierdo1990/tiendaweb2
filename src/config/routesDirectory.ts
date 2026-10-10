import { DOMAIN_OFFICIAL } from '../utils/messageTemplates';

export interface RouteItem {
  path: string;
  fullUrl: string;
  name: string;
  purpose: string;
  category: 'publico' | 'administrativo' | 'franquicia' | 'utilidad';
  accessRole: string;
  description: string;
  features: string[];
}

export const ACTIVE_SYSTEM_ROUTES: RouteItem[] = [
  {
    path: '/',
    fullUrl: `${DOMAIN_OFFICIAL}/`,
    name: 'Tienda Principal / Catálogo Oficial',
    purpose: 'Catálogo de streaming, compra de pantallas/cuentas y checkout con pasarela manual.',
    category: 'publico',
    accessRole: 'Público general / Clientes',
    description: 'Página de inicio donde los usuarios exploran perfiles y cuentas completas (Netflix, Disney+, Max, Spotify, etc.), cotizan a tasa oficial BCV y realizan compras con comprobante de pago.',
    features: [
      'Visualización de catálogo y stock en tiempo real',
      'Conversión de precios en USD y Bolívares (Tasa BCV oficial)',
      'Pasarela de pago manual con múltiples opciones (Pago Móvil, Binance, Zeny, etc.)',
      'Rastreador de pedidos por código',
      'Portal de clientes con billetera interna GrPay'
    ]
  },
  {
    path: '/admin',
    fullUrl: `${DOMAIN_OFFICIAL}/admin`,
    name: 'Panel Administrativo & Conciliador Maestro',
    purpose: 'Gestión operativa, conciliación bancaria, finanzas avanzadas, inventario y soporte.',
    category: 'administrativo',
    accessRole: 'Administrador / Propietario',
    description: 'Centro de mando protegido por credenciales maestras y PIN de seguridad. Permite aprobar pagos, gestionar inventario de credenciales de streaming, supervisar finanzas, deudas, comisiones y sincronizar con la nube.',
    features: [
      'Conciliador bancario manual y de referencias móviles',
      'Módulo de Finanzas: Flujo de caja, margen de ganancia, LTV, gastos fijos y metas',
      'Matriz de Proveedores y Cuentas Híbridas',
      'Gestión de Garantías y Reportes de Fallas en tiempo real',
      'Generador de Facturas/Recibos en PDF y contratos de franquicia',
      'Sincronización bidireccional con Google Calendar y Google Sheets'
    ]
  },
  {
    path: '/solicitud-franquicia',
    fullUrl: `${DOMAIN_OFFICIAL}/solicitud-franquicia`,
    name: 'Portal de Postulación para Franquicias',
    purpose: 'Formulario público para nuevos franquiciados, revendedores y aliados comerciales.',
    category: 'franquicia',
    accessRole: 'Público / Aspirantes a Franquicia',
    description: 'Página dedicada donde personas o negocios interesados pueden postularse para operar su propia franquicia de streaming bajo el ecosistema, con billetera prepagada y precios mayoristas.',
    features: [
      'Formulario estructurado de postulación comercial',
      'Información sobre planes de franquicia, costos y márgenes de ganancia',
      'Recepción de solicitudes directamente en el panel administrativo',
      'Generación de acuerdos de suscripción y kit de onboarding'
    ]
  },
  {
    path: '/invoice/:invoiceId',
    fullUrl: `${DOMAIN_OFFICIAL}/invoice/FACT-XXXX`,
    name: 'Visor Oficial de Facturas y Recibos Digitales',
    purpose: 'Consulta, verificación y descarga en PDF de facturas y recibos de compras.',
    category: 'utilidad',
    accessRole: 'Público (mediante enlace con ID de factura)',
    description: 'Página oficial de consulta de comprobantes fiscales y comerciales. Permite a clientes y administradores verificar la validez de un pedido, ver los detalles de pago y descargar el comprobante en formato PDF.',
    features: [
      'Renderizado profesional de recibo/factura con membrete oficial',
      'Desglose en USD y Bolívares a tasa BCV',
      'Descarga e impresión en PDF directo con un clic',
      'Verificación de autenticidad del pedido'
    ]
  },
  {
    path: '/rutas',
    fullUrl: `${DOMAIN_OFFICIAL}/rutas`,
    name: 'Directorio de Rutas Activas del Dominio Oficial',
    purpose: 'Índice navegable de todas las URLs y módulos disponibles en gregoryizquierdo.xyz.',
    category: 'utilidad',
    accessRole: 'Público / Administrativo',
    description: 'Guía y directorio centralizado que documenta cada una de las rutas activas de la plataforma, su propósito, perfil de acceso y enlaces directos con función de copia al portapapeles.',
    features: [
      'Listado completo con nombres de dominio exactos',
      'Botones de copia rápida de URL al portapapeles',
      'Filtros por categoría (Público, Administrativo, Franquicias, Utilidades)',
      'Acceso directo a cada sección con un clic'
    ]
  }
];
