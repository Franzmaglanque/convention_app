import { View, Text, StyleSheet, Pressable, Button } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { storeService } from '../../services/stores.service';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  console.log('User data from store:', user);

  const handleLogout = () => {
    logout();
    // Navigation will be handled by AuthGuard
    router.replace('/(auth)/login');
  };

  if (!isAuthenticated || !user) {
    return (
    <View style={styles.container}>
        <Text style={styles.title}>Not Authenticated</Text>
      <Pressable 
        style={styles.button}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.buttonText}>Go to Login</Text>
      </Pressable>
    </View>
  );
}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile test1</Text>

      <View style={styles.userInfo}>
        <Text style={styles.label}>Full Name:</Text>
        <Text style={styles.value}>{user.fullname}</Text>

        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{user.username}</Text>

        <Text style={styles.label}>Supplier Code:</Text>
        <Text style={styles.value}>{user.supplier_code}</Text>

        <Text style={styles.label}>Supplier Name:</Text>
        <Text style={styles.value}>{user.supplier_name}</Text>
      </View>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  userInfo: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});