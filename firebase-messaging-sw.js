// Import and initialize the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// यहाँ पर अपना Firebase Config कोड डालें
const firebaseConfig = {
    apiKey: "AIzaSyDxGYPmpw6Ag8Zd_qTym05rekSj_tWxRkI",
    authDomain: "blogger-login-b9795.firebaseapp.com",
    projectId: "blogger-login-b9795",
    storageBucket: "blogger-login-b9795.firebasestorage.app",
    messagingSenderId: "704318869373",
    appId: "1:704318869373:web:f8e477147de540336a8614",
    measurementId: "G-49THRS5MVZ"
  };

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "<data:blog.blogspotFaviconUrl/>" // Dynamic favicon के लिए
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
