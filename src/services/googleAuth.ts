import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;

const readStoredToken = (): string | null => {
  return sessionStorage.getItem('gi_google_oauth_token') || localStorage.getItem('gi_google_oauth_token');
};

let cachedAccessToken: string | null = readStoredToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        cachedAccessToken = readStoredToken();
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('gi_google_oauth_token');
      localStorage.removeItem('gi_google_oauth_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google. Revisa los permisos de la ventana emergente.');
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('gi_google_oauth_token', cachedAccessToken);
    localStorage.setItem('gi_google_oauth_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error de autenticación con Google:', error);
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('La ventana emergente de inicio de sesión con Google fue bloqueada por tu navegador. Por favor permite ventanas emergentes o usa la opción de token manual.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = readStoredToken();
  }
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem('gi_google_oauth_token', token);
    localStorage.setItem('gi_google_oauth_token', token);
  } else {
    sessionStorage.removeItem('gi_google_oauth_token');
    localStorage.removeItem('gi_google_oauth_token');
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem('gi_google_oauth_token');
  localStorage.removeItem('gi_google_oauth_token');
};
