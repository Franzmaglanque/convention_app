import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';


export default function TabsLayout() {
  const { token, user, isAuthenticated } = useAuth();

  const isAdmin = user?.department === 'ADMIN';
  // Helper to check if user is a Supplier Manager
  const isSupplierManager = user?.department === 'SUPPLIER' && user?.role === 'MANAGER';
  // Helper to check if user is a Supplier Cashier
  const isSupplierCashier = user?.department === 'SUPPLIER' && user?.role === 'CASHIER';
  console.log('user department',user?.department);
  console.log('user role',user?.role);


  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066cc',
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transacntions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}