// src/components/customer/OrderDetailsScreen.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const OrderDetailsScreen = ({ route }) => {
  const orderId = route?.params?.orderId || 'Unknown';
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Order Details Screen (Mobile Stub)</Text>
      <Text style={styles.subtext}>Order ID: {orderId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default OrderDetailsScreen;
