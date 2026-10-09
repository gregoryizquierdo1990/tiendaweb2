import { create } from 'zustand';
import { 
  Product, Order, CustomerUser, FranchiseTenant, ExpenseItem, 
  PaymentMethod, SupplierPurchase, AccountingEntry, AppBrandingConfig, Invoice,
  WalletTopup, IncidentReport, FaqItem
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS, INITIAL_CUSTOMERS 
} from '../data/defaultCatalog';
import { 
  isSyncingFromFirestore,
  syncProductToFirestore,
  deleteProductFromFirestore,
  syncOrderToFirestore,
  syncCustomerToFirestore,
  syncWalletTopupToFirestore,
  syncIncidentToFirestore,
  syncPaymentMethodToFirestore,
  deletePaymentMethodFromFirestore,
  syncBrandingToFirestore,
  syncBcvRateToFirestore,
  syncFaqToFirestore,
  syncExpenseToFirestore,
  syncFranchiseToFirestore,
  syncPurchaseToFirestore
} from '../services/firestoreService';

const syncProductsList = (oldList: Product[], newList: Product[]) => {
  if (isSyncingFromFirestore) return;
  
  newList.forEach(p => {
    const oldP = oldList.find(o => o.id === p.id);
    if (!oldP || JSON.stringify(oldP) !== JSON.stringify(p)) {
      syncProductToFirestore(p);
    }
  });
  
  oldList.forEach(o => {
    if (!newList.some(n => n.id === o.id)) {
      deleteProductFromFirestore(o.id);
    }
  });
};

const syncOrdersList = (oldList: Order[], newList: Order[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(o => {
    const oldO = oldList.find(prev => prev.id === o.id);
    if (!oldO || JSON.stringify(oldO) !== JSON.stringify(o)) {
      syncOrderToFirestore(o);
    }
  });
};

const syncCustomersList = (oldList: CustomerUser[], newList: CustomerUser[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(c => {
    const oldC = oldList.find(prev => prev.id === c.id);
    if (!oldC || JSON.stringify(oldC) !== JSON.stringify(c)) {
      syncCustomerToFirestore(c);
    }
  });
};

const syncTopupsList = (oldList: WalletTopup[], newList: WalletTopup[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(t => {
    const oldT = oldList.find(prev => prev.id === t.id);
    if (!oldT || JSON.stringify(oldT) !== JSON.stringify(t)) {
      syncWalletTopupToFirestore(t);
    }
  });
};

const syncIncidentsList = (oldList: IncidentReport[], newList: IncidentReport[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(i => {
    const oldI = oldList.find(prev => prev.id === i.id);
    if (!oldI || JSON.stringify(oldI) !== JSON.stringify(i)) {
      syncIncidentToFirestore(i);
    }
  });
};

const syncPaymentMethodsList = (oldList: PaymentMethod[], newList: PaymentMethod[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(p => {
    const oldP = oldList.find(prev => prev.id === p.id);
    if (!oldP || JSON.stringify(oldP) !== JSON.stringify(p)) {
      syncPaymentMethodToFirestore(p);
    }
  });
  oldList.forEach(o => {
    if (!newList.some(n => n.id === o.id)) {
      deletePaymentMethodFromFirestore(o.id);
    }
  });
};

const syncExpensesList = (oldList: ExpenseItem[], newList: ExpenseItem[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(e => {
    const oldE = oldList.find(prev => prev.id === e.id);
    if (!oldE || JSON.stringify(oldE) !== JSON.stringify(e)) {
      syncExpenseToFirestore(e);
    }
  });
};

const syncFranchisesList = (oldList: FranchiseTenant[], newList: FranchiseTenant[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(f => {
    const oldF = oldList.find(prev => prev.id === f.id);
    if (!oldF || JSON.stringify(oldF) !== JSON.stringify(f)) {
      syncFranchiseToFirestore(f);
    }
  });
};

const syncPurchasesList = (oldList: SupplierPurchase[], newList: SupplierPurchase[]) => {
  if (isSyncingFromFirestore) return;
  newList.forEach(p => {
    const oldP = oldList.find(prev => prev.id === p.id);
    if (!oldP || JSON.stringify(oldP) !== JSON.stringify(p)) {
      syncPurchaseToFirestore(p);
    }
  });
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

  // Global Firestore Connection & Sync State
  firestoreStatus: 'initializing' | 'connected' | 'reconnecting' | 'offline' | 'error';
  isCloudSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTimestamp: string | null;
  connectionError: string | null;
  firestoreLatencyMs: number | null;
  hasCriticalLatency: boolean;
  
  // Actions
  setFirestoreStatus: (status: 'initializing' | 'connected' | 'reconnecting' | 'offline' | 'error') => void;
  setIsCloudSyncing: (isSyncing: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  setLastSyncTimestamp: (ts: string | null) => void;
  setConnectionError: (err: string | null) => void;
  setFirestoreLatency: (ms: number | null) => void;
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
  products: load<Product[]>('streamsync_products_v2', []),
  orders: load<Order[]>('streamsync_orders_v2', []),
  customers: load<CustomerUser[]>('streamsync_customers_v2', []),
  activeCustomer: load<CustomerUser | null>('streamsync_current_customer_v2', null),
  walletTopups: load<WalletTopup[]>('streamsync_topups_v2', []),
  incidents: load<IncidentReport[]>('streamsync_incidents_v2', []),
  franchises: load<FranchiseTenant[]>('streamsync_franchises_v1', []),
  expenses: load<ExpenseItem[]>('gi_expenses_list_2026', []),
  paymentMethods: load<PaymentMethod[]>('streamsync_methods_v2', INITIAL_PAYMENT_METHODS),
  invoices: load<Invoice[]>('streamsync_invoices_v1', []),
  faqItems: load<FaqItem[]>('streamsync_faq_v1', [
    { id: 'faq-1', category: 'Pagos', question: '¿Cómo funciona la pasarela de pago con conciliación manual?', answer: 'Seleccionas tu plataforma y plan (1, 3, 6 o 12 meses). Puedes pagar en Dólares ($ USD) o en Bolívares (Bs.) calculados a la tasa oficial del BCV. Contamos con 9 métodos de pago: Cuenta en EEUU (Zelle / ACH), Airtm, Pago Móvil (Venezuela), Binance Pay (USDT), Banco Pichincha (Ecuador), Wally, Zinli, UglyCash y TDC (Banesco Conecta). Realizas la transferencia, ingresas tu número de referencia bancario y nuestro equipo valida el ingreso en minutos para activar tu suscripción.', order: 1 },
    { id: 'faq-2', category: 'Zeny', question: '¿Qué es la Wallet Zeny y cómo funciona?', answer: 'Zeny es la moneda y billetera interna de StreamSync (1 Zeny = 1 USD, equivalente en Bs. a tasa BCV). Puedes solicitar recargas de saldo abonando por cualquiera de nuestros métodos de pago. Una vez que el administrador acredita tu saldo en tu cuenta, puedes adquirir o renovar suscripciones con 1 solo clic y activación inmediata sin esperas. Importante: este saldo es exclusivo para compras y renovaciones en la plataforma, no es retirable ni canjeable por efectivo.', order: 2 },
    { id: 'faq-3', category: 'Tasa BCV', question: '¿Cómo se actualiza la tasa oficial del Banco Central de Venezuela (BCV)?', answer: 'Nuestra plataforma se conecta diariamente y de forma automática a los servicios oficiales del BCV para actualizar el valor en Bolívares. Además, el administrador tiene la facultad de ajustar o fijar la tasa manualmente desde el panel de control si fuera necesario.', order: 3 },
    { id: 'faq-4', category: 'Clientes', question: '¿Dónde veo mis cuentas activas y su fecha de vencimiento?', answer: 'Al registrarte en el Área de Clientes con tu correo y contraseña, dispones de una pestaña llamada "Mis Suscripciones & Vencimientos". Allí verás cada servicio contratado, tus credenciales de acceso (usuario, clave, perfil y PIN) y una cuenta regresiva con los días exactos que restan para el vencimiento de cada pantalla.', order: 4 },
    { id: 'faq-5', category: 'Google Sheets', question: '¿Cómo se guardan los datos en Google Sheets?', answer: 'La plataforma integra Google Sheets oficial de tu Google Drive. Cada pedido, usuario y recarga se refleja en tiempo real en tu hoja de cálculo, permitiéndote llevar el control administrativo de tu negocio sin depender de bases de datos externas.', order: 5 },
    { id: 'faq-6', category: 'Garantía', question: '¿Qué garantía tienen las cuentas de streaming?', answer: 'Todas nuestras cuentas y pantallas cuentan con garantía total durante el 100% de la duración contratada (30, 90, 180 o 365 días). Si alguna plataforma presenta caída o bloqueo por actualización, nuestro equipo de soporte te restituye el perfil o cuenta en menos de 30 minutos sin costo adicional.', order: 6 }
  ]),
  bcvRate: load<number>('streamsync_bcv_rate_v2', 36.85),
  supabaseSchemaError: null,
  setSupabaseSchemaError: (supabaseSchemaError) => set({ supabaseSchemaError }),
  firestoreStatus: 'initializing',
  isCloudSyncing: false,
  pendingSyncCount: 0,
  lastSyncTimestamp: null,
  connectionError: null,
  firestoreLatencyMs: null,
  hasCriticalLatency: false,
  setFirestoreStatus: (firestoreStatus) => set({ firestoreStatus }),
  setIsCloudSyncing: (isCloudSyncing) => set({ isCloudSyncing }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  setLastSyncTimestamp: (lastSyncTimestamp) => set({ lastSyncTimestamp }),
  setConnectionError: (connectionError) => set({ connectionError }),
  setFirestoreLatency: (firestoreLatencyMs) => set({ 
    firestoreLatencyMs, 
    hasCriticalLatency: typeof firestoreLatencyMs === 'number' && firestoreLatencyMs > 3000 
  }),
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
      syncProductsList(state.products, products);
      return { products };
    });
  },
  setOrders: (val) => {
    set((state) => {
      const orders = typeof val === 'function' ? (val as any)(state.orders) : val;
      localStorage.setItem('streamsync_orders_v2', JSON.stringify(orders));
      syncOrdersList(state.orders, orders);
      return { orders };
    });
  },
  setCustomers: (val) => {
    set((state) => {
      const customers = typeof val === 'function' ? (val as any)(state.customers) : val;
      localStorage.setItem('streamsync_customers_v2', JSON.stringify(customers));
      syncCustomersList(state.customers, customers);
      return { customers };
    });
  },
  setActiveCustomer: (val) => {
    set((state) => {
      const activeCustomer = typeof val === 'function' ? (val as any)(state.activeCustomer) : val;
      localStorage.setItem('streamsync_current_customer_v2', JSON.stringify(activeCustomer));
      if (activeCustomer && !isSyncingFromFirestore) {
        syncCustomerToFirestore(activeCustomer);
      }
      return { activeCustomer };
    });
  },
  setWalletTopups: (val) => {
    set((state) => {
      const walletTopups = typeof val === 'function' ? (val as any)(state.walletTopups) : val;
      localStorage.setItem('streamsync_topups_v2', JSON.stringify(walletTopups));
      syncTopupsList(state.walletTopups, walletTopups);
      return { walletTopups };
    });
  },
  setIncidents: (val) => {
    set((state) => {
      const incidents = typeof val === 'function' ? (val as any)(state.incidents) : val;
      localStorage.setItem('streamsync_incidents_v2', JSON.stringify(incidents));
      syncIncidentsList(state.incidents, incidents);
      return { incidents };
    });
  },
  setFranchises: (val) => {
    set((state) => {
      const franchises = typeof val === 'function' ? (val as any)(state.franchises) : val;
      localStorage.setItem('streamsync_franchises_v1', JSON.stringify(franchises));
      syncFranchisesList(state.franchises, franchises);
      return { franchises };
    });
  },
  setExpenses: (val) => {
    set((state) => {
      const expenses = typeof val === 'function' ? (val as any)(state.expenses) : val;
      localStorage.setItem('gi_expenses_list_2026', JSON.stringify(expenses));
      syncExpensesList(state.expenses, expenses);
      return { expenses };
    });
  },
  setPaymentMethods: (val) => {
    set((state) => {
      const paymentMethods = typeof val === 'function' ? (val as any)(state.paymentMethods) : val;
      localStorage.setItem('streamsync_methods_v2', JSON.stringify(paymentMethods));
      syncPaymentMethodsList(state.paymentMethods, paymentMethods);
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
      if (!isSyncingFromFirestore) {
        syncFaqToFirestore(faqItems);
      }
      return { faqItems };
    });
  },
  setBcvRate: (bcvRate) => {
    localStorage.setItem('streamsync_bcv_rate_v2', JSON.stringify(bcvRate));
    if (!isSyncingFromFirestore) {
      syncBcvRateToFirestore(bcvRate);
    }
    set({ bcvRate });
  },
  setPurchases: (val) => {
    set((state) => {
      const purchases = typeof val === 'function' ? (val as any)(state.purchases) : val;
      localStorage.setItem('streamsync_purchases_v2', JSON.stringify(purchases));
      syncPurchasesList(state.purchases, purchases);
      return { purchases };
    });
  },
  setBranding: (val) => {
    set((state) => {
      const branding = typeof val === 'function' ? (val as any)(state.branding) : val;
      localStorage.setItem('streamsync_branding_v1', JSON.stringify(branding));
      if (!isSyncingFromFirestore) {
        syncBrandingToFirestore(branding);
      }
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
export const useFirestoreStatus = () => useAppStore((state) => state.firestoreStatus);
export const useIsCloudSyncing = () => useAppStore((state) => state.isCloudSyncing);
export const usePendingSyncCount = () => useAppStore((state) => state.pendingSyncCount);
export const useLastSyncTimestamp = () => useAppStore((state) => state.lastSyncTimestamp);
export const useConnectionError = () => useAppStore((state) => state.connectionError);
export const useFirestoreLatencyMs = () => useAppStore((state) => state.firestoreLatencyMs);
export const useHasCriticalLatency = () => useAppStore((state) => state.hasCriticalLatency);
