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

// Proveedor completo para integraciones de Workspace
const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// Proveedor ligero para autenticación administrativa (solo email y profile)
const adminProvider = new GoogleAuthProvider();
adminProvider.addScope('email');
adminProvider.addScope('profile');
adminProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleAuthResult {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  };
  accessToken: string;
}

let isSigningIn = false;

const readStoredToken = (): string | null => {
  return sessionStorage.getItem('gi_google_oauth_token') || localStorage.getItem('gi_google_oauth_token');
};

let cachedAccessToken: string | null = readStoredToken();

/**
 * Determina de forma certera si una cadena es un token OAuth 2.0 real de Google Workspace
 * (los tokens de acceso de Google comienzan con 'ya29.' y no son identificadores simulados o de sesión local).
 */
export function isGoogleOAuthToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const clean = token.trim();
  if (
    clean.startsWith('direct-verified') ||
    clean.startsWith('firebase-verified') ||
    clean === 'mock-token' ||
    clean.length < 20
  ) {
    return false;
  }
  return clean.startsWith('ya29.') || clean.length > 50;
}

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

/**
 * Decodifica un JWT de Google Identity Services de forma segura en el cliente.
 */
export function decodeGoogleJwt(token: string): {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
} | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Error decodificando JWT de Google:', e);
    return null;
  }
}

/**
 * Autenticación directa mediante Google Identity Services (GIS Token Client).
 * Debe invocarse en respuesta directa a un gesto del usuario.
 */
export const signInWithGoogleIdentity = (
  customScopes: string[] = [
    'email',
    'profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
  ]
): Promise<GoogleAuthResult> => {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services no está cargado.'));
    }
    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      return reject(new Error('oAuthClientId no configurado.'));
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: customScopes.join(' '),
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }
          if (!tokenResponse.access_token) {
            return reject(new Error('No se recibió token de acceso de Google.'));
          }

          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            if (!userInfoRes.ok) {
              throw new Error('No se pudo obtener información del perfil de Google.');
            }
            const info = await userInfoRes.json();
            const result: GoogleAuthResult = {
              user: {
                uid: info.sub || 'google-admin-user',
                email: info.email || null,
                displayName: info.name || info.given_name || 'Gregory Izquierdo',
                photoURL: info.picture || null
              },
              accessToken: tokenResponse.access_token
            };
            cachedAccessToken = tokenResponse.access_token;
            if (cachedAccessToken) {
              sessionStorage.setItem('gi_google_oauth_token', cachedAccessToken);
              localStorage.setItem('gi_google_oauth_token', cachedAccessToken);
            }
            resolve(result);
          } catch (e: any) {
            reject(new Error(`Error al recuperar datos de cuenta de Google: ${e.message}`));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || 'Error en ventana de Google OAuth'));
        }
      });

      client.requestAccessToken();
    } catch (err: any) {
      reject(err);
    }
  });
};

/**
 * Inicia sesión con Google. Maneja bloqueos de ventanas emergentes y restricciones de iframe.
 */
export const googleSignIn = async (
  options?: { forAdminOnly?: boolean }
): Promise<GoogleAuthResult | null> => {
  try {
    isSigningIn = true;
    const targetProvider = options?.forAdminOnly ? adminProvider : provider;

    try {
      const result = await signInWithPopup(auth, targetProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || readStoredToken() || 'firebase-verified-token';

      cachedAccessToken = token;
      sessionStorage.setItem('gi_google_oauth_token', cachedAccessToken);
      localStorage.setItem('gi_google_oauth_token', cachedAccessToken);

      return {
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        },
        accessToken: cachedAccessToken
      };
    } catch (fbError: any) {
      console.warn('Firebase signInWithPopup:', fbError?.code || fbError?.message);
      throw fbError;
    }
  } catch (error: any) {
    console.error('Error de autenticación con Google:', error);
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
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Error en signOut de Firebase:', e);
  }
  cachedAccessToken = null;
  sessionStorage.removeItem('gi_google_oauth_token');
  localStorage.removeItem('gi_google_oauth_token');
};
