// Nourish Glow - Service Worker for Routine Reminders & Web Notifications
const SW_VERSION = 'v1.0.0';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing instances
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click: focus or open Nourish Glow and navigate to routine
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/#routine';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there is already a window open with Nourish Glow
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is currently open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Optional: listen for push notifications if configured with backend Web Push
self.addEventListener('push', (event) => {
  let data = {
    title: 'Nourish Glow ✨',
    body: "It's time for your skincare routine!",
    url: '/#routine'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.tag || 'nourish-glow-reminder',
    data: {
      url: data.url || '/#routine'
    },
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
