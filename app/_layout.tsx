import ToastProvider from '@/components/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RootLayout() {
    const [queryClient] = useState(() => new QueryClient());

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
                    {/* Always include index screen - it will handle redirection */}
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    {/* Always include auth screens */}
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    {/* Always include tabs screens */}
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    {/* Always include not-found */}
                    <Stack.Screen name="+not-found" />
                </Stack>
            </ToastProvider>
        </QueryClientProvider>
    );
}
