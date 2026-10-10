importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCdwtL3I3JXErTAdqKXIKBcx36g3nIjPiM",
  authDomain: "tactical-codex-mxjsq.firebaseapp.com",
  projectId: "tactical-codex-mxjsq",
  storageBucket: "tactical-codex-mxjsq.firebasestorage.app",
  messagingSenderId: "146612234845",
  appId: "1:146612234845:web:c0c2b5ecda71af2afd7bb4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
