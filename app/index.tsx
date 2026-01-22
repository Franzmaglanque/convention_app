import { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

// This file is no longer needed as the root layout handles authentication routing
export default function Index() {
  return null;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});

