/* firebase-messaging-sw.js content */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDxGYPmpw6Ag8Zd_qTym05rekSj_tWxRkI",
    authDomain: "blogger-login-b9795.firebaseapp.com",
    projectId: "blogger-login-b9795",
    storageBucket: "blogger-login-b9795.firebasestorage.app",
    messagingSenderId: "704318869373",
    appId: "1:704318869373:web:f8e477147de540336a8614",
    measurementId: "G-49THRS5MVZ"
});

const messaging = firebase.messaging();

// Optional: Background handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
