export type ServiceCategory = 'todos' | 'series_peliculas' | 'musica' | 'deportes_tv' | 'gaming_otros' | 'combos' | 'otros';

export type PlanDuration = '10 días' | '15 días' | '1 mes' | '3 meses' | '6 meses' | '12 meses' | string;

export type AccountType = 'Perfil con PIN' | 'Cuenta Completa' | 'Activación a tu Correo' | 'Código de Canje' | 'Perfil privado' | 'Cuenta compartida' | string;

export type OrderStatus = 'pending_reconciliation' | 'confirmed' | 'delivered' | 'rejected';

export type CurrencyCode = 'USD' | 'BS';

export interface ProductPrice {
  USD: number;
  BS?: number; // Calculated or fixed in Bolívares
  COP?: number;
  MXN?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ServiceCategory;
  tagline: string;
  description: string;
  accountType: AccountType;
  prices: Record<string, ProductPrice>;
  defaultDuration: PlanDuration;
  features: string[];
  screens: number;
  popular?: boolean;
  inStock: boolean;
  warrantyMonths: number;
  logo: string;
  color: string;
  accentBg: string;
  discountPercent?: number; // e.g. 15 for 15% OFF
  badgeText?: string; // e.g. 'Oferta Especial'
  allowInstallments?: boolean;
  requireDownPayment?: boolean;
  downPaymentPercent?: number; // e.g. 50
  numberOfInstallments?: number; // e.g. 2
  installmentIntervalDays?: number; // e.g. 15
  stock?: number;
  isStockManual?: boolean;
  manualStock?: number;
  costPriceUsd?: number; // Added for margin calculation
}

export interface AnnouncementBannerConfig {
  enabled: boolean;
  messages: string[];
  animationType: 'marquee' | 'fade' | 'slide';
  speedSeconds: number; // e.g. 5
  backgroundColor: string; // e.g. '#1e1b4b'
  textColor: string; // e.g. '#ffffff'
  badgeText?: string; // e.g. '🔥 OFERTAS 2026'
}

export interface TelegramBotCustomCommand {
  command: string;
  description: string;
  responseTemplate: string;
  category: 'general' | 'cuotas' | 'wallet' | 'soporte' | 'catalogo' | 'usuario';
  enabled: boolean;
}

export interface AppBrandingConfig {
  projectName: string;
  logoUrl?: string;
  rif?: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  contactPhones?: string[];
  contactEmails?: string[];
  telegramBotToken?: string;
  telegramBotUsername?: string;
  telegramBotCommands?: TelegramBotCustomCommand[];
  announcementBanner?: AnnouncementBannerConfig;
  // Visual Editor & Layout Configuration
  heroTitle?: string;
  heroTitleGradient?: string;
  heroSubtitle?: string;
  heroBadgeText?: string;
  heroFontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  heroFontFamily?: string;
  heroAlignment?: 'left' | 'center' | 'right';
  bannerPlacement?: 'top' | 'below_hero';
  bannerThickness?: 'compact' | 'normal' | 'spacious';
  bannerMessage?: string;
  bannerPhone?: string;
  bannerEmail?: string;
  cardRadius?: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  containerMaxWidth?: 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
  // Footer custom configuration
  footerDescription?: string;
  footerGuaranteeText?: string;
  footerPlatforms?: string[];
  footerPaymentMethods?: string[];
  footerWhatsAppUrl?: string;
  // Finance Configuration
  reservePercentage?: number; // e.g. 5 for 5%
  financeSettings?: {
    autoCalculateMargins: boolean;
    enableCashFlowDashboard: boolean;
    alertOverdueDays: number;
  };
}

export type PaymentMethodCategory = 
  | 'eeuu' 
  | 'venezuela' 
  | 'cripto' 
  | 'billetera_digital' 
  | 'internacional' 
  | 'banco';

export interface PaymentMethod {
  id: string;
  name: string;
  shortName: string;
  category: PaymentMethodCategory;
  holderName: string;
  accountNumber: string;
  accountTypeLabel: string;
  extraDetails?: string;
  qrCodeUrl?: string;
  instructions: string;
  active: boolean;
  badge?: string;
  acceptedCurrencies: ('USD' | 'BS' | 'USDT')[];
  // Campos detallados estructurados
  bankName?: string;
  bankCode?: string;
  phone?: string;
  docId?: string;
  email?: string;
  accountType?: string;
  routing?: string;
  bankAddress?: string;
  userId?: string;
  username?: string;
}

export interface Order {
  id: string; // e.g. STR-84920
  createdAt: string;
  customerId?: string; // Connected customer ID
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  duration: PlanDuration;
  accountType: AccountType;
  total: number;
  currency: CurrencyCode;
  paymentMethodId: string;
  paymentMethodName: string;
  referenceNumber: string;
  receiptImage?: string;
  customerNotes?: string;
  status: OrderStatus;
  rejectionReason?: string;
  paidWithGrpay?: boolean;
  assignedSellerId?: string;
  assignedSellerName?: string;
  credentials?: {
    accountUser?: string;
    accountPass?: string;
    profileName?: string;
    pin?: string;
    startDate?: string;
    expirationDate?: string;
    instructions?: string;
  };
  syncedToSheets?: boolean;
  paymentCondition?: 'contado' | 'credito' | 'cuotas';
  creditDueDate?: string;
  creditStatus?: 'pending_payment' | 'paid' | 'overdue';
  creditNotes?: string;
  commissionUsd?: number; // New: for seller commissions
  isHybrid?: boolean; // New: for hybrid account tracking
  installmentPlan?: {
    totalAmountUsd: number;
    downPaymentUsd: number;
    installmentAmountUsd: number;
    numberOfInstallments: number;
    intervalDays: number;
    paidCount: number;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    nextDueDate?: string;
  };
  isSeniorCitizen?: boolean;
  isTrustClient?: boolean;
  refundDetails?: {
    refundDate: string;
    amountUsd: number;
    amountBs?: number;
    reason: string;
    refundMethod: 'grpay_wallet' | 'bank_transfer' | 'cash';
    beneficiaryName?: string;
    beneficiaryDocId?: string;
    targetBank?: string;
    targetAccountOrPhone?: string;
    transactionReference?: string;
    accountReleased?: boolean;
    processedBy?: string;
    notes?: string;
  };
  walletAmountApplied?: number;
  manualAmountPaid?: number;
}

export type UserRole = 'cliente' | 'vendedor' | 'administrador' | 'admin';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  phone: string;
  role?: UserRole; // 'cliente' | 'vendedor'
  sellerCode?: string; // e.g. GI-01, VEND-02
  internalId?: string; // e.g. CLI-2026-1234
  discountPercent?: number; // Custom or role-specific discount (e.g. 15 for 15% OFF)
  isSuspended?: boolean;
  isSeniorCitizen?: boolean;
  isTrustClient?: boolean;
  notes?: string;
  zenyBalance?: number; // 1 Zeny = 1.00 USD
  grpayBalance?: number; // Compatibility alias
  createdAt: string;
  lastLogin?: string;
  fcmToken?: string;
  ltvUsd?: number; // New: Lifetime Value
}

export interface CreditEvent {
  id: string;
  customerId: string;
  type: 'order' | 'topup' | 'adjustment' | 'refund';
  amountUsd: number;
  balanceAfterUsd: number;
  description: string;
  createdAt: string;
}

export interface WalletTopup {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount?: number; // General amount
  amountZenyPoints?: number; // Amount in ZenyPoints (USD equivalent)
  amountZeny?: number; // Compatibility alias
  amountPaid: number;  // Amount paid in the payment currency
  currency: 'USD' | 'BS';
  paymentMethodId: string;
  paymentMethodName: string;
  referenceNumber: string;
  receiptImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface GoogleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken?: string;
}

export interface SheetsConnectionState {
  isConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface ExchangeRateState {
  bcvRate: number; // Bolívares per 1 USD
  lastUpdated: string;
  source: string;
  isCustomOverride: boolean;
  isLoading: boolean;
}

export type IncidentIssueType =
  | 'Clave o PIN incorrecto'
  | 'Pantalla ocupada / Límite excedido'
  | 'Cuenta caída o membresía pausada'
  | 'Perfil borrado o modificado'
  | 'Error de reproducción o código'
  | 'Renovación o pago no acreditado'
  | 'Otro problema técnico';

export type IncidentStatus = 'pending' | 'in_progress' | 'resolved';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface IncidentReport {
  id: string; // e.g. INC-7821
  createdAt: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  orderId?: string;
  issueType: IncidentIssueType;
  description: string;
  screenshotImage?: string; // Base64 data URL preview
  status: IncidentStatus;
  sentVia?: 'whatsapp' | 'telegram' | 'web';
  adminNotes?: string;
  solution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export type PlatformActionTrigger =
  | 'entrega_regular'
  | 'entrega_credito'
  | 'cobro_credito'
  | 'aviso_vencimiento'
  | 'bienvenida_cliente'
  | 'recarga_wallet'
  | 'soporte_falla'
  | 'personalizado';

export interface MessageTemplate {
  id: string; // e.g. 'entrega_credito_senior'
  title: string;
  category: 'whatsapp' | 'bot' | 'notificacion';
  content: string;
  description: string;
  variables: string[];
  lastModified?: string;
  isCustom?: boolean;
  assignedAction?: PlatformActionTrigger;
}

export type ActionTemplateMapping = Record<PlatformActionTrigger, string>;

// --- FRANCHISE & MULTI-TENANT MANAGEMENT ---
export type FranchiseStatus = 'active' | 'paused' | 'suspended';
export type FranchiseSubscriptionStatus = 'pagado' | 'credito' | 'pendiente' | 'vencido';

export interface FranchiseModulePermission {
  calendar: boolean; // Calendario de Vencimientos
  credits: boolean; // Crédito y Cobranzas
  reminders: boolean; // Avisos de Vencimiento (1 Día Antes)
  botAutomation: boolean; // Bot WhatsApp & Plantillas Pro
  supplierPurchases: boolean; // Matriz de Proveedores & Finanzas
  customDomain: boolean; // Dominio Personalizado
  branding: boolean; // Personalización de Marca, Logo y Colores
  installments: boolean; // Método de Pago en Cuotas
  resellers: boolean; // Red de Revendedores / Sub-Franquicias
}

export interface FranchiseTenant {
  id: string; // e.g. 'franq-1'
  businessName: string; // e.g. 'StreamPlus Venezuela'
  ownerName: string; // e.g. 'Carlos Mendoza'
  phone: string; // e.g. '+584141234567'
  telegramUser?: string; // e.g. '@carlos_stream'
  email: string;
  customDomain?: string; // e.g. 'streamplus.xyz'
  walletCustomName: string; // e.g. 'StreamPay'
  monthlyFeeUsd: number; // e.g. 25.00
  subscriptionStatus: FranchiseSubscriptionStatus;
  status: FranchiseStatus;
  creditDueDate?: string;
  lastPaymentDate?: string;
  availableMasterBalanceUsd: number;
  createdAt: string;
  notes?: string;
  enabledModules?: FranchiseModulePermission;
  extraAddonsMonthlyUsd?: number;
  branding?: AppBrandingConfig;
  isResellerNetworkActive?: boolean;
  subFranchises?: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    status: 'active' | 'suspended';
    createdAt: string;
  }[];
}

export type FranchiseTopupStatus = 'pending' | 'approved' | 'rejected';

export interface FranchiseTopupReport {
  id: string; // e.g. 'ABONO-9812'
  franchiseId: string;
  franchiseName: string;
  franchisePhone: string;
  franchiseTelegram?: string;
  targetCustomerName?: string; // Cliente final del franquiciado a quien se le asignará
  targetCustomerId?: string;
  amountUsd: number;
  amountBs: number;
  paymentMethod: string; // 'pago_movil' | 'binance' | 'zinli' | 'bancamiga' | etc.
  referenceNumber: string;
  screenshotImage?: string; // Base64 o URL
  notes?: string;
  status: FranchiseTopupStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// --- SUPPLIER PURCHASES & ACCOUNTS MATRIX ---
export type PurchaseCurrency = 'USD' | 'VES' | 'COP' | 'EUR' | 'USDT';
export type AccountSaleType = 'full_account' | 'by_profiles';

export interface Supplier {
  id: string;
  name: string;
  contactPhone?: string;
  telegramUser?: string;
  preferredCurrency: PurchaseCurrency;
  currentBalanceUsd: number; // For Supplier Wallet/Balance
  notes?: string;
  createdAt: string;
}

export interface AccountProfileSlot {
  id: string;
  profileName: string; // ej: 'silvia', 'juan nahy 2', 'alexis canaima', 'mama nelson'
  pin: string; // ej: '2480'
  sellerName?: string; // ej: 'Pablo', 'josuanny'
  status: 'available' | 'occupied' | 'maintenance';
  assignedCustomerId?: string;
  assignedCustomerName?: string;
  assignedOrderId?: string;
  startDate?: string;
  expirationDate?: string;
  durationDays?: number;
}

export interface SupplierPurchase {
  id: string; // e.g. 'PUR-0921'
  supplierName: string; // Nombre del proveedor
  platform: string; // ej: 'NETFLIX', 'MAX', 'DISNEY+', 'PRIME', 'SPOTIFY', 'IPTV'
  serviceName: string; // ej: 'Netflix Ultra HD 4K (5 Pantallas)'
  saleType: AccountSaleType; // 'full_account' o 'by_profiles'
  paymentCurrency: PurchaseCurrency;
  paymentAmount: number; // Monto pagado al proveedor en su moneda
  costUsd: number; // Costo normalizado en USD
  startDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  durationDays: number; // ej: 29 o 30 días
  accountEmail: string; // Correo de la cuenta madre
  accountPassword: string; // Clave de la cuenta madre
  profiles: AccountProfileSlot[]; // Slots de perfiles y PINes
  status: 'active' | 'expiring_soon' | 'expired';
  notes?: string;
  isHybrid?: boolean; // New: mixed providers/platforms
  createdAt: string;
  lastCredentialsUpdate?: string;
}

// --- AUDIT LOG & BITÁCORA ---
export type AuditLogSeverity = 'info' | 'success' | 'warning' | 'error';
export type AuditActorRole = 'admin' | 'team' | 'seller' | 'customer' | 'franchise' | 'system';

export interface AuditLogEntry {
  id: string; // e.g. 'LOG-1727680000000-842'
  timestamp: string; // ISO string
  formattedDate: string; // "DD/MM/YYYY, HH:MM:SS"
  actor: string; // e.g. "Gregori Izquierdo" | "Juan Perez" | "Sistema"
  actorRole: AuditActorRole;
  actorEmail?: string;
  actorPhone?: string;
  action: string; // e.g. "CREAR_PEDIDO", "APROBAR_PAGO", "LOGIN_FALLIDO"
  description: string;
  ipAddress: string; // Captured IP or detected client IP
  deviceInfo?: string; // Browser / OS info
  location?: string; // Location or ISP
  severity: AuditLogSeverity;
  metadata?: Record<string, any>;
}

// --- FACTURACIÓN Y CONTRATOS ---
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface Invoice {
  id: string; // e.g. 'FAC-2026-0001'
  orderId?: string;
  customerId?: string;
  invoiceNumber: string; // 'FAC-2026-0001'
  controlNumber: string; // '00-000142'
  issueDate: string; // ISO string
  dueDate?: string;
  customerName: string;
  customerDocId: string; // RIF, CI, DNI
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotalUsd: number;
  taxPercent: number; // e.g. 0 o 16
  taxAmountUsd: number;
  totalUsd: number;
  bcvRate: number;
  totalBs: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'cancelled' | 'refunded';
  notes?: string;
  signatureStamp?: boolean;
}

export interface ContractAgreement {
  id: string; // e.g. 'CTR-2026-001'
  contractNumber: string; // 'CTR-2026-001'
  contractType: 'franquicia_master' | 'subfranquicia' | 'servicio_cliente' | 'garantia_acuerdo';
  title: string;
  parties: {
    partyA: string; // 'Gregori Izquierdo - Plataforma Streaming'
    partyB: string; // 'Nombre del Franquiciado / Cliente'
    docIdB: string;
    emailB: string;
    phoneB: string;
  };
  startDate: string;
  endDate: string;
  version: string; // e.g. 'v2.6'
  status: 'active' | 'renewed' | 'expired' | 'terminated';
  termsAndConditions: string;
  monthlyFeeUsd?: number;
  notes?: string;
  lastUpdated: string;
  autoRenewOnTopup?: boolean;
}

// --- GASTOS Y CONTABILIDAD FINANCIERA ---
export interface ExpenseCategory {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD o ISO
  category: string; // Tipo de gasto
  description: string;
  amount: number; // Con 2 o 3 decimales
  currency: 'USD' | 'BS';
  amountUsd: number;
  amountBs: number;
  payer: string; // Quién realizó el gasto
  paymentMethodId: string;
  paymentMethodName: string;
  referenceNumber?: string;
  supplierOrVendor?: string;
  notes?: string;
  isFixed?: boolean; // New: for fixed expenses
  recurrence?: 'once' | 'monthly' | 'yearly'; // New
  createdAt: string;
}

export interface SalesTarget {
  id: string;
  month: string; // YYYY-MM
  targetAmountUsd: number;
  achievedAmountUsd: number;
  category?: ServiceCategory | 'total';
}

export interface AccountingEntry {
  id: string;
  entryNumber: number;
  date: string;
  concept: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  sourceType: 'sale' | 'purchase' | 'expense' | 'topup' | 'adjustment';
  referenceId?: string;
}
// --- FRANCHISE APPLICATIONS ---
export interface FranchiseApplication {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  telegramUser?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// --- FRANCHISE TICKETS (SUPPORT) ---
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'topup' | 'account_issue' | 'technical' | 'billing' | 'other';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole | 'franchise';
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface FranchiseTicket {
  id: string;
  franchiseId: string;
  franchiseName: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: TicketMessage[];
}
