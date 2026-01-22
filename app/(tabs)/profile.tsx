import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import UserProfile from '@/components/UserProfile';

export default function ProfileScreen() {
  const { token, user, isAuthenticated } = useAuth();
  console.log('User info in ProfileScreen:', user);
  return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Profile test1</Text>
// <Text>Welcome {user?.fullname}</Text>;
//       <Pressable 
//         style={styles.button}
//         onPress={() => router.push('/(auth)/login')}
//       >
//         <Text style={styles.buttonText}>Go to Login</Text>
//       </Pressable>
//     </View>

<UserProfile />
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