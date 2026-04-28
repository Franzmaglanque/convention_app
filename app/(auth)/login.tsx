import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Puregold Brand Colors
const COLORS = {
  puregoldGreen: '#008A45',
  puregoldGold: '#FFCC00',
  background: '#F0FDF4', // Very light green tint
  textDark: '#1C1C1E',
  textLight: '#8E8E93',
  white: '#FFFFFF',
  border: '#E5E5EA'
};

export default function LoginScreen() {
  const { isAuthenticated, sessionMessage, clearSessionMessage } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  // Clear the message after showing it
  useEffect(() => {
    return () => {
      if (sessionMessage) clearSessionMessage();
    };
  }, []);

  const { showSuccess, showError } = useToast();
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const loginMutation = useLogin();

  const handleLogin = () => {
    // Basic validation
    if (!loginForm.email || !loginForm.password) {
      showError('Please enter both username and password.');
      return;
    }

    loginMutation.mutate(
      { username: loginForm.email, password: loginForm.password },
      {
        onSuccess: (responseData) => {
          showSuccess('Welcome to the Convention!');
        },
        onError: (error:any) => {
          console.log('Login failed:', error);
          // showError('Login failed. Please check your credentials.');
          showError(error?.response?.data?.message || 'Login failed. Please check your credentials.');
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          
          {/* Header & Logo Section */}
          <View style={styles.headerContainer}>
            {/* TODO: Replace this View with your actual Puregold/Aling Puring Logo 
              <Image source={require('@/assets/icon.png')} style={styles.logo} /> 
            */}
            <View style={styles.logoPlaceholder}>
              <Ionicons name="basket" size={48} color={COLORS.puregoldGold} />
            </View>
            <Text style={styles.title}>Aling Puring</Text>
            <Text style={styles.subtitle}>Negosyo Convention 2026</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={COLORS.textLight}
                value={loginForm.email}
                onChangeText={(text) => setLoginForm({...loginForm, email: text})}
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textLight}
                value={loginForm.password}
                onChangeText={(text) => setLoginForm({...loginForm, password: text})}
                secureTextEntry={!showPassword}
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.textLight} 
                />
              </Pressable>
            </View>

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && { opacity: 0.8 },
                loginMutation.isPending && { backgroundColor: '#A7F3D0' }
              ]}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <LoadingSpinner color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>

            {/* Register Link */}
            <Pressable 
              onPress={() => router.push('/(auth)/register')}
              style={styles.registerLinkContainer}
            >
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.puregoldGreen,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.puregoldGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.puregoldGreen,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706', // A deeper gold/amber for text readability
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    height: '100%',
  },
  eyeIcon: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: COLORS.puregoldGreen,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.puregoldGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  registerLinkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  registerTextHighlight: {
    color: COLORS.puregoldGreen,
    fontWeight: '700',
  }
});