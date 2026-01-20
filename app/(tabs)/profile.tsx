import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { storeService } from '../../services/stores.service';

export default function ProfileScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeService.getStoreList(),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  console.log('Store data:', data);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile test1</Text>
      
      {data?.data.map((store: any) => (
        <Text key={store.id}>{store.name}</Text>
      ))}

      <Pressable 
        style={styles.button}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.buttonText}>Go to Login</Text>
      </Pressable>
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
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});