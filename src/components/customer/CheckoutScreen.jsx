// src/components/customer/CheckoutScreen.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CheckoutScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Checkout Screen (Mobile Stub)</Text>
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
});

export default CheckoutScreen;
