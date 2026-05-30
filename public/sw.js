/**
 * SWEETO Hub Service Worker for Background Push Notifications
 * Handles dynamic push events and opens specific product details when clicked.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Background push notification received.');
  
  let data = { 
    title: 'SWEETO HUB', 
    body: 'New arrival or special deal available now!', 
    url: '/#/' 
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { 
        title: 'SWEETO HUB', 
        body: event.data.text(), 
        url: '/#/' 
      };
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    image: data.image || null,
    data: { url: data.url },
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      { action: 'explore', title: 'VIEW NOW' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/#/';
  
  // Resolve client window focus or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open with the root domain, navigate it and focus
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          // If the app is active, route or load the product hash
          client.postMessage({ type: 'ROUTE_TO', url: targetUrl });
          return client.focus().then(() => {
            if (client.navigate) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
