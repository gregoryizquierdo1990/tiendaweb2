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

// Initialize Firebase App & Firestore with correct databaseId
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

// Validation Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'config', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Notice: Firestore operating in offline-first mode or reconnecting.");
    }
  }
}
testConnection();

// Flag to prevent loop sync back to Firestore when updates are received from firestore
export let isSyncingFromFirestore = false;

export function setIsSyncingFromFirestore(val: boolean) {
  isSyncingFromFirestore = val;
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

// --- Direct Firestore Writers ---

export async function syncProductToFirestore(p: Product) {
  if (isSyncingFromFirestore) return;
  const path = `products/${p.id}`;
  try {
    await setDoc(doc(db, 'products', p.id), p);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(id: string) {
  if (isSyncingFromFirestore) return;
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncOrderToFirestore(o: Order) {
  if (isSyncingFromFirestore) return;
  const path = `orders/${o.id}`;
  try {
    await setDoc(doc(db, 'orders', o.id), o);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCustomerToFirestore(c: CustomerUser) {
  if (isSyncingFromFirestore) return;
  const path = `customers/${c.id}`;
  try {
    await setDoc(doc(db, 'customers', c.id), c);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncWalletTopupToFirestore(w: WalletTopup) {
  if (isSyncingFromFirestore) return;
  const path = `wallet_topups/${w.id}`;
  try {
    await setDoc(doc(db, 'wallet_topups', w.id), w);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncIncidentToFirestore(i: IncidentReport) {
  if (isSyncingFromFirestore) return;
  const path = `incidents/${i.id}`;
  try {
    await setDoc(doc(db, 'incidents', i.id), i);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncPaymentMethodToFirestore(p: PaymentMethod) {
  if (isSyncingFromFirestore) return;
  const path = `payment_methods/${p.id}`;
  try {
    await setDoc(doc(db, 'payment_methods', p.id), p);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePaymentMethodFromFirestore(id: string) {
  if (isSyncingFromFirestore) return;
  const path = `payment_methods/${id}`;
  try {
    await deleteDoc(doc(db, 'payment_methods', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncBrandingToFirestore(b: AppBrandingConfig) {
  if (isSyncingFromFirestore) return;
  const path = 'config/branding';
  try {
    await setDoc(doc(db, 'config', 'branding'), b);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncBcvRateToFirestore(rate: number) {
  if (isSyncingFromFirestore) return;
  const path = 'config/bcv';
  try {
    await setDoc(doc(db, 'config', 'bcv'), { rate, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncFaqToFirestore(faqItems: FaqItem[]) {
  if (isSyncingFromFirestore) return;
  const path = 'config/faq';
  try {
    await setDoc(doc(db, 'config', 'faq'), { items: faqItems, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncExpenseToFirestore(e: ExpenseItem) {
  if (isSyncingFromFirestore) return;
  const path = `expenses/${e.id}`;
  try {
    await setDoc(doc(db, 'expenses', e.id), e);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncFranchiseToFirestore(f: FranchiseTenant) {
  if (isSyncingFromFirestore) return;
  const path = `franchises/${f.id}`;
  try {
    await setDoc(doc(db, 'franchises', f.id), f);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncPurchaseToFirestore(p: SupplierPurchase) {
  if (isSyncingFromFirestore) return;
  const path = `purchases/${p.id}`;
  try {
    await setDoc(doc(db, 'purchases', p.id), p);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- Real-time Listeners and Subscriptions ---

let activeUnsubscribers: (() => void)[] = [];

export function clearAllFirestoreSubscriptions() {
  activeUnsubscribers.forEach(unsub => unsub());
  activeUnsubscribers = [];
}

/**
 * Seeds default data into Firestore if the catalog is completely empty.
 */
export async function seedFirestoreIfEmpty() {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      console.log('Seeding initial catalog and payment methods to Firestore...');
      // Seed products
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), p);
      }
      // Seed payment methods
      for (const m of INITIAL_PAYMENT_METHODS) {
        await setDoc(doc(db, 'payment_methods', m.id), m);
      }
      // Seed initial customers
      for (const c of INITIAL_CUSTOMERS) {
        await setDoc(doc(db, 'customers', c.id), c);
      }
      // Seed default BCV rate and branding
      await setDoc(doc(db, 'config', 'bcv'), { rate: 36.85, updatedAt: new Date().toISOString() });
      const storeBranding = useAppStore.getState().branding;
      if (storeBranding) {
        await setDoc(doc(db, 'config', 'branding'), storeBranding);
      }
      console.log('Initial seed complete.');
    }
  } catch (err) {
    console.warn('Notice seeding initial Firestore data:', err);
  }
}

/**
 * Initializes global bidirectional real-time synchronization between Firestore and App Store.
 * All devices (local, mobile, and production gregoryizquierdo.xyz) stay in sync 100% in real time.
 */
export function initRealtimeFirestoreSync() {
  clearAllFirestoreSubscriptions();
  const store = useAppStore.getState();

  // Run seed check first asynchronously
  seedFirestoreIfEmpty();

  // 1. Products Catalog Listener (real-time stock, pricing, availability, new streaming items)
  const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const remoteProducts: Product[] = [];
    snapshot.forEach(docSnap => {
      remoteProducts.push(docSnap.data() as Product);
    });
    if (remoteProducts.length > 0) {
      store.setProducts(remoteProducts);
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to products snapshot:', err);
  });
  activeUnsubscribers.push(unsubProducts);

  // 2. Payment Methods Listener
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

  // 3. Customers Listener (includes registrations like Pablo 04129130080)
  const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
    setIsSyncingFromFirestore(true);
    const list: CustomerUser[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as CustomerUser);
    });
    if (list.length > 0) {
      store.setCustomers(list);
      // If activeCustomer is logged in, sync their latest balance and profile
      const active = store.activeCustomer;
      if (active) {
        const found = list.find(c => c.id === active.id || c.email?.toLowerCase() === active.email?.toLowerCase());
        if (found && (found.zenyBalance !== active.zenyBalance || JSON.stringify(found) !== JSON.stringify(active))) {
          store.setActiveCustomer(found);
        }
      }
    }
    setIsSyncingFromFirestore(false);
  }, (err) => {
    console.warn('Notice listening to customers snapshot:', err);
  });
  activeUnsubscribers.push(unsubCustomers);

  // 4. Orders Listener (real-time orders, payment status, credentials fulfillment)
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

  // 5. Wallet Topups Listener
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

  // 6. Incidents Listener
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

  // 7. Branding Config Listener
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

  // 8. BCV Rate Listener
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

  // 9. FAQ Items Listener
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

  // 10. Expenses Listener
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

  // 11. Franchises Listener
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

  // 12. Purchases Listener
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
