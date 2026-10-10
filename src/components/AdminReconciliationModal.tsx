import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Plus,
  Key,
  Sliders,
  DollarSign,
  Wallet,
  TrendingUp,
  CreditCard,
  Edit2,
  Save,
  Send,
  Calendar,
  MessageCircle,
  Bell,
  Copy,
  Check,
  Share2,
  Users,
  BarChart3,
  PieChart,
  AlertTriangle,
  Image as ImageIcon,
  Tv,
  ArrowLeft,
  Tag,
  HeartHandshake,
  Globe,
  FileText,
  RotateCcw,
  Bot,
  CalendarDays,
  Trash2,
  Building,
  Package,
  HelpCircle,
  Download,
  ClipboardList,
  Palette,
  ShieldCheck,
  Layers,
  Receipt
} from 'lucide-react';
import { AdminProductManager } from './AdminProductManager';
import { AdminCreditManager } from './AdminCreditManager';
import { AdminCalendarManager } from './AdminCalendarManager';
import { AdminHandoverGuideModal } from './AdminHandoverGuideModal';
import { AdminPurchasesAndFinanceManager } from './AdminPurchasesAndFinanceManager';
import { AdminAuditLogManager } from './AdminAuditLogManager';
import { AdminUserManager } from './AdminUserManager';
import { AdminInstallmentManager } from './AdminInstallmentManager';
import { AdminRefundManager } from './AdminRefundManager';
import { AdminTelegramBotManager } from './AdminTelegramBotManager';
import { AdminBillingAndContractsManager } from './AdminBillingAndContractsManager';
import { AdminExpensesManager } from './AdminExpensesManager';
import { FranchiseSummaryChart } from './FranchiseSummaryChart';
import { AdminFranchiseApplicationManager } from './AdminFranchiseApplicationManager';
import { AdminFranchiseTicketManager } from './AdminFranchiseTicketManager';

import { MarketingModule } from './MarketingModule';
import { AdminSystemsManager } from './AdminSystemsManager';
import { AdminSecuritySuite } from './AdminSecuritySuite';
import { AdminSidebar } from './AdminSidebar';
import { AdminCategoryManager } from './AdminCategoryManager';
import { INITIAL_PAYMENT_METHODS } from '../data/defaultCatalog';
import { PaymentMethodFieldsDisplay } from './PaymentMethodFieldsDisplay';
import { getAccessToken } from '../services/googleAuth';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { 
  useFirestoreLatencyMs, 
  useHasCriticalLatency, 
  useFirestoreStatus, 
  useConnectionError 
} from '../store/useAppStore';
import { 
  measureFirestoreLatency, 
  validateFirestoreConnection 
} from '../services/firestoreService';
import {
  DOMAIN_OFFICIAL,
  DEFAULT_MESSAGE_TEMPLATES,
  renderTemplate,
  PLATFORM_ACTION_DEFINITIONS,
  DEFAULT_ACTION_MAPPING
} from '../utils/messageTemplates';
import { ACTIVE_SYSTEM_ROUTES } from '../config/routesDirectory';
import {
  downloadGoogleSheetsTemplate,
  downloadOrdersCsvTemplate
} from '../utils/downloadSheetsTemplate';
import {
  Order,
  OrderStatus,
  SheetsConnectionState,
  GoogleUser,
  PaymentMethod,
  WalletTopup,
  CustomerUser,
  IncidentReport,
  IncidentStatus,
  UserRole,
  FaqItem,
  Product,
  PlanDuration,
  MessageTemplate,
  PlatformActionTrigger,
  ActionTemplateMapping,
  FranchiseTenant,
  FranchiseTopupReport,
  SupplierPurchase,
  AppBrandingConfig,
  ExpenseItem,
  Invoice,
  FranchiseApplication,
  FranchiseTicket
} from '../types';
import {
  formatCurrency,
  formatGrpay,
  buildWhatsAppCredentialsUrl,
  buildTelegramCredentialsUrl,
  buildFormattedCredentialsText,
  buildWhatsAppIncidentStatusUrl,
  buildTelegramIncidentStatusUrl,
  buildFormattedIncidentStatusText,
  IncidentStatusMessageType,
  calculateExpirationDate,
  getDaysRemaining,
  safeFormatDate
} from '../utils/formatters';
const SUPABASE_SCHEMA_SQL = `-- Script SQL Completo de Base de Datos para Supabase (Estructura Unificada)
-- Ejecuta este script en el SQL Editor de tu consola de Supabase (https://supabase.com)

-- 1. Crear tabla de Categorías de Servicios
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de Cuentas Madre (Proveedores de streaming)
CREATE TABLE IF NOT EXISTS public.parent_accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    platform TEXT,
    email TEXT,
    password TEXT,
    expiration_date TEXT,
    max_slots INTEGER DEFAULT 5,
    active_slots INTEGER DEFAULT 0,
    purchase_price NUMERIC,
    provider TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de Perfiles de Streaming de la Cuenta Madre
CREATE TABLE IF NOT EXISTS public.account_profiles (
    id TEXT PRIMARY KEY,
    parent_account_id TEXT REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
    profile_name TEXT,
    pin TEXT,
    assigned_customer TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear tabla de Historial de Reversos
CREATE TABLE IF NOT EXISTS public.refunds (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT,
    customer_email TEXT,
    amount NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Crear tabla de Facturas
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    payment_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Crear tabla de Contratos
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Crear tabla de Clientes (Customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT DEFAULT 'cliente',
    zeny_balance NUMERIC DEFAULT 0.00,
    is_suspended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Crear tabla de Catálogo de Productos y Servicios
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price_usd NUMERIC DEFAULT 0.00,
    price_bs NUMERIC DEFAULT 0.00,
    duration TEXT,
    account_type TEXT,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 10,
    is_stock_manual BOOLEAN DEFAULT false,
    manual_stock INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Crear tabla de Métodos de Pago
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bank_name TEXT,
    doc_id TEXT,
    phone TEXT,
    payment_instructions TEXT,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Crear tabla de FAQ
CREATE TABLE IF NOT EXISTS public.faq_items (
    id TEXT PRIMARY KEY,
    category TEXT,
    question TEXT,
    answer TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Crear tabla de Wallet Topups
CREATE TABLE IF NOT EXISTS public.wallet_topups (
    id TEXT PRIMARY KEY,
    customer_email TEXT,
    amount_usd NUMERIC DEFAULT 0.00,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Crear tabla de Franquiciados (Franchises)
CREATE TABLE IF NOT EXISTS public.franchises (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT,
    telegram_user TEXT,
    email TEXT UNIQUE,
    custom_domain TEXT,
    wallet_custom_name TEXT DEFAULT 'ZenyPay',
    monthly_fee_usd NUMERIC DEFAULT 0.00,
    subscription_status TEXT DEFAULT 'active',
    status TEXT DEFAULT 'active',
    credit_due_date TEXT,
    last_payment_date TEXT,
    available_master_balance_usd NUMERIC DEFAULT 0.00,
    notes TEXT,
    extra_addons_monthly_usd NUMERIC DEFAULT 0.00,
    is_reseller_network_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Crear tabla de Abonos de Franquicias
CREATE TABLE IF NOT EXISTS public.franchise_topups (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id) ON DELETE CASCADE,
    franchise_name TEXT,
    franchise_phone TEXT,
    franchise_telegram TEXT,
    target_customer_name TEXT,
    target_customer_id TEXT,
    amount_usd NUMERIC DEFAULT 0.00,
    amount_bs NUMERIC DEFAULT 0.00,
    payment_method TEXT,
    reference_number TEXT,
    screenshot_image TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT,
    rejection_reason TEXT
);

-- Deshabilitar RLS para lecturas y escrituras directas
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_topups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_topups DISABLE ROW LEVEL SECURITY;

-- Cargar semilla de datos iniciales
INSERT INTO public.categories (id, name, icon, description) VALUES
('cat-netflix', 'Netflix 4K', 'Tv', 'Cuentas completas y pantallas premium de Netflix Ultra HD.'),
('cat-disney', 'Disney+ Premium', 'Tv', 'Perfiles y cuentas completas de Disney Plus con Star incluido.'),
('cat-max', 'Max (HBO)', 'Tv', 'Acceso a las mejores películas y series de Warner Bros y HBO.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, name, email, phone, role, zeny_balance) VALUES
('cust-gregory', 'Gregory Izquierdo', 'emprendimientogregoryizquierdo@gmail.com', '584241983648', 'admin', 150.00),
('cust-cliente-1', 'Juan Pérez', 'juan.perez@example.com', '584121234567', 'cliente', 25.50),
('cust-cliente-2', 'María Gómez', 'maria.gomez@example.com', '584249876543', 'cliente', 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, category, price_usd, duration, account_type, description, stock, is_stock_manual, manual_stock) VALUES
('prod-netflix-1', 'Netflix Ultra HD', 'cat-netflix', 3.50, '30 Días', 'Pantalla Privada', 'Perfil privado con PIN de acceso personalizado en calidad 4K Ultra HD.', 15, false, 15),
('prod-disney-1', 'Disney+ Premium', 'cat-disney', 2.50, '30 Días', 'Pantalla Privada', 'Acceso premium con perfil independiente para toda la familia.', 12, false, 12),
('prod-max-1', 'Max (HBO) Premium', 'cat-max', 3.00, '30 Días', 'Pantalla Privada', 'Películas de estreno y series exclusivas en calidad máxima.', 8, false, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_methods (id, name, bank_name, doc_id, phone, payment_instructions, currency) VALUES
('pm-pago-movil', 'Pago Móvil BCV', 'Banco de Venezuela (0102)', 'V-18999000', '04241983648', 'Realiza el pago al celular registrado y reporta el capture con referencia.', 'VES'),
('pm-binance', 'Binance Pay', 'Binance', 'gregory.binance', 'N/A', 'Envía mediante Binance Pay ID y reporta tu ID de transacción.', 'USD'),
('pm-zeny', 'Billetera Zeny', 'Saldo Interno', 'N/A', 'N/A', 'Descuento directo e instantáneo de tu saldo de billetera virtual Zeny.', 'USD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faq_items (id, category, question, answer, sort_order) VALUES
('faq-1', 'Garantía', '¿Qué pasa si mi cuenta deja de funcionar?', 'Todas nuestras cuentas cuentan con garantía total por el tiempo contratado. Si tienes algún inconveniente, puedes abrir un reporte técnico en el Portal de Soporte y te lo solventaremos de inmediato.', 1),
('faq-2', 'Pagos', '¿Cómo reportar un pago móvil o transferencia?', 'Realiza tu pago a nuestros datos oficiales, guarda el comprobante y sube la captura con el número de referencia en el formulario de pago del producto o sección de confirmación.', 2),
('faq-3', 'Zeny', '¿Qué es el saldo ZenyPoints?', 'Es el saldo digital en dólares (USD) recargable para comprar al instante en nuestra plataforma sin esperar validación bancaria.', 3),
('faq-4', 'Renovaciones', '¿Pierdo mi perfil si renuevo?', 'No, al renovar sobre tu mismo perfil conservas intactas tus configuraciones, historial y listas guardadas.', 4)
ON CONFLICT (id) DO NOTHING;
`;


interface AdminReconciliationModalProps {
  orders: Order[];
  walletTopups: WalletTopup[];
  customerUsers: CustomerUser[];
  incidents: IncidentReport[];
  paymentMethods: PaymentMethod[];
  bcvRate: number;
  onUpdateBcvRate: (newRate: number) => void;
  sheetsState: SheetsConnectionState;
  user: GoogleUser | null;
  onClose: () => void;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onCreateNewSheet: () => Promise<void>;
  onSelectExistingSheet: (id: string, name: string) => Promise<void>;
  onSyncWithSheets: () => Promise<void>;
  onSyncCustomersToSheet: () => Promise<void>;
  onSyncReportsToSheet: () => Promise<void>;
  onSyncIncidentsToSheet: () => Promise<void>;
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    credentials?: Order['credentials'],
    rejectionReason?: string,
    assignedSeller?: { id: string; name: string }
  ) => Promise<void>;
  onApproveTopup: (topupId: string) => Promise<void>;
  onRejectTopup: (topupId: string, reason?: string) => Promise<void>;
  onManualCreditGrpay: (customerEmail: string, amount: number, operation?: 'credit' | 'debit') => Promise<void>;
  onUpdateCustomerRole: (
    customerId: string,
    newRole: UserRole,
    sellerCode?: string,
    discountPercent?: number
  ) => Promise<void>;
  onAddUserFromAdmin: (newUser: Omit<CustomerUser, 'id' | 'zenyBalance' | 'createdAt'> & { discountPercent?: number }) => Promise<void>;
  onUpdateIncidentStatus: (
    incidentId: string,
    newStatus: IncidentStatus,
    adminNotes?: string,
    solution?: string
  ) => Promise<void>;
  onUpdatePaymentMethod: (updatedMethod: PaymentMethod) => void;
  onToggleSuspendCustomer: (customerId: string) => void;
  availableDriveSheets: { id: string; name: string }[];
  isLoadingDriveSheets: boolean;
  onFetchDriveSheets: () => Promise<void>;
  faqItems: FaqItem[];
  products: Product[];
  onUpdateProduct?: (product: Product) => void;
  onUpdateProductsBulk?: (products: Product[]) => void;
  onUpdateOrder?: (order: Order) => void;
  onAddProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateFaq: (faqs: FaqItem[]) => void;
  onSendGift: (customerId: string, giftType: 'grpay' | 'membership', amountOrProductId: string, duration?: PlanDuration) => Promise<void>;
  onSyncFaq: () => Promise<void>;
  onSaveCreditOrder?: (order: Order, newCustomer?: CustomerUser) => void;
  onUpdateCreditStatus?: (orderId: string, creditStatus: 'pending_payment' | 'paid' | 'overdue', paymentNotes?: string) => void;
  onUpdateCreditDueDate?: (orderId: string, newDueDate: string) => void;
  templates?: MessageTemplate[];
  onSaveTemplates?: (templates: MessageTemplate[]) => void;
  onSyncMessageTemplates?: () => Promise<void>;
  onOpenAddCustomerModal?: () => void;
  actionMapping?: ActionTemplateMapping;
  onSaveActionMapping?: (mapping: ActionTemplateMapping) => void;
  onRenewOrder?: (orderId: string, duration: PlanDuration, newExpirationDate: string) => void;
  franchises?: FranchiseTenant[];
  franchiseTopups?: FranchiseTopupReport[];
  onUpdateFranchise?: (franchise: FranchiseTenant) => void;
  onAddFranchise?: (franchise: FranchiseTenant) => void;
  onApproveFranchiseTopup?: (reportId: string, reviewedBy: string) => void;
  onRejectFranchiseTopup?: (reportId: string, reason: string) => void;
  onCreateFranchiseTopupReport?: (report: FranchiseTopupReport) => void;
  onAssignBalanceToCustomer?: (franchiseId: string, customerId: string, amountUsd: number) => void;
  supplierPurchases?: SupplierPurchase[];
  onAddSupplierPurchase?: (purchase: Omit<SupplierPurchase, 'id' | 'createdAt'>) => void;
  onUpdateSupplierPurchase?: (purchase: SupplierPurchase) => void;
  onDeleteSupplierPurchase?: (purchaseId: string) => void;
  onUpdateSupplierCredentials?: (purchaseId: string, email: string, pass: string) => void;
  branding?: AppBrandingConfig;
  onSaveBranding?: (b: AppBrandingConfig) => void;
  onResetPassword?: (userId: string, newPass: string, userType: any) => void;
  expenses?: ExpenseItem[];
  onAddExpense?: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  onUpdateExpense?: (expense: ExpenseItem) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onAddPaymentMethod?: (method: PaymentMethod) => void;
  onDeletePaymentMethod?: (methodId: string) => void;
  onSyncDatabaseWithSupabase?: () => Promise<void>;
  supabaseSchemaError?: string | null;
  onOpenSheetsModal?: () => void;
  isCloudSyncing?: boolean;
  invoices?: Invoice[];
  onLogout?: () => void;
  franchiseApplications?: FranchiseApplication[];
  franchiseTickets?: FranchiseTicket[];
  onUpdateFranchiseApplication?: (app: FranchiseApplication) => void;
  onUpdateFranchiseTicket?: (ticket: FranchiseTicket) => void;
}

export const AdminReconciliationModal: React.FC<AdminReconciliationModalProps> = ({
  orders,
  walletTopups,
  customerUsers,
  incidents,
  paymentMethods,
  bcvRate,
  onUpdateBcvRate,
  sheetsState,
  user,
  onClose,
  onSignInGoogle,
  onSignOutGoogle,
  onCreateNewSheet,
  onSelectExistingSheet,
  onSyncWithSheets,
  onSyncDatabaseWithSupabase,
  supabaseSchemaError,
  onOpenSheetsModal,
  isCloudSyncing,
  onSyncCustomersToSheet,
  onSyncReportsToSheet,
  onSyncIncidentsToSheet,
  onUpdateOrderStatus,
  onApproveTopup,
  onRejectTopup,
  onManualCreditGrpay,
  onUpdateCustomerRole,
  onAddUserFromAdmin,
  onUpdateIncidentStatus,
  onUpdatePaymentMethod,
  onToggleSuspendCustomer,
  availableDriveSheets,
  isLoadingDriveSheets,
  onFetchDriveSheets,
  faqItems,
  products,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onUpdateFaq,
  onSendGift,
  onSyncFaq,
  onSaveCreditOrder,
  onUpdateCreditStatus,
  onUpdateCreditDueDate,
  templates,
  onSaveTemplates,
  onSyncMessageTemplates,
  onOpenAddCustomerModal,
  actionMapping,
  onSaveActionMapping,
  onRenewOrder,
  franchises = [],
  franchiseTopups = [],
  onUpdateFranchise,
  onAddFranchise,
  onApproveFranchiseTopup,
  onRejectFranchiseTopup,
  onCreateFranchiseTopupReport,
  onAssignBalanceToCustomer,
  supplierPurchases = [],
  onAddSupplierPurchase,
  onUpdateSupplierPurchase,
  onDeleteSupplierPurchase,
  onUpdateSupplierCredentials,
  branding,
  onSaveBranding,
  onResetPassword,
  onUpdateProductsBulk,
  onUpdateOrder,
  expenses = [],
  onAddExpense = () => {},
  onUpdateExpense = () => {},
  onDeleteExpense = () => {},
  onAddPaymentMethod,
  onDeletePaymentMethod,
  invoices = [],
  onLogout,
  franchiseApplications = [],
  franchiseTickets = [],
  onUpdateFranchiseApplication,
  onUpdateFranchiseTicket
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'reconciliation'
    | 'products'
    | 'clients'
    | 'credits'
    | 'calendar'
    | 'franchises'
    | 'templates'
    | 'domain'
    | 'topups'
    | 'incidents'
    | 'reminders'
    | 'finance'
    | 'categories'
    | 'methods'
    | 'bcv'
    | 'faq'
    | 'purchases_finance'
    | 'bitacora'
    | 'branding'
    | 'users'
    | 'installments'
    | 'refunds'
    | 'telegram_bot'
    | 'billing_contracts'
    | 'expenses'
    | 'integrations'
    | 'marketing'
    | 'sistemas'
    | 'seguridad_suite'
    | 'footer_config'
    | 'franchise_kit'
    | 'franchise_applications'
    | 'franchise_tickets'
  >('reconciliation');

  // Global Firestore Monitoring & Latency States
  const firestoreLatencyMs = useFirestoreLatencyMs();
  const hasCriticalLatency = useHasCriticalLatency();
  const firestoreStatus = useFirestoreStatus();
  const connectionError = useConnectionError();
  const [isMeasuringLatency, setIsMeasuringLatency] = useState(false);

  const handleManualMeasureLatency = async () => {
    setIsMeasuringLatency(true);
    try {
      await measureFirestoreLatency();
    } finally {
      setIsMeasuringLatency(false);
    }
  };

  // Supabase Database Explorer States
  const [selectedSupabaseTable, setSelectedSupabaseTable] = useState<string>('categories');
  const [supabaseRecords, setSupabaseRecords] = useState<any[]>([]);
  const [supabaseExplorerLoading, setSupabaseExplorerLoading] = useState<boolean>(false);
  const [supabaseExplorerError, setSupabaseExplorerError] = useState<string | null>(null);
  const [supabaseTestInsertStatus, setSupabaseTestInsertStatus] = useState<string | null>(null);
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);
  const [dbSyncLogs, setDbSyncLogs] = useState<string[]>([]);

  // States for live client-side Supabase credentials editing and dynamic querying
  const [customTableName, setCustomTableName] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>(() => localStorage.getItem('CUSTOM_SUPABASE_URL') || '');
  const [customKeyInput, setCustomKeyInput] = useState<string>(() => localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || '');
  const [showCredentialsForm, setShowCredentialsForm] = useState<boolean>(false);

  // FAQ Inline Editing States
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editFaqCategory, setEditFaqCategory] = useState<string>('');
  const [editFaqQuestion, setEditFaqQuestion] = useState<string>('');
  const [editFaqAnswer, setEditFaqAnswer] = useState<string>('');

  const handleManualSupabaseSync = async () => {
    if (!onSyncDatabaseWithSupabase) {
      alert('Sincronizador no disponible.');
      return;
    }
    setIsDbSyncing(true);
    const nowStr = () => new Date().toLocaleTimeString();
    setDbSyncLogs([`[${nowStr()}] Iniciando proceso de sincronización bidireccional...`]);
    try {
      await onSyncDatabaseWithSupabase();
      setDbSyncLogs(prev => [
        ...prev,
        `[${nowStr()}] Descargando actualizaciones de la nube...`,
        `[${nowStr()}] Fusionando con el estado local de forma inteligente...`,
        `[${nowStr()}] Subiendo nuevos registros locales a la nube...`,
        `[${nowStr()}] ¡Sincronización bidireccional completada con éxito!`
      ]);
      alert('¡Sincronización con Supabase completada con éxito!');
    } catch (error: any) {
      setDbSyncLogs(prev => [
        ...prev,
        `[${nowStr()}] ERROR en la sincronización: ${error?.message || error}`
      ]);
      alert(`Error al sincronizar: ${error?.message || error}`);
    } finally {
      setIsDbSyncing(false);
    }
  };

  const fetchSupabaseRecords = async (tableName: string) => {
    setSupabaseExplorerLoading(true);
    setSupabaseExplorerError(null);
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(50);
      if (error) {
        throw error;
      }
      setSupabaseRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching Supabase records:', err);
      setSupabaseExplorerError(err.message || 'No se pudieron recuperar los registros.');
      setSupabaseRecords([]);
    } finally {
      setSupabaseExplorerLoading(false);
    }
  };

  const handleSaveCredentials = () => {
    try {
      localStorage.setItem('CUSTOM_SUPABASE_URL', customUrlInput.trim());
      localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', customKeyInput.trim());
      alert('¡Credenciales de Supabase guardadas con éxito! La página se recargará para aplicar los cambios.');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetCredentials = () => {
    try {
      localStorage.removeItem('CUSTOM_SUPABASE_URL');
      localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
      alert('Se han restaurado las credenciales por defecto del sistema. La página se recargará.');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  // Supabase connection tab auto-fetch removed

  const [localMapping, setLocalMapping] = useState<ActionTemplateMapping>(actionMapping || DEFAULT_ACTION_MAPPING);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('pending_reconciliation');
  const [giftCustomer, setGiftCustomer] = useState<CustomerUser | null>(null);
  const [giftType, setGiftType] = useState<'grpay' | 'membership'>('grpay');
  const [giftAmount, setGiftAmount] = useState<number>(10);
  const [giftProductId, setGiftProductId] = useState<string>('netflix');
  const [giftDuration, setGiftDuration] = useState<PlanDuration>('1 mes');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected order for reconciliation modal
  const [reconcilingOrder, setReconcilingOrder] = useState<Order | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isApprovedJustNow, setIsApprovedJustNow] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [credUser, setCredUser] = useState('');
  const [credPass, setCredPass] = useState('');
  const [credPin, setCredPin] = useState('');
  const [credProfile, setCredProfile] = useState('');
  const [credExpirationDate, setCredExpirationDate] = useState('');
  const [credInstructions, setCredInstructions] = useState('');
  const [assignedSellerId, setAssignedSellerId] = useState('vend-1');
  const [assignedSellerName, setAssignedSellerName] = useState('Gregori Izquierdo (Principal)');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isSyncingReports, setIsSyncingReports] = useState(false);
  const [isSyncingClients, setIsSyncingClients] = useState(false);
  const [localTemplates, setLocalTemplates] = useState<MessageTemplate[]>(
    templates && templates.length > 0 ? templates : DEFAULT_MESSAGE_TEMPLATES
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('entrega_credito_senior');
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState(false);
  const [templateSubTab, setTemplateSubTab] = useState<'editor' | 'mapping'>('editor');
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTmplTitle, setNewTmplTitle] = useState('');
  const [newTmplCategory, setNewTmplCategory] = useState<'whatsapp' | 'bot' | 'notificacion'>('whatsapp');
  const [newTmplDescription, setNewTmplDescription] = useState('');
  const [newTmplContent, setNewTmplContent] = useState('');
  const [newTmplAssignAction, setNewTmplAssignAction] = useState<PlatformActionTrigger>('personalizado');
  const [copiedDns, setCopiedDns] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  // Manual Zeny Credit/Debit form
  const [manualCreditEmail, setManualCreditEmail] = useState('');
  const [manualCreditAmount, setManualCreditAmount] = useState<number>(10);
  const [manualCreditOperation, setManualCreditOperation] = useState<'credit' | 'debit'>('credit');
  const [manualCreditSuccess, setManualCreditSuccess] = useState<string | null>(null);

  // User management (Clients & Sellers)
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'cliente' | 'vendedor'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cliente');
  const [newUserSellerCode, setNewUserSellerCode] = useState('');
  const [newUserDiscountPercent, setNewUserDiscountPercent] = useState<number>(0);

  // Interactive Incident status modal
  const [activeIncidentModal, setActiveIncidentModal] = useState<{
    incident: IncidentReport;
    action: IncidentStatusMessageType;
  } | null>(null);
  const [incidentSolutionInput, setIncidentSolutionInput] = useState('');
  const [incidentCustomNote, setIncidentCustomNote] = useState('');
  const [copiedIncidentMsg, setCopiedIncidentMsg] = useState(false);

  // Custom Sheet ID or URL input
  const [customSheetUrlOrId, setCustomSheetUrlOrId] = useState('');

  // BCV edit state
  const [customBcvRate, setCustomBcvRate] = useState<number>(bcvRate);

  // Payment method edit state
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isNewPmModalOpen, setIsNewPmModalOpen] = useState(false);
  const [pmViewMode, setPmViewMode] = useState<'table' | 'cards'>('table');
  const [copiedPmId, setCopiedPmId] = useState<string | null>(null);
  const [newPmName, setNewPmName] = useState('');
  const [newPmType, setNewPmType] = useState<string>('pago_movil');
  const [newPmHolder, setNewPmHolder] = useState('Gregori Izquierdo');
  const [newPmAccount, setNewPmAccount] = useState('');
  const [newPmInstructions, setNewPmInstructions] = useState('enviar comprobante de pago para conciliacion');
  const [newPmBankName, setNewPmBankName] = useState('');
  const [newPmBankCode, setNewPmBankCode] = useState('');
  const [newPmPhone, setNewPmPhone] = useState('04242809333');
  const [newPmDocId, setNewPmDocId] = useState('');
  const [newPmEmail, setNewPmEmail] = useState('');
  const [newPmAccountType, setNewPmAccountType] = useState('Ahorros');
  const [newPmRouting, setNewPmRouting] = useState('');
  const [newPmBankAddress, setNewPmBankAddress] = useState('');
  const [newPmUserId, setNewPmUserId] = useState('');
  const [newPmUsername, setNewPmUsername] = useState('');
  const [newPmCurrency, setNewPmCurrency] = useState<'USD' | 'BS' | 'USDT'>('USD');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending_reconciliation').length;
  const pendingTopupsCount = walletTopups.filter((t) => t.status === 'pending').length;
  const pendingIncidentsCount = incidents.filter((i) => i.status === 'pending').length;

  // Incident state
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [incidentSearch, setIncidentSearch] = useState('');
  const [previewIncidentImage, setPreviewIncidentImage] = useState<string | null>(null);
  const [incidentNotesInput, setIncidentNotesInput] = useState<Record<string, string>>({});
  const [isSyncingIncidents, setIsSyncingIncidents] = useState(false);

  // States for Personal team WhatsApp alerts dispatch
  const [isTeamAlertPanelOpen, setIsTeamAlertPanelOpen] = useState(false);
  const [gregoriAlertPhone, setGregoriAlertPhone] = useState('584121234567');
  const [pabloAlertPhone, setPabloAlertPhone] = useState('584149876543');

  // --- GOOGLE CONTACTS TAB DIRECT INTEGRATION ---
  const [isGoogleContactsPanelOpen, setIsGoogleContactsPanelOpen] = useState(false);
  const [googleContactsList, setGoogleContactsList] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactsToImport, setSelectedContactsToImport] = useState<Record<string, boolean>>({});
  const [contactsStatusMsg, setContactsStatusMsg] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [exportingCustomers, setExportingCustomers] = useState<Record<string, boolean>>({});

  // Field Mapping preferences
  const [nameMappingSource, setNameMappingSource] = useState<'displayName' | 'givenName'>('displayName');
  const [phoneMappingSource, setPhoneMappingSource] = useState<'all' | 'first'>('all');
  const [emailMappingSource, setEmailMappingSource] = useState<'all' | 'first'>('all');

  const handleFetchGoogleContactsForTab = async () => {
    setContactsLoading(true);
    setContactsError('');
    setContactsStatusMsg('');
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Por favor inicia sesión con Google primero (esquina superior derecha del panel).');
      }

      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=200',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Google API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const connections = data.connections || [];

      const mapped = connections.map((c: any) => {
        const names = c.names || [];
        const phoneNumbers = c.phoneNumbers || [];
        const emailAddresses = c.emailAddresses || [];

        return {
          resourceName: c.resourceName,
          displayName: names[0]?.displayName || 'Sin Nombre',
          givenName: names[0]?.givenName || 'Sin Nombre',
          phones: phoneNumbers.map((p: any) => p.value),
          emails: emailAddresses.map((e: any) => e.value)
        };
      });

      setGoogleContactsList(mapped);
      setContactsStatusMsg(`Se leyeron exitosamente ${mapped.length} contactos de tu cuenta de Google.`);
    } catch (err: any) {
      console.error(err);
      setContactsError(err.message);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleImportMappedContacts = async () => {
    const toImport = googleContactsList.filter(c => selectedContactsToImport[c.resourceName]);
    if (toImport.length === 0) {
      alert('Por favor selecciona al menos un contacto.');
      return;
    }

    let successCount = 0;
    for (const contact of toImport) {
      const mappedName = nameMappingSource === 'displayName' ? contact.displayName : contact.givenName;
      const mappedPhone = phoneMappingSource === 'all' 
        ? contact.phones.join(', ') 
        : (contact.phones[0] || 'N/A');
      const mappedEmail = emailMappingSource === 'all'
        ? contact.emails.join(', ')
        : (contact.emails[0] || `${(mappedName || '').toLowerCase().replace(/\s+/g, '')}@import.com`);

      try {
        await onAddUserFromAdmin({
          name: mappedName,
          phone: mappedPhone || 'N/A',
          email: mappedEmail,
          role: 'cliente',
          isSuspended: false,
          notes: 'Importado de Google Contacts (Mapeo Personalizado)'
        });
        successCount++;
      } catch (e) {
        console.error('Error al importar:', e);
      }
    }

    setContactsStatusMsg(`¡Se importaron con éxito ${successCount} contactos mapeados como nuevos clientes!`);
    setSelectedContactsToImport({});
  };

  const handleExportCustomerToGoogleFromTab = async (cust: any) => {
    setExportingCustomers(prev => ({ ...prev, [cust.id]: true }));
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Por favor inicia sesión con Google primero.');
      }

      const contactBody = {
        names: [{ givenName: cust.name }],
        phoneNumbers: cust.phone !== 'N/A' ? [{ value: cust.phone, type: 'mobile' }] : [],
        emailAddresses: cust.email ? [{ value: cust.email, type: 'home' }] : [],
        biographies: [{ value: 'Cliente de Gregory Streaming (Maxter) - Exportación Automatizada' }]
      };

      const response = await fetch(
        'https://people.googleapis.com/v1/people:createContact',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Google API Error: ${response.statusText}`);
      }

      alert(`¡Cliente "${cust.name}" exportado con éxito a tu agenda de Google Contacts!`);
    } catch (err: any) {
      console.error(err);
      alert(`Error al exportar: ${err.message}`);
    } finally {
      setExportingCustomers(prev => ({ ...prev, [cust.id]: false }));
    }
  };

  // --- SUPPLIER PREPAYMENT BALANCES ALERT SYSTEM ---
  const supplierBalances = useMemo(() => {
    const initialDeposits: Record<string, number> = {};

    const usage: Record<string, number> = {};
    supplierPurchases.forEach((p) => {
      const name = p.supplierName || 'Proveedor Desconocido';
      usage[name] = (usage[name] || 0) + (p.costUsd || 0);
    });

    const balances: Record<
      string,
      { deposit: number; spent: number; remaining: number; status: 'critical' | 'warning' | 'normal' }
    > = {};

    const allSuppliers = new Set([...Object.keys(initialDeposits), ...supplierPurchases.map((p) => p.supplierName)]);

    allSuppliers.forEach((name) => {
      const deposit = initialDeposits[name] || 100.00;
      const spent = usage[name] || 0;
      const remaining = Number((deposit - spent).toFixed(2));
      let status: 'critical' | 'warning' | 'normal' = 'normal';
      if (remaining <= 15.00) {
        status = 'critical';
      } else if (remaining <= 35.00) {
        status = 'warning';
      }
      balances[name] = { deposit, spent, remaining, status };
    });

    return balances;
  }, [supplierPurchases]);

  const criticalSupplierAlerts = useMemo(() => {
    return Object.entries(supplierBalances)
      .filter(([_, data]) => data.status === 'critical' || data.status === 'warning')
      .map(([name, data]) => ({
        supplierName: name,
        deposit: data.deposit,
        spent: data.spent,
        remaining: data.remaining,
        status: data.status
      }));
  }, [supplierBalances]);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus = incidentStatusFilter === 'all' ? true : inc.status === incidentStatusFilter;
    const matchesSearch =
      inc.id.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.customerName.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.customerEmail.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.serviceName.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.issueType.toLowerCase().includes(incidentSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });



  // Calculate Financial Metrics & Service Breakdown
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'delivered');
  const totalRevenueUsd = confirmedOrders.reduce((acc, o) => {
    const val = o.currency === 'USD' ? o.total : o.total / bcvRate;
    return acc + val;
  }, 0);
  const totalRevenueBs = confirmedOrders.reduce((acc, o) => {
    const val = o.currency === 'BS' ? o.total : o.total * bcvRate;
    return acc + val;
  }, 0);

  // Service breakdown
  const serviceStats: Record<string, { count: number; totalUsd: number }> = {};
  confirmedOrders.forEach((o) => {
    const sName = o.productName || 'Otros';
    if (!serviceStats[sName]) serviceStats[sName] = { count: 0, totalUsd: 0 };
    serviceStats[sName].count += 1;
    const val = o.currency === 'USD' ? o.total : o.total / bcvRate;
    serviceStats[sName].totalUsd += val;
  });

  // Payment method breakdown
  const methodStats: Record<string, { count: number; totalUsd: number; totalBs: number }> = {};
  confirmedOrders.forEach((o) => {
    const mName = o.paidWithGrpay ? 'Wallet Zeny' : o.paymentMethodName || 'Otros';
    if (!methodStats[mName]) methodStats[mName] = { count: 0, totalUsd: 0, totalBs: 0 };
    methodStats[mName].count += 1;
    const valUsd = o.currency === 'USD' ? o.total : o.total / bcvRate;
    const valBs = o.currency === 'BS' ? o.total : o.total * bcvRate;
    methodStats[mName].totalUsd += valUsd;
    methodStats[mName].totalBs += valBs;
  });

  const sellerOptions = [
    { id: 'vend-1', name: 'Gregori Izquierdo (Principal)', code: 'GI-01' },
    ...customerUsers
      .filter((u) => u.role === 'vendedor' && u.id !== 'vend-1')
      .map((u) => ({ id: u.id, name: u.name, code: u.sellerCode || 'VEND' }))
  ];

  const handleOpenReconcile = (order: Order) => {
    setReconcilingOrder(order);
    setIsApprovedJustNow(order.status === 'confirmed' || order.status === 'delivered');
    setShowRejectInput(false);
    setCredUser(order.credentials?.accountUser || order.customerEmail);
    setCredPass(order.credentials?.accountPass || 'Streaming2026*');
    setCredPin(order.credentials?.pin || Math.floor(1000 + Math.random() * 9000).toString());
    setCredProfile(order.credentials?.profileName || `Perfil 1 (${order.customerName.split(' ')[0]})`);
    setCredExpirationDate(
      order.credentials?.expirationDate ||
        calculateExpirationDate(order.createdAt, order.duration)
    );
    setCredInstructions(
      order.credentials?.instructions ||
        'No cambiar la clave ni el nombre de perfil para conservar la garantía de duración.'
    );
    setAssignedSellerId(order.assignedSellerId || 'vend-1');
    setAssignedSellerName(order.assignedSellerName || 'Gregori Izquierdo (Principal)');
    setRejectionReason('');
    setCopiedMessage(false);
    setIsReconcileModalOpen(true);
  };

  const handleApproveOrder = async () => {
    if (!reconcilingOrder) return;
    try {
      setIsProcessing(true);
      const isTopup = reconcilingOrder.productId === 'topup-zeny' || reconcilingOrder.productName.toLowerCase().includes('zeny');
      const credentials = isTopup
        ? {
            instructions: credInstructions.trim() || 'Recarga de saldo acreditada en Wallet Zeny.'
          }
        : {
            accountUser: credUser.trim(),
            accountPass: credPass.trim(),
            pin: credPin.trim(),
            profileName: credProfile.trim(),
            startDate: reconcilingOrder.createdAt,
            expirationDate: credExpirationDate,
            instructions: credInstructions.trim()
          };

      await onUpdateOrderStatus(
        reconcilingOrder.id,
        'confirmed',
        credentials,
        undefined,
        { id: assignedSellerId, name: assignedSellerName }
      );

      const updated: Order = {
        ...reconcilingOrder,
        status: 'confirmed',
        credentials,
        assignedSellerId,
        assignedSellerName
      };
      setReconcilingOrder(updated);
      setIsApprovedJustNow(true);
    } catch (err) {
      console.error('Error approving order:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!reconcilingOrder) return;
    try {
      setIsProcessing(true);
      await onUpdateOrderStatus(
        reconcilingOrder.id,
        'rejected',
        undefined,
        rejectionReason.trim() || 'Comprobante bancario no verificado o fondos insuficientes'
      );
      setIsReconcileModalOpen(false);
      setReconcilingOrder(null);
    } catch (err) {
      console.error('Error rejecting order:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCreditEmail || manualCreditAmount <= 0) return;
    await onManualCreditGrpay(manualCreditEmail, manualCreditAmount, manualCreditOperation);
    setManualCreditSuccess(
      manualCreditOperation === 'credit'
        ? `¡Acreditados ${manualCreditAmount} Zeny a ${manualCreditEmail}!`
        : `¡Disminuidos ${manualCreditAmount} Zeny a ${manualCreditEmail}!`
    );
    setTimeout(() => setManualCreditSuccess(null), 3000);
  };

  const handleCustomSheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetUrlOrId.trim()) return;
    let sheetId = customSheetUrlOrId.trim();
    if (sheetId.includes('/d/')) {
      const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) sheetId = match[1];
    }
    onSelectExistingSheet(sheetId, 'Mi Archivo de Control (Drive)');
    setCustomSheetUrlOrId('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-100">
        {/* Top Header - Fullscreen Workspace Bar */}
        <div className="px-5 sm:px-8 py-2 sm:py-3 border-b border-slate-800 bg-slate-950 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            {/* Logo Image with Focused Circular Crop and Sutil Elegant Border - Mayor tamaño para lectura de detalle */}
            <div className="w-16 h-16 shrink-0 flex items-center justify-center rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-md bg-white p-0.5">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover object-center rounded-full scale-[1.15]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Panel de Administración - Gregori Izquierdo
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline">
                  Ambiente Completo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Navegación modular por categorías: Finanzas, Gestión, Configuración y Seguridad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cloud Firestore Telemetry & Latency Status Indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm ${
              hasCriticalLatency 
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' 
                : firestoreStatus === 'offline' || firestoreStatus === 'error'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : isCloudSyncing || isMeasuringLatency
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' 
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                isCloudSyncing || isMeasuringLatency ? 'bg-indigo-400 animate-spin' :
                hasCriticalLatency ? 'bg-amber-400 animate-pulse' :
                firestoreStatus === 'offline' || firestoreStatus === 'error' ? 'bg-rose-400' :
                'bg-emerald-400 animate-pulse'
              }`} />
              <div className="flex items-center gap-1.5">
                <span>{isCloudSyncing || isMeasuringLatency ? 'Sincronizando...' : 'Firestore'}</span>
                {typeof firestoreLatencyMs === 'number' && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                    hasCriticalLatency ? 'bg-amber-400/20 text-amber-200 font-black' : 'text-slate-400 font-semibold'
                  }`}>
                    {firestoreLatencyMs}ms
                  </span>
                )}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-400">Tasa BCV:</span>
              <strong className="text-emerald-400">{bcvRate} Bs/USD</strong>
            </div>

            <a
              href="/proyecto-gregory-izquierdo.zip"
              download="proyecto-gregory-izquierdo.zip"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs shadow-xs transition cursor-pointer"
              title="Descargar archivo .ZIP con todo el código fuente del proyecto"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Descargar .ZIP</span>
            </a>


            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              title="Volver a la tienda pública"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ir a la Tienda Web</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as any)}
            onLogout={onLogout}
            badges={{
              orders: pendingOrdersCount,
              topups: pendingTopupsCount,
              incidents: pendingIncidentsCount,
              credits: orders.filter((o) => o.paymentCondition === 'credito' && o.creditStatus !== 'paid').length,
              installments: orders.filter((o) => o.paymentCondition === 'cuotas' || Boolean(o.installmentPlan)).length,
              franchises: franchiseTopups.filter((r) => r.status === 'pending').length,
              franchise_apps: (franchiseApplications || []).filter((a) => a.status === 'pending').length,
              franchise_tickets: (franchiseTickets || []).filter((t) => t.status === 'open' || t.status === 'in_progress').length,
              sheets: sheetsState.isConnected
            }}
          />
          <div className="flex-1 overflow-y-auto bg-slate-100">

            {/* Critical Latency Warning for Administrator */}
            {hasCriticalLatency && typeof firestoreLatencyMs === 'number' && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="font-extrabold text-amber-950 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                      <span>⚠️ Alerta de Latencia Crítica en Base de Datos</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-mono text-[10px]">
                        {(firestoreLatencyMs / 1000).toFixed(2)}s
                      </span>
                    </h5>
                    <p className="text-[11px] text-amber-800">
                      El tiempo de respuesta supera el umbral crítico de 3 segundos ({firestoreLatencyMs}ms). Las operaciones podrían tardar más de lo habitual en reflejarse.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualMeasureLatency}
                  disabled={isMeasuringLatency}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isMeasuringLatency ? 'animate-spin' : ''}`} />
                  <span>Re-medir Latencia</span>
                </button>
              </div>
            )}

            {/* Critical Disconnection Warning for Administrator */}
            {(firestoreStatus === 'offline' || firestoreStatus === 'error') && (
              <div className="bg-rose-500/10 border-b border-rose-500/30 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-700 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="font-extrabold text-rose-950 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                      <span>❌ Desconexión de Base de Datos Cloud</span>
                    </h5>
                    <p className="text-[11px] text-rose-800">
                      {connectionError || 'No se pudo contactar el servidor de Firestore'}. Las operaciones se están guardando localmente en la cola de contingencia.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => validateFirestoreConnection()}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Probar Conexión</span>
                </button>
              </div>
            )}

            {/* Global critical supplier prepayment balance alerts */}
            {/* Global critical supplier prepayment balance alerts with Team Personal Notification Dispatcher */}
            {criticalSupplierAlerts.length > 0 && (
              <div className="bg-rose-50 border-b border-rose-200 flex flex-col shadow-xs animate-slideDown">
                {/* Main Alert Banner */}
                <div className="px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 animate-bounce shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-rose-950 uppercase flex items-center gap-1.5">
                        <span>⚠️ Alerta de Saldo Crítico de Proveedores</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-rose-200 text-rose-800">
                          {criticalSupplierAlerts.length}
                        </span>
                      </h4>
                      <p className="text-[10px] text-rose-700">
                        Los depósitos de prepago para compras mayoristas están por agotarse. Recarga saldo para evitar la interrupción del servicio.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {criticalSupplierAlerts.map((alert) => (
                      <span
                        key={alert.supplierName}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 ${
                          alert.status === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                        <span>{alert.supplierName}:</span>
                        <strong className="font-mono text-rose-950">${alert.remaining.toFixed(2)}</strong>
                      </span>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => setIsTeamAlertPanelOpen(!isTeamAlertPanelOpen)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] shadow-sm cursor-pointer transition flex items-center gap-1"
                    >
                      <span>📢 Notificar por WhatsApp</span>
                      <span>{isTeamAlertPanelOpen ? '▲' : '▼'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('purchases_finance')}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] shadow-sm cursor-pointer transition"
                    >
                      Registrar Recarga
                    </button>
                  </div>
                </div>

                {/* Expanded Team Personal Dispatcher Panel */}
                {isTeamAlertPanelOpen && (
                  <div className="px-6 pb-4 pt-1 border-t border-rose-200/50 bg-rose-50/50 space-y-3.5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-rose-200/30">
                      <div>
                        <h5 className="text-[11px] font-extrabold text-slate-800 uppercase">
                          Despacho Rápido de Alertas a Números Personales
                        </h5>
                        <p className="text-[10px] text-slate-500">
                          Envía un WhatsApp directo con la plantilla de alerta preformateada al celular personal de tu equipo.
                        </p>
                      </div>
                      
                      {/* Phone Configuration Inputs */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border">
                          <span className="font-bold text-slate-600">Gregori:</span>
                          <input
                            type="text"
                            placeholder="ej. 584121234567"
                            value={gregoriAlertPhone}
                            onChange={(e) => setGregoriAlertPhone(e.target.value)}
                            className="w-28 bg-transparent focus:outline-none font-mono text-xs text-slate-800"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border">
                          <span className="font-bold text-slate-600">Pablo:</span>
                          <input
                            type="text"
                            placeholder="ej. 584149876543"
                            value={pabloAlertPhone}
                            onChange={(e) => setPabloAlertPhone(e.target.value)}
                            className="w-28 bg-transparent focus:outline-none font-mono text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alerts Dispatch Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {criticalSupplierAlerts.map((alert) => {
                        const messageText = `⚠️ *[ALERTA CRÍTICA DE PROVEEDOR]*\n\nEstimado operador, el saldo de prepago para compras con el proveedor *${alert.supplierName}* ha bajado de su umbral de seguridad.\n\n• *Saldo Disponible:* $${alert.remaining.toFixed(2)} USD\n• *Estado:* ${alert.status === 'critical' ? '🔴 CRÍTICO' : '🟡 ADVERTENCIA'}\n\nPor favor, ingresa al panel contable y realiza una recarga a la brevedad para garantizar la continuidad del streaming.\n\n🔗 Enlace de Administración:\n${window.location.origin}`;
                        const encodedMessage = encodeURIComponent(messageText);

                        return (
                          <div key={alert.supplierName} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-800 block">
                                Proveedor: <span className="text-indigo-600">{alert.supplierName}</span>
                              </span>
                              <p className="text-[10px] text-slate-500 line-clamp-2">
                                Mensaje: "Saldo en nivel {alert.status === 'critical' ? 'crítico' : 'bajo'} (${alert.remaining} USD)"
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                              <span className="text-[9px] text-slate-400 mr-auto font-medium">Enviar Alerta a:</span>
                              <a
                                href={`https://wa.me/${gregoriAlertPhone}?text=${encodedMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] flex items-center gap-1 transition"
                              >
                                <span>📱 Gregori</span>
                              </a>
                              <a
                                href={`https://wa.me/${pabloAlertPhone}?text=${encodedMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] flex items-center gap-1 transition"
                              >
                                <span>📱 Pablo</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}


        {/* Tabs container removed, AdminSidebar handles navigation */}


        {/* Tab 1: Pedidos & Conciliación */}
        {activeTab === 'reconciliation' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending_reconciliation')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'pending_reconciliation'
                      ? 'bg-amber-100 text-amber-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendientes ({pendingOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'confirmed'
                      ? 'bg-sky-100 text-sky-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aprobados
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({orders.length})
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('credits')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Abrir módulo de asignación manual a crédito para 3era edad y clientes de confianza"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-slate-950" />
                  <span>+ Entrega a Crédito</span>
                </button>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar cliente, servicio, ref..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No hay pedidos en esta lista</h4>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Pedido / Fecha</th>
                        <th className="py-3 px-4">Cliente / Contacto</th>
                        <th className="py-3 px-4">Servicio & Plan</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Método & Ref</th>
                        <th className="py-3 px-4">Vendedor</th>
                        <th className="py-3 px-4">Fecha Corte</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((order) => {
                        const waCredsUrl = buildWhatsAppCredentialsUrl(order);
                        const tgCredsUrl = buildTelegramCredentialsUrl(order);

                        return (
                          <tr key={order.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-slate-900">#{order.id}</div>
                              <div className="text-[10px] text-slate-400">
                                {safeFormatDate(order.createdAt, undefined, '-')}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">{order.customerName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{order.customerEmail}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(order.productId === 'topup-zeny' || order.productName.toLowerCase().includes('zeny')) && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    💰 RECARGA ZENY
                                  </span>
                                )}
                                <span className="font-medium text-slate-900">{order.productName}</span>
                              </div>
                              <div className="text-[11px] text-indigo-600 font-semibold">{order.duration}</div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                              {(order.productId === 'topup-zeny' || order.productName.toLowerCase().includes('zeny')) ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-black">
                                  +{order.total.toFixed(2)} Zeny ($ USD)
                                </span>
                              ) : order.paidWithGrpay ? (
                                <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                                  Zeny Wallet
                                </span>
                              ) : (
                                formatCurrency(order.total, order.currency)
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{order.paymentMethodName}</div>
                              <div className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                                Ref: {order.referenceNumber}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                👔 {order.assignedSellerName || 'Gregori Izquierdo'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                              {order.credentials?.expirationDate ? (
                                <span className="text-slate-800 font-medium">
                                  {safeFormatDate(order.credentials.expirationDate, undefined, '-')}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {order.status === 'pending_reconciliation' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                  Pendiente
                                </span>
                              )}
                              {order.status === 'confirmed' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900">
                                  Aprobado
                                </span>
                              )}
                              {order.status === 'delivered' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                                  Entregado
                                </span>
                              )}
                              {order.status === 'rejected' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                                  Rechazado
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                              {order.status === 'pending_reconciliation' ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReconcile(order)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                                >
                                  Conciliar
                                </button>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReconcile(order)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                  {order.credentials && (
                                    <>
                                      <a
                                        href={waCredsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                                        title="Enviar por WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                      <a
                                        href={tgCredsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 transition"
                                        title="Enviar por Telegram"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </a>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Compras & Finanzas */}
        {activeTab === 'purchases_finance' && (
          <div className="p-6 overflow-y-auto">
            <AdminPurchasesAndFinanceManager
              purchases={supplierPurchases}
              onAddPurchase={onAddSupplierPurchase || (() => {})}
              onUpdatePurchase={onUpdateSupplierPurchase || (() => {})}
              onDeletePurchase={onDeleteSupplierPurchase || (() => {})}
              onUpdateCredentials={onUpdateSupplierCredentials || (() => {})}
              orders={orders}
              customers={customerUsers}
              walletTopups={walletTopups}
              expenses={expenses}
              branding={branding}
              products={products}
            />
          </div>
        )}

        {/* Tab: Catálogo & Tarjetas de Servicios */}
        {activeTab === 'products' && (
          <div className="p-6 overflow-y-auto">
            <AdminProductManager
              products={products}
              onUpdateProduct={onUpdateProduct || (() => {})}
              onAddProduct={onAddProduct || (() => {})}
              onDeleteProduct={onDeleteProduct || (() => {})}
              bcvRate={bcvRate}
            />
          </div>
        )}

        {/* Tab 2: Gestión de Usuarios: Clientes & Vendedores */}
        {activeTab === 'clients' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Gestión de Usuarios: Clientes & Vendedores ({customerUsers.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Identifica quién es comprador final o revendedor/vendedor para asignación de ventas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAddCustomerModal) onOpenAddCustomerModal();
                    else setIsAddUserModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Registrar cliente manual para tercera edad o cliente frecuente"
                >
                  <HeartHandshake className="w-4 h-4 text-slate-950" />
                  <span>+ Registrar Cliente (3era Edad / Confianza)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Usuario / Vendedor</span>
                </button>

                {sheetsState.isConnected && (
                  <button
                    type="button"
                    disabled={isSyncingClients}
                    onClick={async () => {
                      try {
                        setIsSyncingClients(true);
                        await onSyncCustomersToSheet();
                      } finally {
                        setIsSyncingClients(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{isSyncingClients ? 'Sincronizando...' : 'Sincronizar con Drive'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsGoogleContactsPanelOpen(!isGoogleContactsPanelOpen)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Importar y Exportar libreta con Google Contacts"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>{isGoogleContactsPanelOpen ? 'Ocultar Google Contacts' : 'Google Contacts API'}</span>
                </button>
              </div>
            </div>

            {isGoogleContactsPanelOpen && (
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 animate-scaleIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                      Sincronización & Mapeo de Google Contacts
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Importa contactos asignando campos personalizados y exporta tus clientes registrados de vuelta a la agenda de Google.
                    </p>
                  </div>
                  
                  {/* Field Mapping controls */}
                  <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-bold">Mapear Nombre:</span>
                      <select
                        value={nameMappingSource}
                        onChange={(e) => setNameMappingSource(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-sans focus:outline-none"
                      >
                        <option value="displayName">Nombre Completo</option>
                        <option value="givenName">Nombre de Pila</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-bold">Teléfono:</span>
                      <select
                        value={phoneMappingSource}
                        onChange={(e) => setPhoneMappingSource(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-sans focus:outline-none"
                      >
                        <option value="first">Primer Teléfono</option>
                        <option value="all">Suma de Teléfonos</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-bold">Correo:</span>
                      <select
                        value={emailMappingSource}
                        onChange={(e) => setEmailMappingSource(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-sans focus:outline-none"
                      >
                        <option value="first">Primer Correo</option>
                        <option value="all">Suma de Correos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {contactsError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl text-xs">
                    ⚠️ {contactsError}
                  </div>
                )}

                {contactsStatusMsg && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 rounded-xl text-xs font-bold font-sans">
                    ✓ {contactsStatusMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Import section */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="text-[11px] font-extrabold text-indigo-400 uppercase mb-1">
                        📥 Importador de Contactos (Mapeo Inteligente)
                      </h5>
                      <p className="text-[10px] text-slate-400 mb-3">
                        Carga los contactos de tu cuenta de Google y asígnalos a tu lista de clientes de streaming.
                      </p>

                      <button
                        type="button"
                        disabled={contactsLoading}
                        onClick={handleFetchGoogleContactsForTab}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {contactsLoading ? 'Cargando Agenda...' : 'Cargar Contactos desde Google'}
                      </button>

                      {googleContactsList.length > 0 && (
                        <div className="space-y-2 mt-3 animate-fadeIn">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{googleContactsList.length} contactos disponibles para mapeo:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const allSelected = googleContactsList.reduce((acc, c) => {
                                  acc[c.resourceName] = true;
                                  return acc;
                                }, {} as Record<string, boolean>);
                                setSelectedContactsToImport(allSelected);
                              }}
                              className="text-indigo-400 hover:underline"
                            >
                              Seleccionar Todos
                            </button>
                          </div>
                          
                          <div className="max-h-48 overflow-y-auto bg-slate-950 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
                            {googleContactsList.map(contact => (
                              <label key={contact.resourceName} className="flex items-center gap-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer text-[10px]">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedContactsToImport[contact.resourceName])}
                                  onChange={(e) => {
                                    setSelectedContactsToImport(prev => ({
                                      ...prev,
                                      [contact.resourceName]: e.target.checked
                                    }));
                                  }}
                                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-200 truncate">
                                    {nameMappingSource === 'displayName' ? contact.displayName : contact.givenName}
                                  </div>
                                  <div className="text-[9px] text-slate-400 truncate font-mono">
                                    📞 {contact.phones.join(', ') || 'N/A'} • ✉ {contact.emails.join(', ') || 'Sin correo'}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {googleContactsList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleImportMappedContacts}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer"
                      >
                        Confirmar e Importar Contactos Seleccionados
                      </button>
                    )}
                  </div>

                  {/* Export section */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                    <h5 className="text-[11px] font-extrabold text-indigo-400 uppercase mb-1">
                      📤 Exportador a Google Contacts (Tienda → Agenda)
                    </h5>
                    <p className="text-[10px] text-slate-400 mb-3">
                      Exporta tus clientes registrados en el sistema directamente de vuelta a la agenda de tu teléfono Google.
                    </p>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Clientes en el Sistema ({customerUsers.length}):
                      </span>
                      <div className="max-h-64 overflow-y-auto bg-slate-950 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
                        {customerUsers.map(cust => (
                          <div key={cust.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-900 rounded text-[10px]">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-200 truncate">{cust.name}</div>
                              <div className="text-[9px] text-slate-400 truncate font-mono">
                                {cust.phone} • {cust.email}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={Boolean(exportingCustomers[cust.id])}
                              onClick={() => handleExportCustomerToGoogleFromTab(cust)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] cursor-pointer shrink-0 transition"
                            >
                              {exportingCustomers[cust.id] ? 'Exportando...' : 'Exportar a Agenda 📤'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    userRoleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({customerUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('cliente')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    userRoleFilter === 'cliente'
                      ? 'bg-indigo-100 text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Clientes ({customerUsers.filter((u) => u.role !== 'vendedor').length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('vendedor')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    userRoleFilter === 'vendedor'
                      ? 'bg-purple-100 text-purple-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vendedores ({customerUsers.filter((u) => u.role === 'vendedor').length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar usuario o código..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Usuario / Nombre</th>
                    <th className="py-2.5 px-4">Rol & Tipo</th>
                    <th className="py-2.5 px-4">Cód. Vendedor</th>
                    <th className="py-2.5 px-4">Descuento (%)</th>
                    <th className="py-2.5 px-4">Contacto</th>
                    <th className="py-2.5 px-4">Saldo Zeny</th>
                    <th className="py-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerUsers
                    .filter((u) => {
                      const matchesRole = userRoleFilter === 'all' ? true : (u.role || 'cliente') === userRoleFilter;
                      const matchesSearch =
                        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.phone.includes(userSearch) ||
                        (u.sellerCode && u.sellerCode.toLowerCase().includes(userSearch.toLowerCase()));
                      return matchesRole && matchesSearch;
                    })
                    .map((cust) => {
                      const isSeller = cust.role === 'vendedor';

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              {cust.isSeniorCitizen && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
                                  👴 3era Edad
                                </span>
                              )}
                              {cust.isTrustClient && !cust.isSeniorCitizen && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
                                  🤝 Confianza
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Registrado: {safeFormatDate(cust.createdAt, undefined, 'Reciente')}
                              {cust.notes && ` • ${cust.notes}`}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                const newRole: UserRole = isSeller ? 'cliente' : 'vendedor';
                                onUpdateCustomerRole(
                                  cust.id,
                                  newRole,
                                  newRole === 'vendedor' ? (cust.sellerCode || `VEND-${Math.floor(10 + Math.random() * 90)}`) : undefined,
                                  cust.discountPercent
                                );
                              }}
                              title="Haz clic para alternar entre Cliente y Vendedor"
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                                isSeller
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              }`}
                            >
                              <span>{isSeller ? '👔 Vendedor' : '👤 Cliente'}</span>
                              <RefreshCw className="w-3 h-3 text-slate-400" />
                            </button>
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                            {isSeller ? (
                              <span className="bg-purple-100/70 text-purple-900 px-2 py-0.5 rounded text-[11px]">
                                {cust.sellerCode || 'VEND'}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="90"
                                defaultValue={cust.discountPercent !== undefined ? cust.discountPercent : (isSeller ? 15 : 0)}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  onUpdateCustomerRole(cust.id, cust.role || 'cliente', cust.sellerCode, val);
                                }}
                                className="w-14 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 bg-white"
                                title="Descuento personalizado en %"
                              />
                              <span className="text-[11px] font-bold text-slate-500">%</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-600 font-mono text-[11px]">{cust.email}</div>
                            <div className="text-indigo-600 font-mono text-[11px]">{cust.phone}</div>
                          </td>

                          <td className="py-3 px-4 font-extrabold text-indigo-700">
                            {formatGrpay(cust.zenyBalance)}
                          </td>

                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setGiftCustomer(cust)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 transition cursor-pointer inline-flex items-center gap-1"
                              title="Enviar regalo de saldo o membresía"
                            >
                              🎁 Regalar
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleSuspendCustomer(cust.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                cust.isSuspended
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={cust.isSuspended ? 'Cuenta suspendida para compras. Clic para reactivar.' : 'Clic para suspender compras de este usuario'}
                            >
                              {cust.isSuspended ? '🔴 Suspendido' : '🟢 Activo'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setManualCreditEmail(cust.email);
                                setActiveTab('topups');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs cursor-pointer"
                            >
                              + Abonar Saldo
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Modal for adding user directly from Admin */}
            {isAddUserModalOpen && (
              <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
                <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm">Registrar Nuevo Usuario</h4>
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newUserName.trim() || !newUserPhone.trim()) return;
                      const cleanPhone = (newUserPhone || '').replace(/\D/g, '');
                      const finalEmail = newUserEmail.trim()
                        ? newUserEmail.trim().toLowerCase()
                        : `${cleanPhone || 'usuario' + Math.floor(1000 + Math.random() * 9000)}@cliente.gregoryizquierdo.xyz`;

                      await onAddUserFromAdmin({
                        name: newUserName.trim(),
                        email: finalEmail,
                        phone: newUserPhone.trim(),
                        password: newUserPassword || '123456',
                        role: newUserRole,
                        sellerCode: newUserRole === 'vendedor' ? (newUserSellerCode.trim() || `VEND-${Math.floor(10 + Math.random() * 90)}`) : undefined,
                        discountPercent: newUserDiscountPercent
                      });
                      setIsAddUserModalOpen(false);
                      setNewUserName('');
                      setNewUserEmail('');
                      setNewUserPhone('');
                      setNewUserDiscountPercent(0);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tipo / Rol *</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewUserRole('cliente');
                            setNewUserDiscountPercent(0);
                          }}
                          className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                            newUserRole === 'cliente'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          👤 Cliente
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewUserRole('vendedor');
                            setNewUserDiscountPercent(15);
                          }}
                          className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                            newUserRole === 'vendedor'
                              ? 'bg-purple-50 border-purple-500 text-purple-700'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          👔 Vendedor
                        </button>
                      </div>
                    </div>

                    {newUserRole === 'vendedor' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Código de Vendedor</label>
                        <input
                          type="text"
                          value={newUserSellerCode}
                          onChange={(e) => setNewUserSellerCode(e.target.value)}
                          placeholder="Ej. VEND-05 o GREGORI-02"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Descuento Preferencial (% OFF)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={newUserDiscountPercent}
                          onChange={(e) => setNewUserDiscountPercent(parseInt(e.target.value) || 0)}
                          placeholder={newUserRole === 'vendedor' ? '15' : '0'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {newUserRole === 'vendedor' ? 'Margen de ganancia o descuento mayorista' : 'Descuento especial por fidelidad'}
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nombre y Apellido *</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Ej. Maria Delgado"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        WhatsApp / Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        placeholder="+58 414 000 0000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Correo Electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="correo@ejemplo.com (Opcional)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>


                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddUserModalOpen(false)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                      >
                        Guardar Usuario
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Créditos & Cuentas por Cobrar (3era Edad & Clientes de Confianza) */}
        {activeTab === 'credits' && (
          <div className="p-6 overflow-y-auto">
            <AdminCreditManager
              orders={orders}
              products={products}
              customers={customerUsers}
              bcvRate={bcvRate}
              templates={localTemplates}
              onOpenAddCustomerModal={() => {
                if (onOpenAddCustomerModal) onOpenAddCustomerModal();
                else setIsAddUserModalOpen(true);
              }}
              onSaveCreditOrder={(order, newCust) => {
                if (onSaveCreditOrder) {
                  onSaveCreditOrder(order, newCust);
                }
              }}
              onUpdateCreditStatus={(orderId, status, notes) => {
                if (onUpdateCreditStatus) {
                  onUpdateCreditStatus(orderId, status, notes);
                }
              }}
              onUpdateCreditDueDate={(orderId, newDate) => {
                if (onUpdateCreditDueDate) {
                  onUpdateCreditDueDate(orderId, newDate);
                }
              }}
            />
          </div>
        )}

        {/* Tab: Calendario de Vencimientos (Vista Dual: Mes a Mes + Lista Diaria con WhatsApp) */}
        {activeTab === 'calendar' && (
          <div className="p-6 overflow-y-auto">
            <AdminCalendarManager
              orders={orders}
              products={products}
              customers={customerUsers}
              bcvRate={bcvRate}
              templates={localTemplates}
              actionMapping={localMapping}
              onRenewOrder={(orderId, dur, newExp) => {
                if (onRenewOrder) onRenewOrder(orderId, dur, newExp);
              }}
              invoices={invoices}
            />
          </div>
        )}


        {/* Tab: Plantillas de Mensajes & WhatsApp (Sincronizable con Google Sheets) */}
        {activeTab === 'templates' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mensajes & Respuestas Automáticas</span>
                </div>
                <h3 className="text-xl font-extrabold">Plantillas de WhatsApp, Entregas y Bot</h3>
                <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                  Crea nuevas plantillas y define en qué acción o sección de la tienda se disparará cada una. Todo incluye automáticamente tu dominio oficial <strong>{DOMAIN_OFFICIAL}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                {sheetsState.isConnected && (
                  <button
                    type="button"
                    disabled={isSyncingTemplates}
                    onClick={async () => {
                      if (!onSyncMessageTemplates) return;
                      try {
                        setIsSyncingTemplates(true);
                        await onSyncMessageTemplates();
                      } finally {
                        setIsSyncingTemplates(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                    title="Exportar y sincronizar con la hoja Plantillas_Mensajes en Google Drive"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{isSyncingTemplates ? 'Sincronizando...' : 'Exportar a Google Sheets'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onSaveTemplates) onSaveTemplates(localTemplates);
                    if (onSaveActionMapping) onSaveActionMapping(localMapping);
                    setTemplateSaveSuccess(true);
                    setTimeout(() => setTemplateSaveSuccess(false), 2500);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Todo</span>
                </button>
              </div>
            </div>

            {templateSaveSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Plantillas y asignaciones guardadas con éxito! Se aplicarán en todos los envíos y disparadores.</span>
              </div>
            )}

            {/* Sub-Tabs: Editor de Plantillas vs Asignador de Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTemplateSubTab('editor')}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    templateSubTab === 'editor'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Editor de Plantillas ({localTemplates.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateSubTab('mapping')}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    templateSubTab === 'mapping'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>🎯 Asignación de Acciones (7 eventos)</span>
                </button>
              </div>

              {templateSubTab === 'editor' && (
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Crear Nueva Plantilla Personalizada</span>
                </button>
              )}
            </div>

            {/* Content for sub-tab: Editor */}
            {templateSubTab === 'editor' ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[500px]">
                {/* Left Selector List */}
                <div className="w-full md:w-72 p-4 bg-slate-50 space-y-2 shrink-0 overflow-y-auto max-h-[640px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-1">
                    Plantillas Disponibles
                  </span>
                  {localTemplates.map((t) => (
                    <div key={t.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          selectedTemplateId === t.id
                            ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-200'
                            : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 pr-6">
                          {t.category === 'whatsapp' ? (
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                          <span className="font-bold text-xs text-slate-900 line-clamp-1">{t.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{t.description}</p>
                        {t.isCustom && (
                          <span className="mt-1.5 inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                            ⭐ Creada por ti
                          </span>
                        )}
                      </button>

                      {t.isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar plantilla personalizada "${t.title}"?`)) {
                              setLocalTemplates((prev) => prev.filter((item) => item.id !== t.id));
                              setSelectedTemplateId(localTemplates[0]?.id || 'entrega_credito_senior');
                            }
                          }}
                          className="absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right Editor & Preview */}
                {(() => {
                  const currentTmpl =
                    localTemplates.find((t) => t.id === selectedTemplateId) || localTemplates[0];
                  if (!currentTmpl) return null;

                  const sampleVars = {
                    cliente: 'Don Pedro Martínez',
                    servicio: 'Netflix Premium',
                    tipo_cuenta: 'Perfil con PIN',
                    duracion: '1 mes',
                    usuario: 'pedro.martinez@gmail.com',
                    clave: 'Segura2026*',
                    perfil: 'Don Pedro',
                    pin: '7821',
                    monto_usd: '4.50',
                    monto_bs: (4.5 * bcvRate).toFixed(2),
                    fecha_limite: '15 de Octubre de 2026',
                    fecha_vencimiento: '29 de Octubre de 2026',
                    tasa_bcv: bcvRate.toFixed(2),
                    banco: 'Banesco (0134)',
                    pago_movil: '0414-3928410',
                    cedula: '20.892.410',
                    monto_renovacion_usd: '4.50',
                    monto_renovacion_bs: (4.5 * bcvRate).toFixed(2),
                    saldo_actual: '15.00',
                    tiempo_atencion: '15 minutos',
                    dominio: DOMAIN_OFFICIAL
                  };

                  const previewText = renderTemplate(currentTmpl.content, sampleVars);

                  return (
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">{currentTmpl.title}</h4>
                            {currentTmpl.isCustom && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold">
                                Personalizada
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{currentTmpl.description}</p>
                        </div>
                        {!currentTmpl.isCustom && (
                          <button
                            type="button"
                            onClick={() => {
                              const orig = DEFAULT_MESSAGE_TEMPLATES.find((x) => x.id === currentTmpl.id);
                              if (orig) {
                                setLocalTemplates((prev) =>
                                  prev.map((t) => (t.id === currentTmpl.id ? { ...t, content: orig.content } : t))
                                );
                              }
                            }}
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restablecer Original</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-600 block mb-1">
                          Variables admitidas (haz clic para insertar):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {currentTmpl.variables.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                setLocalTemplates((prev) =>
                                  prev.map((t) =>
                                    t.id === currentTmpl.id ? { ...t, content: t.content + ' ' + v } : t
                                  )
                                );
                              }}
                              className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-mono font-semibold border border-indigo-200 transition cursor-pointer"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Redacción de la Plantilla:
                        </label>
                        <textarea
                          rows={8}
                          value={currentTmpl.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalTemplates((prev) =>
                              prev.map((t) => (t.id === currentTmpl.id ? { ...t, content: val } : t))
                            );
                          }}
                          className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                        />
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            <span>Vista previa simulada:</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{DOMAIN_OFFICIAL}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
                          {previewText}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Sub-Tab: Asignación de Acciones */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950">
                  <strong className="block font-bold">🎯 Mapeo de Acciones del Sistema</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Selecciona qué plantilla (oficial o personalizada creada por ti) se activará en cada sección o acción de la plataforma.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PLATFORM_ACTION_DEFINITIONS.map((action) => {
                    const assignedId = localMapping[action.id] || action.defaultTemplateId;
                    const assignedTmpl = localTemplates.find((t) => t.id === assignedId);

                    return (
                      <div
                        key={action.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">
                            Acción #{action.category}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{action.name}</h4>
                          <p className="text-[11px] text-slate-500">{action.description}</p>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Plantilla asignada a esta acción:
                          </label>
                          <select
                            value={assignedId}
                            onChange={(e) => {
                              const newId = e.target.value;
                              setLocalMapping((prev) => ({
                                ...prev,
                                [action.id]: newId
                              }));
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                          >
                            {localTemplates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title} {t.isCustom ? '(⭐ Personalizada)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {assignedTmpl && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 italic font-mono line-clamp-2">
                            "{assignedTmpl.content.substring(0, 100)}..."
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL PARA CREAR NUEVA PLANTILLA DESDE EL TAB ADMIN */}
        {isNewTemplateModalOpen && (
          <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Crear Nueva Plantilla Personalizada</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTmplTitle.trim() || !newTmplContent.trim()) {
                    alert('Por favor completa el nombre y el contenido de la plantilla.');
                    return;
                  }
                  const createdId = `custom_${Date.now()}`;
                  const created: MessageTemplate = {
                    id: createdId,
                    title: newTmplTitle.trim(),
                    category: newTmplCategory,
                    description: newTmplDescription.trim() || 'Plantilla personalizada creada por ti.',
                    content: newTmplContent.trim(),
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
                      '{fecha_vencimiento}',
                      '{tasa_bcv}',
                      '{dominio}'
                    ],
                    isCustom: true,
                    lastModified: new Date().toISOString()
                  };

                  setLocalTemplates((prev) => [...prev, created]);
                  setSelectedTemplateId(createdId);

                  if (newTmplAssignAction !== 'personalizado') {
                    setLocalMapping((prev) => ({
                      ...prev,
                      [newTmplAssignAction]: createdId
                    }));
                  }

                  setIsNewTemplateModalOpen(false);
                  setNewTmplTitle('');
                  setNewTmplDescription('');
                  setNewTmplContent('');
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nombre de la Plantilla *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Recordatorio 3 Días Antes (Preventivo)"
                    value={newTmplTitle}
                    onChange={(e) => setNewTmplTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Canal
                    </label>
                    <select
                      value={newTmplCategory}
                      onChange={(e) => setNewTmplCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="bot">Bot Asistente</option>
                      <option value="notificacion">Notificación</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Asignar a Acción Ahora:
                    </label>
                    <select
                      value={newTmplAssignAction}
                      onChange={(e) => setNewTmplAssignAction(e.target.value as PlatformActionTrigger)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                    >
                      <option value="personalizado">Ninguna (Manual / Libre)</option>
                      <option value="aviso_vencimiento">4. Aviso de Vencimiento</option>
                      <option value="cobro_credito">3. Recordatorio de Cobro</option>
                      <option value="entrega_credito">2. Entrega a Crédito</option>
                      <option value="entrega_regular">1. Entrega Regular</option>
                      <option value="bienvenida_cliente">5. Bienvenida a Nuevos Clientes</option>
                      <option value="recarga_wallet">6. Recarga Zeny Acreditada</option>
                      <option value="soporte_falla">7. Respuesta a Incidencias</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Descripción Breve:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mensaje preventivo con 3 días de antelación"
                    value={newTmplDescription}
                    onChange={(e) => setNewTmplDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Contenido del Mensaje *
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder={`Hola *{cliente}*, tu servicio de *{servicio}* vence el {fecha_vencimiento}. Renovación: \${monto_renovacion_usd} USD (Bs. {monto_renovacion_bs} BCV). Visítanos en {dominio}`}
                    value={newTmplContent}
                    onChange={(e) => setNewTmplContent(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsNewTemplateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Plantilla</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab: Dominio Propio & DNS (www y raíz) */}
        {activeTab === 'domain' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Top Banner with BOTH domain options */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2 Accesos Oficiales Vinculados y Activos</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  www.gregoryizquierdo.xyz <span className="text-slate-400 font-normal text-base sm:text-lg">/</span> gregoryizquierdo.xyz
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Tus clientes y revendedores pueden entrar por cualquiera de las dos direcciones. Ambas cargan exactamente la misma plataforma en vivo con certificado SSL seguro.
                </p>
              </div>

              {/* Action Buttons for BOTH domains */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                <a
                  href="https://www.gregoryizquierdo.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-slate-950" />
                  <span>Abrir www.gregoryizquierdo.xyz</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                </a>
                <a
                  href="https://gregoryizquierdo.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Abrir gregoryizquierdo.xyz (Apex)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                </a>
              </div>
            </div>

            {/* Two Side-by-Side Cards: Option 1 (con WWW) and Option 2 (Directo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: www.gregoryizquierdo.xyz */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                    Opción 1: Con WWW
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">https://www.gregoryizquierdo.xyz</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ideal para navegadores tradicionales, enlaces en redes sociales y botones de WhatsApp:
                </p>
                <div className="p-3 rounded-xl bg-slate-100 font-mono font-bold text-indigo-700 text-xs flex items-center justify-between gap-2">
                  <span className="truncate">https://www.gregoryizquierdo.xyz</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('https://www.gregoryizquierdo.xyz');
                        setCopiedUrl('www');
                        setTimeout(() => setCopiedUrl(null), 2000);
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-900 text-[10px] font-sans font-bold cursor-pointer transition shadow-2xs"
                    >
                      {copiedUrl === 'www' ? '✓ Copiado' : 'Copiar'}
                    </button>
                    <a
                      href="https://www.gregoryizquierdo.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                      title="Visitar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Formato estándar universal reconocido por todos los clientes.</li>
                  <li>Recomendado para publicaciones en Instagram, TikTok y Bio.</li>
                </ul>
              </div>

              {/* Option 2: https://gregoryizquierdo.xyz */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    Opción 2: Raíz / Apex
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">https://gregoryizquierdo.xyz</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enlace directo corto, moderno y rápido para memorizar o enviar por chat:
                </p>
                <div className="p-3 rounded-xl bg-slate-100 font-mono font-bold text-emerald-700 text-xs flex items-center justify-between gap-2">
                  <span className="truncate">https://gregoryizquierdo.xyz</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('https://gregoryizquierdo.xyz');
                        setCopiedUrl('apex');
                        setTimeout(() => setCopiedUrl(null), 2000);
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-900 text-[10px] font-sans font-bold cursor-pointer transition shadow-2xs"
                    >
                      {copiedUrl === 'apex' ? '✓ Copiado' : 'Copiar'}
                    </button>
                    <a
                      href="https://gregoryizquierdo.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                      title="Visitar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Enlace limpio sin subdominio www.</li>
                  <li>Ambas opciones acceden a la misma tienda con catálogo y precios BCV.</li>
                </ul>
              </div>
            </div>

            {/* Access guide for Super Admin & Team */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Acceso Administrativo y de Vendedores</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tanto tú como tus vendedores entran exactamente por cualquiera de las dos direcciones:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block font-bold">👑 Super Administrador (Gregori):</strong>
                  <span className="text-slate-600 text-[11px] block mt-1">
                    Haz clic en el botón "Admin &amp; Conciliación" en la barra superior e introduce tu clave maestra para controlar finanzas, inventario de proveedores y conciliación.
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block font-bold">👔 Vendedores / Revendedores:</strong>
                  <span className="text-slate-600 text-[11px] block mt-1">
                    Inician sesión con su correo y clave creados en "Clientes &amp; Vendedores". Ven precios mayoristas y gestionan sus comisiones automáticamente.
                  </span>
                </div>
              </div>
            </div>

            {/* NUEVA SECCIÓN: MAPA DE TODAS LAS RUTAS ACTIVAS DEL DOMINIO OFICIAL */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Directorio de Rutas Activas en {DOMAIN_OFFICIAL.replace('https://', '')}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Rutas oficiales del sistema, para qué sirve cada una y enlaces directos de acceso:
                    </p>
                  </div>
                </div>

                <a
                  href="/rutas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <span>Abrir Portal de Rutas /rutas</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3 pt-2">
                {ACTIVE_SYSTEM_ROUTES.map((route, idx) => {
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                            {DOMAIN_OFFICIAL.replace('https://', '')}{route.path}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            = {route.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {route.accessRole}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(route.fullUrl);
                              setCopiedUrl(`route-${route.path}`);
                              setTimeout(() => setCopiedUrl(null), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-bold cursor-pointer transition shadow-2xs flex items-center gap-1"
                          >
                            <span>{copiedUrl === `route-${route.path}` ? '✓ Copiado' : 'Copiar URL'}</span>
                          </button>
                          <a
                            href={route.path.includes(':') ? '/invoice/FACT-DEMO-01' : route.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition"
                            title="Probar ruta"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        🎯 <strong>Función:</strong> {route.purpose} — {route.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 3: Configuración DNS para apuntar tu dominio */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Configuración DNS en tu Registrador de Dominio (Cloudflare, Namecheap, Hostinger, GoDaddy)
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Para que tanto <strong>www.gregoryizquierdo.xyz</strong> como <strong>gregoryizquierdo.xyz</strong> carguen tu plataforma con certificado SSL (candado verde HTTPS) sin costo adicional, ingresa a la zona DNS de tu dominio y asegúrate de tener ambos registros:
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 font-bold text-slate-600 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Tipo de Registro</th>
                      <th className="py-2.5 px-4">Host / Nombre</th>
                      <th className="py-2.5 px-4">Destino / Valor</th>
                      <th className="py-2.5 px-4">Proxy / SSL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-3 px-4 font-bold text-indigo-700">CNAME</td>
                      <td className="py-3 px-4 font-bold text-slate-900">www</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 break-all">
                        ais-pre-v2vfe75zpwpp7udmwkxp7y-875522824060.us-east1.run.app
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-sans font-bold">Activo (DNS + Proxy SSL)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-indigo-700">CNAME / ALIAS</td>
                      <td className="py-3 px-4 font-bold text-slate-900">@ (raíz)</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 break-all">
                        ais-pre-v2vfe75zpwpp7udmwkxp7y-875522824060.us-east1.run.app
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-sans font-bold">Activo (Cloudflare CNAME Flattening)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                <strong className="block font-bold">💡 Recomendación para Certificado SSL Gratis Inmediato:</strong>
                <p className="text-[11px] leading-relaxed">
                  Si gestionas el dominio a través de <strong>Cloudflare</strong> (es gratuito), activa la nube naranja en ambos registros CNAME. Cloudflare emitirá el certificado SSL HTTPS de forma automática en 2 minutos y acelerará la carga para clientes en Venezuela y el mundo.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Tab 3: Conciliación Mensual & Ingresos por Métodos */}
        {activeTab === 'finance' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Top Correlation KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Ventas Brutas */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block mb-1">
                  1. Ventas Brutas (+)
                </span>
                <div className="text-xl font-black text-indigo-950 font-mono">
                  ${totalRevenueUsd.toFixed(2)} USD
                </div>
                <span className="text-[10px] text-indigo-600 block mt-1 font-medium">
                  Bs. {totalRevenueBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Compras de Cuentas */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                  2. Compras Mayoristas (-)
                </span>
                <div className="text-xl font-black text-amber-950 font-mono">
                  -${supplierPurchases.reduce((sum, p) => sum + (p.costUsd || 0), 0).toFixed(2)} USD
                </div>
                <span className="text-[10px] text-amber-600 block mt-1">
                  Bs. {(supplierPurchases.reduce((sum, p) => sum + (p.costUsd || 0), 0) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Gastos Operativos */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 uppercase block mb-1">
                  3. Gastos Operativos (-)
                </span>
                <div className="text-xl font-black text-rose-950 font-mono">
                  -${expenses.reduce((sum, e) => sum + (e.amountUsd || 0), 0).toFixed(2)} USD
                </div>
                <span className="text-[10px] text-rose-600 block mt-1">
                  Bs. {expenses.reduce((sum, e) => sum + (e.amountBs || 0), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Ganancia Neta Real */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                    4. Ganancia Neta Real (=)
                  </span>
                  <div className="text-xl font-black text-emerald-950 font-mono">
                    ${(
                      totalRevenueUsd -
                      supplierPurchases.reduce((sum, p) => sum + (p.costUsd || 0), 0) -
                      expenses.reduce((sum, e) => sum + (e.amountUsd || 0), 0)
                    ).toFixed(2)} USD
                  </div>
                  <span className="text-[10px] text-emerald-600 block mt-1 font-bold">
                    Bs. {(
                      (totalRevenueUsd -
                        supplierPurchases.reduce((sum, p) => sum + (p.costUsd || 0), 0) -
                        expenses.reduce((sum, e) => sum + (e.amountUsd || 0), 0)) *
                      bcvRate
                    ).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions and Drive Sync Row */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('expenses')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 font-bold text-xs transition cursor-pointer"
                >
                  📉 Registrar Gastos (Egresos)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('finance')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 font-bold text-xs transition cursor-pointer"
                >
                  📊 Ver Conciliación Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('purchases_finance')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 font-bold text-xs transition cursor-pointer"
                >
                  📦 Compras Mayoristas
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isSyncingReports || !sheetsState.isConnected}
                  onClick={async () => {
                    try {
                      setIsSyncingReports(true);
                      await onSyncReportsToSheet();
                    } finally {
                      setIsSyncingReports(false);
                    }
                  }}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSyncingReports ? 'Sincronizando...' : 'Exportar Conciliación a Drive'}</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas por Servicio */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Ventas por Servicio / Plataforma</h4>
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Servicio</th>
                      <th className="py-2 px-3">Unidades</th>
                      <th className="py-2 px-3 text-right">Total USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(serviceStats).map(([sName, stat]) => (
                      <tr key={sName} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{sName}</td>
                        <td className="py-2.5 px-3">{stat.count} pantallas/cuentas</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${stat.totalUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen por Método de Pago */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Ingresos por Método de Pago</h4>
                  <PieChart className="w-4 h-4 text-slate-400" />
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Método</th>
                      <th className="py-2 px-3">Transacciones</th>
                      <th className="py-2 px-3 text-right">Total USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(methodStats).map(([mName, stat]) => (
                      <tr key={mName} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{mName}</td>
                        <td className="py-2.5 px-3">{stat.count} pagos</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${stat.totalUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



        {/* Tab 5: Wallet Zeny */}
        {activeTab === 'topups' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Abonar Saldo Zeny Manualmente
                </h3>
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">
                  1 Zeny = 1 USD. Acredita o disminuye saldo de la billetera virtual.
                </p>
                <select
                  value={manualCreditOperation}
                  onChange={(e) => setManualCreditOperation(e.target.value as 'credit' | 'debit')}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-xs bg-white text-indigo-700"
                >
                  <option value="credit">Acreditar Saldo (+)</option>
                  <option value="debit">Disminuir / Debitar (-)</option>
                </select>
              </div>
              <form onSubmit={handleManualCreditSubmit} className="flex flex-wrap items-center gap-3">
                <input
                  type="email"
                  required
                  value={manualCreditEmail}
                  onChange={(e) => setManualCreditEmail(e.target.value)}
                  placeholder="Correo del cliente registrado (ej. cliente@gmail.com)"
                  className="flex-1 min-w-[240px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={manualCreditAmount}
                    onChange={(e) => setManualCreditAmount(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold font-mono"
                  />
                  <span className="text-xs font-bold text-slate-500">Zeny</span>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                >
                  Acreditar Saldo
                </button>
              </form>
              {manualCreditSuccess && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {manualCreditSuccess}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Solicitudes de Recarga de Clientes
              </h4>
              {walletTopups.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">No hay solicitudes de recarga pendientes.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">ID</th>
                        <th className="py-2.5 px-4">Cliente</th>
                        <th className="py-2.5 px-4">Monto Zeny</th>
                        <th className="py-2.5 px-4">Transferido</th>
                        <th className="py-2.5 px-4">Método & Ref</th>
                        <th className="py-2.5 px-4">Estado</th>
                        <th className="py-2.5 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {walletTopups.map((topup) => (
                        <tr key={topup.id}>
                          <td className="py-3 px-4 font-mono font-bold">#{topup.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold">{topup.customerName}</div>
                            <div className="text-[10px] text-slate-400">{topup.customerEmail}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-700">+{formatGrpay(topup.amountZenyPoints || topup.amountZeny || 0)}</td>
                          <td className="py-3 px-4">{formatCurrency(topup.amountPaid, topup.currency)}</td>
                          <td className="py-3 px-4">
                            <div>{topup.paymentMethodName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Ref: {topup.referenceNumber}</div>
                          </td>
                          <td className="py-3 px-4">
                            {topup.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                Por Validar
                              </span>
                            )}
                            {topup.status === 'approved' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                                Acreditado ✓
                              </span>
                            )}
                            {topup.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                                Rechazado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {topup.status === 'pending' && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onApproveTopup(topup.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                                >
                                  Aprobar & Acreditar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRejectTopup(topup.id)}
                                  className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 text-xs cursor-pointer"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Métodos de Pago */}
        {activeTab === 'methods' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {/* Header con estadísticas y controles */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Tabla Oficial de Métodos de Pago (Pasarela Manual)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Configuración precisa con todos los campos especificados por método de pago para compras de clientes y conciliación administrativa.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                    {paymentMethods.length} Métodos Registrados
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100">
                    {paymentMethods.filter((m) => m.active).length} Activos
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Campo Obligatorio: "enviar comprobante de pago para conciliacion"
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Botón Restablecer Métodos Oficiales */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Deseas restablecer la tabla a los 9 Métodos Oficiales configurados (+ Wallet Zeny)?')) {
                      INITIAL_PAYMENT_METHODS.forEach((officialMethod) => {
                        onUpdatePaymentMethod(officialMethod);
                      });
                      alert('¡Métodos de pago restablecidos a los 9 oficiales con todos sus campos exactos!');
                    }
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Restablece los 9 métodos de pago con los datos exactos solicitados"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Restablecer Oficiales</span>
                </button>

                {/* Toggle Vista Tabla / Tarjetas */}
                <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPmViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      pmViewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Tabla</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPmViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      pmViewMode === 'cards' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </button>
                </div>

                {/* Botón Agregar Nuevo */}
                <button
                  type="button"
                  onClick={() => setIsNewPmModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Método</span>
                </button>
              </div>
            </div>

            {pmViewMode === 'table' ? (
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3 min-w-[140px]">Método de Pago</th>
                      <th className="py-3 px-3 min-w-[160px]">N° Cuenta / Teléfono / ID</th>
                      <th className="py-3 px-3 min-w-[150px]">Titular / Beneficiario</th>
                      <th className="py-3 px-3 min-w-[250px]">Detalles (Banco, Doc, Email)</th>
                      <th className="py-3 px-3 min-w-[200px]">Conciliación Obligatoria</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentMethods.map((method, index) => {
                      const idValue = method.accountNumber || method.userId || method.phone || method.username || 'N/A';
                      const bankDetails = [
                        method.bankName ? `Banco: ${method.bankName}` : null,
                        method.bankCode ? `Cod: ${method.bankCode}` : null,
                        method.accountType ? `Tipo: ${method.accountType}` : null,
                        method.docId ? `Doc: ${method.docId}` : null,
                        method.email ? `Email: ${method.email}` : null,
                        method.routing ? `Routing: ${method.routing}` : null,
                        method.bankAddress ? `Dir: ${method.bankAddress}` : null,
                      ].filter(Boolean).join(' | ');

                      return (
                        <tr key={method.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-3 text-center font-bold text-slate-400 font-mono text-[10px]">
                            {index + 1}
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <CreditCard className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 text-xs tracking-tight">{method.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                  {method.badge || method.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 group">
                              <span className="font-mono font-black text-slate-900 truncate">
                                {idValue}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(idValue);
                                  alert('Copiado al portapapeles');
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                title="Copiar"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <span className="font-extrabold text-slate-800">
                              {method.holderName || 'N/A'}
                            </span>
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <div className="text-[10px] text-slate-600 leading-relaxed max-w-[250px] italic">
                              {bankDetails || 'N/D'}
                            </div>
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-[9px] uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                              <span>{method.instructions || 'enviar comprobante de pago para conciliacion'}</span>
                            </div>
                          </td>

                          <td className="py-4 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdatePaymentMethod({
                                  ...method,
                                  active: !method.active
                                });
                              }}
                              className={`w-20 py-1.5 rounded-full text-[10px] font-black transition cursor-pointer border shadow-xs ${
                                method.active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {method.active ? 'ACTIVO' : 'INACTIVO'}
                            </button>
                          </td>

                          <td className="py-4 px-4 text-right align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingMethod(method)}
                                className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                title="Editar Datos"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('¿Deseas eliminar este método de pago?')) {
                                    onDeletePaymentMethod && onDeletePaymentMethod(method.id);
                                  }
                                }}
                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (

              /* VISTA 2: TARJETAS DETALLADAS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          <span>{method.name}</span>
                          {method.badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingMethod(method)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeletePaymentMethod && !method.id.includes('zeny') && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Eliminar el método "${method.name}"?`)) {
                                  onDeletePaymentMethod(method.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <PaymentMethodFieldsDisplay
                        method={method}
                        compact={false}
                        showConciliationNotice={true}
                        showCopyButtons={true}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium">Monedas:</span>
                        {(method.acceptedCurrencies || ['USD']).map((c) => (
                          <span key={c} className="font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded bg-slate-100">
                            {c}
                          </span>
                        ))}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          method.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {method.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODAL PARA EDITAR MÉTODO CON TODOS SUS CAMPOS */}
            {editingMethod && (
              <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scaleIn space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                        <Edit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">
                          Editar Campos: {editingMethod.name}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Ajusta los datos bancarios y la instrucción de conciliación.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingMethod(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nombre del Método *</label>
                        <input
                          type="text"
                          value={editingMethod.name}
                          onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Badge / Etiqueta</label>
                        <input
                          type="text"
                          value={editingMethod.badge || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, badge: e.target.value })}
                          placeholder="Ej: BNC, Binance, Lead Bank..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    {/* Campos Bancarios */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Banco</label>
                        <input
                          type="text"
                          value={editingMethod.bankName || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, bankName: e.target.value })}
                          placeholder="Ej: BNC, Guayaquil, Lead Bank..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Código Banco (Cod)</label>
                        <input
                          type="text"
                          value={editingMethod.bankCode || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, bankCode: e.target.value })}
                          placeholder="Ej: 0191, 0104..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={editingMethod.phone || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, phone: e.target.value })}
                          placeholder="Ej: 04242809333"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Documento / Cédula / RIF</label>
                        <input
                          type="text"
                          value={editingMethod.docId || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, docId: e.target.value })}
                          placeholder="Ej: V 18931731, J 506393794, 2451655498"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Titular de la Cuenta</label>
                        <input
                          type="text"
                          value={editingMethod.holderName || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, holderName: e.target.value })}
                          placeholder="Nombre del titular"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Tipo de Cuenta</label>
                        <input
                          type="text"
                          value={editingMethod.accountType || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, accountType: e.target.value })}
                          placeholder="Ahorros / Corriente"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Número de Cuenta / ID / Cuenta</label>
                        <input
                          type="text"
                          value={editingMethod.accountNumber || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, accountNumber: e.target.value })}
                          placeholder="Ej: 0042286503, 210345561126..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                        <input
                          type="text"
                          value={editingMethod.email || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, email: e.target.value })}
                          placeholder="gregoryrodriguez2021@gmail.com"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    {/* Identificadores y Routing */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">ID Usuario / Binance</label>
                        <input
                          type="text"
                          value={editingMethod.userId || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, userId: e.target.value })}
                          placeholder="393089335, 7604..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Usuario</label>
                        <input
                          type="text"
                          value={editingMethod.username || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, username: e.target.value })}
                          placeholder="gair1990..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Routing (EEUU)</label>
                        <input
                          type="text"
                          value={editingMethod.routing || ''}
                          onChange={(e) => setEditingMethod({ ...editingMethod, routing: e.target.value })}
                          placeholder="101019644..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Dirección del Banco</label>
                      <input
                        type="text"
                        value={editingMethod.bankAddress || ''}
                        onChange={(e) => setEditingMethod({ ...editingMethod, bankAddress: e.target.value })}
                        placeholder="1801 Main St., Kansas City. MO 64108"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Instrucción de Conciliación * (Requisito)
                      </label>
                      <input
                        type="text"
                        value={editingMethod.instructions}
                        onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                        placeholder="enviar comprobante de pago para conciliacion"
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-semibold"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block">Estado del Método</span>
                        <span className="text-[11px] text-slate-500">
                          {editingMethod.active ? 'Disponible para los clientes en compras y recargas' : 'Oculto para los clientes'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingMethod({ ...editingMethod, active: !editingMethod.active })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                          editingMethod.active
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {editingMethod.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingMethod(null)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdatePaymentMethod(editingMethod);
                        setEditingMethod(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md transition"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL PARA AGREGAR NUEVO MÉTODO */}
            {isNewPmModalOpen && (
              <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scaleIn space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Agregar Nuevo Método de Pago</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsNewPmModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nombre del Método *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Pago Móvil, Binance, Transferencia..."
                        value={newPmName}
                        onChange={(e) => setNewPmName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Banco</label>
                        <input
                          type="text"
                          placeholder="Ej: BNC, Guayaquil, Lead Bank..."
                          value={newPmBankName}
                          onChange={(e) => setNewPmBankName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Código Banco (Cod)</label>
                        <input
                          type="text"
                          placeholder="Ej: 0191, 0104..."
                          value={newPmBankCode}
                          onChange={(e) => setNewPmBankCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Teléfono</label>
                        <input
                          type="text"
                          placeholder="Ej: 04242809333"
                          value={newPmPhone}
                          onChange={(e) => setNewPmPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Documento / Cédula / RIF</label>
                        <input
                          type="text"
                          placeholder="Ej: V 18931731, J 506393794"
                          value={newPmDocId}
                          onChange={(e) => setNewPmDocId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Titular</label>
                        <input
                          type="text"
                          placeholder="Nombre del titular"
                          value={newPmHolder}
                          onChange={(e) => setNewPmHolder(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Número de Cuenta / ID</label>
                        <input
                          type="text"
                          placeholder="Número de cuenta o usuario"
                          value={newPmAccount}
                          onChange={(e) => setNewPmAccount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                        <input
                          type="text"
                          placeholder="gregoryrodriguez2021@gmail.com"
                          value={newPmEmail}
                          onChange={(e) => setNewPmEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Moneda Principal</label>
                        <select
                          value={newPmCurrency}
                          onChange={(e) => setNewPmCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50"
                        >
                          <option value="USD">Dólares ($ USD)</option>
                          <option value="BS">Bolívares (Bs.)</option>
                          <option value="USDT">Tether (USDT)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Instrucción de Conciliación *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPmInstructions}
                        onChange={(e) => setNewPmInstructions(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsNewPmModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPmName.trim()) {
                          alert('Por favor ingresa el nombre del método.');
                          return;
                        }
                        if (onAddPaymentMethod) {
                          onAddPaymentMethod({
                            id: `pm-${Date.now()}`,
                            name: newPmName.trim(),
                            shortName: newPmName.trim().slice(0, 10),
                            category: newPmCurrency === 'BS' ? 'venezuela' : newPmCurrency === 'USDT' ? 'cripto' : 'internacional',
                            holderName: newPmHolder || newPmEmail || newPmName,
                            accountNumber: newPmAccount || newPmPhone || newPmUserId || '0000',
                            accountTypeLabel: newPmBankName || 'Transferencia',
                            instructions: newPmInstructions || 'enviar comprobante de pago para conciliacion',
                            bankName: newPmBankName || undefined,
                            bankCode: newPmBankCode || undefined,
                            phone: newPmPhone || undefined,
                            docId: newPmDocId || undefined,
                            email: newPmEmail || undefined,
                            accountType: newPmAccountType || undefined,
                            routing: newPmRouting || undefined,
                            bankAddress: newPmBankAddress || undefined,
                            userId: newPmUserId || undefined,
                            username: newPmUsername || undefined,
                            active: true,
                            acceptedCurrencies: [newPmCurrency]
                          });
                        }
                        setNewPmName('');
                        setNewPmAccount('');
                        setNewPmBankName('');
                        setNewPmBankCode('');
                        setNewPmDocId('');
                        setNewPmEmail('');
                        setIsNewPmModalOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md transition"
                    >
                      Crear Método
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Control Tasa BCV */}
        {activeTab === 'bcv' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Tasa Oficial BCV</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Se actualiza automáticamente todos los días. Puedes ingresar un valor manual si deseas forzarla.
              </p>
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Tasa Activa</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono">{bcvRate} Bs/USD</div>
                </div>
                <div className="border-l pl-4 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={customBcvRate}
                    onChange={(e) => setCustomBcvRate(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateBcvRate(customBcvRate)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    Guardar Tasa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Supabase Cloud SQL Database Dashboard & Explorer (REMOVED) */}
        {false && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Banner Superior de Supabase */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-indigo-500/20 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Auditoría de Sistemas & Base de Datos Relacional</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Explorador de Base de Datos Supabase (PostgreSQL)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Monitorea en tiempo real las tablas estructuradas de Gregory Izquierdo Streaming. Consulta los proveedores asignados, perfiles de cuentas madre, logs de reversos y categorías de servicios directamente desde la nube de Supabase.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchSupabaseRecords(selectedSupabaseTable)}
                    disabled={supabaseExplorerLoading}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${supabaseExplorerLoading ? 'animate-spin' : ''}`} />
                    <span>{supabaseExplorerLoading ? 'Refrescando...' : 'Refrescar Tablas'}</span>
                  </button>

                  <a
                    href="/proyecto-gregory-izquierdo.zip"
                    download="proyecto-gregory-izquierdo.zip"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Descargar paquete completo del proyecto en formato .ZIP"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Código Fuente .ZIP</span>
                  </a>
                </div>
              </div>

              {/* Tarjetas de Métricas de Conexión en Vivo y Formulario de Ajustes */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Estado de Conexión</span>
                      <button
                        type="button"
                        onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                      >
                        {showCredentialsForm ? 'Cerrar Ajustes' : 'Configurar'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <strong className={isSupabaseConfigured ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'}>
                        {isSupabaseConfigured ? '● Conectado (Nube Supabase)' : '○ Modo Sandbox (Memoria)'}
                      </strong>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Motor de Datos</span>
                    <div>
                      <strong className="text-white font-extrabold">PostgreSQL 15 + Supabase SDK</strong>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Credenciales Activas</span>
                    <div className="truncate" title={isSupabaseConfigured ? 'Personalizadas guardadas' : 'Defecto del sistema'}>
                      <strong className="text-indigo-300 font-extrabold">
                        {localStorage.getItem('CUSTOM_SUPABASE_URL') ? 'Personalizadas (localStorage)' : 'Configuración de Servidor'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Formulario de Configuración Directa */}
                {showCredentialsForm && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-3 animate-fadeIn">
                    <h4 className="font-bold text-white text-sm">Configuración de Conexión Directa a Supabase</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Conecta la aplicación directamente a tu propio proyecto de Supabase ingresando las credenciales de tu proyecto. Se almacenarán localmente de forma segura en tu navegador.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-slate-400 font-medium">Supabase Project URL:</label>
                        <input
                          type="text"
                          placeholder="https://xxxx.supabase.co"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-400 font-medium">Supabase Anon Key:</label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                          value={customKeyInput}
                          onChange={(e) => setCustomKeyInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveCredentials}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Guardar y Conectar
                      </button>
                      <button
                        type="button"
                        onClick={handleResetCredentials}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer"
                      >
                        Restaurar Valores por Defecto
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL DE CONTROL DE SINCRONIZACIÓN EN TIEMPO REAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Estadísticas de Registro Local */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span>Estado y Conteo de Registros Locales</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      Listo para sincronizar
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    A continuación se listan las entidades y el número de registros en la memoria local del cliente que se fusionarán con Supabase de forma bidireccional.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-slate-500 font-medium block">👥 Clientes</span>
                    <div className="text-lg font-black text-slate-800 font-mono tabular-nums">
                      {customerUsers.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-slate-500 font-medium block">🛍️ Productos</span>
                    <div className="text-lg font-black text-slate-800 font-mono tabular-nums">
                      {products.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-slate-500 font-medium block">💳 M. de Pago</span>
                    <div className="text-lg font-black text-slate-800 font-mono tabular-nums">
                      {paymentMethods.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-slate-500 font-medium block">❓ Preguntas FAQ</span>
                    <div className="text-lg font-black text-slate-800 font-mono tabular-nums">
                      {faqItems.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-slate-500 font-medium block">💎 Abonos Zeny</span>
                    <div className="text-lg font-black text-slate-800 font-mono tabular-nums">
                      {walletTopups.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-slate-500 font-medium block">🏢 Franquicias</span>
                    <div className="text-lg font-black text-slate-800 font-mono tabular-nums">
                      {franchises?.length || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 col-span-2">
                    <span className="text-slate-500 font-medium block">📝 Recargas de Franquicias</span>
                    <div className="text-lg font-black text-slate-800 font-mono tabular-nums">
                      {franchiseTopups?.length || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Botón de Sincronización y Logs */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                      Controlador de Sincronización
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Haz clic abajo para iniciar la sincronización bidireccional inmediata. El sistema descargará nuevos registros en la nube y subirá las inserciones locales creadas fuera de línea o recientemente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualSupabaseSync}
                    disabled={isDbSyncing || !isSupabaseConfigured}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md ${
                      isDbSyncing
                        ? 'bg-amber-600 text-white cursor-not-allowed animate-pulse'
                        : !isSupabaseConfigured
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${isDbSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isDbSyncing
                        ? 'Sincronizando Base de Datos...'
                        : !isSupabaseConfigured
                        ? 'Configura Supabase para Sincronizar'
                        : 'Sincronizar Todo con Supabase'}
                    </span>
                  </button>
                </div>

                {/* Consola de logs */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-mono block">Log de Sincronización:</span>
                  <div className="p-3.5 rounded-xl bg-black border border-slate-800 font-mono text-[10px] text-emerald-400 h-28 overflow-y-auto space-y-1 scrollbar-thin">
                    {dbSyncLogs.length === 0 ? (
                      <span className="text-slate-500">Esperando inicio...</span>
                    ) : (
                      dbSyncLogs.map((log, i) => (
                        <div key={i} className="truncate">{log}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA DE CONTENIDOS Y SELECTOR DE TABLAS DE SUPABASE */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span>Selecciona una Tabla para Explorar</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                      SQL DB
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">Haz clic en una pestaña para cargar los registros en vivo desde Supabase, o usa la búsqueda libre abajo.</p>
                </div>

                {/* Consulta de Tabla Personalizada Libre */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto sm:max-w-md shrink-0">
                  <input
                    type="text"
                    placeholder="Buscar tabla personalizada (ej. logs)..."
                    value={customTableName}
                    onChange={(e) => setCustomTableName(e.target.value)}
                    className="w-full bg-transparent text-slate-800 text-xs font-semibold focus:outline-none placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTableName.trim()) {
                        setSelectedSupabaseTable(customTableName.trim());
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer shrink-0 transition"
                  >
                    Consultar
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-w-3xl">
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('categories')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'categories'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    📂 Categorías
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('parent_accounts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'parent_accounts'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    📺 Cuentas Madre
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('account_profiles')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'account_profiles'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    👤 Perfiles
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('refunds')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'refunds'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    💸 Reversos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('customers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'customers'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    👥 Clientes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('products')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'products'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    🛍️ Productos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('payment_methods')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'payment_methods'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    💳 Métodos de Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('faq_items')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'faq_items'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    ❓ FAQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('wallet_topups')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'wallet_topups'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    💎 Abonos Zeny
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('franchises')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'franchises'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    🏢 Franquicias
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSupabaseTable('franchise_topups')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSupabaseTable === 'franchise_topups'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    📈 Abonos Franquicias
                  </button>
                </div>
              </div>

              {/* Botón de Inserción de Prueba e Instructivo de Tablas */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50/70 border border-indigo-100 rounded-3xl text-xs">
                <div className="space-y-1 text-slate-700">
                  <p className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>Consola de Acciones en Vivo:</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Inserta un registro real de demostración en la tabla seleccionada para comprobar que se escribe en Supabase de forma instantánea.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {supabaseTestInsertStatus && (
                    <span className="text-[11px] text-indigo-700 bg-white border border-indigo-100 px-3 py-1.5 rounded-xl font-bold font-mono animate-fadeIn">
                      {supabaseTestInsertStatus}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setSupabaseTestInsertStatus('Insertando...');
                      try {
                        if (selectedSupabaseTable === 'categories') {
                          const testId = `cat-test-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('categories').insert({
                            id: testId,
                            name: `Streaming Test ${Math.floor(100 + Math.random() * 900)}`,
                            icon: 'Tv',
                            description: 'Categoría de prueba creada desde el panel de control de base de datos Supabase.'
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Categoría insertada ID: ${testId}`);
                        } else if (selectedSupabaseTable === 'parent_accounts') {
                          const randomAcc = Math.floor(1000 + Math.random() * 9000);
                          const { error } = await supabase.from('parent_accounts').insert({
                            email: `proveedor-${randomAcc}@test.com`,
                            password: 'password-secreta',
                            provider: 'Netflix 4K Test',
                            max_slots: 5,
                            active_slots: 0,
                            purchase_price: 9.99
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Cuenta madre creada para proveedor-${randomAcc}`);
                        } else if (selectedSupabaseTable === 'account_profiles') {
                          const { error } = await supabase.from('account_profiles').insert({
                            parent_account_id: 1,
                            profile_name: `Perfil Test ${Math.floor(10 + Math.random() * 90)}`,
                            pin: '1234',
                            assigned_customer: 'Gregory Izquierdo'
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Perfil asignado.`);
                        } else if (selectedSupabaseTable === 'refunds') {
                          const { error } = await supabase.from('refunds').insert({
                            order_id: `ORD-TEST-${Math.floor(100 + Math.random() * 900)}`,
                            customer_email: 'test@cliente.com',
                            amount: 5.50,
                            notes: 'Reverso simulado desde administrador Supabase.'
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus('¡Éxito! Log de reverso creado.');
                        } else if (selectedSupabaseTable === 'customers') {
                          const testId = `cust-test-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('customers').insert({
                            id: testId,
                            name: `Cliente Prueba ${Math.floor(10 + Math.random() * 90)}`,
                            email: `cliente-${testId}@test.com`,
                            phone: `58412${Math.floor(1000000 + Math.random() * 9000000)}`,
                            role: 'cliente',
                            zeny_balance: 50.00
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Cliente creado: ${testId}`);
                        } else if (selectedSupabaseTable === 'products') {
                          const testId = `prod-test-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('products').insert({
                            id: testId,
                            name: `Netflix Premium ${Math.floor(10 + Math.random() * 90)}`,
                            category: 'cat-netflix',
                            price_usd: 3.50,
                            price_bs: 128.50,
                            duration: '30 Días',
                            account_type: 'Perfil Privado',
                            description: 'Cuenta de prueba creada instantáneamente en Supabase.',
                            stock: 10
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Producto creado: ${testId}`);
                        } else if (selectedSupabaseTable === 'payment_methods') {
                          const testId = `pm-test-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('payment_methods').insert({
                            id: testId,
                            name: `Pago Móvil ${Math.floor(10 + Math.random() * 90)}`,
                            bank_name: 'Banco Mercantil',
                            doc_id: 'V-20111222',
                            phone: '04125555555',
                            payment_instructions: 'Enviar pago móvil y reportar captura.',
                            currency: 'VES',
                            is_active: true
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Método de pago creado.`);
                        } else if (selectedSupabaseTable === 'faq_items') {
                          const testId = `faq-test-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('faq_items').insert({
                            id: testId,
                            category: 'Soporte',
                            question: '¿Cómo reportar una falla?',
                            answer: 'Puedes reportarla directamente desde tu portal de cliente con un par de clics.',
                            sort_order: 1
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Pregunta frecuente creada.`);
                        } else if (selectedSupabaseTable === 'wallet_topups') {
                          const testId = `top-test-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('wallet_topups').insert({
                            id: testId,
                            customer_email: 'juan.perez@test.com',
                            amount_usd: 20.00,
                            reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
                            notes: 'Recarga de saldo simulada.'
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Abono Zeny creado.`);
                        } else if (selectedSupabaseTable === 'franchises') {
                          const testId = `franq-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('franchises').insert({
                            id: testId,
                            business_name: `Franquicia Prueba ${Math.floor(10 + Math.random() * 90)}`,
                            owner_name: `Socio ${Math.floor(10 + Math.random() * 90)}`,
                            email: `test-${testId}@franquicia.com`,
                            phone: `+58424${Math.floor(1000000 + Math.random() * 9000000)}`,
                            monthly_fee_usd: 25.00,
                            available_master_balance_usd: 120.00,
                            subscription_status: 'active'
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Franquiciado creado.`);
                        } else if (selectedSupabaseTable === 'franchise_topups') {
                          const testId = `top-fran-${Math.floor(1000 + Math.random() * 9000)}`;
                          const { error } = await supabase.from('franchise_topups').insert({
                            id: testId,
                            franchise_id: 'franq-caracas',
                            franchise_name: 'StreamPlus Caracas',
                            amount_usd: 75.00,
                            payment_method: 'Pago Móvil BCV',
                            reference_number: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
                            status: 'pending'
                          });
                          if (error) throw error;
                          setSupabaseTestInsertStatus(`¡Éxito! Abono de franquicia creado.`);
                        }
                        fetchSupabaseRecords(selectedSupabaseTable);
                        setTimeout(() => setSupabaseTestInsertStatus(null), 3000);
                      } catch (err: any) {
                        console.error(err);
                        setSupabaseTestInsertStatus(`Error: ${err.message || 'Error en inserción'}`);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <span>➕ Crear Registro de Prueba en Supabase</span>
                  </button>
                </div>
              </div>

              {/* PANEL DE REGISTROS DE LA BASE DE DATOS */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                    <span className="font-extrabold text-xs uppercase tracking-wider">
                      Registros de Tabla: <span className="font-mono text-sky-300">{selectedSupabaseTable}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Mostrando últimos 50 registros
                  </span>
                </div>

                {/* Tabla de Datos Dinámicos */}
                <div className="overflow-x-auto">
                  {supabaseExplorerLoading ? (
                    <div className="p-12 text-center text-slate-400">
                      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-sm">Consultando Supabase en tiempo real...</p>
                      <p className="text-xs text-slate-400 mt-0.5">Estableciendo túnel SQL seguro...</p>
                    </div>
                  ) : supabaseExplorerError ? (
                    <div className="p-8 text-center text-rose-600 bg-rose-50/50 space-y-4">
                      <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                      <div>
                        <p className="font-black text-slate-900 text-base">⚠️ Error de Estructura de Base de Datos</p>
                        <p className="text-xs text-rose-500 mt-1 max-w-md mx-auto">{supabaseExplorerError}</p>
                      </div>
                      
                      {(supabaseExplorerError?.includes('Could not find') || supabaseExplorerError?.includes('PGRST205') || supabaseExplorerError?.includes('relation') || supabaseExplorerError?.includes('does not exist')) && (
                        <div className="max-w-xl mx-auto p-5 rounded-2xl bg-white border border-rose-200 text-left text-slate-700 space-y-3 shadow-xs">
                          <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                            <span>¿Por qué ocurre este error?</span>
                          </h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Este error ocurre porque tu proyecto de Supabase está activo pero <strong>aún no has creado las tablas obligatorias</strong> en tu base de datos relacional.
                          </p>
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-2">
                            <p className="font-bold text-slate-900">Pasos para solucionar en 20 segundos:</p>
                            <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                              <li>Haz clic en el botón de abajo para <strong>copiar el Script SQL de inicialización</strong>.</li>
                              <li>Entra en tu consola de <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">Supabase Dashboard</a>.</li>
                              <li>Ve a la pestaña <strong>SQL Editor</strong> en el menú lateral izquierdo.</li>
                              <li>Haz clic en <strong>New Query</strong>, pega el código copiado y presiona <strong>Run</strong>. ¡Listo!</li>
                            </ol>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                              alert('¡Script SQL de inicialización copiado al portapapeles! Listo para pegar en el SQL Editor de tu consola Supabase.');
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>📋 Copiar Script SQL de Inicialización</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : supabaseRecords.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-sm">No se encontraron registros en `{selectedSupabaseTable}`</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isSupabaseConfigured
                          ? 'La tabla de la base de datos está vacía. Haz clic en "Crear Registro de Prueba" arriba.'
                          : 'Estás usando el cliente fallback de memoria porque Supabase no tiene claves activas.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                          {selectedSupabaseTable === 'categories' && (
                            <>
                              <th className="p-3">ID Categoría</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Ícono</th>
                              <th className="p-3">Descripción</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'parent_accounts' && (
                            <>
                              <th className="p-3">ID</th>
                              <th className="p-3">Email Proveedor</th>
                              <th className="p-3">Proveedor / Servicio</th>
                              <th className="p-3">Slots Máx</th>
                              <th className="p-3">Slots Activos</th>
                              <th className="p-3">Precio Compra ($)</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'account_profiles' && (
                            <>
                              <th className="p-3">ID Perfil</th>
                              <th className="p-3">ID Cuenta Madre</th>
                              <th className="p-3">Nombre Perfil</th>
                              <th className="p-3">PIN</th>
                              <th className="p-3">Cliente Asignado</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'refunds' && (
                            <>
                              <th className="p-3">ID Reverso</th>
                              <th className="p-3">ID Pedido</th>
                              <th className="p-3">Email Cliente</th>
                              <th className="p-3">Monto Reverso ($)</th>
                              <th className="p-3">Notas / Motivo</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'customers' && (
                            <>
                              <th className="p-3">ID Cliente</th>
                              <th className="p-3">Nombre Completo</th>
                              <th className="p-3">Email</th>
                              <th className="p-3">Teléfono</th>
                              <th className="p-3">Rol</th>
                              <th className="p-3">Billetera Zeny ($)</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'products' && (
                            <>
                              <th className="p-3">ID Producto</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Duración</th>
                              <th className="p-3">Tipo Cuenta</th>
                              <th className="p-3">Precio ($)</th>
                              <th className="p-3">Precio (Bs)</th>
                              <th className="p-3">Stock</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'payment_methods' && (
                            <>
                              <th className="p-3">ID</th>
                              <th className="p-3">Método</th>
                              <th className="p-3">Banco / Red</th>
                              <th className="p-3">Identificación</th>
                              <th className="p-3">Teléfono</th>
                              <th className="p-3">Moneda</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'faq_items' && (
                            <>
                              <th className="p-3">ID</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Pregunta</th>
                              <th className="p-3">Respuesta</th>
                              <th className="p-3">Orden</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'wallet_topups' && (
                            <>
                              <th className="p-3">ID Abono</th>
                              <th className="p-3">Email Cliente</th>
                              <th className="p-3">Monto Zeny ($)</th>
                              <th className="p-3">Referencia</th>
                              <th className="p-3">Notas</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'franchises' && (
                            <>
                              <th className="p-3">ID Franquicia</th>
                              <th className="p-3">Nombre Comercial</th>
                              <th className="p-3">Titular</th>
                              <th className="p-3">Email</th>
                              <th className="p-3">Suscripción</th>
                              <th className="p-3">Fondo Master ($)</th>
                            </>
                          )}
                          {selectedSupabaseTable === 'franchise_topups' && (
                            <>
                              <th className="p-3">ID Abono F.</th>
                              <th className="p-3">Franquicia</th>
                              <th className="p-3">Monto ($)</th>
                              <th className="p-3">Método</th>
                              <th className="p-3">Referencia</th>
                              <th className="p-3">Estado</th>
                            </>
                          )}
                          {!['categories', 'parent_accounts', 'account_profiles', 'refunds', 'customers', 'products', 'payment_methods', 'faq_items', 'wallet_topups', 'franchises', 'franchise_topups'].includes(selectedSupabaseTable) && (
                            <>
                              {supabaseRecords.length > 0 ? (
                                Object.keys(supabaseRecords[0]).map((key) => (
                                  <th key={key} className="p-3 capitalize">{(key || '').replace(/_/g, ' ')}</th>
                                ))
                              ) : (
                                <th className="p-3">Registro</th>
                              )}
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supabaseRecords.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50 transition font-medium text-slate-700">
                            {selectedSupabaseTable === 'categories' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.name}</td>
                                <td className="p-3 font-mono text-slate-500">{row.icon || 'Tv'}</td>
                                <td className="p-3 text-slate-500 truncate max-w-xs" title={row.description}>{row.description}</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'parent_accounts' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.email}</td>
                                <td className="p-3 font-bold text-slate-500">{row.provider}</td>
                                <td className="p-3 font-mono text-slate-500">{row.max_slots} slots</td>
                                <td className="p-3 font-mono font-extrabold text-indigo-600">{row.active_slots} slots</td>
                                <td className="p-3 font-mono font-extrabold text-emerald-600">${row.purchase_price?.toFixed(2)}</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'account_profiles' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 font-mono text-slate-500">{row.parent_account_id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.profile_name}</td>
                                <td className="p-3 font-mono text-slate-500">{row.pin || 'N/A'}</td>
                                <td className="p-3 font-bold text-indigo-600">{row.assigned_customer || 'Sin asignar'}</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'refunds' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 font-mono text-slate-500">{row.order_id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.customer_email}</td>
                                <td className="p-3 font-mono font-extrabold text-rose-600">${row.amount?.toFixed(2)} USD</td>
                                <td className="p-3 text-slate-500 truncate max-w-xs" title={row.notes}>{row.notes}</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'customers' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.name}</td>
                                <td className="p-3 text-slate-500 font-mono">{row.email || 'N/A'}</td>
                                <td className="p-3 text-slate-500 font-mono">{row.phone || 'N/A'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    row.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {row.role}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-extrabold text-emerald-600">${row.zeny_balance?.toFixed(2)} USD</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'products' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.name}</td>
                                <td className="p-3 font-mono text-slate-500">{row.duration || 'N/A'}</td>
                                <td className="p-3 font-bold text-indigo-600 text-[11px]">{row.account_type || 'N/A'}</td>
                                <td className="p-3 font-mono font-extrabold text-emerald-600">${row.price_usd?.toFixed(2)}</td>
                                <td className="p-3 font-mono text-slate-500">Bs {row.price_bs?.toFixed(2)}</td>
                                <td className="p-3 font-mono font-black text-slate-900">{row.stock} uds</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'payment_methods' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.name}</td>
                                <td className="p-3 font-bold text-slate-500">{row.bank_name || 'N/A'}</td>
                                <td className="p-3 font-mono text-slate-500">{row.doc_id || 'N/A'}</td>
                                <td className="p-3 font-mono text-slate-500">{row.phone || 'N/A'}</td>
                                <td className="p-3 font-mono font-extrabold text-indigo-600">{row.currency}</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'faq_items' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 font-bold text-indigo-600">{row.category}</td>
                                <td className="p-3 text-slate-950 font-bold">{row.question}</td>
                                <td className="p-3 text-slate-500 truncate max-w-xs" title={row.answer}>{row.answer}</td>
                                <td className="p-3 font-mono text-slate-400 font-bold">{row.sort_order}</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'wallet_topups' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.customer_email}</td>
                                <td className="p-3 font-mono font-extrabold text-emerald-600">${row.amount_usd?.toFixed(2)} USD</td>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.reference || 'N/A'}</td>
                                <td className="p-3 text-slate-500 truncate max-w-xs" title={row.notes}>{row.notes || '-'}</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'franchises' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.business_name}</td>
                                <td className="p-3 font-bold text-slate-700">{row.owner_name}</td>
                                <td className="p-3 font-mono text-slate-500">{row.email || 'N/A'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    row.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {row.subscription_status || 'active'}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-extrabold text-indigo-600">${row.available_master_balance_usd?.toFixed(2)} USD</td>
                              </>
                            )}
                            {selectedSupabaseTable === 'franchise_topups' && (
                              <>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.id}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.franchise_name}</td>
                                <td className="p-3 font-mono font-extrabold text-emerald-600">${row.amount_usd?.toFixed(2)}</td>
                                <td className="p-3 font-semibold text-slate-500">{row.payment_method}</td>
                                <td className="p-3 font-mono text-indigo-600 font-black">{row.reference_number || 'N/A'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    row.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : row.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                              </>
                            )}
                            {!['categories', 'parent_accounts', 'account_profiles', 'refunds', 'customers', 'products', 'payment_methods', 'faq_items', 'wallet_topups', 'franchises', 'franchise_topups'].includes(selectedSupabaseTable) && (
                              <>
                                {Object.values(row).map((val: any, i) => (
                                  <td key={i} className="p-3 truncate max-w-xs text-xs font-mono" title={typeof val === 'object' ? JSON.stringify(val) : String(val)}>
                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </td>
                                ))}
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Incidencias & Soporte Técnico */}
        {activeTab === 'incidents' && (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIncidentStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    incidentStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({incidents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIncidentStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    incidentStatusFilter === 'pending'
                      ? 'bg-rose-100 text-rose-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendientes ({pendingIncidentsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setIncidentStatusFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    incidentStatusFilter === 'in_progress'
                      ? 'bg-amber-100 text-amber-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  En Proceso
                </button>
                <button
                  type="button"
                  onClick={() => setIncidentStatusFilter('resolved')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    incidentStatusFilter === 'resolved'
                      ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Resueltos
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={incidentSearch}
                    onChange={(e) => setIncidentSearch(e.target.value)}
                    placeholder="Buscar ticket, cliente o falla..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                {sheetsState.isConnected && (
                  <button
                    type="button"
                    disabled={isSyncingIncidents}
                    onClick={async () => {
                      setIsSyncingIncidents(true);
                      await onSyncIncidentsToSheet();
                      setIsSyncingIncidents(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{isSyncingIncidents ? 'Sincronizando...' : 'Sincronizar a Drive'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Incidents List */}
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12 rounded-3xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No hay incidencias en esta categoría</h4>
                <p className="text-xs text-slate-500">
                  {incidentStatusFilter === 'pending'
                    ? '¡Excelente! Todos los reportes de clientes han sido atendidos.'
                    : 'No se encontraron tickets con los filtros seleccionados.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-rose-600 text-sm">
                            #{inc.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              inc.status === 'pending'
                                ? 'bg-rose-100 text-rose-800'
                                : inc.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {inc.status === 'pending'
                              ? '🔴 Pendiente'
                              : inc.status === 'in_progress'
                              ? '🟡 En Atención'
                              : '🟢 Resuelto'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(inc.createdAt).toLocaleString('es-VE')}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{inc.customerName}</span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-slate-500 text-xs font-mono">{inc.customerEmail}</span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-indigo-600 text-xs font-semibold font-mono">
                            {inc.customerPhone}
                          </span>
                        </div>
                      </div>

                      {/* Quick Status & Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {inc.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveIncidentModal({ incident: inc, action: 'received' });
                                setIncidentCustomNote('');
                                setIncidentSolutionInput('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Enviar aviso al cliente de que ya recibimos su reporte"
                            >
                              <Bell className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Avisar Recibido</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateIncidentStatus(inc.id, 'in_progress')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition cursor-pointer"
                            >
                              En Proceso
                            </button>
                          </>
                        )}

                        {inc.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveIncidentModal({ incident: inc, action: 'in_progress' });
                              setIncidentCustomNote(inc.adminNotes || '');
                              setIncidentSolutionInput('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition cursor-pointer flex items-center gap-1"
                            title="Enviar actualización del estado técnico al cliente"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Avisar En Proceso</span>
                          </button>
                        )}

                        {inc.status !== 'resolved' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveIncidentModal({ incident: inc, action: 'resolved' });
                              setIncidentSolutionInput(inc.solution || 'Se ha restablecido el PIN y reactivado la pantalla con éxito.');
                              setIncidentCustomNote(inc.adminNotes || '');
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Resolver & Notificar</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveIncidentModal({ incident: inc, action: 'resolved' });
                                setIncidentSolutionInput(inc.solution || 'Se ha restablecido el PIN y reactivado la pantalla con éxito.');
                                setIncidentCustomNote(inc.adminNotes || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ver / Reenviar Solución</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateIncidentStatus(inc.id, 'pending')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition cursor-pointer"
                            >
                              Reabrir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service & Issue Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Servicio Afectado
                        </span>
                        <span className="font-bold text-slate-900">{inc.serviceName}</span>
                        {inc.orderId && (
                          <span className="block text-[11px] text-slate-500 font-mono">
                            Pedido asociado: #{inc.orderId}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Tipo de Falla
                        </span>
                        <span className="font-semibold text-rose-700">{inc.issueType}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Canal Preferido
                        </span>
                        <span className="capitalize font-semibold text-slate-800">
                          {inc.sentVia === 'whatsapp' ? 'WhatsApp' : inc.sentVia === 'telegram' ? 'Telegram' : 'Web'}
                        </span>
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100/80 text-xs text-slate-800">
                      <span className="font-bold text-rose-900 block mb-1">
                        Explicación dada por el cliente:
                      </span>
                      <p className="italic leading-relaxed">"{inc.description}"</p>
                    </div>

                    {/* Solution Applied Block if resolved */}
                    {inc.status === 'resolved' && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between text-emerald-950 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Solución Técnica Entregada al Cliente:
                          </span>
                          {inc.resolvedAt && (
                            <span className="text-[10px] text-emerald-700 font-mono">
                              Resuelto el {new Date(inc.resolvedAt).toLocaleString('es-VE')}
                            </span>
                          )}
                        </div>
                        <p className="text-emerald-900 font-medium bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                          {inc.solution || inc.adminNotes || 'Caso solventado exitosamente.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <a
                            href={buildWhatsAppIncidentStatusUrl(inc, 'resolved', inc.solution)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Reenviar Solución por WhatsApp</span>
                          </a>
                          <a
                            href={buildTelegramIncidentStatusUrl(inc, 'resolved', inc.solution)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Reenviar Telegram</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Screenshot Preview if available */}
                    {inc.screenshotImage && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div
                          onClick={() => setPreviewIncidentImage(inc.screenshotImage || null)}
                          className="w-20 h-14 rounded-lg bg-slate-900 overflow-hidden cursor-pointer relative group shrink-0 border border-slate-300"
                        >
                          <img
                            src={inc.screenshotImage}
                            alt="Captura problema"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImageIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 text-xs">
                          <span className="font-bold text-slate-900 block">
                            Captura de pantalla adjunta por el cliente
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Haz clic en la miniatura para verla en tamaño completo
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewIncidentImage(inc.screenshotImage || null)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                        >
                          Ver Captura
                        </button>
                      </div>
                    )}

                    {/* Interactive Messaging & Admin Notes Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">
                          Avisos Rápidos:
                        </span>

                        {/* 1. Quick "Aviso Recibido" via WhatsApp or Telegram */}
                        <a
                          href={buildWhatsAppIncidentStatusUrl(inc, 'received')}
                          onClick={() => {
                            if (inc.status === 'pending') {
                              onUpdateIncidentStatus(inc.id, 'in_progress');
                            }
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          title="Notificar por WhatsApp que ya recibimos el reporte y estamos al tanto"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Avisar Recibido (WhatsApp)</span>
                        </a>

                        <a
                          href={buildTelegramIncidentStatusUrl(inc, 'received')}
                          onClick={() => {
                            if (inc.status === 'pending') {
                              onUpdateIncidentStatus(inc.id, 'in_progress');
                            }
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          title="Notificar por Telegram que ya recibimos el reporte y estamos al tanto"
                        >
                          <Send className="w-3.5 h-3.5 text-sky-600" />
                          <span>Avisar Recibido (Telegram)</span>
                        </a>

                        {inc.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveIncidentModal({ incident: inc, action: 'resolved' });
                              setIncidentSolutionInput(inc.solution || 'Se ha restablecido el PIN y reactivado la pantalla con éxito.');
                              setIncidentCustomNote(inc.adminNotes || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dar Solución al Caso</span>
                          </button>
                        )}
                      </div>

                      {/* Admin Notes Input */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Nota interna (ej: PIN reseteado)"
                          value={
                            incidentNotesInput[inc.id] !== undefined
                              ? incidentNotesInput[inc.id]
                              : inc.adminNotes || ''
                          }
                          onChange={(e) =>
                            setIncidentNotesInput((prev) => ({ ...prev, [inc.id]: e.target.value }))
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full sm:w-60 focus:outline-hidden focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const note = incidentNotesInput[inc.id] ?? inc.adminNotes;
                            onUpdateIncidentStatus(inc.id, inc.status, note);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Interactivo para Notificación de Estado & Envío de Solución */}
            {activeIncidentModal && (
              <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
                <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                  {/* Modal Header */}
                  <div className={`px-6 py-4 border-b flex items-center justify-between ${
                    activeIncidentModal.action === 'resolved'
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : activeIncidentModal.action === 'received'
                      ? 'bg-indigo-50/80 border-indigo-200'
                      : 'bg-amber-50/80 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs ${
                        activeIncidentModal.action === 'resolved'
                          ? 'bg-emerald-600'
                          : activeIncidentModal.action === 'received'
                          ? 'bg-indigo-600'
                          : 'bg-amber-600'
                      }`}>
                        {activeIncidentModal.action === 'resolved' ? '✅' : activeIncidentModal.action === 'received' ? '🔔' : '⏳'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {activeIncidentModal.action === 'resolved'
                            ? `Dar Solución & Notificar Ticket #${activeIncidentModal.incident.id}`
                            : activeIncidentModal.action === 'received'
                            ? `Aviso: Reporte Recibido #${activeIncidentModal.incident.id}`
                            : `Aviso: En Proceso Técnico #${activeIncidentModal.incident.id}`}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {activeIncidentModal.action === 'resolved'
                            ? 'Escribe la solución dada al cliente y notifícala directamente por WhatsApp o Telegram'
                            : 'Avisa al cliente que ya estás al tanto de su falla y atendiendo su cuenta'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveIncidentModal(null)}
                      className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4 text-xs">
                    {/* Incident Summary Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Cliente</span>
                        <div className="font-bold text-slate-900">{activeIncidentModal.incident.customerName}</div>
                        <div className="text-indigo-600 font-mono text-[11px]">{activeIncidentModal.incident.customerPhone}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Servicio / Falla</span>
                        <div className="font-bold text-slate-900">{activeIncidentModal.incident.serviceName}</div>
                        <div className="text-rose-600 font-semibold">{activeIncidentModal.incident.issueType}</div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Reporte Cliente</span>
                        <div className="text-slate-600 italic line-clamp-2">"{activeIncidentModal.incident.description}"</div>
                      </div>
                    </div>

                    {/* If Resolved: Quick Solution Presets & Input */}
                    {activeIncidentModal.action === 'resolved' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Plantillas Rápidas de Solución:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'PIN restablecido a 1234 y perfil reactivado',
                              'Contraseña actualizada y sesiones reseteadas',
                              'Pantalla sustituida y nuevo perfil asignado',
                              'Cuenta sustituida por garantía de servicio',
                              'Caché reiniciado y acceso comprobado al 100%'
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setIncidentSolutionInput(preset)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-medium border border-slate-200 transition cursor-pointer"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Explicación de la Solución (Se enviará al cliente) *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={incidentSolutionInput}
                            onChange={(e) => setIncidentSolutionInput(e.target.value)}
                            placeholder="Ej. Se restableció el PIN a 1234 y la pantalla 3 ya se encuentra 100% activa. Ya puedes disfrutar de tu servicio."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nota Interna de Administración (Opcional):
                          </label>
                          <input
                            type="text"
                            value={incidentCustomNote}
                            onChange={(e) => setIncidentCustomNote(e.target.value)}
                            placeholder="Ej. Proveedor reinició servidor"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-900 text-xs">
                          <p className="font-semibold mb-1">
                            {activeIncidentModal.action === 'received'
                              ? '📢 Mensaje de Aviso Inmediato:'
                              : '⏳ Mensaje de Actualización Técnica:'}
                          </p>
                          <p className="text-[11px] text-indigo-700">
                            {activeIncidentModal.action === 'received'
                              ? 'Le avisa al cliente que su ticket fue recibido y que el soporte técnico ya está al tanto y en revisión inmediata.'
                              : 'Le avisa al cliente que el caso está en proceso con el servidor/proveedor.'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Comentario adicional u observación técnica (opcional):
                          </label>
                          <input
                            type="text"
                            value={incidentCustomNote}
                            onChange={(e) => setIncidentCustomNote(e.target.value)}
                            placeholder="Ej. Verificando con el servidor central de Netflix..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* Live Preview of formatted Message */}
                    <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1">
                        <span>Vista Previa del Mensaje para el Cliente</span>
                        <span>WhatsApp / Telegram</span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto pr-1">
                        {buildFormattedIncidentStatusText(
                          activeIncidentModal.incident,
                          activeIncidentModal.action,
                          activeIncidentModal.action === 'resolved'
                            ? incidentSolutionInput || 'Se ha restablecido el PIN y el acceso al servicio.'
                            : incidentCustomNote
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = buildFormattedIncidentStatusText(
                          activeIncidentModal.incident,
                          activeIncidentModal.action,
                          activeIncidentModal.action === 'resolved'
                            ? incidentSolutionInput || 'Se ha restablecido el PIN y el acceso al servicio.'
                            : incidentCustomNote
                        );
                        navigator.clipboard.writeText(msg);
                        setCopiedIncidentMsg(true);
                        setTimeout(() => setCopiedIncidentMsg(false), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedIncidentMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIncidentMsg ? '¡Copiado!' : 'Copiar Texto'}</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {activeIncidentModal.action === 'resolved' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await onUpdateIncidentStatus(
                              activeIncidentModal.incident.id,
                              'resolved',
                              incidentCustomNote || activeIncidentModal.incident.adminNotes,
                              incidentSolutionInput || 'Caso solventado'
                            );
                            setActiveIncidentModal(null);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                        >
                          Solo Guardar como Resuelto
                        </button>
                      )}

                      {/* WhatsApp Button */}
                      <a
                        href={buildWhatsAppIncidentStatusUrl(
                          activeIncidentModal.incident,
                          activeIncidentModal.action,
                          activeIncidentModal.action === 'resolved' ? incidentSolutionInput : incidentCustomNote
                        )}
                        onClick={async () => {
                          const nextStatus = activeIncidentModal.action === 'resolved' ? 'resolved' : 'in_progress';
                          await onUpdateIncidentStatus(
                            activeIncidentModal.incident.id,
                            nextStatus,
                            incidentCustomNote || activeIncidentModal.incident.adminNotes,
                            activeIncidentModal.action === 'resolved' ? incidentSolutionInput : undefined
                          );
                          setActiveIncidentModal(null);
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>
                          {activeIncidentModal.action === 'resolved'
                            ? 'Resolver & Enviar WhatsApp'
                            : 'Enviar Aviso WhatsApp'}
                        </span>
                      </a>

                      {/* Telegram Button */}
                      <a
                        href={buildTelegramIncidentStatusUrl(
                          activeIncidentModal.incident,
                          activeIncidentModal.action,
                          activeIncidentModal.action === 'resolved' ? incidentSolutionInput : incidentCustomNote
                        )}
                        onClick={async () => {
                          const nextStatus = activeIncidentModal.action === 'resolved' ? 'resolved' : 'in_progress';
                          await onUpdateIncidentStatus(
                            activeIncidentModal.incident.id,
                            nextStatus,
                            incidentCustomNote || activeIncidentModal.incident.adminNotes,
                            activeIncidentModal.action === 'resolved' ? incidentSolutionInput : undefined
                          );
                          setActiveIncidentModal(null);
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {activeIncidentModal.action === 'resolved'
                            ? 'Resolver & Telegram'
                            : 'Enviar Aviso Telegram'}
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for full size screenshot */}
            {previewIncidentImage && (
              <div
                className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
                onClick={() => setPreviewIncidentImage(null)}
              >
                <div
                  className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl p-3 border border-slate-700 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewIncidentImage(null)}
                    className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <img
                    src={previewIncidentImage}
                    alt="Captura ampliada"
                    className="max-h-[82vh] w-auto mx-auto rounded-2xl object-contain"
                  />
                  <div className="text-center text-slate-300 text-xs py-2">
                    Captura del problema enviada por el cliente
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Centro de Sistemas & DevOps (5 Módulos Críticos) */}
        {activeTab === 'sistemas' && (
          <div className="overflow-y-auto">
            <AdminSystemsManager
              bcvRate={bcvRate}
              onUpdateBcvRate={onUpdateBcvRate}
              orders={orders}
              products={products}
              customers={customerUsers}
              franchises={franchises}
              expenses={expenses}
              onShowNotification={(type, msg) => {
                console.log(`[${type.toUpperCase()}] ${msg}`);
              }}
            />
          </div>
        )}

        {/* Tab: Centro de Blindaje & Ciberseguridad (10 Módulos de Defensa) */}
        {activeTab === 'seguridad_suite' && (
          <div className="overflow-y-auto">
            <AdminSecuritySuite
              onShowNotification={(type, msg) => {
                console.log(`[${type.toUpperCase()}] ${msg}`);
              }}
            />
          </div>
        )}

        {/* Tab FAQ: Preguntas Frecuentes & Google Sheets Sync */}
        {activeTab === 'faq' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
              <div>
                <h3 className="text-base font-bold text-indigo-950">Gestión de Preguntas Frecuentes (FAQ)</h3>
                <p className="text-xs text-indigo-700">
                  Estas preguntas y respuestas aparecen en la sección pública de la tienda y se sincronizan directamente con la pestaña <code className="bg-white px-1.5 py-0.5 rounded font-mono">PreguntasFrecuentes</code> de tu hoja de Google Drive.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setIsSyncingReports(true);
                  try {
                    await onSyncFaq();
                  } finally {
                    setIsSyncingReports(false);
                  }
                }}
                disabled={!sheetsState.isConnected || isSyncingReports}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isSyncingReports ? 'Sincronizando...' : 'Sincronizar FAQ con Google Sheets'}</span>
              </button>
            </div>

            {/* List & Add FAQ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* FAQ List */}
              <div className="lg:col-span-2 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase">Preguntas Registradas ({faqItems.length})</div>
                {faqItems.map((faq) => {
                  const isEditing = editingFaqId === faq.id;
                  return (
                    <div key={faq.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      {isEditing ? (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                            <input
                              type="text"
                              value={editFaqCategory}
                              onChange={(e) => setEditFaqCategory(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Pregunta *</label>
                            <input
                              type="text"
                              value={editFaqQuestion}
                              onChange={(e) => setEditFaqQuestion(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Respuesta *</label>
                            <textarea
                              value={editFaqAnswer}
                              onChange={(e) => setEditFaqAnswer(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 text-xs text-slate-800"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!editFaqQuestion.trim() || !editFaqAnswer.trim()) return;
                                const updated = faqItems.map((f) =>
                                  f.id === faq.id
                                    ? { ...f, category: editFaqCategory.trim() || 'General', question: editFaqQuestion.trim(), answer: editFaqAnswer.trim() }
                                    : f
                                );
                                onUpdateFaq(updated);
                                setEditingFaqId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Guardar Cambios
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFaqId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold uppercase">
                              {faq.category}
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFaqId(faq.id);
                                  setEditFaqCategory(faq.category);
                                  setEditFaqQuestion(faq.question);
                                  setEditFaqAnswer(faq.answer);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = faqItems.filter((f) => f.id !== faq.id);
                                  onUpdateFaq(updated);
                                }}
                                className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">{faq.question}</div>
                          <p className="text-slate-600 text-xs leading-relaxed">{faq.answer}</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add FAQ Form */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-900 text-sm">Agregar Nueva Pregunta (FAQ)</div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const qInput = form.elements.namedItem('q') as HTMLInputElement;
                    const aInput = form.elements.namedItem('a') as HTMLTextAreaElement;
                    const catInput = form.elements.namedItem('cat') as HTMLInputElement;

                    if (!qInput.value.trim() || !aInput.value.trim()) return;

                    const newFaq: FaqItem = {
                      id: `faq-${Date.now()}`,
                      category: catInput.value.trim() || 'General',
                      question: qInput.value.trim(),
                      answer: aInput.value.trim(),
                      order: faqItems.length + 1
                    };

                    onUpdateFaq([...faqItems, newFaq]);
                    form.reset();
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                    <input
                      type="text"
                      name="cat"
                      defaultValue="General"
                      required
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pregunta *</label>
                    <input
                      type="text"
                      name="q"
                      required
                      placeholder="ej. ¿Cómo se activa el servicio?"
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Respuesta *</label>
                    <textarea
                      name="a"
                      rows={3}
                      required
                      placeholder="Explica detalladamente la respuesta..."
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                  >
                    + Agregar Pregunta FAQ
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Bitácora de Transacciones & Auditoría */}
        {activeTab === 'bitacora' && (
          <div className="overflow-y-auto">
            <AdminAuditLogManager />
          </div>
        )}



        {/* Tab: Categorías de Servicios */}
        {activeTab === 'categories' && (
          <div className="overflow-y-auto p-6">
            <AdminCategoryManager />
          </div>
        )}


        {/* Tab: Usuarios Administradores & Credenciales */}
        {activeTab === 'users' && (
          <div className="overflow-y-auto p-6">
            <AdminUserManager
              customers={customerUsers}
              franchises={franchises}
              onResetPassword={onResetPassword || (() => {})}
            />
          </div>
        )}

        {/* Tab: Gestión de Cuotas (Ventas Fraccionadas) */}
        {activeTab === 'installments' && (
          <div className="overflow-y-auto p-6">
            <AdminInstallmentManager
              products={products}
              orders={orders}
              bcvRate={bcvRate}
              onUpdateProduct={(prod) => {
                if (onUpdateProduct) onUpdateProduct(prod);
              }}
              onUpdateProductsBulk={(prods) => {
                if (onUpdateProductsBulk) onUpdateProductsBulk(prods);
              }}
              onUpdateOrder={(ord) => {
                if (onUpdateOrder) onUpdateOrder(ord);
              }}
            />
          </div>
        )}

        {/* Tab: Reversos & Devoluciones */}
        {activeTab === 'refunds' && (
          <div className="overflow-y-auto p-6">
            <AdminRefundManager
              orders={orders}
              customers={customerUsers}
              paymentMethods={paymentMethods}
              bcvRate={bcvRate}
              onUpdateOrder={(ord) => {
                if (onUpdateOrder) onUpdateOrder(ord);
              }}
              onUpdateCustomerBalance={(customerId, amount) => {
                if (onManualCreditGrpay) {
                  const cust = customerUsers.find((c) => c.id === customerId);
                  if (cust) onManualCreditGrpay(cust.email, amount);
                }
              }}
            />
          </div>
        )}

        {/* Tab: Bot de Telegram */}
        {activeTab === 'telegram_bot' && (
          <div className="overflow-y-auto p-6">
            <AdminTelegramBotManager
              branding={branding || { projectName: 'Gregori Izquierdo Streaming', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', fontFamily: 'Inter' }}
              products={products}
              onSaveBranding={(newB) => {
                if (onSaveBranding) onSaveBranding(newB);
              }}
            />
          </div>
        )}

        {/* Tab: Facturación y Contratos */}
        {activeTab === 'billing_contracts' && (
          <div className="overflow-y-auto p-6">
            <AdminBillingAndContractsManager
              orders={orders}
              customers={customerUsers}
              franchises={franchises}
              bcvRate={bcvRate}
              branding={branding}
            />
          </div>
        )}

        {/* Tab: Gastos & Egresos */}
        {activeTab === 'expenses' && (
          <div className="overflow-y-auto p-6">
            <AdminExpensesManager
              expenses={expenses}
              onAddExpense={onAddExpense}
              onUpdateExpense={onUpdateExpense}
              onDeleteExpense={onDeleteExpense}
              paymentMethods={paymentMethods}
              onAddPaymentMethod={onAddPaymentMethod}
              bcvRate={bcvRate}
            />
          </div>
        )}




        {/* Tab: Módulo de Marketing Pro */}
        {/* Tab: Mis Franquicias */}
        {activeTab === 'franchises' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    <span>Gestión de Franquicias Activas</span>
                  </h3>
                  <p className="text-xs text-slate-500">Monitorea y gestiona tus socios comerciales y redes de reventa.</p>
                </div>
              </div>

              {/* Statistics Section */}
              <FranchiseSummaryChart 
                franchises={franchises} 
                topups={franchiseTopups} 
              />

              <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-slate-900 font-bold">Módulo de Franquicias en Red</h4>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Aquí aparecerá la lista de tus franquiciados, sus consumos de saldo y el estado de sus suscripciones mensuales.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Kit Venta de Franquicia */}
        {activeTab === 'franchise_kit' && (
          <div className="p-0 overflow-y-auto h-full bg-white">
            <AdminHandoverGuideModal 
              isInline={true} 
              onClose={() => setActiveTab('reconciliation')} 
              bcvRate={bcvRate} 
            />
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="overflow-y-auto">
            <MarketingModule
              customers={customerUsers}
              orders={orders}
              products={products}
              bcvRate={bcvRate}
              franchises={franchises}
              branding={branding}
              onShowNotification={(type, msg) => {
                console.log(`[${type.toUpperCase()}] ${msg}`);
              }}
            />
          </div>
        )}
        {activeTab === 'franchise_applications' && (
          <div className="p-6 overflow-y-auto">
            <AdminFranchiseApplicationManager
              applications={franchiseApplications}
              onApprove={(app) => {
                if (onAddFranchise) {
                  const newFranchise: FranchiseTenant = {
                    id: `franq-${Date.now()}`,
                    businessName: app.businessName,
                    ownerName: app.ownerName,
                    email: app.email,
                    phone: app.phone,
                    telegramUser: app.telegramUser,
                    status: 'active',
                    subscriptionStatus: 'pendiente',
                    monthlyFeeUsd: 25,
                    availableMasterBalanceUsd: 0,
                    walletCustomName: 'Mi Wallet',
                    createdAt: new Date().toISOString(),
                    enabledModules: {
                      calendar: true,
                      credits: false,
                      reminders: true,
                      botAutomation: false,
                      supplierPurchases: false,
                      customDomain: false,
                      branding: true,
                      installments: false,
                      resellers: false
                    }
                  };
                  onAddFranchise(newFranchise);
                  if (onUpdateFranchiseApplication) {
                    onUpdateFranchiseApplication({ ...app, status: 'approved', reviewedAt: new Date().toISOString() });
                  }
                }
              }}
              onReject={(appId, reason) => {
                const app = franchiseApplications.find(a => a.id === appId);
                if (app && onUpdateFranchiseApplication) {
                  onUpdateFranchiseApplication({ 
                    ...app, 
                    status: 'rejected', 
                    rejectionReason: reason,
                    reviewedAt: new Date().toISOString() 
                  });
                }
              }}
            />
          </div>
        )}

        {activeTab === 'franchise_tickets' && (
          <div className="p-6 overflow-y-auto">
            <AdminFranchiseTicketManager
              tickets={franchiseTickets}
              onUpdateTicket={onUpdateFranchiseTicket || (() => {})}
              adminName={user?.displayName || 'Administrador'}
            />
          </div>
        )}


        {/* Gift Modal Dialog */}
        {giftCustomer && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">🎁</div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Enviar Regalo / Cortesía</h3>
                    <p className="text-slate-500">Cliente: <strong>{giftCustomer.name}</strong></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGiftCustomer(null)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Regalo:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGiftType('grpay')}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                        giftType === 'grpay'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      💰 Saldo Zeny (USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGiftType('membership')}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                        giftType === 'membership'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      📺 Membresía / Servicio
                    </button>
                  </div>
                </div>

                {giftType === 'grpay' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monto en Saldo Zeny (USD) *</label>
                    <input
                      type="number"
                      min="1"
                      value={giftAmount}
                      onChange={(e) => setGiftAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border bg-white font-mono font-bold text-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Seleccionar Servicio / Producto *</label>
                      <select
                        value={giftProductId}
                        onChange={(e) => setGiftProductId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-white font-bold"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.accountType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Duración del Regalo *</label>
                      <select
                        value={giftDuration}
                        onChange={(e) => setGiftDuration(e.target.value as PlanDuration)}
                        className="w-full px-3 py-2 rounded-xl border bg-white font-bold"
                      >
                        <option value="10 días">10 Días (Cortesía)</option>
                        <option value="15 días">15 Días (Cortesía)</option>
                        <option value="1 mes">1 Mes</option>
                        <option value="3 meses">3 Meses</option>
                        <option value="6 meses">6 Meses</option>
                        <option value="12 meses">1 Año</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGiftCustomer(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (giftType === 'grpay') {
                      await onSendGift(giftCustomer.id, 'grpay', giftAmount.toString());
                    } else {
                      await onSendGift(giftCustomer.id, 'membership', giftProductId, giftDuration);
                    }
                    setGiftCustomer(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  🎁 Confirmar y Enviar Regalo
                </button>
              </div>
            </div>
          </div>
        )}

        {isHandoverModalOpen && (
          <AdminHandoverGuideModal
            onClose={() => setIsHandoverModalOpen(false)}
            bcvRate={bcvRate}
          />
        )}
        
        {isReconcileModalOpen && reconcilingOrder && (
          <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">
                        Conciliar Pedido #{reconcilingOrder.id}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        reconcilingOrder.status === 'confirmed' || isApprovedJustNow
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {reconcilingOrder.status === 'confirmed' || isApprovedJustNow ? 'Aprobado / Conciliado' : 'Pendiente de Conciliación'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Cliente: <strong>{reconcilingOrder.customerName}</strong> ({reconcilingOrder.customerPhone})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsReconcileModalOpen(false);
                    setReconcilingOrder(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Banner when approved */}
                {(isApprovedJustNow || reconcilingOrder.status === 'confirmed' || reconcilingOrder.status === 'delivered') && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in zoom-in-95">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-900">¡Pedido Aprobado y Conciliado!</h4>
                        <p className="text-xs text-emerald-700">
                          La factura interna se ha generado en segundo plano y el vencimiento se ha agendado en el calendario.
                        </p>
                      </div>
                    </div>

                    {/* Quick Dispatch Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={buildWhatsAppCredentialsUrl(reconcilingOrder)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition hover:scale-[1.02] cursor-pointer"
                        title="Abrir chat de WhatsApp para enviar credenciales al cliente"
                      >
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>Enviar Credenciales por WhatsApp 📲</span>
                      </a>

                      <a
                        href={buildTelegramCredentialsUrl(reconcilingOrder)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar por Telegram</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(buildFormattedCredentialsText(reconcilingOrder));
                          setCopiedMessage(true);
                          setTimeout(() => setCopiedMessage(false), 2500);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:bg-emerald-50 transition cursor-pointer"
                      >
                        {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMessage ? '¡Copiado!' : 'Copiar Texto'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsReconcileModalOpen(false);
                          setReconcilingOrder(null);
                          setActiveTab('billing_contracts');
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ml-auto"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Ver Factura Emitida 🧾</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Resumen del Pago y Pedido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">Servicio Solicitado:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {reconcilingOrder.productName} ({reconcilingOrder.duration})
                    </span>
                    <div className="text-indigo-600 font-semibold text-[11px] mt-0.5">
                      Tipo de cuenta: {reconcilingOrder.accountType}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">Total Pagado:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-black text-slate-900 text-base">
                        ${reconcilingOrder.total.toFixed(2)} USD
                      </span>
                      {bcvRate > 0 && (
                        <span className="text-slate-500 font-semibold text-[11px]">
                          ≈ Bs. {(reconcilingOrder.total * bcvRate).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">Método de Pago:</span>
                    <span className="font-bold text-slate-800">{reconcilingOrder.paymentMethodName}</span>
                    <div className="font-mono text-indigo-700 text-[11px]">
                      Referencia: <strong>{reconcilingOrder.referenceNumber || 'Sin referencia'}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">Datos de Contacto:</span>
                    <div className="font-bold text-slate-800">{reconcilingOrder.customerPhone}</div>
                    <div className="text-slate-500 truncate max-w-[200px]">{reconcilingOrder.customerEmail}</div>
                  </div>

                  {reconcilingOrder.receiptImage && (
                    <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600 font-bold flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        <span>Comprobante de pago adjunto</span>
                      </span>
                      <a
                        href={reconcilingOrder.receiptImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs border border-indigo-200 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver Comprobante</span>
                      </a>
                    </div>
                  )}

                  {reconcilingOrder.customerNotes && (
                    <div className="col-span-1 sm:col-span-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                      <strong>Nota del cliente:</strong> {reconcilingOrder.customerNotes}
                    </div>
                  )}
                </div>

                {/* Formulario de Conciliación: Billetera Zeny o Streaming */}
                {(reconcilingOrder.productId === 'topup-zeny' || reconcilingOrder.productName.toLowerCase().includes('zeny')) ? (
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-indigo-900">
                            Acreditación Directa de Saldo en Wallet Zeny
                          </h4>
                          <p className="text-xs text-indigo-700">
                            Valor oficial: <strong>1 Zeny = 1.00 USD</strong>
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block">Saldo a Acreditar:</span>
                          <span className="text-base font-black text-indigo-700 font-mono">
                            +{reconcilingOrder.total.toFixed(2)} Zeny ($ USD)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 font-bold block">Cliente Beneficiario:</span>
                          <span className="text-xs font-extrabold text-slate-800">
                            {reconcilingOrder.customerName}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">{reconcilingOrder.customerEmail}</div>
                        </div>
                      </div>

                      <div className="text-xs text-indigo-800 space-y-1">
                        <p>
                          ✓ Al hacer clic en <strong>Aprobar y Conciliar Pago</strong>, el saldo se acreditará inmediatamente a la cuenta del usuario.
                        </p>
                        <p>
                          ✓ Se emitirá la factura digital en el módulo de facturación.
                        </p>
                        <p>
                          ✓ Se habilitará el botón de WhatsApp con el mensaje oficial de recarga acreditada para el cliente.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Asesor Responsable</label>
                        <select
                          value={assignedSellerId}
                          onChange={(e) => {
                            setAssignedSellerId(e.target.value);
                            const seller = sellerOptions.find(s => s.id === e.target.value);
                            if (seller) setAssignedSellerName(seller.name);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          {sellerOptions.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nota Administrativa (Opcional)</label>
                        <input
                          type="text"
                          value={credInstructions}
                          onChange={(e) => setCredInstructions(e.target.value)}
                          placeholder="Ej: Validado en cuenta Banco..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Credenciales de la Cuenta de Streaming a Entregar</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correo / Usuario de Acceso *</label>
                        <input
                          type="text"
                          value={credUser}
                          onChange={(e) => setCredUser(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                          placeholder="usuario@streaming.com"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Contraseña de la Cuenta *</label>
                        <input
                          type="text"
                          value={credPass}
                          onChange={(e) => setCredPass(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                          placeholder="Clave2026*"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nombre de Perfil / Pantalla</label>
                        <input
                          type="text"
                          value={credProfile}
                          onChange={(e) => setCredProfile(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                          placeholder="Perfil 1 (Pablo)"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">PIN de Perfil (Si aplica)</label>
                        <input
                          type="text"
                          value={credPin}
                          onChange={(e) => setCredPin(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                          placeholder="1234"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Fecha de Vencimiento / Corte *</label>
                        <input
                          type="date"
                          value={credExpirationDate ? credExpirationDate.split('T')[0] : ''}
                          onChange={(e) => setCredExpirationDate(`${e.target.value}T23:59:59.000Z`)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Asesor Responsable</label>
                        <select
                          value={assignedSellerId}
                          onChange={(e) => {
                            setAssignedSellerId(e.target.value);
                            const seller = sellerOptions.find(s => s.id === e.target.value);
                            if (seller) setAssignedSellerName(seller.name);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          {sellerOptions.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Reglas de Garantía e Instrucciones</label>
                        <textarea
                          rows={2}
                          value={credInstructions}
                          onChange={(e) => setCredInstructions(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                          placeholder="Instrucciones para el cliente..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Rechazar pedido opcional */}
                {showRejectInput && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2 animate-in fade-in">
                    <label className="block font-bold text-rose-900">Motivo del Rechazo del Pago:</label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ej. Pago no cayó en cuenta / Referencia inválida"
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs bg-white"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleRejectOrder}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-xs"
                      >
                        {isProcessing ? 'Procesando...' : 'Confirmar Rechazo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {!showRejectInput && reconcilingOrder.status === 'pending_reconciliation' && (
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    Rechazar Pago
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReconcileModalOpen(false);
                      setReconcilingOrder(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    {isApprovedJustNow ? 'Cerrar' : 'Cancelar'}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleApproveOrder}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition hover:scale-[1.02] cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Aprobando...'
                        : isApprovedJustNow || reconcilingOrder.status === 'confirmed'
                        ? 'Guardar Cambios de Credenciales'
                        : 'Aprobar y Conciliar Pedido'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
