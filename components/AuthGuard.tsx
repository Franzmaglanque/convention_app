import { useEffect, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { View, ActivityIndicator } from 'react-native';

type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

export default function AuthGuard({ 
  children, 
  requireAuth = true,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a bit to ensure navigation is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || isLoading) return;
    
    const isAuthRoute = pathname?.startsWith('/(auth)') || false;
    
    if (requireAuth && !isAuthenticated && !isAuthRoute) {
      router.replace('/(auth)/login');
    } else if (!requireAuth && isAuthenticated && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, pathname, requireAuth, isReady, isLoading]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  // Don't render children if redirecting
  const isAuthRoute = pathname?.startsWith('/(auth)') || false;
  if (requireAuth && !isAuthenticated && !isAuthRoute) {
    return null;
  }
  if (!requireAuth && isAuthenticated && isAuthRoute) {
    return null;
  }

  return <>{children}</>;
}
