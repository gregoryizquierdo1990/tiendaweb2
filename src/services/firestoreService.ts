import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { auth } from './googleAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import { useAppStore } from '../store/useAppStore';
import { 
  Product, Order, CustomerUser, WalletTopup, 
  IncidentReport, PaymentMethod, ExpenseItem, 
  FranchiseTenant, SupplierPurchase, AppBrandingConfig, FaqItem 
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS, INITIAL_CUSTOMERS 
} from '../data/defaultCatalog';

// Initialize Firebase App & Firestore with configured databaseId
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = (firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== '(default)'
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

// Flag to prevent recursive loop syncing when local updates originate from Firestore
export let isSyncingFromFirestore = false;

export function setIsSyncingFromFirestore(val: boolean) {
  isSyncingFromFirestore = val;
}

// --- Offline Queue & Resilience Types ---
const QUEUE_STORAGE_KEY = 'streamsync_pending_firestore_queue';

export interface QueuedOperation {
  id: string;
  collection: string;
  docId: string;
  type: 'set' | 'delete';
  data?: any;
  timestamp: number;
  retries: number;
}

export function getPendingQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingQueue(queue: QueuedOperation[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    useAppStore.getState().setPendingSyncCount(queue.length);
  } catch (err) {
    console.warn('Could not save pending queue to localStorage:', err);
  }
}

export function enqueuePendingOperation(collectionName: string, docId: string, type: 'set' | 'delete', data?: any) {
  const queue = getPendingQueue();
  const existingIndex = queue.findIndex(item => item.collection === collectionName && item.docId === docId);
  const newOp: QueuedOperation = {
    id: `${collectionName}_${docId}_${Date.now()}`,
    collection: collectionName,
    docId,
    type,
    data,
    timestamp: Date.now(),
    retries: 0
  };
  
  if (existingIndex >= 0) {
    queue[existingIndex] = newOp;
  } else {
    queue.push(newOp);
  }
  savePendingQueue(queue);
}

// --- Pre-flight Connection Validation ---
let validationInProgress = false;

/**
 * Validates connectivity with the live Firestore backend using getDocFromServer
 * to guarantee real two-way synchronization before read/write operations.
 */
export async function validateFirestoreConnection(options?: { timeoutMs?: number; silent?: boolean }): Promise<boolean> {
  if (validationInProgress) return true;
  validationInProgress = true;
  const store = useAppStore.getState();

  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      store.setFirestoreStatus('offline');
      store.setConnectionError('Sin conexión a internet (modo local activo)');
      validationInProgress = false;
      return false;
    }

    store.setFirestoreStatus('reconnecting');
    
    const timeoutMs = options?.timeoutMs || 7000;
    const fetchPromise = getDocFromServer(doc(db, 'config', 'bcv'));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar a Firestore')), timeoutMs)
    );

    await Promise.race([fetchPromise, timeoutPromise]);
    
    store.setFirestoreStatus('connected');
    store.setConnectionError(null);
    store.setLastSyncTimestamp(new Date().toLocaleTimeString());
    
    // Automatically drain pending offline queue once connectivity is validated
    drainPendingSyncQueue();
    
    validationInProgress = false;
    return true;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const isOffline = errorMsg.includes('offline') || errorMsg.includes('network') || errorMsg.includes('Tiempo de espera');
    
    store.setFirestoreStatus(isOffline ? 'offline' : 'error');
    store.setConnectionError(isOffline ? 'Modo sin conexión: los cambios se sincronizarán al reconectar' : errorMsg);
    
    validationInProgress = false;
    return false;
  }
}

/**
 * Measures round-trip latency (RTT in ms) to Firestore directly from the server.
 * Updates isCloudSyncing, firestoreLatencyMs, and hasCriticalLatency in useAppStore.
 */
export async function measureFirestoreLatency(): Promise<number | null> {
  const store = useAppStore.getState();
  
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    store.setFirestoreStatus('offline');
    store.setFirestoreLatency(null);
    store.setConnectionError('Sin conexión a internet (modo local activo)');
    return null;
  }

  store.setIsCloudSyncing(true);
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const timeoutMs = 7000;
    const fetchPromise = getDocFromServer(doc(db, 'config', 'bcv'));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tiempo de espera agotado (>7s)')), timeoutMs)
    );

    await Promise.race([fetchPromise, timeoutPromise]);
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latencyMs = Math.round(endTime - startTime);

    store.setFirestoreLatency(latencyMs);
    store.setFirestoreStatus('connected');
    store.setConnectionError(null);
    store.setLastSyncTimestamp(new Date().toLocaleTimeString());

    // Auto-drain pending queue if any items were retained
    if (getPendingQueue().length > 0) {
      drainPendingSyncQueue();
    }

    return latencyMs;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const isOffline = errorMsg.includes('offline') || errorMsg.includes('network') || errorMsg.includes('Tiempo de espera');
    
    store.setFirestoreLatency(null);
    store.setFirestoreStatus(isOffline ? 'offline' : 'error');
    store.setConnectionError(isOffline ? 'Desconexión crítica o red no disponible' : errorMsg);
    return null;
  } finally {
    store.setIsCloudSyncing(false);
  }
}

/**
 * Starts a background heartbeat checking connection health and latency every 30 seconds.
 * Throttles execution if the browser tab is hidden to preserve resources.
 */
export function startFirestoreHeartbeat(intervalMs: number = 30000): () => void {
  // Run immediate first measurement
  measureFirestoreLatency();

  const timer = setInterval(() => {
    // Only execute if page is visible in browser
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    measureFirestoreLatency();
  }, intervalMs);

  return () => clearInterval(timer);
}

// --- Queue Drainer (Automatic Re-try on Reconnect) ---
let isDraining = false;

export async function drainPendingSyncQueue(): Promise<void> {
  if (isDraining) return;
  const queue = getPendingQueue();
  if (queue.length === 0) return;

  isDraining = true;
  const store = useAppStore.getState();
  store.setIsCloudSyncing(true);

  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    try {
      const docRef = doc(db, op.collection, op.docId);
      if (op.type === 'delete') {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, op.data);
      }
    } catch (err: any) {
      op.retries += 1;
      if (err?.message?.includes('offline') || err?.message?.includes('unavailable')) {
        remaining.push(op, ...queue.slice(queue.indexOf(op) + 1));
        break;
      }
      if (op.retries < 5) {
        remaining.push(op);
      }
    }
  }

  savePendingQueue(remaining);
  store.setIsCloudSyncing(false);
  store.setLastSyncTimestamp(new Date().toLocaleTimeString());
  isDraining = false;
}

// --- Firestore Error Handling ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'guest-or-custom-auth',
      email: auth.currentUser?.email || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

// --- Resilient Writer Wrapper ---
async function safeFirestoreWrite(collectionName: string, docId: string, type: 'set' | 'delete', data?: any) {
  if (isSyncingFromFirestore) return;

  const store = useAppStore.getState();
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;

  if (!isOnline || store.firestoreStatus === 'offline') {
    enqueuePendingOperation(collectionName, docId, type, data);
    return;
  }

  store.setIsCloudSyncing(true);
  try {
    const docRef = doc(db, collectionName, docId);
    if (type === 'delete') {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, data);
    }
    store.setLastSyncTimestamp(new Date().toLocaleTimeString());
    store.setConnectionError(null);
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('network')) {
      enqueuePendingOperation(collectionName, docId, type, data);
      store.setFirestoreStatus('offline');
      store.setConnectionError('Modo sin conexión: cambio guardado localmente');
    } else {
      handleFirestoreError(error, type === 'delete' ? OperationType.DELETE : OperationType.WRITE, `${collectionName}/${docId}`);
    }
  } finally {
    store.setIsCloudSyncing(false);
  }
}

// --- Direct Entity Writers ---

export async function syncProductToFirestore(p: Product) {
  return safeFirestoreWrite('products', p.id, 'set', p);
}

export async function deleteProductFromFirestore(id: string) {
  return safeFirestoreWrite('products', id, 'delete');
}

export async function syncOrderToFirestore(o: Order) {
  return safeFirestoreWrite('orders', o.id, 'set', o);
}

export async function syncCustomerToFirestore(c: CustomerUser) {
  return safeFirestoreWrite('customers', c.id, 'set', c);
}

export async function syncWalletTopupToFirestore(w: WalletTopup) {
  return safeFirestoreWrite('wallet_topups', w.id, 'set', w);
}

export async function syncIncidentToFirestore(i: IncidentReport) {
  return safeFirestoreWrite('incidents', i.id, 'set', i);
}

export async function syncPaymentMethodToFirestore(p: PaymentMethod) {
  return safeFirestoreWrite('payment_methods', p.id, 'set', p);
}

export async function deletePaymentMethodFromFirestore(id: string) {
  return safeFirestoreWrite('payment_methods', id, 'delete');
}

export async function syncBrandingToFirestore(b: AppBrandingConfig) {
  return safeFirestoreWrite('config', 'branding', 'set', b);
}

export async function syncBcvRateToFirestore(rate: number) {
  return safeFirestoreWrite('config', 'bcv', 'set', { rate, updatedAt: new Date().toISOString() });
}

export async function syncFaqToFirestore(faqItems: FaqItem[]) {
  return safeFirestoreWrite('config', 'faq', 'set', { items: faqItems, updatedAt: new Date().toISOString() });
}

export async function syncExpenseToFirestore(e: ExpenseItem) {
  return safeFirestoreWrite('expenses', e.id, 'set', e);
}

export async function syncFranchiseToFirestore(f: FranchiseTenant) {
  return safeFirestoreWrite('franchises', f.id, 'set', f);
}

export async function syncPurchaseToFirestore(p: SupplierPurchase) {
  return safeFirestoreWrite('purchases', p.id, 'set', p);
}

// --- Real-time Listeners and Subscriptions ---

let activeUnsubscribers: (() => void)[] = [];

export function clearAllFirestoreSubscriptions() {
  activeUnsubscribers.forEach(unsub => unsub());
  activeUnsubscribers = [];
}

/**
 * Verifies essential config documents without injecting dummy products/customers,
 * ensuring the database remains completely clean from scratch as requested.
 */
export async function seedFirestoreIfEmpty() {
  try {
    const bcvRef = doc(db, 'config', 'bcv');
    const bcvSnap = await getDocFromServer(bcvRef).catch(() => null);
    if (!bcvSnap || !bcvSnap.exists()) {
      await setDoc(bcvRef, { rate: 36.85, updatedAt: new Date().toISOString() });
    }

    const brandingRef = doc(db, 'config', 'branding');
    const brandingSnap = await getDocFromServer(brandingRef).catch(() => null);
    if (!brandingSnap || !brandingSnap.exists()) {
      const storeBranding = useAppStore.getState().branding;
      if (storeBranding) {
        await setDoc(brandingRef, storeBranding);
      }
    }
  } catch (err) {
    console.warn('Notice verifying configuration documents:', err);
  }
}

/**
 * Initializes global bidirectional real-time synchronization between Firestore and App Store.
 * Validates connection, manages online/offline lifecycle, and syncs all entities live.
 */
export function initRealtimeFirestoreSync() {
  clearAllFirestoreSubscriptions();
  const store = useAppStore.getState();

  // Load pending queue count into store
  store.setPendingSyncCount(getPendingQueue().length);

  // 1. Initial pre-flight connection validation and 30s heartbeat start
  validateFirestoreConnection();
  const stopHeartbeat = startFirestoreHeartbeat(30000);
  activeUnsubscribers.push(stopHeartbeat);

  // 2. Setup window online/offline event listeners
  const handleOnline = () => {
    validateFirestoreConnection();
    measureFirestoreLatency();
  };
  const handleOffline = () => {
    store.setFirestoreStatus('offline');
    store.setConnectionError('Sin conexión a internet (modo local activo)');
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    activeUnsubscribers.push(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  // 3. Config check
  seedFirestoreIfEmpty();

  // 4. Products Catalog Listener
  const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const remoteProducts: Product[] = [];
    snapshot.forEach(docSnap => {
      remoteProducts.push(docSnap.data() as Product);
    });
    // Set store products to exact remote state (even if empty, clean slate)
    store.setProducts(remoteProducts);
    store.setLastSyncTimestamp(new Date().toLocaleTimeString());
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to products snapshot:', err);
  });
  activeUnsubscribers.push(unsubProducts);
  console.log('Firestore products listener initialized.');

  // 5. Payment Methods Listener
  const unsubMethods = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const methods: PaymentMethod[] = [];
    snapshot.forEach(docSnap => {
      methods.push(docSnap.data() as PaymentMethod);
    });
    if (methods.length > 0) {
      store.setPaymentMethods(methods);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to payment methods snapshot:', err);
  });
  activeUnsubscribers.push(unsubMethods);

  // 6. Customers Listener (includes registrations like Pablo 04129130080)
  const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: CustomerUser[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as CustomerUser);
    });
    store.setCustomers(list);
    const active = store.activeCustomer;
    if (active) {
      const found = list.find(c => c.id === active.id || c.email?.toLowerCase() === active.email?.toLowerCase());
      if (found && (found.zenyBalance !== active.zenyBalance || JSON.stringify(found) !== JSON.stringify(active))) {
        store.setActiveCustomer(found);
      }
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to customers snapshot:', err);
  });
  activeUnsubscribers.push(unsubCustomers);

  // 6b. Users Collection Listener (Firebase Auth RBAC roles: cliente vs vendedor)
  const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const userRoleMap = new Map<string, { role: string; email: string; displayName?: string; phone?: string }>();
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      userRoleMap.set(docSnap.id, {
        role: data.role || 'cliente',
        email: (data.email || '').toLowerCase(),
        displayName: data.displayName,
        phone: data.phone
      });
      if (data.email) {
        userRoleMap.set(data.email.toLowerCase(), {
          role: data.role || 'cliente',
          email: data.email.toLowerCase(),
          displayName: data.displayName,
          phone: data.phone
        });
      }
    });

    const currentCusts = useAppStore.getState().customers;
    let hasChanges = false;
    const merged = currentCusts.map(cust => {
      const uData = userRoleMap.get(cust.id) || (cust.email ? userRoleMap.get(cust.email.toLowerCase()) : null);
      if (uData && uData.role) {
        const targetRole = uData.role === 'admin' ? 'administrador' : (uData.role as any);
        if (cust.role !== targetRole) {
          hasChanges = true;
          return {
            ...cust,
            role: targetRole
          };
        }
      }
      return cust;
    });

    if (hasChanges) {
      store.setCustomers(merged);
      const active = store.activeCustomer;
      if (active) {
        const activeUserData = userRoleMap.get(active.id) || (active.email ? userRoleMap.get(active.email.toLowerCase()) : null);
        if (activeUserData && activeUserData.role) {
          const newActiveRole = activeUserData.role === 'admin' ? 'administrador' : (activeUserData.role as any);
          if (active.role !== newActiveRole) {
            store.setActiveCustomer({
              ...active,
              role: newActiveRole
            });
          }
        }
      }
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to users collection snapshot:', err);
  });
  activeUnsubscribers.push(unsubUsers);

  // 7. Orders Listener
  const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: Order[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as Order);
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    if (list.length > 0) {
      store.setOrders(list);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to orders snapshot:', err);
  });
  activeUnsubscribers.push(unsubOrders);

  // 8. Wallet Topups Listener
  const unsubTopups = onSnapshot(collection(db, 'wallet_topups'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: WalletTopup[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as WalletTopup);
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    if (list.length > 0) {
      store.setWalletTopups(list);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to wallet topups snapshot:', err);
  });
  activeUnsubscribers.push(unsubTopups);

  // 9. Incidents Listener
  const unsubIncidents = onSnapshot(collection(db, 'incidents'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: IncidentReport[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as IncidentReport);
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    if (list.length > 0) {
      store.setIncidents(list);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to incidents snapshot:', err);
  });
  activeUnsubscribers.push(unsubIncidents);

  // 10. Branding Config Listener
  const unsubBranding = onSnapshot(doc(db, 'config', 'branding'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    if (snapshot.exists()) {
      store.setBranding(snapshot.data() as AppBrandingConfig);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to branding snapshot:', err);
  });
  activeUnsubscribers.push(unsubBranding);

  // 11. BCV Rate Listener
  const unsubBcv = onSnapshot(doc(db, 'config', 'bcv'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && typeof data.rate === 'number') {
        store.setBcvRate(data.rate);
      }
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to BCV rate snapshot:', err);
  });
  activeUnsubscribers.push(unsubBcv);

  // 12. FAQ Items Listener
  const unsubFaq = onSnapshot(doc(db, 'config', 'faq'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && Array.isArray(data.items)) {
        store.setFaqItems(data.items);
      }
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to FAQ snapshot:', err);
  });
  activeUnsubscribers.push(unsubFaq);

  // 13. Expenses Listener
  const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: ExpenseItem[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as ExpenseItem);
    });
    if (list.length > 0) {
      store.setExpenses(list);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to expenses snapshot:', err);
  });
  activeUnsubscribers.push(unsubExpenses);

  // 14. Franchises Listener
  const unsubFranchises = onSnapshot(collection(db, 'franchises'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: FranchiseTenant[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as FranchiseTenant);
    });
    if (list.length > 0) {
      store.setFranchises(list);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to franchises snapshot:', err);
  });
  activeUnsubscribers.push(unsubFranchises);

  // 15. Purchases Listener
  const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: SupplierPurchase[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as SupplierPurchase);
    });
    if (list.length > 0) {
      store.setPurchases(list);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to purchases snapshot:', err);
  });
  activeUnsubscribers.push(unsubPurchases);

  return clearAllFirestoreSubscriptions;
}
