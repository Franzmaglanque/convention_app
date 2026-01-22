import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import ToastProvider from '@/components/ToastProvider';
import { useAuthStore } from '@/stores/auth.store';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
    const [queryClient] = useState(() => new QueryClient());
    const { isAuthenticated, isLoading } = useAuthStore();

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <StatusBar style="auto" />
                <Stack
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: '#0066cc',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                >
                    {/* Conditionally show tabs or auth based on authentication */}
                    {isAuthenticated ? (
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    ) : (
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    )}
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    {/* <Stack.Screen name="products" options={{ headerShown: false }} /> */}
                    {/* <Stack.Screen name="+not-found" /> */}
                </Stack>
            </ToastProvider>
        </QueryClientProvider>
    );
}
