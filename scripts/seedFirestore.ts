import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS, INITIAL_CUSTOMERS } from '../src/data/defaultCatalog';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

async function main() {
  console.log('Connecting to Firestore database:', (firebaseConfig as any).firestoreDatabaseId);
  const snap = await getDocs(collection(db, 'products'));
  console.log('Current Firestore products count:', snap.size);

  if (snap.size === 0) {
    console.log(`Seeding ${INITIAL_PRODUCTS.length} products...`);
    for (const p of INITIAL_PRODUCTS) {
      await setDoc(doc(db, 'products', p.id), p);
    }
    console.log(`Seeding ${INITIAL_PAYMENT_METHODS.length} payment methods...`);
    for (const m of INITIAL_PAYMENT_METHODS) {
      await setDoc(doc(db, 'payment_methods', m.id), m);
    }
    console.log(`Seeding ${INITIAL_CUSTOMERS.length} default customers...`);
    for (const c of INITIAL_CUSTOMERS) {
      await setDoc(doc(db, 'customers', c.id), c);
    }
    console.log('Seeding config docs (bcv & branding)...');
    await setDoc(doc(db, 'config', 'bcv'), { rate: 36.85, updatedAt: new Date().toISOString() });
    await setDoc(doc(db, 'config', 'branding'), {
      projectName: 'Gregory Izquierdo Streaming',
      rif: '',
      slogan: 'Tu plataforma de streaming de alta gama 24/7',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      heroTitle: 'Tus Suscripciones y Servicios de Streaming favoritas',
      heroTitleGradient: 'en un solo lugar',
      heroSubtitle: 'Perfiles Privados, Cuentas Completas, Aplicaciones y mucho mas. Paga con Pago Movil a Tasa BCV Oficial, o a traves de: Binance Pay, Banco Guayaquil, Zinli o con tu Saldo de Billetera Zeny.',
      heroBadgeText: 'Entrega Inmediata & Garantía Total de Duración'
    });
    console.log('Firestore seed completed successfully!');
  } else {
    console.log('Firestore already has products, skipping seed.');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
