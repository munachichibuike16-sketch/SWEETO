// src/services/firebaseConfig.js
import messaging from '@react-native-firebase/messaging';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

class FirebaseMessagingService {
  constructor() {
    this.token = null;
  }

  async setupMessaging() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Notification permissions not granted');
        return;
      }

      if (Platform.OS === 'ios') {
        await messaging().registerForRemoteNotifications();
      }

      this.token = await messaging().getToken();
      console.log('📱 FCM Token:', this.token);

      await this.saveTokenToServer(this.token);
      messaging().onTokenRefresh(async (token) => {
        console.log('🔄 Token refreshed:', token);
        await this.saveTokenToServer(token);
      });

      return this.token;
    } catch (error) {
      console.error('Error setting up FCM:', error);
    }
  }

  async saveTokenToServer(token) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceId = await DeviceInfo.getUniqueId();
      
      await supabase
        .from('users')
        .update({ 
          push_token: token,
          device_type: Platform.OS,
          device_id: deviceId,
        })
        .eq('id', user.id);

      console.log('✅ Token saved to server');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`📨 Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`📨 Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }
}

export default new FirebaseMessagingService();
