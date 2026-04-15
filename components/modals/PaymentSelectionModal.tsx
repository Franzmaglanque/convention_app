import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value);
};

export type PaymentMethod = 'CASH' | 'GCASH' | 'PWALLET' | 'CREDIT_DEBIT_CARD' | 'HOME_CREDIT' | 'SHOPEE_PAY';

export interface PaymentDetails {
  method: PaymentMethod;
  amountPaid: number;
  referenceNumber?: string;
  cashReceived?: number;
  change?: number;
}

interface PaymentSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  balanceDue: number;
  onConfirmPayment: (details: PaymentDetails) => void;
}

const roundMoney = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

export default function PaymentSelectionModal({ 
  visible, 
  onClose, 
  balanceDue, 
  onConfirmPayment 
}: PaymentSelectionModalProps) {
  
  // --- STATE ---
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  // Form States
  const [inputAmount, setInputAmount] = useState(''); // Starts empty now!
  const [cashReceived, setCashReceived] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSelectedMethod(null);
      setInputAmount(''); // Starts empty
      setCashReceived('');
      setReferenceNo('');
    }
  }, [visible, balanceDue]);

  // --- CONFIG ---
  const paymentOptions = [
    { id: 'CASH', title: 'Cash', icon: 'cash-outline', color: '#34C759' },
    { id: 'GCASH', title: 'GCash', icon: 'phone-portrait-outline', color: '#007AFF' },
    { id: 'PWALLET', title: 'P-Wallet', icon: 'wallet-outline', color: '#FF9500' },
    { id: 'CREDIT_DEBIT_CARD', title: 'Credit / Debit Card', icon: 'card-outline', color: '#5856D6' },
    { id: 'HOME_CREDIT', title: 'Home Credit', icon: 'home-outline', color: '#FF2D55' },
    { id: 'SHOPEE_PAY', title: 'Shopee Pay', icon: 'bag-check-outline', color: '#FF3B30' },
  ];

  // --- HANDLERS ---
  const handleScanQR = (method: PaymentMethod) => {
    Alert.alert('Scanning...', 'Simulating QR scan and API decode...', [
      {
        text: 'Simulate Success', 
        onPress: () => {
          const mockDecodedRef = method === 'PWALLET' ? 'PWAL-987654321' : 'APRV-123456';
          setReferenceNo(mockDecodedRef);
        }
      }
    ]);
  };

  const handleConfirm = () => {
    if (!selectedMethod) return;

    const amount = roundMoney(parseFloat(inputAmount) || 0);

    // Prevent submitting 0 amount
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }
    
    if (selectedMethod === 'CASH') {
      const received = roundMoney(parseFloat(cashReceived) || 0);
      if (received < amount) {
        Alert.alert('Invalid Amount', 'Cash received cannot be less than the amount to pay.');
        return;
      }
      onConfirmPayment({
        method: selectedMethod,
        amountPaid: amount,
        cashReceived: received,
        change: roundMoney(received - amount)
      });
    } else {
      if (!referenceNo && (selectedMethod === 'PWALLET' || selectedMethod === 'CREDIT_DEBIT_CARD')) {
        Alert.alert('Missing Info', 'Please provide a reference or approval code.');
        return;
      }
      onConfirmPayment({
        method: selectedMethod,
        amountPaid: amount,
        referenceNumber: referenceNo
      });
    }
  };

  // --- RENDERERS ---
  const renderMethodList = () => (
    <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
      {paymentOptions.map((option) => (
        <TouchableOpacity 
          key={option.id} 
          style={styles.paymentRow}
          onPress={() => {
            setSelectedMethod(option.id as PaymentMethod);
            setInputAmount(''); // Reset to empty when method selected
          }}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
            <Ionicons name={option.icon as any} size={24} color={option.color} />
          </View>
          <Text style={styles.paymentTitle}>{option.title}</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // Helper function to render the reusable "Amount to Pay" row with the auto-fill button
  const renderAmountInputSection = () => (
    <>
      <View style={styles.amountHeaderRow}>
        <Text style={styles.inputLabelClean}>Amount to Pay</Text>
        <TouchableOpacity onPress={() => setInputAmount(roundMoney(balanceDue).toString())}>
          <Text style={styles.fillBalanceText}>Pay Full: {formatCurrency(balanceDue)}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.textInput}
        keyboardType="decimal-pad"
        value={inputAmount}
        onChangeText={setInputAmount}
        placeholder="0.00"
        autoFocus
      />
    </>
  );

  const renderPaymentForm = () => {
    const numericCashReceived = parseFloat(cashReceived) || 0;
    const numericAmountToPay = parseFloat(inputAmount) || 0;
    const change = roundMoney(numericCashReceived - numericAmountToPay);

    return (
      <View style={styles.formContainer}>
        {/* CASH FORM */}
        {selectedMethod === 'CASH' && (
          <>
            {renderAmountInputSection()}

            <Text style={styles.inputLabel}>Cash Received</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={cashReceived}
              onChangeText={setCashReceived}
            />

            <View style={styles.staticAmountRow}>
              <Text style={styles.inputLabel}>Change</Text>
              <Text style={[styles.staticAmountValue, { color: change >= 0 ? '#34C759' : '#FF3B30' }]}>
                {change >= 0 ? formatCurrency(change) : '₱0.00'}
              </Text>
            </View>
          </>
        )}

        {/* PWALLET FORM */}
        {selectedMethod === 'PWALLET' && (
          <>
            {renderAmountInputSection()}

            <Text style={styles.inputLabel}>PWallet Reference Number</Text>
            <View style={styles.rowInput}>
              <TextInput
                style={[styles.textInput, styles.flexInput, styles.disabledInput]}
                placeholder="Scan QR to decode..."
                value={referenceNo}
                editable={false} 
              />
              <TouchableOpacity style={styles.scanButton} onPress={() => handleScanQR('PWALLET')}>
                <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* CREDIT CARD FORM */}
        {selectedMethod === 'CREDIT_DEBIT_CARD' && (
          <>
            {renderAmountInputSection()}

            <Text style={styles.inputLabel}>Approval Code</Text>
            <View style={styles.rowInput}>
              <TextInput
                style={[styles.textInput, styles.flexInput]}
                placeholder="Enter or scan code"
                value={referenceNo}
                onChangeText={setReferenceNo}
              />
              <TouchableOpacity style={styles.scanButton} onPress={() => handleScanQR('CREDIT_DEBIT_CARD')}>
                <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* GCASH / HOME CREDIT / SHOPEE PAY */}
        {['GCASH', 'HOME_CREDIT', 'SHOPEE_PAY'].includes(selectedMethod || '') && (
          <>
             {renderAmountInputSection()}

             <Text style={styles.inputLabel}>Reference Number</Text>
             <TextInput
               style={styles.textInput}
               placeholder="Enter reference number"
               value={referenceNo}
               onChangeText={setReferenceNo}
             />
          </>
        )}

        {/* CONFIRM BUTTON */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSheetOverlay}
      >
        <View style={styles.bottomSheetContent}>
          
          <View style={styles.sheetHeader}>
            {selectedMethod ? (
              <TouchableOpacity onPress={() => setSelectedMethod(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
            ) : <View style={{ width: 24 }} />}

            <Text style={styles.sheetTitle}>
              {selectedMethod ? `Process ${paymentOptions.find(o => o.id === selectedMethod)?.title}` : 'Select Payment'}
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          {!selectedMethod && (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Amount Due</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balanceDue)}</Text>
            </View>
          )}

          {selectedMethod ? renderPaymentForm() : renderMethodList()}

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  backButton: { padding: 4, marginLeft: -4 },
  
  balanceContainer: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#F8F8F9', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  balanceLabel: { fontSize: 14, color: '#8E8E93', fontWeight: '500', marginBottom: 4 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#1C1C1E' },
  
  sheetList: { paddingHorizontal: 16, paddingTop: 16 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  paymentTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  
  // Form Styles
  formContainer: { padding: 20 },
  
  // New Styles for the Amount Header Row
  amountHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 16 },
  inputLabelClean: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  fillBalanceText: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: '#F2F2F7', borderRadius: 10, padding: 16, fontSize: 18, color: '#1C1C1E', fontWeight: '500' },
  disabledInput: { color: '#8E8E93', backgroundColor: '#E5E5EA' },
  rowInput: { flexDirection: 'row', gap: 12 },
  flexInput: { flex: 1 },
  scanButton: { backgroundColor: '#007AFF', borderRadius: 10, width: 56, alignItems: 'center', justifyContent: 'center' },
  
  staticAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 16 },
  staticAmountValue: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },

  confirmButton: { backgroundColor: '#34C759', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});