import { create } from 'zustand';
import { 
  Product, Order, CustomerUser, FranchiseTenant, ExpenseItem, 
  PaymentMethod, SupplierPurchase, AccountingEntry, AppBrandingConfig, Invoice,
  WalletTopup, IncidentReport, FaqItem
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS, INITIAL_CUSTOMERS 
} from '../data/defaultCatalog';

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
  
  // Actions
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
    { id: 'faq-1', category: 'Garantía', question: '¿Qué pasa si mi cuenta deja de funcionar?', answer: 'Todas nuestras cuentas cuentan con garantía total por el tiempo contratado. Si tienes algún inconveniente, puedes abrir un reporte técnico en el Portal de Soporte y te lo solventaremos de inmediato.', order: 1 },
    { id: 'faq-2', category: 'Pagos', question: '¿Cómo reportar un pago móvil o transferencia?', answer: 'Realiza tu pago a nuestros datos oficiales, guarda el comprobante y sube la captura con el número de referencia en el formulario de pago del producto o sección de confirmación.', order: 2 },
    { id: 'faq-3', category: 'Zeny', question: '¿Qué es el saldo ZenyPoints?', answer: 'Es el saldo digital en dólares (USD) recargable para comprar al instante en nuestra plataforma sin esperar validación bancaria.', order: 3 },
    { id: 'faq-4', category: 'Renovaciones', question: '¿Pierdo mi perfil si renuevo?', answer: 'No, al renovar sobre tu mismo perfil conservas intactas tus configuraciones, historial y listas guardadas.', order: 4 }
  ]),
  bcvRate: load<number>('streamsync_bcv_rate_v2', 36.85),
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
      containerMaxWidth: 'max-w-7xl'
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
