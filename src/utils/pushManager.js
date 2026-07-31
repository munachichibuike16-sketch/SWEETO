import { apiFetch } from './api';

export class PushNotificationManager {
  constructor() {
    this.swRegistration = null;
    this.isSubscribed = false;
  }

  // 1. Initialize and register Service Worker
  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported in this browser.');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Check existing subscription
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = subscription !== null;
      
      return true;
    } catch (error) {
      console.error('Service Worker Registration Failed:', error);
      return false;
    }
  }

  // Helper to convert VAPID key
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 2. Request Permission and Subscribe
  async subscribe(role = 'customer') {
    if (this.isSubscribed) return true;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Fetch VAPID Public Key from server
      const response = await apiFetch('/push/public-key');
      const data = await response.json();
      const applicationServerKey = this.urlB64ToUint8Array(data.publicKey);

      // Subscribe to Push Service
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send subscription to backend
      const session = JSON.parse(localStorage.getItem('sweetohub_session') || '{}');
      const user_id = session?.id || session?.phone || '';

      await apiFetch('/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          },
          role,
          user_id
        })
      });

      this.isSubscribed = true;
      console.log('Push subscription saved successfully.');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }
}

export const pushManager = new PushNotificationManager();
