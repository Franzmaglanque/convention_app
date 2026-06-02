import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SMSModal({ visible, onClose, onSubmit }: any) {
    const [localNumber, setLocalNumber] = useState('');

    // Ensure it's exactly 10 digits (e.g., 9123456789)
    const isValidNumber = localNumber.length === 10;

    const handleSubmit = () => {
        if (!isValidNumber) return;
        setLocalNumber('');
        onSubmit(localNumber);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.smsModalContent}>
                    
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Ionicons name="chatbubble-ellipses" size={32} color="#007AFF" style={styles.headerIcon} />
                        <Text style={styles.modalTitle}>Customer SMS</Text>
                    </View>
                    
                    <Text style={styles.modalSubtext}>
                        Please ask the customer for their mobile number to send their E-Receipt.
                    </Text>

                    {/* Phone Number Input */}
                    <View style={[styles.inputContainer, isValidNumber && styles.inputContainerValid]}>
                        <Ionicons name="phone-portrait-outline" size={22} color={isValidNumber ? "#007AFF" : "#8E8E93"} style={styles.inputIcon} />
                        
                        {/* Static +63 Prefix */}
                        <Text style={styles.prefixText}>+63</Text>
                        
                        <TextInput
                            style={styles.phoneInput}
                            value={localNumber}
                            onChangeText={(text) => setLocalNumber(text.replace(/[^0-9]/g, ''))} // Restrict to numbers only
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholder="912 345 6789"
                            placeholderTextColor="#C7C7CC"
                            autoFocus={true}
                        />
                        
                        {/* Validation Checkmark */}
                        {isValidNumber && (
                            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                        )}
                    </View>

                    {/* Submit Button (Full Width, replaces the row) */}
                    <TouchableOpacity 
                        style={[
                            styles.submitButton, 
                            isValidNumber ? styles.submitButtonActive : styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!isValidNumber}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitButtonText}>Send SMS & Complete</Text>
                        <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                    
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    smsModalContent: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24, // Account for safe area
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    headerIcon: {
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 0.5,
    },
    modalSubtext: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#F8F8F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
    },
    inputContainerValid: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F8FF',
    },
    inputIcon: {
        marginRight: 10,
    },
    prefixText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        height: '100%',
        fontSize: 18,
        color: '#1C1C1E',
        fontWeight: '600',
        letterSpacing: 1.5,
    },
    submitButton: {
        flexDirection: 'row',
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonActive: {
        backgroundColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D1D6',
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});