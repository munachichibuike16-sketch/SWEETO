// src/components/customer/CustomerNotificationBubble.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const CustomerNotificationBubble = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    const handleNotification = (notification) => {
      setCurrentNotification(notification);
      setNotifications(prev => [notification, ...prev].slice(0, 5));
      showNotification();
    };

    window.addEventListener('inAppNotification', handleNotification);

    return () => {
      window.removeEventListener('inAppNotification', handleNotification);
    };
  }, []);

  const showNotification = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      dismissNotification();
    }, 8000);
  };

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentNotification(null);
    });
  };

  const handleNotificationPress = () => {
    if (currentNotification?.data?.orderId) {
      navigation.navigate('OrderDetails', { 
        orderId: currentNotification.data.orderId 
      });
    }
    dismissNotification();
  };

  if (!currentNotification) return null;

  return (
    <PanGestureHandler
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.translationY < -50) {
          dismissNotification();
        }
      }}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleNotificationPress}
          style={styles.content}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>
                {currentNotification.style?.icon || '🛍️'}
              </Text>
            </View>
          </View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{currentNotification.title}</Text>
              <Text style={styles.time}>{currentNotification.time || 'Just now'}</Text>
            </View>
            {currentNotification.subtitle && (
              <Text style={styles.subtitle}>{currentNotification.subtitle}</Text>
            )}
            <Text style={styles.body}>{currentNotification.body}</Text>
          </View>

          <TouchableOpacity
            onPress={dismissNotification}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {currentNotification.actions && (
          <View style={styles.actionsContainer}>
            {currentNotification.actions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  index < currentNotification.actions.length - 1 && styles.actionBorder,
                ]}
                onPress={() => {
                  if (action.id === 'view_order' || action.id === 'track_order') {
                    handleNotificationPress();
                  }
                }}
              >
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 10,
    right: 10,
    backgroundColor: '#25D366',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
    overflow: 'hidden',
    maxWidth: width - 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 70,
  },
  avatarContainer: {
    marginRight: 12,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 1,
  },
  body: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  closeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
export default CustomerNotificationBubble;
