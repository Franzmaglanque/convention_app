import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  const { user } = useAuth();

  const isAdmin = user?.department === 'ADMIN';
  const isSupplierManager = user?.department === 'SUPPLIER' && user?.role === 'MANAGER';
  const isSupplierCashier = user?.department === 'SUPPLIER' && user?.role === 'CASHIER';
  const isSupplierGlobe = user?.supplier_code === '14597'
  
  // Fix the typo in "Transactions"
  const transactionsTitle = 'Transactions';

  return (
    <ProtectedRoute>
      {/* <EnvironmentBanner /> */}
      <Tabs
        initialRouteName={isSupplierCashier ? 'cart' : 'index'}
        screenOptions={{
          tabBarActiveTintColor: '#0066cc',
          headerShown: false,
          headerStyle: {
            backgroundColor: '#0066cc',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            href: (isAdmin || isSupplierManager) ? '/' : null,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" size={size} color={color} />
            ),
            href: isSupplierCashier ? '/cart' : null,
          }}
        />

        <Tabs.Screen
          name="returns"
          options={{
            title: 'Returns',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="swap-horizontal-outline" size={size} color={color} />
            ),
            href: isSupplierCashier ? '/returns' : null,
          }}
        />

        <Tabs.Screen
          name="transactions"
          options={{
            title: transactionsTitle,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
            href: isSupplierManager ? '/transactions' : null,
          }}
        />

        <Tabs.Screen
          name="load"
          options={{
            title: 'E-Load',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="phone-portrait-outline" size={size} color={color} />
            ),
            href : isSupplierGlobe ? '/load' : null,
          }}
        />

        <Tabs.Screen
          name="remittance"
          options={{
            title: 'Remittance',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash-outline" size={size} color={color} />
            ),
            href: isSupplierManager ? '/remittance' : null,
          }}
        />

        <Tabs.Screen
          name="cashier"
          options={{
            title: 'Cashier',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
            href: isSupplierManager ? '/cashier' : null,
          }}
        />

        <Tabs.Screen
          name="encode-cashier"
          options={{
            title: 'Register',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
            href: isSupplierManager ? '/encode-cashier' : null,
          }}
        />

        <Tabs.Screen
          name="vendorQrScreen"
          options={{
            title: 'Vendor QR',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="qr-code-outline" size={size} color={color} />
            ),
            href: isSupplierManager ? '/vendorQrScreen' : null,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
       
      </Tabs>
    </ProtectedRoute>
  );
}
