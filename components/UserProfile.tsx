import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/useAuth';

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{user.fullname}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{user.username}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Supplier Code:</Text>
        <Text style={styles.value}>{user.supplier_code}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Supplier Name:</Text>
        <Text style={styles.value}>{user.supplier_name}</Text>
      </View>
      
      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    width: 120,
    fontSize: 16,
  },
  value: {
    flex: 1,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});