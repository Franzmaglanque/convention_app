import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SMSModal({visible,onClose,onSubmit}:any) {
    const [localNumber, setLocalNumber] = useState('');

    const handleSubmit = () => {
        setLocalNumber('');
        onSubmit(localNumber);
    }
    const handleSkip = () => {
        setLocalNumber('');
        onSubmit();
    }

  return (
    <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.smsModalContent}>
            
            {/* Header */}
            <Text style={styles.modalTitle}>Send SMS Receipt</Text>
            <Text style={styles.modalSubtext}>
                Enter the customer's mobile number to send the transaction details.
            </Text>

            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
                <Ionicons name="phone-portrait-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                
                {/* Static +63 Prefix */}
                <Text style={styles.prefixText}>+63</Text>
                
                <TextInput
                    style={styles.phoneInput}
                    placeholder="9XXXXXXXXX"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="phone-pad"
                    maxLength={10} // Only 10 digits needed after +63
                    value={localNumber}
                    onChangeText={(text) => {
                        // Strip any non-numeric characters (like spaces or dashes)
                        const numericOnly = text.replace(/[^0-9]/g, '');
                        setLocalNumber(numericOnly);
                    }}
                    autoFocus={true}
                />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={styles.skipButton}
                    onPress={handleSkip}
                >
                    <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    // Button is disabled until exactly 10 digits are entered
                    style={[styles.submitButton, localNumber.length < 10 && styles.submitButtonDisabled]}
                    disabled={localNumber.length < 10}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
            </View>

            </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsModalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputIcon: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12, // React Native 0.71+ supports gap. If older, use margin/padding.
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A9C7F0', // Faded blue for disabled state
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  prefixText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 4,
  },
});