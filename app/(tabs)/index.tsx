import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Puregold!</Text>
        <Text style={styles.subtitle}>Fresh groceries delivered to your door</Text>
        {user && (
          <Text style={styles.welcomeText}>Welcome back, {user.fullname}!</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Pressable
          style={styles.button}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Text style={styles.buttonText}>Go to Cart</Text>
          </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.buttonText}>View Profile</Text>
          </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});