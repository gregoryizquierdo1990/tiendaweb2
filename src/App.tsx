import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminReconciliationModal } from './components/AdminReconciliationModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminLoginPage } from './components/AdminLoginPage';
import {
  getActiveAdminSession,
  clearAdminSession,
  setAdminSession
} from './config/adminCredentials';
import { SheetsConnectModal } from './components/SheetsConnectModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerPortalModal } from './components/CustomerPortalModal';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { FloatingIncidentButton } from './components/FloatingIncidentButton';
import { IncidentReportModal } from './components/IncidentReportModal';
import { PlatformBotWidget } from './components/PlatformBotWidget';
import { AddManualCustomerModal } from './components/AddManualCustomerModal';
import { GeminiPanel } from './components/GeminiPanel';
import { DEFAULT_MESSAGE_TEMPLATES, DOMAIN_OFFICIAL, DEFAULT_ACTION_MAPPING } from './utils/messageTemplates';
import { logAuditEvent } from './services/auditLogger';
import { useAppStore } from './store/useAppStore';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { 
  initRealtimeFirestoreSync, 
  syncCustomerToFirestore, 
  syncOrderToFirestore, 
  syncWalletTopupToFirestore, 
  syncIncidentToFirestore,
  syncProductToFirestore,
  deleteProductFromFirestore,
  sanitizeForFirestore,
  seedFirestoreIfEmpty
} from './services/firestoreService';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InvoiceViewer } from './components/InvoiceViewer';
import { registerServiceWorker, sendPushNotification } from './utils/pushNotifications';
import { whatsappLink, BUSINESS } from './config/business';
import {
  Product,
  PaymentMethod,
  Order,
  CurrencyCode,
  ServiceCategory,
  PlanDuration,
  SheetsConnectionState,
  GoogleUser,
  OrderStatus,
  CustomerUser,
  UserRole,
  WalletTopup,
  IncidentReport,
  IncidentStatus,
  FaqItem,
  MessageTemplate,
  ActionTemplateMapping,
  FranchiseTenant,
  FranchiseTopupReport,
  SupplierPurchase,
  AppBrandingConfig,
  ExpenseItem,
  Invoice
} from './types';

import {
  INITIAL_PRODUCTS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_SAMPLE_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_TOPUPS,
  INITIAL_INCIDENTS,
  INITIAL_FRANCHISES,
  INITIAL_FRANCHISE_TOPUPS,
  INITIAL_SUPPLIER_PURCHASES
} from './data/defaultCatalog';

import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  isGoogleOAuthToken
} from './services/googleAuth';

import {
  createStreamSyncSpreadsheet,
  listUserSpreadsheets,
  appendOrderToSheet,
  updateOrderStatusInSheet,
  fetchOrdersFromSheet,
  syncCustomersToSheet,
  generateAndSyncFinancialReportsToSheet,
  appendIncidentToSheet,
  syncIncidentsToSheet,
  syncFaqToSheet,
  syncMessageTemplatesToSheet,
  searchAndLinkSpreadsheetByName,
  performFullPlatformSync,
  isValidSpreadsheetId
} from './services/googleSheets';

import { fetchLiveBcvRate } from './services/bcvRate';
import { triggerAutomaticSync } from './utils/syncManager';

import {
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  Wallet
} from 'lucide-react';

import { calculateExpirationDate } from './utils/formatters';
import { PWAInstallBanner, IOSInstallModal } from './components/PWAInstallBanner';

const STORAGE_PRODUCTS_KEY = 'streamsync_products_v2';
const STORAGE_ORDERS_KEY = 'streamsync_orders_v2';
const STORAGE_SHEET_KEY = 'streamsync_sheet_config_v2';
const STORAGE_CUSTOMERS_KEY = 'streamsync_customers_v2';
const STORAGE_CURRENT_CUSTOMER_KEY = 'streamsync_current_customer_v2';
const STORAGE_TOPUPS_KEY = 'streamsync_topups_v2';
const STORAGE_METHODS_KEY = 'streamsync_methods_v2';
const STORAGE_BCV_KEY = 'streamsync_bcv_rate_v2';
const STORAGE_INCIDENTS_KEY = 'streamsync_incidents_v2';
const STORAGE_TEMPLATES_KEY = 'streamsync_message_templates_v2';
const STORAGE_ACTION_MAPPING_KEY = 'streamsync_action_mapping_v2';
const STORAGE_FRANCHISES_KEY = 'streamsync_franchises_v1';
const STORAGE_FRANCHISE_TOPUPS_KEY = 'streamsync_franchise_topups_v1';
const STORAGE_BRANDING_KEY = 'streamsync_branding_v1';
const STORAGE_EXPENSES_KEY = 'gi_expenses_list_2026';

export default function App() {
  // Global catalog
  const { products, setProducts } = useAppStore();
  const { branding, setBranding } = useAppStore();
  const { supabaseSchemaError, setSupabaseSchemaError } = useAppStore();
  const { paymentMethods, setPaymentMethods } = useAppStore();
  const { orders, setOrders } = useAppStore();
  const { customers: customerUsers, setCustomers: setCustomerUsers } = useAppStore();
  
  // Logged-in customer user
  const { activeCustomer, setActiveCustomer } = useAppStore();

  // Wallet topups state
  const { walletTopups, setWalletTopups } = useAppStore();

  // Incidents state
  const { incidents, setIncidents } = useAppStore();

  // FAQ Items
  const { faqItems, setFaqItems } = useAppStore();

  // BCV Rate state
  const { bcvRate, setBcvRate } = useAppStore();
  const [isBcvLoading, setIsBcvLoading] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);

  // UI state
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [checkoutData, setCheckoutData] = useState<{
    product: Product;
    duration: PlanDuration;
  } | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  
  // Ruta activa de la aplicación y estado de sesión administrativa
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.toLowerCase();
  });

  const [adminSession, setAdminSessionState] = useState(() => {
    return getActiveAdminSession();
  });

  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    return window.location.pathname.toLowerCase().startsWith('/admin') && Boolean(getActiveAdminSession());
  });
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Bidirectional real-time cloud synchronization via Firebase Firestore
  useEffect(() => {
    setIsCloudSyncing(true);
    const unsubscribeFirestore = initRealtimeFirestoreSync();
    setIsDbLoaded(true);
    setIsCloudSyncing(false);

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Escuchar navegación del navegador (atrás/adelante o cambios de URL directa)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      setCurrentPath(path);
      const activeSession = getActiveAdminSession();
      setAdminSessionState(activeSession);
      if (path.startsWith('/admin')) {
        setIsAdminOpen(Boolean(activeSession));
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);
  const STORAGE_SUPPLIER_PURCHASES_KEY = 'streamsync_supplier_purchases_v1';
  // Purchases & Expenses
  const { purchases: supplierPurchases, setPurchases: setSupplierPurchases } = useAppStore();
  const { expenses, setExpenses } = useAppStore();
  const { invoices, setInvoices } = useAppStore();

  // Expenses state

  // Expenses state


  useEffect(() => {
    localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = (expenseData: Omit<ExpenseItem, 'id' | 'createdAt'>) => {
    const newExp: ExpenseItem = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setExpenses((prev) => [newExp, ...prev]);
    showNotification('success', `Gasto "${newExp.description}" registrado con éxito.`);
  };

  const handleUpdateExpense = (updated: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    showNotification('success', `Gasto actualizado correctamente.`);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showNotification('success', `Gasto eliminado.`);
  };

  const handleAddPaymentMethod = (newMethod: PaymentMethod) => {
    setPaymentMethods((prev) => [...prev, newMethod]);
    showNotification('success', `Método de pago "${newMethod.name}" agregado exitosamente.`);
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
    showNotification('success', `Método de pago eliminado.`);
  };

  const [isAddManualCustomerOpen, setIsAddManualCustomerOpen] = useState(false);

  // Message templates state with fallback to defaults
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TEMPLATES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load message templates from storage');
    }
    return DEFAULT_MESSAGE_TEMPLATES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TEMPLATES_KEY, JSON.stringify(templates));
    } catch (e) {
      console.warn('Could not save message templates to storage');
    }
  }, [templates]);

  // Single session per user across devices enforcement
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAdminOpen) {
        const activeStaffId = localStorage.getItem('streamsync_active_logged_staff_id') || 'admin-maxter';
        const activeToken = localStorage.getItem(`streamsync_staff_session_token_${activeStaffId}`);
        const myToken = sessionStorage.getItem('streamsync_my_staff_session');
        if (activeToken && myToken && activeToken !== myToken) {
          setIsAdminOpen(false);
          localStorage.removeItem('streamsync_active_logged_staff_id');
          showNotification('error', 'Sesión cerrada: Se ha iniciado sesión en otro dispositivo o pestaña de forma simultánea.');
        }
      }
      if (isCustomerPortalOpen && activeCustomer) {
        const activeToken = localStorage.getItem(`streamsync_customer_session_token_${activeCustomer.id}`);
        const myToken = sessionStorage.getItem('streamsync_my_customer_session');
        if (activeToken && myToken && activeToken !== myToken) {
          setIsCustomerPortalOpen(false);
          setActiveCustomer(null);
          showNotification('error', 'Sesión cerrada: Se ha iniciado sesión en otro dispositivo o pestaña de forma simultánea.');
        }
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isAdminOpen, isCustomerPortalOpen, activeCustomer]);

  // Deep production cleanup script on mount to purge all lingering demo records in localStorage
  useEffect(() => {
    try {
      const allKeysToClean = [
        'streamsync_products_v2',
        'streamsync_orders_v2',
        'streamsync_customers_v2',
        'streamsync_purchases_v2',
        'streamsync_invoices_v1',
        'gi_expenses_list_2026',
        'streamsync_topups_v2',
        'streamsync_incidents_v2',
        'gregory_audit_logs_v1',
        'streamsync_franchises_v1',
        'streamsync_franchise_topups_v1',
        'maxter_accounts_receivable',
        'maxter_accounts_payable'
      ];
      allKeysToClean.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter((item: any) => {
                const str = JSON.stringify(item).toLowerCase();
                return (
                  !str.includes('demo') &&
                  !str.includes('prueba') &&
                  !str.includes('netflix') &&
                  !str.includes('disney') &&
                  !str.includes('sample') &&
                  !str.includes('test') &&
                  !str.includes('cliente@demo.com')
                );
              });
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          } catch {
            localStorage.setItem(key, '[]');
          }
        }
      });
    } catch (e) {
      console.warn('Deep cleanup script error', e);
    }
  }, []);

  // Register Service Worker for push notifications
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Action to Template Mapping state
  const [actionMapping, setActionMapping] = useState<ActionTemplateMapping>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTION_MAPPING_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load action mapping');
    }
    return DEFAULT_ACTION_MAPPING;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTION_MAPPING_KEY, JSON.stringify(actionMapping));
    } catch (e) {
      console.warn('Could not save action mapping');
    }
  }, [actionMapping]);

  // Franchise & Multi-Tenant State (clean production defaults)
  const [franchises, setFranchises] = useState<FranchiseTenant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FRANCHISES_KEY);
      if (saved) {
        const list = JSON.parse(saved);
        return list.filter((f: any) => !['franq-1', 'franq-2', 'franq-3'].includes(f.id));
      }
    } catch (e) {
      console.warn('Could not load franchises');
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FRANCHISES_KEY, JSON.stringify(franchises));
    } catch (e) {
      console.warn('Could not save franchises');
    }
  }, [franchises]);

  const [franchiseTopups, setFranchiseTopups] = useState<FranchiseTopupReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FRANCHISE_TOPUPS_KEY);
      if (saved) {
        const list = JSON.parse(saved);
        return list.filter((t: any) => !['ABONO-9812', 'ABONO-9750'].includes(t.id));
      }
    } catch (e) {
      console.warn('Could not load franchise topups');
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FRANCHISE_TOPUPS_KEY, JSON.stringify(franchiseTopups));
      if (isSupabaseConfigured && franchiseTopups.length > 0) {
        Promise.all(franchiseTopups.map((ft) =>
          supabase.from('franchise_topups').upsert({
            id: ft.id,
            franchise_id: ft.franchiseId,
            franchise_name: ft.franchiseName,
            franchise_phone: ft.franchisePhone,
            franchise_telegram: ft.franchiseTelegram,
            target_customer_name: ft.targetCustomerName,
            target_customer_id: ft.targetCustomerId,
            amount_usd: ft.amountUsd,
            amount_bs: ft.amountBs,
            payment_method: ft.paymentMethod,
            reference_number: ft.referenceNumber,
            screenshot_image: ft.screenshotImage,
            notes: ft.notes,
            status: ft.status,
            reviewed_at: ft.reviewedAt,
            reviewed_by: ft.reviewedBy,
            rejection_reason: ft.rejectionReason
          })
        )).catch(err => console.warn('Supabase franchise topups write notice:', err));
      }
    } catch (e) {
      console.warn('Could not save franchise topups');
    }
  }, [franchiseTopups]);

  // Google OAuth & Sheets State
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [sheetsState, setSheetsState] = useState<SheetsConnectionState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHEET_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && isValidSpreadsheetId(parsed.spreadsheetId)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load saved sheets state');
    }
    return {
      isConnected: false,
      spreadsheetId: '',
      spreadsheetName: '',
      spreadsheetUrl: '',
      lastSyncedAt: null,
      syncStatus: 'idle'
    };
  });

  const [availableDriveSheets, setAvailableDriveSheets] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingDriveSheets, setIsLoadingDriveSheets] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Load and refresh live BCV rate automatically on app load
  const loadLiveBcvRate = useCallback(async () => {
    try {
      setIsBcvLoading(true);
      const res = await fetchLiveBcvRate();
      if (res.rate && res.rate > 0) {
        setBcvRate(res.rate);
        localStorage.setItem(STORAGE_BCV_KEY, res.rate.toString());
      }
    } catch (e) {
      console.warn('Could not fetch live BCV rate, using cached value:', e);
    } finally {
      setIsBcvLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveBcvRate();
  }, [loadLiveBcvRate]);

  const handleSupabaseSyncError = useCallback((err: any, context: string) => {
    console.warn(`Notice in ${context}:`, err);
  }, []);

  const verifySupabaseSchema = useCallback(async (): Promise<boolean> => {
    return true;
  }, []);

  // Load and bidirectionally sync database tables with Firestore on startup
  const syncDatabaseWithSupabase = useCallback(async () => {
    try {
      await seedFirestoreIfEmpty();
      showNotification('success', 'Base de datos Firestore sincronizada en tiempo real.');
    } catch (err: any) {
      console.warn('Notice seeding Firestore:', err);
    }
  }, []);

  useEffect(() => {
    if (paymentMethods.length === 0) {
      setPaymentMethods(INITIAL_PAYMENT_METHODS);
    }
    syncDatabaseWithSupabase();
  }, []);

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customerUsers));
  }, [customerUsers]);

  useEffect(() => {
    if (activeCustomer) {
      localStorage.setItem(STORAGE_CURRENT_CUSTOMER_KEY, JSON.stringify(activeCustomer));
    } else {
      localStorage.removeItem(STORAGE_CURRENT_CUSTOMER_KEY);
    }
  }, [activeCustomer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TOPUPS_KEY, JSON.stringify(walletTopups));
  }, [walletTopups]);

  // Sincronizar solicitudes de recarga de Wallet Zeny hacia la lista general de Pedidos
  useEffect(() => {
    if (walletTopups.length > 0) {
      setOrders((prevOrders) => {
        let changed = false;
        const newOrders = [...prevOrders];
        walletTopups.forEach((topup) => {
          const recId = topup.id.startsWith('WAL-') ? topup.id.replace('WAL-', 'REC-') : `REC-${topup.id}`;
          const existing = newOrders.find((o) => o.id === recId || o.id === topup.id);
          if (!existing) {
            const topupAmount = topup.amountZeny || topup.amount || topup.amountPaid || 1;
            const mappedOrder: Order = {
              id: recId,
              createdAt: topup.createdAt || new Date().toISOString(),
              customerId: topup.customerId,
              customerName: topup.customerName,
              customerEmail: topup.customerEmail,
              customerPhone: topup.customerPhone || '',
              productId: 'topup-zeny',
              productName: `Recarga Saldo Wallet Zeny (${topupAmount} USD)`,
              duration: '1_mes',
              accountType: 'perfil_completo',
              total: topupAmount,
              currency: topup.currency,
              paymentMethodId: topup.paymentMethodId,
              paymentMethodName: topup.paymentMethodName,
              referenceNumber: topup.referenceNumber,
              receiptImage: topup.receiptImage,
              customerNotes: `Solicitud de recarga de saldo virtual Zeny. Acreditar $${topupAmount} USD al saldo del cliente (1 Zeny = 1.00 USD).`,
              status: topup.status === 'approved' ? 'confirmed' : topup.status === 'rejected' ? 'rejected' : 'pending_reconciliation'
            };
            const sanitized = sanitizeForFirestore(mappedOrder);
            newOrders.unshift(sanitized);
            syncOrderToFirestore(sanitized);
            changed = true;
          }
        });
        return changed ? newOrders : prevOrders;
      });
    }
  }, [walletTopups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_METHODS_KEY, JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem(STORAGE_INCIDENTS_KEY, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(sheetsState));
  }, [sheetsState]);

  // Firebase Auth listener for Google Workspace Sheets integration
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setGoogleUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        });
        if (isGoogleOAuthToken(token)) {
          fetchDriveSheets(token);
        }
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Google Sign In handler
  const handleSignInGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res?.user && res?.accessToken) {
        setGoogleUser({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL ?? null
        });
        showNotification('success', `Conectado como ${res.user.displayName || res.user.email}`);
        if (isGoogleOAuthToken(res.accessToken)) {
          fetchDriveSheets(res.accessToken);
        }
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      console.warn('Google Sign In notice:', err?.message || err);
      showNotification('error', 'No se pudo iniciar sesión con Google.');
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setSheetsState((prev) => ({ ...prev, isConnected: false }));
      showNotification('info', 'Sesión de Google cerrada.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchDriveSheets = async (tokenOverride?: string) => {
    const token = tokenOverride || getAccessToken();
    if (!token || !isGoogleOAuthToken(token)) return;
    try {
      setIsLoadingDriveSheets(true);
      const files = await listUserSpreadsheets(token);
      setAvailableDriveSheets(files.map((f) => ({ id: f.id, name: f.name })));
    } catch (err: any) {
      console.warn('Aviso listando archivos de Drive:', err?.message || err);
    } finally {
      setIsLoadingDriveSheets(false);
    }
  };

  const handleCreateNewSheet = async () => {
    let token = getAccessToken();
    if (!token || !isGoogleOAuthToken(token)) {
      await handleSignInGoogle();
      token = getAccessToken();
      if (!token || !isGoogleOAuthToken(token)) return;
    }
    try {
      setSheetsState((prev) => ({ ...prev, syncStatus: 'syncing' }));
      const { spreadsheetId, spreadsheetUrl } = await createStreamSyncSpreadsheet(
        token,
        'StreamSync - Base de Datos Streaming'
      );
      setSheetsState({
        isConnected: true,
        spreadsheetId,
        spreadsheetName: 'StreamSync - Base de Datos Streaming',
        spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'success'
      });
      showNotification('success', '¡Hoja creada en tu Google Drive exitosamente!');
      fetchDriveSheets(token);
    } catch (err: any) {
      console.warn('Aviso al crear hoja de cálculo:', err?.message || err);
      setSheetsState((prev) => ({ ...prev, syncStatus: 'error', errorMessage: err.message }));
      showNotification('error', `Error al crear hoja: ${err.message}`);
    }
  };

  const handleSelectExistingSheet = async (id: string, name: string) => {
    let token = getAccessToken();
    if (!token || !isGoogleOAuthToken(token)) {
      await handleSignInGoogle();
      token = getAccessToken();
      if (!token || !isGoogleOAuthToken(token)) return;
    }
    try {
      setSheetsState((prev) => ({ ...prev, syncStatus: 'syncing' }));
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${id}/edit`;
      setSheetsState({
        isConnected: true,
        spreadsheetId: id,
        spreadsheetName: name,
        spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'success'
      });
      showNotification('success', `Hoja "${name}" vinculada con éxito.`);
      try {
        const remoteOrders = await fetchOrdersFromSheet(token, id);
        if (remoteOrders.length > 0) {
          setOrders((current) => {
            const currentIds = new Set(current.map((o) => o.id));
            const newFromRemote = remoteOrders.filter((ro) => !currentIds.has(ro.id));
            return [...current, ...newFromRemote];
          });
        }
      } catch (e) {
        console.warn('Could not read existing rows from sheet:', e);
      }
    } catch (err: any) {
      console.warn('Aviso al vincular hoja existente:', err?.message || err);
      showNotification('error', 'Error al vincular hoja de cálculo.');
    }
  };

  const [isSyncingFull, setIsSyncingFull] = useState(false);

  const handleSearchAndLinkFile = async (fileName: string = 'streaming_gregory') => {
    let token = getAccessToken();
    if (!token || !isGoogleOAuthToken(token)) {
      showNotification('info', 'Iniciando sesión con Google para buscar en tu Drive...');
      await handleSignInGoogle();
      token = getAccessToken();
      if (!token || !isGoogleOAuthToken(token)) return;
    }

    try {
      showNotification('info', `Buscando "${fileName}" en tu Google Drive...`);
      const found = await searchAndLinkSpreadsheetByName(token, fileName);
      if (found) {
        setSheetsState({
          isConnected: true,
          spreadsheetId: found.id,
          spreadsheetName: found.name,
          spreadsheetUrl: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}/edit`,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'success'
        });
        showNotification('success', `¡Hoja "${found.name}" vinculada con éxito desde Google Drive!`);
        fetchDriveSheets(token);
      } else {
        showNotification('info', `No se encontró "${fileName}". Creando automáticamente en tu Google Drive...`);
        const { spreadsheetId, spreadsheetUrl } = await createStreamSyncSpreadsheet(token, fileName);
        setSheetsState({
          isConnected: true,
          spreadsheetId,
          spreadsheetName: fileName,
          spreadsheetUrl,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'success'
        });
        showNotification('success', `¡Hoja "${fileName}" creada y vinculada en tu Drive!`);
        fetchDriveSheets(token);
      }
    } catch (err: any) {
      console.warn('Aviso al vincular archivo:', err?.message || err);
      showNotification('error', `Error al vincular: ${err.message}`);
    }
  };

  const handlePerformFullPlatformSync = async () => {
    let token = getAccessToken();
    if (!token || !isGoogleOAuthToken(token)) {
      showNotification('info', 'Inicia sesión con Google para autorizar la sincronización de Sheets.');
      await handleSignInGoogle();
      token = getAccessToken();
      if (!token || !isGoogleOAuthToken(token)) return;
    }

    if (!sheetsState.isConnected || !isValidSpreadsheetId(sheetsState.spreadsheetId)) {
      showNotification('info', 'Vincula una hoja de Google Drive primero.');
      setIsSheetsModalOpen(true);
      return;
    }

    try {
      setIsSyncingFull(true);
      showNotification('info', 'Iniciando respaldo total en Google Drive...');
      const res = await performFullPlatformSync(token, sheetsState.spreadsheetId!, {
        orders,
        customers: customerUsers,
        invoices,
        purchases: supplierPurchases,
        expenses,
        bcvRate
      });
      setSheetsState((prev) => ({
        ...prev,
        lastSyncedAt: res.syncedAt,
        syncStatus: 'success'
      }));
      showNotification('success', `¡Sincronización total exitosa! ${res.stats.orders} pedidos y ${res.stats.customers} clientes guardados.`);
    } catch (err: any) {
      console.warn('Aviso en sincronización total:', err?.message || err);
      showNotification('error', `Error en sincronización: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsSyncingFull(false);
    }
  };

  // Autoguardado automático de transacciones a Google Drive cada 5 minutos
  useEffect(() => {
    const timer = setInterval(() => {
      const token = getAccessToken();
      if (token && isGoogleOAuthToken(token) && sheetsState.isConnected && isValidSpreadsheetId(sheetsState.spreadsheetId)) {
        performFullPlatformSync(token, sheetsState.spreadsheetId!, {
          orders,
          customers: customerUsers,
          invoices,
          purchases: supplierPurchases,
          expenses,
          bcvRate
        }).then((res) => {
          setSheetsState((prev) => ({
            ...prev,
            lastSyncedAt: res.syncedAt,
            syncStatus: 'success'
          }));
        }).catch((err) => {
          console.warn('Auto-sync silencioso (5 min) aviso:', err?.message || err);
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, [sheetsState.isConnected, sheetsState.spreadsheetId, orders, customerUsers, invoices, supplierPurchases, expenses, bcvRate]);

  const handleSyncWithSheets = async () => {
    const token = getAccessToken();
    if (!token || !sheetsState.spreadsheetId) {
      showNotification('info', 'Por favor conecta tu cuenta de Google primero.');
      return;
    }

    try {
      setSheetsState((prev) => ({ ...prev, syncStatus: 'syncing' }));
      const remoteOrders = await fetchOrdersFromSheet(token, sheetsState.spreadsheetId);
      setOrders((prev) => {
        const orderMap = new Map<string, Order>();
        prev.forEach((o) => orderMap.set(o.id, o));
        remoteOrders.forEach((ro) => orderMap.set(ro.id, ro));
        return Array.from(orderMap.values());
      });
      setSheetsState((prev) => ({
        ...prev,
        syncStatus: 'success',
        lastSyncedAt: new Date().toISOString()
      }));
      showNotification('success', 'Sincronización con Google Sheets completada.');
    } catch (err: any) {
      console.error('Sync error:', err);
      setSheetsState((prev) => ({ ...prev, syncStatus: 'error' }));
      showNotification('error', `Error al sincronizar: ${err.message}`);
    }
  };

  const handleSyncCustomersToSheet = async () => {
    const token = getAccessToken();
    if (!token || !sheetsState.spreadsheetId) {
      showNotification('info', 'Por favor conecta tu cuenta de Google primero.');
      return;
    }
    try {
      await syncCustomersToSheet(token, sheetsState.spreadsheetId, customerUsers);
      showNotification('success', '¡Base de datos de Clientes sincronizada en Google Drive!');
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Error al sincronizar clientes: ${err.message}`);
    }
  };

  const handleSyncReportsToSheet = async () => {
    const token = getAccessToken();
    if (!token || !sheetsState.spreadsheetId) {
      showNotification('info', 'Por favor conecta tu cuenta de Google primero.');
      return;
    }
    try {
      await generateAndSyncFinancialReportsToSheet(
        token,
        sheetsState.spreadsheetId,
        orders,
        bcvRate,
        paymentMethods
      );
      showNotification('success', '¡Hojas de Conciliación Mensual y Métodos exportadas a tu Drive!');
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Error al exportar reportes: ${err.message}`);
    }
  };

  const handleSyncIncidentsToSheet = async () => {
    const token = getAccessToken();
    if (!token || !sheetsState.spreadsheetId) {
      showNotification('info', 'Por favor conecta tu cuenta de Google primero.');
      return;
    }
    try {
      await syncIncidentsToSheet(token, sheetsState.spreadsheetId, incidents);
      showNotification('success', '¡Incidencias sincronizadas exitosamente en tu Google Drive!');
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Error al sincronizar incidencias: ${err.message}`);
    }
  };

  const handleSubmitIncident = async (newIncident: IncidentReport) => {
    setIncidents((prev) => [newIncident, ...prev]);
    await syncIncidentToFirestore(newIncident);
    showNotification('success', `¡Reporte de falla #${newIncident.id} enviado exitosamente!`);

    // Sync to Google Sheets if connected
    const token = getAccessToken();
    if (sheetsState.isConnected && sheetsState.spreadsheetId && token) {
      try {
        await appendIncidentToSheet(token, sheetsState.spreadsheetId, newIncident);
      } catch (e) {
        console.warn('Could not append incident to Google Sheets:', e);
      }
    }
  };

  const handleUpdateIncidentStatus = async (
    incidentId: string,
    newStatus: IncidentStatus,
    adminNotes?: string,
    solution?: string
  ) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: newStatus,
            adminNotes: adminNotes !== undefined ? adminNotes : inc.adminNotes,
            solution: solution !== undefined ? solution : inc.solution,
            resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : inc.resolvedAt
          };
        }
        return inc;
      })
    );
    showNotification('info', `Ticket #${incidentId} actualizado (${newStatus}).`);
  };

  // Customer & Seller Role Management
  // Customer & Seller Role Management with Discounts
  const handleUpdateCustomerRole = async (
    customerId: string,
    newRole: UserRole,
    sellerCode?: string,
    discountPercent?: number
  ) => {
    setCustomerUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === customerId) {
          return {
            ...u,
            role: newRole,
            sellerCode: sellerCode !== undefined ? sellerCode : u.sellerCode,
            discountPercent: discountPercent !== undefined ? discountPercent : u.discountPercent
          };
        }
        return u;
      });
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(next));
      return next;
    });

    if (activeCustomer && activeCustomer.id === customerId) {
      setActiveCustomer((prev) =>
        prev
          ? {
              ...prev,
              role: newRole,
              sellerCode: sellerCode !== undefined ? sellerCode : prev.sellerCode,
              discountPercent: discountPercent !== undefined ? discountPercent : prev.discountPercent
            }
          : null
      );
    }
    showNotification('success', `Rol y descuento actualizados con éxito.`);
  };

  const handleAddUserFromAdmin = async (
    newUser: Omit<CustomerUser, 'id' | 'zenyBalance' | 'createdAt'> & { discountPercent?: number }
  ) => {
    const created: CustomerUser = {
      ...newUser,
      id: `user-${Date.now()}`,
      zenyBalance: 0,
      createdAt: new Date().toISOString()
    };
    setCustomerUsers((prev) => {
      const next = [created, ...prev];
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(next));
      return next;
    });
    showNotification('success', `${newUser.role === 'vendedor' ? 'Vendedor' : 'Cliente'} ${created.name} registrado con éxito.`);
  };

  // Product Catalog CRUD handlers
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(next));
      return next;
    });
    showNotification('success', `Tarjeta "${updatedProduct.name}" actualizada con éxito.`);
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => {
      const next = [newProduct, ...prev];
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(next));
      return next;
    });
    showNotification('success', `Servicio "${newProduct.name}" añadido al catálogo.`);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(next));
      return next;
    });
    showNotification('info', 'Servicio eliminado del catálogo.');
  };

  const handleToggleSuspendCustomer = (customerId: string) => {
    setCustomerUsers((prev) =>
      prev.map((u) => {
        if (u.id === customerId) {
          const nextSuspended = !u.isSuspended;
          showNotification(
            nextSuspended ? 'error' : 'success',
            `Usuario ${u.name} ha sido ${nextSuspended ? 'suspendido' : 'reactivado'}.`
          );
          return { ...u, isSuspended: nextSuspended };
        }
        return u;
      })
    );
  };

  const handleSendGiftToCustomer = async (
    customerId: string,
    giftType: 'grpay' | 'membership',
    amountOrProductId: string,
    duration?: PlanDuration
  ) => {
    const customer = customerUsers.find((u) => u.id === customerId);
    if (!customer) return;

    if (giftType === 'grpay') {
      const amount = parseFloat(amountOrProductId) || 10;
      setCustomerUsers((prev) =>
        prev.map((u) => (u.id === customerId ? { ...u, zenyBalance: (u.zenyBalance || 0) + amount } : u))
      );
      if (activeCustomer && activeCustomer.id === customerId) {
        setActiveCustomer((prev) => (prev ? { ...prev, zenyBalance: (prev.zenyBalance || 0) + amount } : null));
      }
      showNotification('success', `¡Regalo enviado! Se acreditaron $${amount} USD en Zeny a ${customer.name}.`);
    } else if (giftType === 'membership') {
      const prod = products.find((p) => p.id === amountOrProductId);
      if (!prod) return;
      const planDur = duration || '1 mes';

      const newGiftOrder: Order = {
        id: `GIFT-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        productId: prod.id,
        productName: `${prod.name} (Regalo Cortesía)`,
        accountType: prod.accountType,
        duration: planDur,
        total: 0,
        currency: 'USD',
        paymentMethodId: 'gift',
        paymentMethodName: 'Regalo de Cortesía - Admin',
        referenceNumber: 'CORTESIA-ADMIN',
        status: 'confirmed',
        assignedSellerId: 'vend-1',
        assignedSellerName: 'Gregori Izquierdo (Principal)',
        credentials: {
          accountUser: customer.email,
          accountPass: 'Streaming2026*',
          pin: '1234',
          profileName: `Perfil Regalo (${customer.name.split(' ')[0]})`,
          startDate: new Date().toISOString(),
          expirationDate: calculateExpirationDate(new Date().toISOString(), planDur),
          instructions: 'Membresía de cortesía obsequiada por administración. ¡Disfrútala!'
        }
      };

      setOrders((prev) => [newGiftOrder, ...prev]);
      showNotification('success', `¡Membresía de ${prod.name} (${planDur}) regalada a ${customer.name} con éxito!`);
    }
  };

  // Customer Registration & Auth
  const handleRegisterCustomer = async (
    newUser: Omit<CustomerUser, 'id' | 'zenyBalance' | 'createdAt'>
  ): Promise<CustomerUser> => {
    if (newUser.email) {
      const existing = customerUsers.find((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
      if (existing && existing.isSuspended) {
        throw new Error('Esta cuenta se encuentra suspendida.');
      }
    }
    const created: CustomerUser = {
      ...newUser,
      id: `cust-${Date.now()}`,
      internalId: `CLI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      zenyBalance: 0,
      discountPercent: newUser.discountPercent || 0,
      createdAt: new Date().toISOString()
    };
    setCustomerUsers((prev) => [created, ...prev]);
    setActiveCustomer(created);
    await syncCustomerToFirestore(created);
    showNotification('success', `¡Bienvenido a Gregori Izquierdo Streaming, ${created.name}!`);
    return created;
  };

  // Order submission
  const handleSubmitOrder = async (order: Order, usedGrpay?: boolean) => {
    if (activeCustomer?.isSuspended) {
      showNotification('error', 'Tu cuenta se encuentra suspendida para realizar compras. Contacta a soporte.');
      return;
    }
    // If paid with Zeny, deduct balance from activeCustomer
    if (usedGrpay && activeCustomer) {
      const deduction = order.total; // in USD / Zeny
      const newBalance = Math.max(0, (activeCustomer.zenyBalance || 0) - deduction);
      const updatedUser = { ...activeCustomer, zenyBalance: newBalance };

      setActiveCustomer(updatedUser);
      setCustomerUsers((prev) =>
        prev.map((u) => (u.id === activeCustomer.id ? updatedUser : u))
      );
      await syncCustomerToFirestore(updatedUser);
    }

    setOrders((prev) => [order, ...prev]);
    await syncOrderToFirestore(order);

    // Log to audit bitácora
    logAuditEvent({
      actor: order.customerName,
      actorRole: 'customer',
      actorEmail: order.customerEmail,
      actorPhone: order.customerPhone,
      action: 'CREAR_PEDIDO',
      description: `Creó pedido #${order.id} de "${order.productName}" por $${order.total.toFixed(2)} USD (${order.paymentMethodName}).`,
      severity: 'info',
      metadata: { orderId: order.id, totalUsd: order.total, method: order.paymentMethodName }
    });

    // Push to Google Sheets if connected
    const token = getAccessToken();
    if (sheetsState.isConnected && sheetsState.spreadsheetId && token) {
      try {
        await appendOrderToSheet(token, sheetsState.spreadsheetId, order);
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, syncedToSheets: true } : o))
        );
      } catch (err) {
        console.warn('Could not append row to Google Sheets:', err);
      }
    }
  };

  // Update order status from Admin
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    credentials?: Order['credentials'],
    rejectionReason?: string,
    assignedSeller?: { id: string; name: string }
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedOrder: Order = {
            ...o,
            status: newStatus,
            credentials: credentials || o.credentials,
            assignedSellerId: assignedSeller?.id || o.assignedSellerId,
            assignedSellerName: assignedSeller?.name || o.assignedSellerName
          };

          if (rejectionReason && rejectionReason.trim()) {
            updatedOrder.rejectionReason = rejectionReason.trim();
          } else if (newStatus !== 'rejected') {
            delete (updatedOrder as any).rejectionReason;
          }

          // If order is confirmed or delivered, automatically generate internal invoice if not exists
          if (newStatus === 'confirmed' || newStatus === 'delivered') {
            const existingInv = invoices.find(inv => inv.orderId === orderId);
            if (!existingInv) {
              const invNum = `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
              const controlNum = `00-${Math.floor(100000 + Math.random() * 900000)}`;
              const newInvoice: Invoice = {
                id: `inv-${Date.now()}`,
                orderId: updatedOrder.id,
                invoiceNumber: invNum,
                controlNumber: controlNum,
                issueDate: new Date().toISOString(),
                dueDate: updatedOrder.credentials?.expirationDate || new Date().toISOString(),
                customerName: updatedOrder.customerName,
                customerDocId: 'V-26849201',
                customerEmail: updatedOrder.customerEmail,
                customerPhone: updatedOrder.customerPhone,
                items: [
                  {
                    id: `item-${Date.now()}`,
                    description: `${updatedOrder.productName} (${updatedOrder.duration})`,
                    quantity: 1,
                    unitPriceUsd: updatedOrder.total,
                    totalUsd: updatedOrder.total
                  }
                ],
                subtotalUsd: updatedOrder.total,
                taxPercent: 0,
                taxAmountUsd: 0,
                totalUsd: updatedOrder.total,
                bcvRate: bcvRate,
                totalBs: Number((updatedOrder.total * bcvRate).toFixed(2)),
                paymentMethod: updatedOrder.paymentMethodName,
                paymentStatus: 'paid',
                notes: `Generado automáticamente por conciliación del pedido #${updatedOrder.id}`,
                signatureStamp: true
              };
              setInvoices(prevInv => [newInvoice, ...prevInv]);

              try {
                const STORAGE_INVOICES_KEY = 'GI_BILLING_INVOICES_2026';
                const saved = localStorage.getItem(STORAGE_INVOICES_KEY);
                const list: Invoice[] = saved ? JSON.parse(saved) : [];
                if (!list.some(inv => inv.orderId === orderId)) {
                  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify([newInvoice, ...list]));
                }
              } catch (e) {
                console.error('Error saving invoice to local storage:', e);
              }
            }
          }

          return updatedOrder;
        }
        return o;
      })
    );

    // Log to audit bitácora
    logAuditEvent({
      actor: assignedSeller?.name || 'Gregori Izquierdo (Admin)',
      actorRole: assignedSeller ? 'seller' : 'admin',
      action:
        newStatus === 'confirmed'
          ? 'PAGO_CONFIRMADO'
          : newStatus === 'delivered'
          ? 'ENTREGA_CREDENCIALES'
          : newStatus === 'rejected'
          ? 'PEDIDO_RECHAZADO'
          : 'CAMBIO_ESTADO_PEDIDO',
      description: `Pedido #${orderId} actualizado a estado "${newStatus}". ${
        rejectionReason ? `Motivo: ${rejectionReason}` : ''
      }`,
      severity: newStatus === 'rejected' ? 'warning' : 'success',
      metadata: { orderId, newStatus, rejectionReason }
    });

    // Si es un pedido de recarga de saldo Zeny, acreditar automáticamente el saldo al cliente
    if (newStatus === 'confirmed') {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (
        targetOrder &&
        (targetOrder.productId === 'topup-zeny' ||
          targetOrder.productName.toLowerCase().includes('zeny'))
      ) {
        const added = targetOrder.total || 0;
        const userToCredit = customerUsers.find(
          (u) =>
            u.id === targetOrder.customerId ||
            u.email.toLowerCase() === targetOrder.customerEmail.toLowerCase()
        );
        if (userToCredit) {
          const newBal = Number(((userToCredit.zenyBalance || 0) + added).toFixed(2));
          const updatedUser = { ...userToCredit, zenyBalance: newBal };
          setCustomerUsers((prev) =>
            prev.map((u) => (u.id === userToCredit.id ? updatedUser : u))
          );
          if (activeCustomer && (activeCustomer.id === userToCredit.id || activeCustomer.email.toLowerCase() === userToCredit.email.toLowerCase())) {
            setActiveCustomer(updatedUser);
          }
          syncCustomerToFirestore(updatedUser);
        }

        // Marcar la recarga de billetera asociada como aprobada
        setWalletTopups((prev) =>
          prev.map((t) => {
            const recId = t.id.startsWith('WAL-') ? t.id.replace('WAL-', 'REC-') : `REC-${t.id}`;
            if (t.id === orderId || recId === orderId) {
              const approvedTopup: WalletTopup = {
                ...t,
                status: 'approved',
                approvedAt: new Date().toISOString()
              };
              syncWalletTopupToFirestore(approvedTopup);
              return approvedTopup;
            }
            return t;
          })
        );
      }
    } else if (newStatus === 'rejected') {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (
        targetOrder &&
        (targetOrder.productId === 'topup-zeny' ||
          targetOrder.productName.toLowerCase().includes('zeny'))
      ) {
        setWalletTopups((prev) =>
          prev.map((t) => {
            const recId = t.id.startsWith('WAL-') ? t.id.replace('WAL-', 'REC-') : `REC-${t.id}`;
            if (t.id === orderId || recId === orderId) {
              const rejectedTopup: WalletTopup = {
                ...t,
                status: 'rejected',
                rejectionReason: rejectionReason || 'Rechazado por administración'
              };
              syncWalletTopupToFirestore(rejectedTopup);
              return rejectedTopup;
            }
            return t;
          })
        );
      }
    }

    if (newStatus === 'confirmed' || newStatus === 'delivered') {
      sendPushNotification(
        newStatus === 'confirmed' ? '¡Pago Confirmado!' : '¡Credenciales Entregadas!',
        `Tu pedido #${orderId} ha sido procesado con éxito. Ya puedes disfrutar de tu servicio.`
      );

      // Sincronizar en tiempo real hacia Google Calendar
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder) {
        const orderToSync = {
          ...targetOrder,
          status: newStatus,
          credentials: credentials || targetOrder.credentials
        };
        triggerAutomaticSync(orderToSync, sheetsState.spreadsheetId).catch((err) => {
          console.warn('Error al sincronizar con Google Calendar en tiempo real:', err);
        });
      }
    }

    const token = getAccessToken();
    if (sheetsState.isConnected && sheetsState.spreadsheetId && token) {
      try {
        const credsText = credentials
          ? `User: ${credentials.accountUser || ''} | Pass: ${credentials.accountPass || ''} | Perfil: ${credentials.profileName || ''} | PIN: ${credentials.pin || ''} | Vence: ${credentials.expirationDate || ''}`
          : rejectionReason || '';
        await updateOrderStatusInSheet(
          token,
          sheetsState.spreadsheetId,
          orderId,
          newStatus,
          credsText
        );
      } catch (err) {
        console.warn('Could not update status in Google Sheet:', err);
      }
    }

    showNotification(
      'success',
      newStatus === 'confirmed'
        ? `Pedido #${orderId} conciliado y credenciales guardadas.`
        : `Pedido #${orderId} marcado como rechazado.`
    );
  };

  // Customer requests a Zeny wallet topup
  const handleRequestTopup = async (topup: WalletTopup) => {
    if (activeCustomer?.isSuspended) {
      showNotification('error', 'Tu cuenta se encuentra suspendida para recargas de saldo. Contacta a soporte.');
      return;
    }
    const cleanTopup: WalletTopup = {
      ...topup,
      amount: topup.amount ?? topup.amountZeny ?? topup.amountZenyPoints ?? topup.amountPaid
    };
    const sanitized = sanitizeForFirestore(cleanTopup);
    setWalletTopups((prev) => [sanitized, ...prev.filter((t) => t.id !== sanitized.id)]);
    await syncWalletTopupToFirestore(sanitized);

    // Crear la orden correspondiente para que se refleje inmediatamente en el módulo administrativo de Pedidos
    const recId = topup.id.startsWith('WAL-') ? topup.id.replace('WAL-', 'REC-') : `REC-${topup.id}`;
    const topupAmount = topup.amountZeny || topup.amount || topup.amountPaid || 1;
    const topupOrder: Order = {
      id: recId,
      createdAt: topup.createdAt || new Date().toISOString(),
      customerId: topup.customerId,
      customerName: topup.customerName,
      customerEmail: topup.customerEmail,
      customerPhone: topup.customerPhone || activeCustomer?.phone || '',
      productId: 'topup-zeny',
      productName: `Recarga Saldo Wallet Zeny (${topupAmount} USD)`,
      duration: '1_mes',
      accountType: 'perfil_completo',
      total: topupAmount,
      currency: topup.currency,
      paymentMethodId: topup.paymentMethodId,
      paymentMethodName: topup.paymentMethodName,
      referenceNumber: topup.referenceNumber,
      receiptImage: topup.receiptImage,
      customerNotes: `Solicitud de recarga de saldo virtual Zeny. Acreditar $${topupAmount} USD al saldo del cliente (1 Zeny = 1.00 USD).`,
      status: 'pending_reconciliation'
    };
    const sanitizedOrder = sanitizeForFirestore(topupOrder);
    setOrders((prev) => [sanitizedOrder, ...prev.filter((o) => o.id !== recId)]);
    await syncOrderToFirestore(sanitizedOrder);

    showNotification('success', 'Solicitud de recarga enviada. En espera de confirmación.');
  };

  // Admin approves Zeny topup
  const handleApproveTopup = async (topupId: string) => {
    const targetTopup = walletTopups.find((t) => t.id === topupId);
    if (!targetTopup) return;

    const approvedTopup: WalletTopup = {
      ...targetTopup,
      status: 'approved',
      approvedAt: new Date().toISOString()
    };

    setWalletTopups((prev) =>
      prev.map((t) => (t.id === topupId ? approvedTopup : t))
    );
    await syncWalletTopupToFirestore(approvedTopup);

    // Credit user's Zeny balance
    const userToCredit = customerUsers.find(
      (u) =>
        u.id === targetTopup.customerId ||
        u.email.toLowerCase() === targetTopup.customerEmail.toLowerCase()
    );

    if (userToCredit) {
      const added = targetTopup.amountZenyPoints || targetTopup.amountZeny || targetTopup.amount || 0;
      const newBal = Number(((userToCredit.zenyBalance || 0) + added).toFixed(2));
      const updatedUser = { ...userToCredit, zenyBalance: newBal };

      setCustomerUsers((prev) =>
        prev.map((u) => (u.id === userToCredit.id ? updatedUser : u))
      );
      if (activeCustomer && (activeCustomer.id === userToCredit.id || activeCustomer.email.toLowerCase() === userToCredit.email.toLowerCase())) {
        setActiveCustomer(updatedUser);
      }
      await syncCustomerToFirestore(updatedUser);
    }

    // Actualizar el pedido asociado en la lista de pedidos si existe
    const recId = topupId.startsWith('WAL-') ? topupId.replace('WAL-', 'REC-') : `REC-${topupId}`;
    handleUpdateOrderStatus(recId, 'confirmed');

    showNotification(
      'success',
      `¡Recarga #${topupId} aprobada! +${targetTopup.amountZeny || targetTopup.amount || 1} Zeny acreditados a ${targetTopup.customerEmail}.`
    );
  };

  // Admin rejects Zeny topup
  const handleRejectTopup = async (topupId: string, reason?: string) => {
    setWalletTopups((prev) =>
      prev.map((t) =>
        t.id === topupId
          ? { ...t, status: 'rejected', rejectionReason: reason || 'Comprobante no verificado' }
          : t
      )
    );
    const targetTopup = walletTopups.find((t) => t.id === topupId);
    if (targetTopup) {
      syncWalletTopupToFirestore({
        ...targetTopup,
        status: 'rejected',
        rejectionReason: reason || 'Comprobante no verificado'
      });
    }

    const recId = topupId.startsWith('WAL-') ? topupId.replace('WAL-', 'REC-') : `REC-${topupId}`;
    handleUpdateOrderStatus(recId, 'rejected', undefined, reason);
    showNotification('info', `Recarga #${topupId} rechazada.`);
  };

  // Admin manually credits Zeny to an email
  // Admin manually credits or debits Zeny to an email
  const handleManualCreditGrpay = async (customerEmail: string, amount: number, operation: 'credit' | 'debit' = 'credit') => {
    const targetEmail = customerEmail.trim().toLowerCase();
    let found = false;
    let finalBalance = 0;
    const delta = operation === 'debit' ? -Math.abs(amount) : Math.abs(amount);

    setCustomerUsers((prev) =>
      prev.map((u) => {
        if (u.email.toLowerCase() === targetEmail) {
          found = true;
          const newBal = Math.max(0, Number(((u.zenyBalance || 0) + delta).toFixed(2)));
          finalBalance = newBal;
          if (activeCustomer && activeCustomer.id === u.id) {
            setActiveCustomer({ ...activeCustomer, zenyBalance: newBal });
          }
          return { ...u, zenyBalance: newBal };
        }
        return u;
      })
    );

    if (!found) {
      if (delta > 0) {
        const newCust: CustomerUser = {
          id: `cust-${Date.now()}`,
          name: targetEmail.split('@')[0],
          email: targetEmail,
          phone: '+58',
          zenyBalance: delta,
          createdAt: new Date().toISOString()
        };
        setCustomerUsers((prev) => [newCust, ...prev]);
        showNotification('success', `Usuario creado y acreditados +${delta} Zeny a ${targetEmail}.`);
      } else {
        showNotification('error', `No se encontró al usuario con correo ${targetEmail} para debitar.`);
      }
      return;
    }

    if (delta >= 0) {
      showNotification('success', `Acreditados +${delta} Zeny a ${targetEmail}. Saldo: ${finalBalance} Zeny.`);
    } else {
      showNotification('info', `Debitado saldo de ${Math.abs(delta)} Zeny a ${targetEmail}. Saldo actual: ${finalBalance} Zeny.`);
    }
  };

  // Admin updates a payment method's details
  const handleUpdatePaymentMethod = (updated: PaymentMethod) => {
    setPaymentMethods((prev) => {
      const exists = prev.some((m) => m.id === updated.id);
      if (exists) {
        return prev.map((m) => (m.id === updated.id ? updated : m));
      }
      return [...prev, updated];
    });
    showNotification('success', `Método de pago ${updated.name} guardado con éxito.`);
  };

  // Admin saves credit order (manual assignment for senior citizens & trusted clients)
  const handleSaveCreditOrder = (newOrder: Order, newCustomer?: CustomerUser) => {
    setOrders((prev) => [newOrder, ...prev]);
    if (newCustomer) {
      setCustomerUsers((prev) => [newCustomer, ...prev]);
    }

    // Sincronizar en tiempo real hacia Google Calendar
    triggerAutomaticSync(newOrder, sheetsState.spreadsheetId).catch((err) => {
      console.warn('Error al sincronizar crédito con Google Calendar:', err);
    });

    showNotification(
      'success',
      `¡Servicio a crédito asignado con éxito a ${newOrder.customerName}!`
    );
  };

  // Admin updates credit status (liquidated / paid / overdue)
  const handleUpdateCreditStatus = (
    orderId: string,
    creditStatus: 'pending_payment' | 'paid' | 'overdue',
    paymentNotes?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            creditStatus,
            customerNotes: paymentNotes
              ? `${o.customerNotes || ''} | ${paymentNotes}`.trim()
              : o.customerNotes
          };
        }
        return o;
      })
    );
    showNotification(
      'success',
      creditStatus === 'paid' ? '¡Crédito liquidado y marcado como pagado!' : 'Estado del crédito actualizado.'
    );
  };

  // Admin updates credit due date
  const handleUpdateCreditDueDate = (orderId: string, newDueDate: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, creditDueDate: newDueDate } : o))
    );
    showNotification('success', 'Fecha límite de pago actualizada.');
  };

  // Admin saves manual customer (3era edad o frecuente)
  const handleSaveManualCustomer = (newCustomer: CustomerUser, proceedToCredit?: boolean) => {
    setCustomerUsers((prev) => [newCustomer, ...prev]);
    syncCustomerToFirestore(newCustomer);
    showNotification('success', `¡Cliente ${newCustomer.name} guardado en la base de datos!`);
    if (proceedToCredit) {
      setIsAdminOpen(true);
    }
  };

  // Admin saves templates
  const handleSaveTemplates = (updated: MessageTemplate[]) => {
    setTemplates(updated);
    showNotification('success', 'Plantillas de mensajes actualizadas.');
  };

  // Sync templates to Google Sheets
  const handleSyncMessageTemplates = async () => {
    if (!sheetsState.isConnected || !sheetsState.spreadsheetId || !googleUser) {
      showNotification('error', 'Debes conectar tu hoja de Google Drive primero.');
      return;
    }
    await syncMessageTemplatesToSheet(
      googleUser.accessToken || '',
      sheetsState.spreadsheetId,
      templates
    );
    showNotification('success', 'Plantillas sincronizadas en la hoja Plantillas_Mensajes de Drive.');
  };

  // Handler for renewing an order from the calendar
  const handleRenewOrder = (orderId: string, duration: PlanDuration, newExpirationDate: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            duration,
            credentials: o.credentials
              ? {
                  ...o.credentials,
                  expirationDate: newExpirationDate
                }
              : undefined,
            creditDueDate: o.creditDueDate
              ? newExpirationDate.split('T')[0]
              : undefined
          };
        }
        return o;
      })
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      const orderToSync = {
        ...targetOrder,
        duration,
        credentials: targetOrder.credentials
          ? {
              ...targetOrder.credentials,
              expirationDate: newExpirationDate
            }
          : undefined,
        creditDueDate: targetOrder.creditDueDate
          ? newExpirationDate.split('T')[0]
          : undefined
      };
      triggerAutomaticSync(orderToSync, sheetsState.spreadsheetId).catch((err) => {
        console.warn('Error al sincronizar renovación con Google Calendar:', err);
      });
    }

    showNotification('success', '¡Suscripción renovada exitosamente!');
  };

  // Handler for saving action mapping
  const handleSaveActionMapping = (newMapping: ActionTemplateMapping) => {
    setActionMapping(newMapping);
    showNotification('success', 'Asignación de acciones actualizada.');
  };

  // Franchise Management Handlers
  const handleUpdateFranchise = (updated: FranchiseTenant) => {
    setFranchises((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    showNotification('success', `Franquicia "${updated.businessName}" actualizada.`);
  };

  const handleAddFranchise = (newFranq: FranchiseTenant) => {
    setFranchises((prev) => [newFranq, ...prev]);
    showNotification('success', `Franquicia "${newFranq.businessName}" registrada.`);
  };

  const handleApproveFranchiseTopup = (reportId: string, reviewedBy: string) => {
    const report = franchiseTopups.find((r) => r.id === reportId);
    if (!report) return;

    // Credit amount to the franchise's master pool
    setFranchises((prev) =>
      prev.map((f) =>
        f.id === report.franchiseId
          ? {
              ...f,
              availableMasterBalanceUsd: (f.availableMasterBalanceUsd || 0) + report.amountUsd
            }
          : f
      )
    );

    // Update report
    setFranchiseTopups((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'approved',
              reviewedAt: new Date().toISOString(),
              reviewedBy
            }
          : r
      )
    );
    showNotification('success', `¡Abono de $${report.amountUsd.toFixed(2)} USD aprobado y acreditado a ${report.franchiseName}!`);
  };

  const handleRejectFranchiseTopup = (reportId: string, reason: string) => {
    setFranchiseTopups((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'rejected',
              rejectionReason: reason,
              reviewedAt: new Date().toISOString()
            }
          : r
      )
    );
    showNotification('info', 'Reporte de abono rechazado.');
  };

  const handleCreateFranchiseTopupReport = (newReport: FranchiseTopupReport) => {
    setFranchiseTopups((prev) => [newReport, ...prev]);
    showNotification('success', `¡Abono #${newReport.id} de $${newReport.amountUsd.toFixed(2)} USD registrado para auditoría!`);
  };

  const handleAssignBalanceToCustomer = (franchiseId: string, customerId: string, amountUsd: number) => {
    setCustomerUsers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              zenyBalance: (c.zenyBalance || 0) + amountUsd
            }
          : c
      )
    );
    showNotification('success', `¡$${amountUsd.toFixed(2)} USD asignados a la billetera del cliente!`);
  };

  // Navegación segura hacia el panel administrativo
  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentPath('/admin');
    const session = getActiveAdminSession();
    if (session) {
      setIsAdminOpen(true);
    }
  };

  // Navegación de vuelta a la tienda pública
  const navigateToStore = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
    setIsAdminOpen(false);
  };

  // Manejador cuando el administrador se autentica satisfactoriamente en /admin
  const handleAdminLoginSuccess = (session: any) => {
    setAdminSessionState(session);
    setIsAdminOpen(true);
    window.history.pushState({}, '', '/admin');
    setCurrentPath('/admin');
    showNotification('success', `¡Bienvenido al Panel de Administración, ${session.name}!`);
  };

  // Cierre de sesión administrativo
  const handleAdminLogout = () => {
    clearAdminSession();
    setAdminSessionState(null);
    setIsAdminOpen(false);
    showNotification('info', 'Sesión de administrador cerrada correctamente.');
    navigateToStore();
  };

  // Filter products for the store catalog
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'todos' ? true : p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending_reconciliation').length;
  const pendingTopupsCount = walletTopups.filter((t) => t.status === 'pending').length;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/invoice/:invoiceId" element={<InvoiceViewer />} />

        {/* RUTA PROTEGIDA DEDICADA DEL PANEL DE ADMINISTRACIÓN: /admin */}
        <Route
          path="/admin/*"
          element={
            adminSession ? (
              <AdminReconciliationModal
                orders={orders}
                walletTopups={walletTopups}
                customerUsers={customerUsers}
                incidents={incidents}
                paymentMethods={paymentMethods}
                bcvRate={bcvRate}
                onUpdateBcvRate={(newRate) => {
                  setBcvRate(newRate);
                  localStorage.setItem(STORAGE_BCV_KEY, newRate.toString());
                  showNotification('success', `Tasa BCV actualizada a ${newRate} Bs/USD.`);
                  logAuditEvent({
                    actor: `${adminSession.name} (Admin)`,
                    actorRole: 'admin',
                    action: 'ACTUALIZAR_TASA_BCV',
                    description: `Tasa BCV modificada a ${newRate} Bs/USD en el sistema.`,
                    severity: 'info',
                    metadata: { newRate }
                  });
                }}
                sheetsState={sheetsState}
                user={googleUser}
                onClose={navigateToStore}
                onSignInGoogle={handleSignInGoogle}
                onSignOutGoogle={() => {
                  handleSignOutGoogle();
                  handleAdminLogout();
                }}
                onCreateNewSheet={handleCreateNewSheet}
                onSelectExistingSheet={handleSelectExistingSheet}
                onSyncWithSheets={handleSyncWithSheets}
                onSyncDatabaseWithSupabase={syncDatabaseWithSupabase}
                supabaseSchemaError={supabaseSchemaError}
                onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
                isCloudSyncing={isCloudSyncing}
                onSyncCustomersToSheet={handleSyncCustomersToSheet}
                onSyncReportsToSheet={handleSyncReportsToSheet}
                onSyncIncidentsToSheet={handleSyncIncidentsToSheet}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onApproveTopup={handleApproveTopup}
                onRejectTopup={handleRejectTopup}
                onManualCreditGrpay={handleManualCreditGrpay}
                onUpdateCustomerRole={handleUpdateCustomerRole}
                onAddUserFromAdmin={handleAddUserFromAdmin}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onUpdatePaymentMethod={handleUpdatePaymentMethod}
                onAddPaymentMethod={handleAddPaymentMethod}
                onDeletePaymentMethod={handleDeletePaymentMethod}
                onToggleSuspendCustomer={handleToggleSuspendCustomer}
                availableDriveSheets={availableDriveSheets}
                isLoadingDriveSheets={isLoadingDriveSheets}
                onFetchDriveSheets={() => fetchDriveSheets()}
                faqItems={faqItems}
                products={products}
                onUpdateProduct={handleUpdateProduct}
                onUpdateProductsBulk={(updatedProducts) => {
                  setProducts(updatedProducts);
                  showNotification('success', 'Configuración de cuotas actualizada masivamente.');
                }}
                onUpdateOrder={(updatedOrder) => {
                  setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
                  showNotification('success', `Pedido #${updatedOrder.id} actualizado.`);
                }}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateFaq={(updated) => {
                  setFaqItems(updated);
                  showNotification('success', 'Preguntas frecuentes actualizadas.');
                }}
                onSendGift={handleSendGiftToCustomer}
                onSyncFaq={async () => {
                  if (!sheetsState.isConnected || !sheetsState.spreadsheetId || !googleUser) return;
                  await syncFaqToSheet(googleUser.accessToken || '', sheetsState.spreadsheetId, faqItems);
                  showNotification('success', 'Preguntas frecuentes sincronizadas en Google Sheets.');
                }}
                onSaveCreditOrder={handleSaveCreditOrder}
                onUpdateCreditStatus={handleUpdateCreditStatus}
                onUpdateCreditDueDate={handleUpdateCreditDueDate}
                templates={templates}
                onSaveTemplates={handleSaveTemplates}
                onSyncMessageTemplates={handleSyncMessageTemplates}
                onOpenAddCustomerModal={() => setIsAddManualCustomerOpen(true)}
                actionMapping={actionMapping}
                onSaveActionMapping={handleSaveActionMapping}
                onRenewOrder={handleRenewOrder}
                franchises={franchises}
                franchiseTopups={franchiseTopups}
                onUpdateFranchise={handleUpdateFranchise}
                onAddFranchise={handleAddFranchise}
                onApproveFranchiseTopup={handleApproveFranchiseTopup}
                onRejectFranchiseTopup={handleRejectFranchiseTopup}
                onCreateFranchiseTopupReport={handleCreateFranchiseTopupReport}
                onAssignBalanceToCustomer={handleAssignBalanceToCustomer}
                supplierPurchases={supplierPurchases}
                onAddSupplierPurchase={(newPurchase) => {
                  const added: SupplierPurchase = {
                    ...newPurchase,
                    id: `PUR-${Date.now()}`,
                    createdAt: new Date().toISOString()
                  };
                  setSupplierPurchases([...supplierPurchases, added]);
                }}
                onUpdateSupplierPurchase={(upd) => {
                  setSupplierPurchases(supplierPurchases.map((p) => (p.id === upd.id ? upd : p)));
                }}
                onDeleteSupplierPurchase={(id) => {
                  setSupplierPurchases(supplierPurchases.filter((p) => p.id !== id));
                }}
                onUpdateSupplierCredentials={(id, newEmail, newPass) => {
                  setSupplierPurchases(
                    supplierPurchases.map((p) =>
                      p.id === id
                        ? {
                            ...p,
                            accountEmail: newEmail,
                            accountPassword: newPass,
                            lastCredentialsUpdate: new Date().toISOString()
                          }
                        : p
                    )
                  );
                }}
                branding={branding}
                onSaveBranding={(newB) => setBranding(newB)}
                onResetPassword={(userId) => {
                  showNotification('success', `Contraseña actualizada para usuario: ${userId}`);
                }}
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
              />
            ) : (
              <AdminLoginPage
                onSuccess={handleAdminLoginSuccess}
                onBackToStore={navigateToStore}
                isStandalonePage={true}
              />
            )
          }
        />

        {/* TIENDA PÚBLICA: www.gregoryizquierdo.xyz (Ruta Principal /) */}
        <Route path="*" element={
          <div
            className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased selection:bg-indigo-500 selection:text-white"
            style={{ fontFamily: branding?.fontFamily || 'inherit' }}
          >
            <Header
              currency={currency}
              onCurrencyChange={setCurrency}
              bcvRate={bcvRate}
              onRefreshBcv={loadLiveBcvRate}
              isBcvLoading={isBcvLoading}
              sheetsState={sheetsState}
              customerUser={activeCustomer}
              onOpenCustomerModal={() => setIsCustomerPortalOpen(true)}
              onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onOpenTrackerModal={() => {
                setTrackingOrderId('');
                setIsTrackerOpen(true);
              }}
              onOpenInstallModal={() => setIsIOSGuideOpen(true)}
              pendingOrdersCount={pendingOrdersCount}
              pendingTopupsCount={pendingTopupsCount}
              branding={branding}
            />

            <main className="flex-1">
              {/* Hero Section (Mensaje de Bienvenida) */}
              <Hero
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalProductsCount={filteredProducts.length}
              />



              {/* Product Catalog Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {selectedCategory === 'todos'
                  ? 'Catálogo Disponible'
                  : selectedCategory === 'combos'
                  ? 'Combos y Promociones Especiales'
                  : selectedCategory === 'series_peliculas'
                  ? 'Películas & Series'
                  : selectedCategory === 'musica'
                  ? 'Música & Audio'
                  : 'Deportes en Vivo & IPTV'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mostrando {filteredProducts.length} servicio(s) • Tasa BCV Oficial: {bcvRate} Bs/USD
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <span>Precios en:</span>
                <strong className="text-indigo-600">{currency === 'BS' ? 'Bolívares (Bs.)' : 'Dólares ($ USD)'}</strong>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                No encontramos servicios para "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Prueba con otro término o consulta disponibilidad por WhatsApp.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todos');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
              >
                Ver todos los servicios
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                  bcvRate={bcvRate}
                  customerUser={activeCustomer}
                  onSelectProduct={(prod, dur) => {
                    setCheckoutData({ product: prod, duration: dur });
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Zeny Wallet Explanatory Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Moneda Interna Zeny</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Recarga tu Wallet Zeny y activa tus cuentas al instante
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                Abona saldo en Bolívares (Tasa BCV) o Dólares. 1 Zeny = 1 USD. Usa tu saldo para comprar o renovar sin esperar tiempos de validación bancaria en cada compra.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (activeCustomer) {
                      setIsCustomerPortalOpen(true);
                    } else {
                      setIsCustomerAuthOpen(true);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-900/50 transition cursor-pointer"
                >
                  {activeCustomer ? 'Abrir mi Wallet Zeny' : 'Registrarme y Obtener Wallet'}
                </button>
                <span className="text-[11px] text-slate-400">
                  • Saldo no canjeable ni transferible fuera de la plataforma
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white border-y border-slate-200/80 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Proceso Simple & Transparente
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                ¿Cómo comprar tu cuenta de streaming?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-xs">
                  1
                </span>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Elige tu Plan</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Selecciona la plataforma y duración de 1 a 12 meses en USD o Bolívares.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-xs">
                  2
                </span>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Transfiere Seguro</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paga con cualquiera de nuestros 9 métodos o utiliza tu saldo de la wallet Zeny.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-xs">
                  3
                </span>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Conciliación Manual</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ingresa tu referencia de comprobante. Validamos el depósito en minutos.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-xs">
                  4
                </span>
                <h4 className="font-bold text-slate-900 text-sm mb-1">¡Acceso & Vencimiento!</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Consulta tus credenciales y cuenta regresiva de vencimiento en tu área de cliente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenTracker={() => {
          setTrackingOrderId('');
          setIsTrackerOpen(true);
        }}
        onOpenAdmin={() => setIsLoginModalOpen(true)}
        onOpenSheets={() => setIsSheetsModalOpen(true)}
        projectName={branding.projectName}
        branding={branding}
      />

      {/* Floating Incident Report Button (Midpoint of right screen) */}
      <FloatingIncidentButton
        onClick={() => setIsIncidentModalOpen(true)}
        openIncidentsCount={incidents.filter((i) => i.status === 'pending').length}
      />

      {/* Floating WhatsApp Action Button */}
      <a
        href={whatsappLink('Hola, quisiera consultar sobre una cuenta de streaming')}
        target="_blank"
        rel="noopener noreferrer"
        title="Chatear con soporte por WhatsApp"
        className="hidden fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-200 hover:scale-105 transition-all flex items-center gap-2 group cursor-pointer"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pr-1">
          WhatsApp 24/7
        </span>
      </a>

      {/* MODALS */}
      {/* 1. Checkout & Manual Payment Modal */}
      {checkoutData && (
        <CheckoutModal
          product={checkoutData.product}
          duration={checkoutData.duration}
          currency={currency}
          bcvRate={bcvRate}
          paymentMethods={paymentMethods}
          customerUser={activeCustomer}
          onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
          onClose={() => setCheckoutData(null)}
          onSubmitOrder={handleSubmitOrder}
          onTrackOrder={(orderId) => {
            setCheckoutData(null);
            setTrackingOrderId(orderId);
            setIsTrackerOpen(true);
          }}
        />
      )}

      {/* 2. Order Tracker Modal */}
      {isTrackerOpen && (
        <OrderTrackerModal
          orders={orders}
          initialOrderId={trackingOrderId}
          onClose={() => setIsTrackerOpen(false)}
        />
      )}

      {/* 3. Customer Auth Modal */}
      {isCustomerAuthOpen && (
        <CustomerAuthModal
          existingUsers={customerUsers}
          onClose={() => setIsCustomerAuthOpen(false)}
          onLoginSuccess={(user) => {
            setActiveCustomer(user);
            setIsCustomerAuthOpen(false);
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem(`streamsync_customer_session_token_${user.id}`, token);
            sessionStorage.setItem('streamsync_my_customer_session', token);
            setIsCustomerPortalOpen(true);
            showNotification('success', `¡Bienvenido de nuevo, ${user.name}!`);
          }}
          onRegister={handleRegisterCustomer}
        />
      )}

      {/* 4. Customer Dashboard Portal Modal */}
      {isCustomerPortalOpen && activeCustomer && (
        <CustomerPortalModal
          user={activeCustomer}
          orders={orders}
          walletTopups={walletTopups}
          paymentMethods={paymentMethods}
          bcvRate={bcvRate}
          onClose={() => setIsCustomerPortalOpen(false)}
          onLogout={() => {
            setActiveCustomer(null);
            setIsCustomerPortalOpen(false);
            showNotification('info', 'Sesión cerrada.');
          }}
          onRequestTopup={handleRequestTopup}
          onRenewSubscription={(subOrder) => {
            const prod = products.find((p) => p.id === subOrder.productId) || products[0];
            setIsCustomerPortalOpen(false);
            setCheckoutData({ product: prod, duration: subOrder.duration });
          }}
          onOpenIncidentReport={() => setIsIncidentModalOpen(true)}
        />
      )}

      {/* Modal de Acceso Rápido Admin (Redirige al entorno dedicado /admin) */}
      {isLoginModalOpen && (
        <AdminLoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(adminProfile) => {
            setIsLoginModalOpen(false);
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem(`streamsync_staff_session_token_${adminProfile.id}`, token);
            sessionStorage.setItem('streamsync_my_staff_session', token);
            localStorage.setItem('streamsync_active_logged_staff_id', adminProfile.id);
            navigateToAdmin();
          }}
        />
      )}

      {/* 5. Admin & Reconciliation Portal */}
      {isAdminOpen && (
        <AdminReconciliationModal
          orders={orders}
          walletTopups={walletTopups}
          customerUsers={customerUsers}
          incidents={incidents}
          paymentMethods={paymentMethods}
          bcvRate={bcvRate}
          onUpdateBcvRate={(newRate) => {
            setBcvRate(newRate);
            localStorage.setItem(STORAGE_BCV_KEY, newRate.toString());
            showNotification('success', `Tasa BCV actualizada a ${newRate} Bs/USD.`);
            logAuditEvent({
              actor: 'Gregori Izquierdo (Admin)',
              actorRole: 'admin',
              action: 'ACTUALIZAR_TASA_BCV',
              description: `Tasa BCV modificada a ${newRate} Bs/USD en el sistema.`,
              severity: 'info',
              metadata: { newRate }
            });
          }}
          sheetsState={sheetsState}
          user={googleUser}
          onClose={() => setIsAdminOpen(false)}
          onSignInGoogle={handleSignInGoogle}
          onSignOutGoogle={handleSignOutGoogle}
          onCreateNewSheet={handleCreateNewSheet}
          onSelectExistingSheet={handleSelectExistingSheet}
          onSyncWithSheets={handleSyncWithSheets}
          onSyncDatabaseWithSupabase={syncDatabaseWithSupabase}
          supabaseSchemaError={supabaseSchemaError}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          isCloudSyncing={isCloudSyncing}
          onSyncCustomersToSheet={handleSyncCustomersToSheet}
          onSyncReportsToSheet={handleSyncReportsToSheet}
          onSyncIncidentsToSheet={handleSyncIncidentsToSheet}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onApproveTopup={handleApproveTopup}
          onRejectTopup={handleRejectTopup}
          onManualCreditGrpay={handleManualCreditGrpay}
          onUpdateCustomerRole={handleUpdateCustomerRole}
          onAddUserFromAdmin={handleAddUserFromAdmin}
          onUpdateIncidentStatus={handleUpdateIncidentStatus}
          onUpdatePaymentMethod={handleUpdatePaymentMethod}
          onAddPaymentMethod={handleAddPaymentMethod}
          onDeletePaymentMethod={handleDeletePaymentMethod}
          onToggleSuspendCustomer={handleToggleSuspendCustomer}
          availableDriveSheets={availableDriveSheets}
          isLoadingDriveSheets={isLoadingDriveSheets}
          onFetchDriveSheets={() => fetchDriveSheets()}
          faqItems={faqItems}
          products={products}
          onUpdateProduct={handleUpdateProduct}
          onUpdateProductsBulk={(updatedProducts) => {
            setProducts(updatedProducts);
            showNotification('success', 'Configuración de cuotas actualizada masivamente.');
          }}
          onUpdateOrder={(updatedOrder) => {
            setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
            showNotification('success', `Pedido #${updatedOrder.id} actualizado.`);
          }}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateFaq={(updated) => {
            setFaqItems(updated);
            showNotification('success', 'Preguntas frecuentes actualizadas.');
          }}
          onSendGift={handleSendGiftToCustomer}
          onSyncFaq={async () => {
            if (!sheetsState.isConnected || !sheetsState.spreadsheetId || !googleUser) return;
            await syncFaqToSheet(googleUser.accessToken || '', sheetsState.spreadsheetId, faqItems);
            showNotification('success', 'Preguntas frecuentes sincronizadas en Google Sheets.');
          }}
          onSaveCreditOrder={handleSaveCreditOrder}
          onUpdateCreditStatus={handleUpdateCreditStatus}
          onUpdateCreditDueDate={handleUpdateCreditDueDate}
          templates={templates}
          onSaveTemplates={handleSaveTemplates}
          onSyncMessageTemplates={handleSyncMessageTemplates}
          onOpenAddCustomerModal={() => setIsAddManualCustomerOpen(true)}
          actionMapping={actionMapping}
          onSaveActionMapping={handleSaveActionMapping}
          onRenewOrder={handleRenewOrder}
          franchises={franchises}
          franchiseTopups={franchiseTopups}
          onUpdateFranchise={handleUpdateFranchise}
          onAddFranchise={handleAddFranchise}
          onApproveFranchiseTopup={handleApproveFranchiseTopup}
          onRejectFranchiseTopup={handleRejectFranchiseTopup}
          onCreateFranchiseTopupReport={handleCreateFranchiseTopupReport}
          onAssignBalanceToCustomer={handleAssignBalanceToCustomer}
          supplierPurchases={supplierPurchases}
          onAddSupplierPurchase={(newPurchase) => {
            const added: SupplierPurchase = {
              ...newPurchase,
              id: `PUR-${Date.now()}`,
              createdAt: new Date().toISOString()
            };
            setSupplierPurchases([...supplierPurchases, added]);
          }}
          onUpdateSupplierPurchase={(upd) => {
            setSupplierPurchases(supplierPurchases.map((p) => (p.id === upd.id ? upd : p)));
          }}
          onDeleteSupplierPurchase={(id) => {
            setSupplierPurchases(supplierPurchases.filter((p) => p.id !== id));
          }}
          onUpdateSupplierCredentials={(id, newEmail, newPass) => {
            setSupplierPurchases(
              supplierPurchases.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      accountEmail: newEmail,
                      accountPassword: newPass,
                      lastCredentialsUpdate: new Date().toISOString()
                    }
                  : p
              )
            );
          }}
          branding={branding}
          onSaveBranding={(newB) => setBranding(newB)}
          onResetPassword={(userId) => {
            showNotification('success', `Contraseña actualizada para usuario: ${userId}`);
          }}
          expenses={expenses}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      )}

      {/* 6. Google Sheets Connect Modal */}
      {isSheetsModalOpen && (
        <SheetsConnectModal
          sheetsState={sheetsState}
          user={googleUser}
          onClose={() => setIsSheetsModalOpen(false)}
          onSignInGoogle={handleSignInGoogle}
          onSignOutGoogle={handleSignOutGoogle}
          onCreateNewSheet={handleCreateNewSheet}
          onSelectExistingSheet={handleSelectExistingSheet}
          availableDriveSheets={availableDriveSheets}
          isLoadingDriveSheets={isLoadingDriveSheets}
          onFetchDriveSheets={() => fetchDriveSheets()}
          onPerformFullSync={handlePerformFullPlatformSync}
          isSyncingFull={isSyncingFull}
          onSearchAndLinkFile={handleSearchAndLinkFile}
        />
      )}


      {/* 7. Incident & Failure Report Modal */}
      {isIncidentModalOpen && (
        <IncidentReportModal
          customerUser={activeCustomer}
          existingUsers={customerUsers}
          userOrders={
            activeCustomer
              ? orders.filter(
                  (o) => o.customerId === activeCustomer.id || o.customerEmail.toLowerCase() === activeCustomer.email.toLowerCase()
                )
              : orders
          }
          onClose={() => setIsIncidentModalOpen(false)}
          onLoginCustomer={(user) => {
            setActiveCustomer(user);
            showNotification('success', `Identificado como ${user.name}`);
          }}
          onSubmitIncident={handleSubmitIncident}
        />
      )}

      {/* 8. Add Manual Customer Modal (3era Edad / Frecuente) */}
      {isAddManualCustomerOpen && (
        <AddManualCustomerModal
          onClose={() => setIsAddManualCustomerOpen(false)}
          onSaveCustomer={handleSaveManualCustomer}
        />
      )}

      {/* 9. PWA Install Floating Banner & Mobile Prompt */}
      <PWAInstallBanner onOpenAppGuide={() => setIsIOSGuideOpen(true)} />

      {/* 9. iOS PWA Install Guide Modal */}
      {isIOSGuideOpen && (
        <IOSInstallModal onClose={() => setIsIOSGuideOpen(false)} />
      )}

      {/* 10. Platform Bot Assistant Widget */}
      <PlatformBotWidget
        products={products}
        paymentMethods={paymentMethods}
        activeCustomer={activeCustomer}
        currency={currency}
        bcvRate={bcvRate}
        onOpenProductCheckout={(prod, dur) => {
          setCheckoutData({ product: prod, duration: dur });
        }}
        onOpenIncidentReport={() => setIsIncidentModalOpen(true)}
        onOpenTracker={() => {
          setTrackingOrderId('');
          setIsTrackerOpen(true);
        }}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
        onOpenCustomerPortal={() => setIsCustomerPortalOpen(true)}
      />


          </div>
        } />
      </Routes>
      <GeminiPanel />
    </BrowserRouter>
  );
}

