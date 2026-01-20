import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
// use the useLogin hook here when implementing login functionality
import { useLogin } from '@/hooks/useAuth';
import { useState } from 'react';

export default function LoginScreen() {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const loginMutation = useLogin();

  const handleLogin = () => {
    const foo = loginMutation.mutate({ username: loginForm.email, password: loginForm.password });
    console.log('Login response:', foo);
  }

  return (
    <View style={styles.container}>
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
});