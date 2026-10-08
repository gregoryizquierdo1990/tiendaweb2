import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from './googleAuth';
import { db } from './firestoreService';
import { CustomerUser } from '../types';
import { logAuditEvent } from './auditLogger';

export type UserRoleType = 'cliente' | 'vendedor' | 'admin';

export interface AppUserDoc {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  role: UserRoleType;
  createdAt: string;
  updatedAt: string;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Master clearance code for role promotion (as confirmed by administrator)
export const ADMIN_MASTER_CODE = 'maxter2026';

/**
 * Validates the administrator master clearance code.
 */
export function isMasterCodeValid(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toLowerCase();
  return clean === 'maxter2026' || clean === 'maxter2026*';
}

/**
 * Maps an AppUserDoc and FirebaseUser to a CustomerUser entity for app-wide compatibility.
 */
export function mapUserDocToCustomer(userDoc: AppUserDoc): CustomerUser {
  return {
    id: userDoc.uid,
    internalId: `CLI-2026-${userDoc.uid.slice(0, 5).toUpperCase()}`,
    name: userDoc.displayName || userDoc.email.split('@')[0],
    email: userDoc.email,
    phone: userDoc.phone || '',
    role: userDoc.role === 'admin' ? 'administrador' : userDoc.role,
    zenyBalance: 0,
    createdAt: userDoc.createdAt
  };
}

/**
 * Registers a new user with Firebase Auth email/password and automatically provisions
 * a document in Firestore in the 'users' collection with default role 'cliente'.
 */
export async function registerWithEmailPassword(
  email: string, 
  password: string, 
  displayName: string, 
  phone: string
): Promise<CustomerUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const fbUser = cred.user;

  if (displayName.trim()) {
    try {
      await updateProfile(fbUser, { displayName: displayName.trim() });
    } catch (e) {
      console.warn('Could not update Firebase user displayName:', e);
    }
  }

  // Document in Firestore 'users' collection - Default role is strictly 'cliente'
  const userDoc: AppUserDoc = {
    uid: fbUser.uid,
    email: cleanEmail,
    displayName: displayName.trim(),
    phone: phone.trim(),
    role: 'cliente', // ALWAYS DEFAULT TO CLIENTE
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', fbUser.uid), userDoc);

  // Synchronized document in 'customers' collection for order processing
  const customerDoc: CustomerUser = mapUserDocToCustomer(userDoc);
  await setDoc(doc(db, 'customers', fbUser.uid), customerDoc);

  logAuditEvent({
    actor: userDoc.displayName || cleanEmail,
    actorRole: 'customer',
    actorEmail: cleanEmail,
    actorPhone: phone,
    action: 'REGISTRO_FIREBASE_AUTH',
    description: `Usuario registrado con Firebase Auth. Rol asignado por defecto: CLIENTE`,
    severity: 'success'
  });

  return customerDoc;
}

/**
 * Signs in a user using Google Sign-In popup. If the user is logging in for the
 * first time, automatically creates their document in the 'users' collection with role 'cliente'.
 */
export async function loginWithGooglePopup(): Promise<CustomerUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);

  let userDoc: AppUserDoc;

  if (!userSnap.exists()) {
    // First time login - assign default role 'cliente'
    userDoc = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || 'Usuario Google',
      phone: fbUser.phoneNumber || '',
      role: 'cliente', // ALWAYS DEFAULT TO CLIENTE
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userRef, userDoc);
    await setDoc(doc(db, 'customers', fbUser.uid), mapUserDocToCustomer(userDoc));

    logAuditEvent({
      actor: userDoc.displayName,
      actorRole: 'customer',
      actorEmail: userDoc.email,
      action: 'REGISTRO_GOOGLE_AUTH',
      description: `Usuario registrado con Google Auth. Rol asignado por defecto: CLIENTE`,
      severity: 'success'
    });
  } else {
    userDoc = userSnap.data() as AppUserDoc;
  }

  return mapUserDocToCustomer(userDoc);
}

/**
 * Signs in a user using Email and Password and loads their Firestore profile with role.
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<CustomerUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const fbUser = cred.user;

  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);

  let userDoc: AppUserDoc;
  if (!userSnap.exists()) {
    // If user exists in Auth but not in Firestore yet, provision with 'cliente'
    userDoc = {
      uid: fbUser.uid,
      email: cleanEmail,
      displayName: fbUser.displayName || cleanEmail.split('@')[0],
      phone: '',
      role: 'cliente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userRef, userDoc);
    await setDoc(doc(db, 'customers', fbUser.uid), mapUserDocToCustomer(userDoc));
  } else {
    userDoc = userSnap.data() as AppUserDoc;
  }

  return mapUserDocToCustomer(userDoc);
}

/**
 * Claims or provisions the initial administrator role in Firestore ('users' and 'admins' collections)
 * via Master Code authorization.
 */
export async function claimInitialAdminRole(
  targetUid: string,
  masterCode: string,
  adminEmail: string = 'emprendimientogregoryizquierdo@gmail.com',
  adminName: string = 'Gregory Izquierdo'
): Promise<void> {
  if (!isMasterCodeValid(masterCode)) {
    throw new Error('Código maestro inválido. No tienes autorización para reclamar o asignar el rol de administrador.');
  }

  const userRef = doc(db, 'users', targetUid);
  await setDoc(userRef, {
    uid: targetUid,
    email: adminEmail,
    displayName: adminName,
    role: 'admin',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  try {
    const adminRef = doc(db, 'admins', targetUid);
    await setDoc(adminRef, {
      id: targetUid,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Notice saving to admins collection:', e);
  }

  logAuditEvent({
    actor: adminName,
    actorRole: 'admin',
    action: 'INICIALIZAR_ROL_ADMINISTRADOR',
    description: `Rol de Administrador aprovisionado para ${adminEmail} en Firestore mediante Código Maestro.`,
    severity: 'warning'
  });
}

/**
 * Updates a user's role in Firestore ('users' and 'customers' collections).
 * Only authorized administrators with Master Code can change roles to 'vendedor' or back to 'cliente'.
 */
export async function updateUserRoleByAdmin(
  targetUid: string, 
  newRole: 'cliente' | 'vendedor' | 'admin',
  masterCode: string,
  adminName: string = 'Administrador'
): Promise<void> {
  if (!isMasterCodeValid(masterCode)) {
    throw new Error('Código maestro de administrador inválido. No tienes autorización para modificar roles.');
  }

  // 1. Update in customers collection (immediate store & portal reflection)
  try {
    const custRef = doc(db, 'customers', targetUid);
    await setDoc(custRef, {
      role: newRole
    }, { merge: true });
  } catch (e) {
    console.warn('Notice updating role in customers collection:', e);
  }

  // 2. Update in users collection (Firebase Auth document)
  const userRef = doc(db, 'users', targetUid);
  try {
    await setDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    console.warn('Notice updating users collection:', err);
    if (err?.code === 'permission-denied') {
      console.info('Rol actualizado en customers. Para escribir directamente en users, requiere sesión de Google Admin.');
    } else {
      throw err;
    }
  }

  logAuditEvent({
    actor: adminName,
    actorRole: 'admin',
    action: 'CAMBIO_ROL_USUARIO',
    description: `El administrador cambió el rol del usuario ${targetUid} a "${newRole.toUpperCase()}".`,
    severity: 'warning'
  });
}

/**
 * Logs out the active user from Firebase Auth.
 */
export async function logoutAppUser(): Promise<void> {
  await signOut(auth);
}
