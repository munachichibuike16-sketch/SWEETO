// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './lib/supabase';
import backgroundNotificationService from './services/backgroundNotificationService';
import firebaseMessaging from './services/firebaseConfig';
import { NotificationDrawer } from './components/NotificationDrawer';
import { CustomerNotificationBubble } from './components/customer/CustomerNotificationBubble';
import { CheckoutScreen } from './components/customer/CheckoutScreen';
import { HomeScreen } from './components/customer/HomeScreen';
import { OrderDetailsScreen } from './components/customer/OrderDetailsScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';

const Stack = createStackNavigator();

const HeaderRight = ({ navigation }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    let subscription;

    const setupSubscription = async () => {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updateUnreadCount = async () => {
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

          setUnreadCount(count || 0);
        };

        updateUnreadCount();

        subscription = supabase
          .channel('notifications-count')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => updateUnreadCount()
          )
          .subscribe();
      } catch (err) {
        console.warn('Error setting up notification count subscription:', err);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <TouchableOpacity 
        style={styles.bellButton}
        onPress={() => setDrawerVisible(true)}
      >
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />
    </>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('customer');
  const [initializing, setInitializing] = useState(true);
  const navigationRef = useRef();

  useEffect(() => {
    // Initialize Firebase Messaging
    const initMessaging = async () => {
      try {
        await firebaseMessaging.setupMessaging();
        console.log('✅ Firebase Messaging initialized');
      } catch (error) {
        console.error('❌ Firebase Messaging error:', error);
      }
    };

    // Get current user
    const initUser = async () => {
      if (!supabase) {
        setInitializing(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          
          // Get user role
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(userData?.role || 'customer');
          
          // Subscribe to topics
          await firebaseMessaging.subscribeToTopic(`user_${user.id}`);
          await firebaseMessaging.subscribeToTopic('all_customers');
          if (userData?.role === 'admin') {
            await firebaseMessaging.subscribeToTopic('admins');
          }
        }
      } catch (err) {
        console.error('Error initializing user session:', err);
      }
      setInitializing(false);
    };

    initMessaging();
    initUser();

    // Auth state listener
    let authListener;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser(session.user);
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();
            setUserRole(userData?.role || 'customer');
            await firebaseMessaging.subscribeToTopic(`user_${session.user.id}`);
            await firebaseMessaging.subscribeToTopic('all_customers');
          } else {
            setUser(null);
            setUserRole('customer');
          }
        }
      );
      authListener = data;
    }

    // Handle navigation from notification taps
    const handleNavigation = (event) => {
      const { detail } = event;
      if (detail?.orderId) {
        navigationRef.current?.navigate('OrderDetails', { orderId: detail.orderId });
      }
    };

    window.addEventListener('navigateToOrder', handleNavigation);

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      window.removeEventListener('navigateToOrder', handleNavigation);
    };
  }, []);

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#25D366',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {userRole === 'admin' ? (
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboard}
              options={({ navigation }) => ({
                title: 'Admin Dashboard',
                headerRight: () => <HeaderRight navigation={navigation} />,
              })}
            />
          ) : (
            <>
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={({ navigation }) => ({
                  title: 'Shop',
                  headerRight: () => <HeaderRight navigation={navigation} />,
                })}
              />
              <Stack.Screen 
                name="Checkout" 
                component={CheckoutScreen}
                options={{ title: 'Checkout', headerBackTitle: 'Back' }}
              />
              <Stack.Screen 
                name="OrderDetails" 
                component={OrderDetailsScreen}
                options={{ title: 'Order Details', headerBackTitle: 'Back' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <CustomerNotificationBubble />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  bellButton: {
    position: 'relative',
    padding: 8,
  },
  bellIcon: {
    fontSize: 24,
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#25D366',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});
