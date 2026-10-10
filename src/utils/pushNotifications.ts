// Push notifications utility for StreamSync Pro with FCM support
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
import { syncFcmTokenToFirestore } from '../services/firestoreService';

// Initialize Firebase for messaging if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let messaging: any = null;

try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('FCM Messaging not supported in this environment:', err);
}

// VAPID Key is required for web push notifications.
// Replace this placeholder with your actual VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = 'BGn0i9EKTiWS2Us5vLAtVYte_f08y0nKxiwgtwDdF3_rTe6eN9qw_Iy8MhIEcPVVAr2IO5qJ-9Zyzi_5ayAppks';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Firebase Messaging Service Worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export async function initFcm(userId?: string) {
  if (!messaging) return null;
  
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    // Explicitly register and wait for the service worker to ensure connection
    const registration = await registerServiceWorker();
    if (!registration) {
      console.warn('Could not register Service Worker for FCM');
      return null;
    }

    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token acquired successfully');
      if (userId) {
        await syncFcmTokenToFirestore(userId, token);
      }
      return token;
    } else {
      console.warn('No registration token available.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

export async function sendPushNotification(title: string, body: string, url: string = '/') {
  if (typeof window === 'undefined') return;

  // Local fallback for immediate feedback or if FCM is not configured
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration && registration.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        data: { url }
      });
    }
  } catch (e) {
    console.warn('Could not send local push notification:', e);
  }
}

export async function sendFcmNotification(token: string, title: string, body: string, url: string = '/') {
  try {
    const response = await fetch('/api/push-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, url })
    });
    return await response.json();
  } catch (err) {
    console.error('Error calling FCM notification API:', err);
    return { success: false, error: err };
  }
}
