import { useToast } from '@/components/ToastProvider';
import { useRegisterCashier } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Using your existing color palette
const COLORS = {
  puregoldGreen: '#008A45',
  background: '#F0FDF4',
  white: '#FFFFFF',
  textDark: '#1C1C1E',
  textLight: '#8E8E93',
  border: '#E5E5EA',
  warningBg: '#FFFBEB',
  warningText: '#D97706',
};

const initialState = {
  firstName: '',
  middleName: '',
  lastName: '',
  username: '',
  password: '',
};

export default function RegisterCashierScreen() {
  const { showSuccess, showError, showInfo } = useToast();
  
  // --- Form State ---
  const [form, setForm] = useState(initialState);

 

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerCashierMutation = useRegisterCashier();

  // --- Handlers ---
  const handleRegister = async () => {
    // 1. Basic Validation
    if (!form.firstName || !form.lastName || !form.username || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    registerCashierMutation.mutate({
        firstname:form.firstName,
        middlename:form.middleName,
        lastname:form.lastName,
        username:form.username,
        password:form.password
      },{
        onSuccess: (response) => {
            console.log('response',response);
            setForm(initialState);
            showSuccess(`Cashier ${form.firstName} ${form.lastName} has been successfully encoded. They will be able to log in once an Admin approves their account.`);
        },
        onError: (error) => {
          console.log('error',error.message)
          showError('Failed to encode cashier. Please try again.');
        }
    })


    setIsSubmitting(false);

    // try {
    //   // TODO: Replace with your actual useMutation hook for Elysia API
    //   // await registerCashierMutation.mutateAsync({ ...form, role: 'CASHIER' });
      
    //   // Simulating API call delay
    //   await new Promise((resolve) => setTimeout(resolve, 1500));

    //   Alert.alert(
    //     'Registration Submitted',
    //     `Cashier ${form.firstName} ${form.lastName} has been successfully encoded. They will be able to log in once an Admin approves their account.`,
    //     [{ text: 'Understood', onPress: () => router.back() }]
    //   );
    // } catch (error: any) {
    //   Alert.alert('Registration Failed', error?.message || 'Something went wrong.');
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Encode Cashier</Text>
          <View style={{ width: 40 }} /> {/* Spacer for centering */}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* CMS Approval Notice Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color={COLORS.warningText} />
            <Text style={styles.infoBannerText}>
              Encoded cashiers are created as <Text style={{ fontWeight: '700' }}>Pending</Text>. 
              An Admin must approve this account before the cashier can log in.
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.card}>
            
            {/* First Name */}
            <Text style={styles.inputLabel}>First Name <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Juan"
                placeholderTextColor={COLORS.textLight}
                value={form.firstName}
                onChangeText={(text) => setForm({ ...form, firstName: text })}
              />
            </View>

            {/* Middle Name */}
            <Text style={styles.inputLabel}>Middle Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Dela"
                placeholderTextColor={COLORS.textLight}
                value={form.middleName}
                onChangeText={(text) => setForm({ ...form, middleName: text })}
              />
            </View>

            {/* Last Name */}
            <Text style={styles.inputLabel}>Last Name <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Cruz"
                placeholderTextColor={COLORS.textLight}
                value={form.lastName}
                onChangeText={(text) => setForm({ ...form, lastName: text })}
              />
            </View>

            <View style={styles.divider} />

            {/* Username */}
            <Text style={styles.inputLabel}>Username <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at-circle-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Cashier's login username"
                placeholderTextColor={COLORS.textLight}
                value={form.username}
                onChangeText={(text) => setForm({ ...form, username: text })}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <Text style={styles.inputLabel}>Temporary Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={COLORS.textLight}
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.textLight} 
                />
              </Pressable>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit for Approval</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background to make the white card pop
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.warningText,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    marginBottom: 20,
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: COLORS.puregoldGreen,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.puregoldGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#A7F3D0',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});