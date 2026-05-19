// firebase-messaging-sw.js
// Service Worker para manejar notificaciones push de Firebase en segundo plano

// Importar scripts de Firebase
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Inicializar Firebase con configuración
firebase.initializeApp({
    apiKey: 'AIzaSyDPvplJ0Z1KaYMa9krgAUTCkSUFAHOd3ls',
    authDomain: 'mystrategee.firebaseapp.com',
    projectId: 'mystrategee',
    storageBucket: 'mystrategee.firebasestorage.app',
    messagingSenderId: '239139202787',
    appId: '1:239139202787:web:e804ebca2ccde9dc6107d6'
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    // Soporta tanto notification field como data-only (web)
    const title = payload.notification?.title || payload.data?.title || 'Nueva Notificación';
    const body = payload.notification?.body || payload.data?.body || '';

    self.registration.showNotification(title, {
        body,
        icon: '/assets/icon/favicon.png',
        badge: '/assets/icon/badge.png',
        data: payload.data,
    });
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;
    
    if (data.requestId) {
        const urlToOpen = `/requests/${data.requestId}`;
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Si hay una ventana abierta, enfocarla y navegar
                    for (let client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            client.focus();
                            client.postMessage({
                                type: 'NAVIGATE',
                                url: urlToOpen
                            });
                            return;
                        }
                    }
                    // Si no hay ventana abierta, abrir una nueva
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});
