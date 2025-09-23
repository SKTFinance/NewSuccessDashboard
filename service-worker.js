// Importiere die Firebase-Skripte. Dies ist für den Service Worker notwendig.
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

// Deine Firebase-Konfiguration (dieselbe wie in deiner Haupt-App)
const firebaseConfig = {
    apiKey: "AIzaSyCRb2nZrC9U78fFxuVZu7NF9JxRxyZw864",
    authDomain: "skt-dashboard-c7374.firebaseapp.com",
    projectId: "skt-dashboard-c7374",
    storageBucket: "skt-dashboard-c7374.appspot.com",
    messagingSenderId: "936899917792",
    appId: "1:936899917792:web:6470917c8ae8e410ee5d85"
};

// Initialisiere die Firebase-App im Service Worker
firebase.initializeApp(firebaseConfig);

// Rufe eine Instanz von Firebase Messaging ab, um Benachrichtigungen im Hintergrund zu verarbeiten
const messaging = firebase.messaging();

// Füge einen Handler für Hintergrund-Benachrichtigungen hinzu
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[service-worker.js] Received background message ",
    payload
  );
  
  // Wir lesen jetzt aus payload.data statt payload.notification
  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: './icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// --- Caching für Offline-Fähigkeit ---
const CACHE_NAME = 'skt-dashboard-cache-v0.8.8';
const urlsToCache = [
  './', 
  './index.html',
  './style.css',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(keyList.map(key => {
        if (!cacheWhitelist.includes(key)) {
          return caches.delete(key);
        }
      }))
    )
  );
});
