import { create } from 'zustand';
import { 
  Product, Order, CustomerUser, FranchiseTenant, ExpenseItem, 
  PaymentMethod, SupplierPurchase, AccountingEntry, AppBrandingConfig, Invoice,
  WalletTopup, IncidentReport, FaqItem
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS, INITIAL_CUSTOMERS 
} from '../data/defaultCatalog';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

// Helper mappers for bidirectional Supabase synchronization
const mapStoreProductToDb = (p: any) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price_usd: p.prices?.[p.defaultDuration]?.USD || 0,
  price_bs: p.prices?.[p.defaultDuration]?.BS || 0,
  duration: p.defaultDuration,
  account_type: p.accountType,
  description: p.description,
  image_url: p.logo || '',
  stock: p.stock,
  is_stock_manual: p.isStockManual,
  manual_stock: p.manualStock
});

const mapStoreCustomerToDb = (c: any) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  role: c.role || 'cliente',
  zeny_balance: c.zenyBalance ?? c.grpayBalance ?? 0,
  is_suspended: Boolean(c.isSuspended)
});

const mapStorePaymentMethodToDb = (p: any) => ({
  id: p.id,
  name: p.name,
  bank_name: p.holderName || p.shortName || '',
  doc_id: p.docId || p.accountNumber || '',
  phone: p.phone || p.accountNumber || '',
  payment_instructions: p.instructions || '',
  currency: p.acceptedCurrencies?.[0] || 'USD',
  is_active: p.active ?? p.isActive ?? true
});

const mapStoreFaqToDb = (f: any) => ({
  id: f.id,
  category: f.category,
  question: f.question,
  answer: f.answer,
  sort_order: f.order
});

const mapStoreWalletTopupToDb = (w: any) => ({
  id: w.id,
  customer_email: w.customerEmail,
  amount_usd: w.amountZenyPoints ?? w.amountZeny ?? w.amountPaid ?? 0,
  reference: w.referenceNumber,
  notes: `Abono Zeny - Estado: ${w.status}`
});

const mapStoreFranchiseToDb = (f: any) => ({
  id: f.id,
  business_name: f.businessName,
  owner_name: f.ownerName,
  phone: f.phone,
  telegram_user: f.telegramUser,
  email: f.email,
  custom_domain: f.customDomain,
  wallet_custom_name: f.walletCustomName || 'ZenyPay',
  monthly_fee_usd: f.monthlyFeeUsd || 0,
  subscription_status: f.subscriptionStatus || 'active',
  status: f.status || 'active',
  credit_due_date: f.creditDueDate,
  last_payment_date: f.lastPaymentDate,
  available_master_balance_usd: f.availableMasterBalanceUsd || 0,
  notes: f.notes,
  extra_addons_monthly_usd: f.extraAddonsMonthlyUsd || 0,
  is_reseller_network_active: Boolean(f.isResellerNetworkActive)
});

// Resilient upsert with exponential backoff retries for direct writing
const upsertWithRetry = async (table: string, data: any, retries = 3, delay = 1000): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase.from(table).upsert(data);
      if (error) throw error;
      return; // Success
    } catch (err) {
      console.warn(`[Supabase Retry] Attempt ${attempt} failed for table ${table}:`, err);
      if (attempt === retries) throw err;
      await new Promise(res => setTimeout(res, delay * attempt)); // exponential delay
    }
  }
};


interface AppState {
  // Financial State
  isGeminiPanelOpen: boolean;
  toggleGeminiPanel: () => void;
  bankBalances: Record<string, { balanceUsd: number; balanceBs: number }>;
  accountsReceivable: any[];
  accountsPayable: any[];
  purchases: SupplierPurchase[];
  accountingEntries: AccountingEntry[];
  
  // Core Entities
  products: Product[];
  orders: Order[];
  customers: CustomerUser[];
  activeCustomer: CustomerUser | null;
  walletTopups: WalletTopup[];
  incidents: IncidentReport[];
  franchises: FranchiseTenant[];
  expenses: ExpenseItem[];
  paymentMethods: PaymentMethod[];
  branding: AppBrandingConfig;
  invoices: Invoice[];
  faqItems: FaqItem[];
  bcvRate: number;
  supabaseSchemaError: string | null;
  
  // Actions
  setSupabaseSchemaError: (error: string | null) => void;
  setBankBalances: (balances: Record<string, { balanceUsd: number; balanceBs: number }>) => void;
  setAccountsReceivable: (cxc: any[]) => void;
  setAccountsPayable: (cxp: any[]) => void;
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
  setCustomers: (customers: CustomerUser[] | ((prev: CustomerUser[]) => CustomerUser[])) => void;
  setActiveCustomer: (customer: CustomerUser | null | ((prev: CustomerUser | null) => CustomerUser | null)) => void;
  setWalletTopups: (topups: WalletTopup[] | ((prev: WalletTopup[]) => WalletTopup[])) => void;
  setIncidents: (incidents: IncidentReport[] | ((prev: IncidentReport[]) => IncidentReport[])) => void;
  setFranchises: (franchises: FranchiseTenant[] | ((prev: FranchiseTenant[]) => FranchiseTenant[])) => void;
  setExpenses: (expenses: ExpenseItem[] | ((prev: ExpenseItem[]) => ExpenseItem[])) => void;
  setPaymentMethods: (methods: PaymentMethod[] | ((prev: PaymentMethod[]) => PaymentMethod[])) => void;
  setInvoices: (invoices: Invoice[] | ((prev: Invoice[]) => Invoice[])) => void;
  setFaqItems: (faqItems: FaqItem[] | ((prev: FaqItem[]) => FaqItem[])) => void;
  setBcvRate: (rate: number) => void;
  setPurchases: (purchases: SupplierPurchase[] | ((prev: SupplierPurchase[]) => SupplierPurchase[])) => void;
  setBranding: (branding: AppBrandingConfig | ((prev: AppBrandingConfig) => AppBrandingConfig)) => void;

  
  // Atomic Action: Register Purchase
  addPurchase: (purchase: SupplierPurchase, paymentAccountId?: string) => void;
}

// Lectura segura desde localStorage (sin registros de ejemplo)
const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  isGeminiPanelOpen: false,
  toggleGeminiPanel: () => set((state) => ({ isGeminiPanelOpen: !state.isGeminiPanelOpen })),
  // Initialize from localStorage if available, or default data
  bankBalances: load('maxter_initial_bank_balances', {}),
  accountsReceivable: load('maxter_accounts_receivable', []),
  accountsPayable: load('maxter_accounts_payable', []),
  purchases: load<SupplierPurchase[]>('streamsync_purchases_v2', []),
  accountingEntries: [],
  products: load<Product[]>('streamsync_products_v2', INITIAL_PRODUCTS),
  orders: load<Order[]>('streamsync_orders_v2', []),
  customers: load<CustomerUser[]>('streamsync_customers_v2', INITIAL_CUSTOMERS),
  activeCustomer: load<CustomerUser | null>('streamsync_current_customer_v2', null),
  walletTopups: load<WalletTopup[]>('streamsync_topups_v2', []),
  incidents: load<IncidentReport[]>('streamsync_incidents_v2', []),
  franchises: load<FranchiseTenant[]>('streamsync_franchises_v1', []),
  expenses: load<ExpenseItem[]>('gi_expenses_list_2026', []),
  paymentMethods: load<PaymentMethod[]>('streamsync_methods_v2', INITIAL_PAYMENT_METHODS),
  invoices: load<Invoice[]>('streamsync_invoices_v1', []),
  faqItems: load<FaqItem[]>('streamsync_faq_v1', [
    { id: 'faq-1', category: 'Pagos', question: '¿Cómo funciona la pasarela de pago con conciliación manual?', answer: 'Seleccionas tu plataforma y plan (1, 3, 6 o 12 meses). Puedes pagar en Dólares ($ USD) o en Bolívares (Bs.) calculados a la tasa oficial del BCV. Contamos con 9 métodos de pago: Cuenta en EEUU (Zelle / ACH), Airtm, Pago Móvil (Venezuela), Binance Pay (USDT), Banco Pichincha (Ecuador), Wally, Zinli, UglyCash y TDC (Banesco Conecta). Realizas la transferencia, ingresas tu número de referencia bancario y nuestro equipo valida el ingreso en minutos para activar tu suscripción.', order: 1 },
    { id: 'faq-2', category: 'Zeny', question: '¿Qué es la Wallet Zeny y cómo funciona?', answer: 'Zeny es la moneda y billetera interna de StreamSync (1 Zeny = 1 USD / 1 USDT / equivalente en Bs. a tasa BCV). Puedes solicitar recargas de saldo abonando por cualquiera de nuestros métodos de pago. Una vez que el administrador acredita tu saldo en tu cuenta, puedes adquirir o renovar suscripciones con 1 solo clic y activación inmediata sin esperas. Importante: este saldo es exclusivo para compras y renovaciones en la plataforma, no es retirable ni canjeable por efectivo.', order: 2 },
    { id: 'faq-3', category: 'Tasa BCV', question: '¿Cómo se actualiza la tasa oficial del Banco Central de Venezuela (BCV)?', answer: 'Nuestra plataforma se conecta diariamente y de forma automática a los servicios oficiales del BCV para actualizar el valor en Bolívares. Además, el administrador tiene la facultad de ajustar o fijar la tasa manualmente desde el panel de control si fuera necesario.', order: 3 },
    { id: 'faq-4', category: 'Clientes', question: '¿Dónde veo mis cuentas activas y su fecha de vencimiento?', answer: 'Al registrarte en el Área de Clientes con tu correo y contraseña, dispones de una pestaña llamada "Mis Suscripciones & Vencimientos". Allí verás cada servicio contratado, tus credenciales de acceso (usuario, clave, perfil y PIN) y una cuenta regresiva con los días exactos que restan para el vencimiento de cada pantalla.', order: 4 },
    { id: 'faq-5', category: 'Google Sheets', question: '¿Cómo se guardan los datos en Google Sheets?', answer: 'La plataforma integra Google Sheets oficial de tu Google Drive. Cada pedido, usuario y recarga se refleja en tiempo real en tu hoja de cálculo, permitiéndote llevar el control administrativo de tu negocio sin depender de bases de datos externas.', order: 5 },
    { id: 'faq-6', category: 'Garantía', question: '¿Qué garantía tienen las cuentas de streaming?', answer: 'Todas nuestras cuentas y pantallas cuentan con garantía total durante el 100% de la duración contratada (30, 90, 180 o 365 días). Si alguna plataforma presenta caída o bloqueo por actualización, nuestro equipo de soporte te restituye el perfil o cuenta en menos de 30 minutos sin costo adicional.', order: 6 }
  ]),
  bcvRate: load<number>('streamsync_bcv_rate_v2', 36.85),
  supabaseSchemaError: null,
  setSupabaseSchemaError: (supabaseSchemaError) => set({ supabaseSchemaError }),
  branding: load<AppBrandingConfig>('streamsync_branding_v1', {
      projectName: 'Gregory Izquierdo Streaming',
      rif: '',
      slogan: 'Tu plataforma de streaming de alta gama 24/7',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      fontFamily: 'Plus Jakarta Sans',
      heroTitle: 'Tus Suscripciones y Servicios de Streaming favoritas',
      heroTitleGradient: 'en un solo lugar',
      heroSubtitle: 'Perfiles Privados, Cuentas Completas, Aplicaciones y mucho mas. Paga con Pago Movil a Tasa BCV Oficial , o a traves de : Binance Pay, Banco Guayaquil , Zinli o con tu Saldo de Billeterea Zeny.',
      heroBadgeText: 'Entrega Inmediata & Garantía Total de Duración',
      heroFontSize: '3xl',
      heroFontFamily: 'Plus Jakarta Sans',
      heroAlignment: 'center',
      bannerPlacement: 'below_hero',
      bannerThickness: 'normal',
      bannerMessage: '¡Bienvenidos a nuestra plataforma de streaming oficial! Soporte 24/7 y recargas inmediatas vía WhatsApp y Telegram.',
      bannerPhone: '04241983648 / +584241983648',
      bannerEmail: 'emprendimientogregoryizquierdo@gmail.com',
      cardRadius: 'rounded-2xl',
      containerMaxWidth: 'max-w-7xl',
      // Footer Default Values
      footerDescription: 'Plataforma de suscripciones y perfiles de streaming con pasarela de pago manual y sincronización en Google Sheets.',
      footerGuaranteeText: 'Garantía 100% de duración',
      footerPlatforms: [
        'Netflix Ultra HD 4K',
        'Disney+ con ESPN en Vivo',
        'Max (HBO Max) Platino',
        'Spotify Premium & Familiar',
        'YouTube Premium sin anuncios',
        'Magis TV & IPTV Internacional'
      ],
      footerPaymentMethods: [
        'Cuenta en EEUU (Zelle / ACH)',
        'Airtm',
        'Pago Móvil (Tasa BCV)',
        'Binance Pay (USDT)',
        'Banco Pichincha (Ecuador)',
        'Wally & Zinli',
        'UglyCash',
        'TDC Banesco Conecta',
        'Wallet Privada Zeny'
      ],
      footerWhatsAppUrl: 'https://wa.me/584241983648?text=Hola,%20necesito%20informaci%C3%B3n%20o%20soporte%20con%20mi%20cuenta%20streaming.'
  } as AppBrandingConfig),

  setBankBalances: (bankBalances) => {
    localStorage.setItem('maxter_initial_bank_balances', JSON.stringify(bankBalances));
    set({ bankBalances });
  },
  setAccountsReceivable: (accountsReceivable) => {
    localStorage.setItem('maxter_accounts_receivable', JSON.stringify(accountsReceivable));
    set({ accountsReceivable });
  },
  setAccountsPayable: (accountsPayable) => {
    localStorage.setItem('maxter_accounts_payable', JSON.stringify(accountsPayable));
    set({ accountsPayable });
  },
  setProducts: (val) => {
    set((state) => {
      const products = typeof val === 'function' ? (val as any)(state.products) : val;
      localStorage.setItem('streamsync_products_v2', JSON.stringify(products));
      if (isSupabaseConfigured) {
        const changed = products.filter((p: any) => {
          const prev = state.products.find((prevP: any) => prevP.id === p.id);
          return !prev || JSON.stringify(prev) !== JSON.stringify(p);
        });
        if (changed.length > 0) {
          Promise.all(changed.map((p: any) => 
            upsertWithRetry('products', mapStoreProductToDb(p))
          )).catch(err => console.warn('Supabase products write notice:', err));
        }
      }
      return { products };
    });
  },
  setOrders: (val) => {
    set((state) => {
      const orders = typeof val === 'function' ? (val as any)(state.orders) : val;
      localStorage.setItem('streamsync_orders_v2', JSON.stringify(orders));
      return { orders };
    });
  },
  setCustomers: (val) => {
    set((state) => {
      const customers = typeof val === 'function' ? (val as any)(state.customers) : val;
      localStorage.setItem('streamsync_customers_v2', JSON.stringify(customers));
      if (isSupabaseConfigured) {
        const changed = customers.filter((c: any) => {
          const prev = state.customers.find((prevC: any) => prevC.id === c.id);
          return !prev || JSON.stringify(prev) !== JSON.stringify(c);
        });
        if (changed.length > 0) {
          Promise.all(changed.map((c: any) => 
            upsertWithRetry('customers', mapStoreCustomerToDb(c))
          )).catch(err => console.warn('Supabase customers write notice:', err));
        }
      }
      return { customers };
    });
  },
  setActiveCustomer: (val) => {
    set((state) => {
      const activeCustomer = typeof val === 'function' ? (val as any)(state.activeCustomer) : val;
      localStorage.setItem('streamsync_current_customer_v2', JSON.stringify(activeCustomer));
      return { activeCustomer };
    });
  },
  setWalletTopups: (val) => {
    set((state) => {
      const walletTopups = typeof val === 'function' ? (val as any)(state.walletTopups) : val;
      localStorage.setItem('streamsync_topups_v2', JSON.stringify(walletTopups));
      if (isSupabaseConfigured) {
        const changed = walletTopups.filter((w: any) => {
          const prev = state.walletTopups.find((prevW: any) => prevW.id === w.id);
          return !prev || JSON.stringify(prev) !== JSON.stringify(w);
        });
        if (changed.length > 0) {
          Promise.all(changed.map((w: any) => 
            upsertWithRetry('wallet_topups', mapStoreWalletTopupToDb(w))
          )).catch(err => console.warn('Supabase wallet topups write notice:', err));
        }
      }
      return { walletTopups };
    });
  },
  setIncidents: (val) => {
    set((state) => {
      const incidents = typeof val === 'function' ? (val as any)(state.incidents) : val;
      localStorage.setItem('streamsync_incidents_v2', JSON.stringify(incidents));
      return { incidents };
    });
  },
  setFranchises: (val) => {
    set((state) => {
      const franchises = typeof val === 'function' ? (val as any)(state.franchises) : val;
      localStorage.setItem('streamsync_franchises_v1', JSON.stringify(franchises));
      if (isSupabaseConfigured) {
        const changed = franchises.filter((f: any) => {
          const prev = state.franchises.find((prevF: any) => prevF.id === f.id);
          return !prev || JSON.stringify(prev) !== JSON.stringify(f);
        });
        if (changed.length > 0) {
          Promise.all(changed.map((f: any) => 
            upsertWithRetry('franchises', mapStoreFranchiseToDb(f))
          )).catch(err => console.warn('Supabase franchises write notice:', err));
        }
      }
      return { franchises };
    });
  },
  setExpenses: (val) => {
    set((state) => {
      const expenses = typeof val === 'function' ? (val as any)(state.expenses) : val;
      localStorage.setItem('gi_expenses_list_2026', JSON.stringify(expenses));
      return { expenses };
    });
  },
  setPaymentMethods: (val) => {
    set((state) => {
      const paymentMethods = typeof val === 'function' ? (val as any)(state.paymentMethods) : val;
      localStorage.setItem('streamsync_methods_v2', JSON.stringify(paymentMethods));
      if (isSupabaseConfigured) {
        const changed = paymentMethods.filter((p: any) => {
          const prev = state.paymentMethods.find((prevP: any) => prevP.id === p.id);
          return !prev || JSON.stringify(prev) !== JSON.stringify(p);
        });
        if (changed.length > 0) {
          Promise.all(changed.map((p: any) => 
            upsertWithRetry('payment_methods', mapStorePaymentMethodToDb(p))
          )).catch(err => console.warn('Supabase payment methods write notice:', err));
        }
      }
      return { paymentMethods };
    });
  },
  setInvoices: (val) => {
    set((state) => {
      const invoices = typeof val === 'function' ? (val as any)(state.invoices) : val;
      localStorage.setItem('streamsync_invoices_v1', JSON.stringify(invoices));
      return { invoices };
    });
  },
  setFaqItems: (val) => {
    set((state) => {
      const faqItems = typeof val === 'function' ? (val as any)(state.faqItems) : val;
      localStorage.setItem('streamsync_faq_v1', JSON.stringify(faqItems));
      if (isSupabaseConfigured) {
        const changed = faqItems.filter((f: any) => {
          const prev = state.faqItems.find((prevF: any) => prevF.id === f.id);
          return !prev || JSON.stringify(prev) !== JSON.stringify(f);
        });
        if (changed.length > 0) {
          Promise.all(changed.map((f: any) => 
            upsertWithRetry('faq_items', mapStoreFaqToDb(f))
          )).catch(err => console.warn('Supabase faq items write notice:', err));
        }
      }
      return { faqItems };
    });
  },
  setBcvRate: (bcvRate) => {
    localStorage.setItem('streamsync_bcv_rate_v2', JSON.stringify(bcvRate));
    set({ bcvRate });
  },
  setPurchases: (val) => {
    set((state) => {
      const purchases = typeof val === 'function' ? (val as any)(state.purchases) : val;
      localStorage.setItem('streamsync_purchases_v2', JSON.stringify(purchases));
      return { purchases };
    });
  },
  setBranding: (val) => {
    set((state) => {
      const branding = typeof val === 'function' ? (val as any)(state.branding) : val;
      localStorage.setItem('streamsync_branding_v1', JSON.stringify(branding));
      return { branding };
    });
  },

  // Atomic Action: Register Purchase
  addPurchase: (purchase, paymentAccountId) => {
    const state = get();
    const updatedPurchases = [...state.purchases, purchase];
    localStorage.setItem('streamsync_purchases_v2', JSON.stringify(updatedPurchases));

    const newEntry: AccountingEntry = {
      id: `ENT-${Date.now()}`,
      entryNumber: state.accountingEntries.length + 1,
      date: new Date().toISOString(),
      concept: `Compra a ${purchase.supplierName} - ${purchase.platform}`,
      debitAccount: 'Costos de Venta',
      debitAmount: purchase.costUsd,
      creditAccount: paymentAccountId || 'Cuentas por Pagar',
      creditAmount: purchase.costUsd,
      sourceType: 'purchase',
      referenceId: purchase.id
    };

    let updatedBalances = { ...state.bankBalances };
    if (paymentAccountId && updatedBalances[paymentAccountId]) {
        updatedBalances[paymentAccountId].balanceUsd -= purchase.costUsd;
        localStorage.setItem('maxter_initial_bank_balances', JSON.stringify(updatedBalances));
    }

    set({ 
        purchases: updatedPurchases, 
        accountingEntries: [...state.accountingEntries, newEntry],
        bankBalances: updatedBalances
    });
  },
}));

// Selector Hooks
export const useBankBalances = () => useAppStore((state) => state.bankBalances);
export const useAccountsReceivable = () => useAppStore((state) => state.accountsReceivable);
export const useAccountsPayable = () => useAppStore((state) => state.accountsPayable);
export const useProducts = () => useAppStore((state) => state.products);
export const useOrders = () => useAppStore((state) => state.orders);
export const useCustomers = () => useAppStore((state) => state.customers);
export const useActiveCustomer = () => useAppStore((state) => state.activeCustomer);
export const useWalletTopups = () => useAppStore((state) => state.walletTopups);
export const useIncidents = () => useAppStore((state) => state.incidents);
export const useFranchises = () => useAppStore((state) => state.franchises);
export const useExpenses = () => useAppStore((state) => state.expenses);
export const usePaymentMethods = () => useAppStore((state) => state.paymentMethods);
export const useInvoices = () => useAppStore((state) => state.invoices);
export const useFaqItems = () => useAppStore((state) => state.faqItems);
export const useBcvRate = () => useAppStore((state) => state.bcvRate);
export const useBranding = () => useAppStore((state) => state.branding);
export const usePurchases = () => useAppStore((state) => state.purchases);
export const useGeminiPanelOpen = () => useAppStore((state) => state.isGeminiPanelOpen);
export const useToggleGeminiPanel = () => useAppStore((state) => state.toggleGeminiPanel);
export const useSupabaseSchemaError = () => useAppStore((state) => state.supabaseSchemaError);
