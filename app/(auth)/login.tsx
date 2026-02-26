import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const { isAuthenticated, sessionMessage, clearSessionMessage } = useAuthStore();

   // Clear the message after showing it
  useEffect(() => {
    return () => {
      if (sessionMessage) clearSessionMessage();
    };
  }, []);

  const {
      showSuccess,
      showError,
    } = useToast();
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const loginMutation = useLogin();

  const handleLogin = () => {
    loginMutation.mutate(
      { username: loginForm.email, password: loginForm.password },
      {
        onSuccess: (responseData) => {
          // Response data is automatically saved to auth store via useLogin hook
          showSuccess('Login successful!');
        },
        onError: (error) => {
          console.log('Login failed:', error);
          showError('Login failed. Please check your credentials.');
        }
      }
    );
  }

  if(isAuthenticated){
    return <Redirect href="(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loginMutation.isPending} />

       {/* Session expired message */}
      {sessionMessage && (
        <View style={styles.sessionBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#1D4ED8" />
          <Text style={styles.sessionMessage}>{sessionMessage}</Text>
        </View>
      )}

      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(text) => setLoginForm({...loginForm, email: text})}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={(text) => setLoginForm({...loginForm, password: text})}
      />

      <Pressable
        style={styles.button}
        onPress={() => handleLogin()}
      >
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#0066cc',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  sessionMessage: {
    color: '#1D4ED8',
    fontSize: 14,
    flex: 1,
  },
});