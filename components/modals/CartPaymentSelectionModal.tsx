import { CardType, TerminalType } from '@/app/(tabs)/cart';
import { useScanPwalletQr } from '@/hooks/usePayment';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import BarcodeScanner from '../BarcodeScanner';

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
  ccQrData?: string;
  // ✨ NEW: Add the new fields
  terminalType?: TerminalType;
  cardType?: CardType;
}

interface PaymentSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  balanceDue: number;
  onConfirmPayment: (details: PaymentDetails) => void;
  isProcessing: boolean; // ✨ NEW: Tell the modal when the API is running
}

const roundMoney = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

export default function PaymentSelectionModal({ 
  visible, 
  onClose, 
  balanceDue, 
  onConfirmPayment,
  isProcessing
}: PaymentSelectionModalProps) {
  
  // --- STATE ---
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentScanner, setPaymentScanner] = useState(false);
  const [ccQrData, setCcQrData] = useState('');
  // ✨ NEW: Credit Card Sub-flow States
  const [terminalType, setTerminalType] = useState<TerminalType | null>(null);
  const [cardType, setCardType] = useState<CardType | null>(null);
  
  // ✨ UPDATE: Reset the sub-states when changing methods
  // const handleMethodSelect = (method: PaymentMethod) => {
  //   setSelectedMethod(method);
  //   setAmountPaid(balanceDue.toString());
  //   setReferenceNumber('');
  //   setCashReceived('');
  //   setChange(0);
  //   setCcQrData('');
  //   // Reset terminal choices
  //   setTerminalType(null);
  //   setCardType(null);
  // };

  // Form States
  const [inputAmount, setInputAmount] = useState(''); // Starts empty now!
  const [cashReceived, setCashReceived] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  const scanPwalletQrMutation = useScanPwalletQr();
  

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
    { id: 'PWALLET', title: 'PWallet', icon: 'wallet-outline', color: '#FF9500' },
    { id: 'CREDIT_DEBIT_CARD', title: 'Credit / Debit Card', icon: 'card-outline', color: '#5856D6' },
    { id: 'HOME_CREDIT', title: 'Home Credit', icon: 'home-outline', color: '#FF2D55' },
    { id: 'SHOPEE_PAY', title: 'Shopee Pay', icon: 'bag-check-outline', color: '#FF3B30' },
    { id: 'SKYRO', title: 'Skyro', icon: 'wallet-outline', color: '#007AFF' },
  ];

  const handleConfirm = () => {
    if (!selectedMethod) return;
    console.log('Confirming payment with method:', selectedMethod);
    const amount = roundMoney(parseFloat(inputAmount) || 0);

    // Prevent submitting 0 amount
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }
      const received = roundMoney(parseFloat(cashReceived) || 0);
    if (selectedMethod === 'CASH') {
    
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
        amountPaid: Number(amount),
        referenceNumber: referenceNo,
        cashReceived: Number(cashReceived),
        change: roundMoney(received - amount),
        ccQrData: ccQrData,
        terminalType:terminalType ?? undefined,
        cardType:cardType ?? undefined
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
        {['PWALLET','GCASH','SHOPEE_PAY','HOME_CREDIT'].includes(selectedMethod || '') && (
          <>
            <Text style={styles.inputLabel}>{selectedMethod} Reference Number</Text>
            <View style={styles.rowInput}>
              <TextInput
                style={[styles.textInput, styles.flexInput, styles.disabledInput]}
                placeholder="Scan QR to decode..."
                value={referenceNo}
                editable={false} 
              />
              <TouchableOpacity style={styles.scanButton} onPress={() =>setPaymentScanner(true)}>
                <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {renderAmountInputSection()}
          </>
        )}

        {/* CREDIT CARD FORM */}
        {selectedMethod === 'CREDIT_DEBIT_CARD' && (
          <>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>Select Terminal Used</Text>
              <View style={styles.rowInput}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, terminalType === 'GCASH' && styles.toggleBtnActive]}
                  onPress={() => {
                      setTerminalType('GCASH');
                      setCardType(null); // Clear card type if they switch back to GCash
                  }}
                >
                  <Text style={[styles.toggleBtnText, terminalType === 'GCASH' && styles.toggleBtnTextActive]}>GCash Terminal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.toggleBtn, terminalType === 'TANGENT' && styles.toggleBtnActive]}
                  onPress={() => setTerminalType('TANGENT')}
                >
                  <Text style={[styles.toggleBtnText, terminalType === 'TANGENT' && styles.toggleBtnTextActive]}>Tangent Terminal</Text>
                </TouchableOpacity>
              </View>
            </View>
            {terminalType === 'TANGENT' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputLabel}>Select Card Type</Text>
                <View style={styles.rowInput}>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, cardType === 'CREDIT' && styles.toggleBtnActive]}
                    onPress={() => setCardType('CREDIT')}
                  >
                    <Text style={[styles.toggleBtnText, cardType === 'CREDIT' && styles.toggleBtnTextActive]}>Credit Card</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.toggleBtn, cardType === 'DEBIT' && styles.toggleBtnActive]}
                    onPress={() => setCardType('DEBIT')}
                  >
                    <Text style={[styles.toggleBtnText, cardType === 'DEBIT' && styles.toggleBtnTextActive]}>Debit Card</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            { (terminalType === 'GCASH' || (terminalType === 'TANGENT' && cardType !== null)) && (
              <>
                <Text style={styles.inputLabel}>Approval Code</Text>
                <View style={styles.rowInput}>
                  <TextInput
                    style={[styles.textInput, styles.flexInput]}
                    placeholder="Enter or scan code"
                    value={referenceNo}
                    onChangeText={setReferenceNo}
                  />
                  <TouchableOpacity style={styles.scanButton} onPress={() => setPaymentScanner(true)}>
                    <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {renderAmountInputSection()}
              </>
            )}
          </>
        )}

        {/* GCASH / HOME CREDIT / SHOPEE PAY */}
        {['SKYRO'].includes(selectedMethod || '') && (
          <>
            <Text style={styles.inputLabel}>Reference Number</Text>
             <TextInput
               style={styles.textInput}
               placeholder="Enter reference number"
               value={referenceNo}
               onChangeText={setReferenceNo}
             />
             {renderAmountInputSection()}

             
          </>
        )}

        {/* CONFIRM BUTTON */}
        <TouchableOpacity 
            style={[
              styles.confirmButton, 
              // Add isProcessing to the disabled style check
              isProcessing && styles.confirmButtonDisabled
            ]} 
            onPress={handleConfirm}
            // Actually disable the button physically
            disabled={isProcessing}
          >
            {/* Show the spinner if processing, otherwise show text */}
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Payment</Text>
            )}
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm Payment</Text>
        </TouchableOpacity> */}
      </View>
    );
  };

  const handlePaymentScanned = async (paymentData: string) => {

    switch (selectedMethod) {
      case 'CREDIT_DEBIT_CARD':
        try {
          const dataPart = paymentData.split('|');
          if (dataPart.length >= 5) {
            setCcQrData(paymentData); // Save the raw string
            setReferenceNo(dataPart[3]); // Set Ref Number
            setInputAmount(dataPart[4]); // Set Amount
            setPaymentScanner(false);
          } else {
            Alert.alert('Error', 'Invalid Credit Card QR format');
            setPaymentScanner(false);
          }
        } catch (error) {
          Alert.alert('Error', 'Credit Card Scan Failed.');
          setPaymentScanner(false);
        }
        break;

      case 'GCASH':
        try {
          setReferenceNo(paymentData);
          setPaymentScanner(false);
          // console.log('paymentData',paymentData);
        } catch (error) {
          Alert.alert('Error', 'GCash Scan Failed.');
          setPaymentScanner(false);
        }
        break;

      case 'PWALLET':
        try {
          await scanPwalletQrMutation.mutate({
                  QrCode: paymentData,
            },{
              onSuccess: (response) => {
                setReferenceNo((response.data.reference_no).toString()); 
                setPaymentScanner(false);
                setPaymentScanner(false);
              },
              onError: () => {
                setPaymentScanner(false);
                Alert.alert('Error', 'IInvalid Pwallet Qr Code');
              },
              onSettled: () => {
            
              }
          });
        } catch (error) {
           Alert.alert('Error', 'Pwallet Scan Failed.');
           setPaymentScanner(false);
        }
        break;

      case 'SHOPEE_PAY':
        try {
          setReferenceNo(paymentData);
          setPaymentScanner(false);
          setReferenceNo(paymentData);
        } catch (error) {
           Alert.alert('Error', 'Shopee Pay Scan Failed.');
           setPaymentScanner(false);
        }
        break;

      case 'HOME_CREDIT':
        try {
          setReferenceNo(paymentData);
          setPaymentScanner(false);
          setReferenceNo(paymentData);
        } catch (error) {
           Alert.alert('Error', 'Home Credit Scan Failed.');
           setPaymentScanner(false);
        }
        break;
    }
  };

  return (
    <>
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
      <BarcodeScanner
        isVisible={paymentScanner}
        onBarcodeScanned={handlePaymentScanned}
        onClose={() => setPaymentScanner(false)}
        scanDelay={1000}
      />

    </>
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
  confirmButtonDisabled: {
    backgroundColor: '#E5E5EA', // iOS system gray
    opacity: 0.7,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  toggleBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toggleBtnText: {
    color: '#8E8E93',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
});