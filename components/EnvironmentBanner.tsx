import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const EnvironmentBanner = () => {
  // Replace with your actual env check (e.g., process.env.EXPO_PUBLIC_APP_ENV)
  const isUAT = true; 

  if (!isUAT) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>UAT ENVIRONMENT - NOT FOR ACTUAL TRANSACTIONS</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF3B30', // Bright red to catch attention
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default EnvironmentBanner;