import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useToast } from '@/components/ToastProvider';

/**
 * Example component demonstrating how to use the MessageToast component
 * You can copy this pattern to any screen in your app
 */
const MessageToastExample: React.FC = () => {
  const {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useToast();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Message Toast Examples</Text>
      
      <Pressable
        style={[styles.button, styles.successButton]}
        onPress={() => showSuccess('Operation completed successfully!')}
      >
        <Text style={styles.buttonText}>Show Success</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.errorButton]}
        onPress={() => showError('Something went wrong. Please try again.')}
      >
        <Text style={styles.buttonText}>Show Error</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.infoButton]}
        onPress={() => showInfo('This is an informational message.')}
      >
        <Text style={styles.buttonText}>Show Info</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.warningButton]}
        onPress={() => showWarning('Warning: This action cannot be undone.')}
      >
        <Text style={styles.buttonText}>Show Warning</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.customButton]}
        onPress={() => showError('Network error: Unable to connect to server', 5000)}
      >
        <Text style={styles.buttonText}>Show 5s Error</Text>
      </Pressable>

      <Text style={styles.note}>
        Note: The toast will auto-dismiss after 3 seconds (configurable).
        You can also click the X button to dismiss manually.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  infoButton: {
    backgroundColor: '#3B82F6',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  customButton: {
    backgroundColor: '#8B5CF6',
  },
  note: {
    marginTop: 30,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default MessageToastExample;