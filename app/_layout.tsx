import ToastProvider from '@/components/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RootLayout() {
    const [queryClient] = useState(() => new QueryClient());
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <LoadingSpinner visible={true} />
                </ToastProvider>
            </QueryClientProvider>
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
                    {!isAuthenticated ? (
                        // If not authenticated, only show auth screens
                        <>
                            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                            <Stack.Screen name="+not-found" />
                        </>
                    ) : (
                        // If authenticated, show protected screens
                        <>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="+not-found" />
                        </>
                    )}
                </Stack>
            </ToastProvider>
        </QueryClientProvider>
    );
}
