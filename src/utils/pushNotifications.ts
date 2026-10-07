// Push notifications utility for StreamSync Pro

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration.scope);
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

export async function sendPushNotification(title: string, body: string, url: string = '/') {
  if (typeof window === 'undefined') return;

  // Check if browser notifications are supported and permitted
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
    } else if ('Notification' in window) {
      new Notification(title, { body, icon: '/icon.svg' });
    }
  } catch (e) {
    console.warn('Could not send push notification:', e);
  }
}
