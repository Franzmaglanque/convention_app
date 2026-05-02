import LoadPaymentSelectionModal from '@/components/modals/LoadPaymentSelectionModal';
import { useToast } from '@/components/ToastProvider';
import { useFetchDataPromos, useFetchTelcos, useProcessLoadSelling } from '@/hooks/useLoad';
import { useProcessPayment, usePwalletDebit, useSaveCashPayment, useSaveCreditCardPayment, useSkyroPayment } from '@/hooks/usePayment';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

type LoadType = 'COMMERCIAL' | 'DATA' | 'REGULAR' | null;
type TelcoNetwork = {
  id: string | number;
  telco: string;
};

type DataPromo = {
  command: string;
  description: string;
  amount: number;
};

export default function LoadScreen() {
    const [mobileNumber, setMobileNumber] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { showSuccess, showError, showInfo } = useToast();
    
    const [loadType, setLoadType] = useState<LoadType>(null);
    
    // ✨ CHANGED: Replaced selectedPreset with commercialAmount
    const [commercialAmount, setCommercialAmount] = useState('');
    const [selectedNetwork, setSelectedNetwork] = useState<TelcoNetwork | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [selectedPromo, setSelectedPromo] = useState<DataPromo | null>(null);

    const pwalletDebitMutation = usePwalletDebit();
    const cashPaymentMutation = useSaveCashPayment();
    const creditCardPaymentMutation = useSaveCreditCardPayment();
    const processPaymentMutation = useProcessPayment();
    const skyroPaymentMutation = useSkyroPayment();
    const processLoadSellingMutation = useProcessLoadSelling();

    const {
        data: telcos,
        isLoading,
        isError,
    } = useFetchTelcos(loadType === 'DATA');

    const {
        data: promosRes,
        isLoading: isPromosLoading,
        isError: isPromosError
    } = useFetchDataPromos(selectedNetwork?.telco!);

    const isFormValid = () => {
        if (mobileNumber.length < 10) return false;
        // ✨ CHANGED: Validate the new commercialAmount input
        if (loadType === 'COMMERCIAL' && (!commercialAmount || isNaN(Number(commercialAmount)))) return false;
        if (loadType === 'DATA' && (!selectedNetwork || !selectedPromo)) return false;
        if (loadType === 'REGULAR' && (!customAmount || isNaN(Number(customAmount)))) return false;
        return true;
    };

    const handleLoadTypeChange = (type: LoadType) => {
        setLoadType(type);
        // ✨ CHANGED: Reset the new commercialAmount
        setCommercialAmount('');
        setSelectedNetwork(null);
        setCustomAmount('');
        setSelectedPromo(null);
    };

    const handleConfirmPayment = async(payment_details: any) => {
      // ✨ CHANGED: Calculate amount based on commercialAmount input
      const amount = 
        loadType === 'COMMERCIAL' ? Number(commercialAmount) : 
        loadType === 'DATA' ? selectedPromo?.amount : 
        loadType === 'REGULAR' ? Number(customAmount) : 0;

      try {
        const orderNo = await processLoadSellingMutation.mutateAsync({
          load_type: loadType,
          mobile_number: mobileNumber,
          network: selectedNetwork?.telco ?? null,
          promo: selectedPromo ?? null,
          amount: amount,
          sku: loadType === 'COMMERCIAL' ? '349315' : loadType === 'REGULAR' ? '322304' : null
        });

        if (!orderNo) throw new Error('Failed to retrieve order number from the server.');

        switch (payment_details.method){
          case 'PWALLET':
            await pwalletDebitMutation.mutateAsync({
              reference_no: payment_details?.referenceNumber ?? "",
              amount: Number(amount!),
              store_code: 801,
              order_no: orderNo.toString(),
              payment_method: payment_details.method
            });
            break;
          case 'CASH':
            await cashPaymentMutation.mutateAsync({
              cash_bill: payment_details.cashReceived.toString(),
              cash_change: payment_details.change.toString(),
              amount: Number(amount!),
              payment_method: payment_details.method,
              order_no: orderNo.toString(),
            });
            break;
          case 'CREDIT_DEBIT_CARD':
            await creditCardPaymentMutation.mutateAsync({
              amount: amount!,
              payment_method: payment_details.method,
              order_no: orderNo.toString(),
              reference_no: payment_details.referenceNumber!,
              qr_code_data: payment_details.ccQrData,
              terminal_type: payment_details.terminalType,
              card_type: payment_details.cardType ?? null,
            });
            break;
          case 'GCASH':
          case 'SHOPEE_PAY':
          case 'HOME_CREDIT':
            await processPaymentMutation.mutateAsync({
              order_no: orderNo.toString(),
              payment_method: payment_details.method,
              amount: amount!,
              reference_no: payment_details.referenceNumber!
            });
            break;
          case 'SKYRO':
            await skyroPaymentMutation.mutateAsync({
              amount: amount!,
              payment_method: payment_details.method,
              order_no: orderNo.toString(),
              reference_no: payment_details.referenceNumber!
            });
            break;
        }

        setShowPaymentModal(false);
        handleLoadTypeChange(null); // Resets all states
        setMobileNumber('');
        showSuccess(`Payment of ₱${amount} added`);
        
      } catch (error: any) {
        setShowPaymentModal(false);
        showError(error.message || `${payment_details.method} Payment Failed.`);
      }
    };

    const isProcessingPayment = 
      cashPaymentMutation.isPending || 
      creditCardPaymentMutation.isPending || 
      pwalletDebitMutation.isPending || 
      processPaymentMutation.isPending ||
      skyroPaymentMutation.isPending ||
      processLoadSellingMutation.isPending;

    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            
            {/* 1. Mobile Number Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Customer Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#8E8E93" />
                <Text style={styles.staticPrefix}>+63</Text>
                <TextInput
                  style={styles.input}
                  placeholder="917 123 4567" 
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={10} 
                  value={mobileNumber}
                  onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            {/* 2. Load Type Selection */}
            <View style={styles.section}>
            <Text style={styles.label}>Select Load Type</Text>
            <View style={styles.typeContainer}>
                {(['COMMERCIAL', 'DATA', 'REGULAR'] as LoadType[]).map((type) => (
                  <Pressable 
                    key={type}
                    style={({ pressed }) => [
                      styles.typeCard, 
                      loadType === type && styles.activeCardStyle,
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => handleLoadTypeChange(type)}
                  >
                    <Ionicons 
                      name={type === 'COMMERCIAL' ? 'briefcase-outline' : type === 'DATA' ? 'wifi-outline' : 'phone-portrait-outline'} 
                      size={24} 
                      color={loadType === type ? '#0066cc' : '#666'} 
                    />
                    <Text style={[styles.typeText, loadType === type && styles.activeTextHeavy]}>
                      {type === 'COMMERCIAL' ? 'Commercial' : type === 'DATA' ? 'Data Load' : 'Regular'}
                    </Text>
                  </Pressable>
                ))}
            </View>
            </View>

            {/* 3. Conditional Rendering based on Load Type */}
            
            {/* ✨ CHANGED: Commercial is now an input field instead of a preset grid */}
            {loadType === 'COMMERCIAL' && (
            <View style={styles.section}>
                <Text style={styles.label}>Enter Commercial Amount (₱)</Text>
                <View style={styles.inputWrapper}>
                <Ionicons name="briefcase-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 1500"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    value={commercialAmount}
                    onChangeText={setCommercialAmount}
                />
                </View>
            </View>
            )}

            {loadType === 'DATA' && (
              <View style={styles.section}>
                <Text style={styles.label}>Select Network Provider</Text>
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#0066cc" />
                        <Text style={styles.loaderText}>Loading networks...</Text>
                    </View>
                ) : isError ? (
                    <View style={styles.loaderContainer}>
                        <Text style={{ color: '#E53935' }}>Failed to load networks.</Text>
                    </View>
                ) : (
                    <View style={styles.networkContainer}>
                        {telcos.data.map((network: any) => (
                        <Pressable
                            key={network.telco}
                            style={({ pressed }) => [
                                styles.networkCard, 
                                selectedNetwork?.telco === network.telco && styles.activeCardStyle,
                                pressed && { opacity: 0.7 }
                            ]}
                            onPress={() => setSelectedNetwork(network)}
                        >
                            <Text style={[
                                styles.networkCardText, 
                                selectedNetwork?.telco === network.telco && styles.activeTextHeavy
                            ]}>
                            {network.telco}
                            </Text>
                        </Pressable>
                        ))}
                    </View>
                )}
              </View>
            )}

            {/* Promo List Section */}
            {loadType === 'DATA' && selectedNetwork && (
                <View style={styles.section}>
                    <Text style={styles.label}>Select Promo Data</Text>
                    {isPromosLoading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#0066cc" />
                            <Text style={styles.loaderText}>Fetching promos for {selectedNetwork.telco}...</Text>
                        </View>
                    ) : isPromosError ? (
                        <View style={styles.loaderContainer}>
                          <Text style={{ color: '#E53935' }}>Failed to fetch promos.</Text>
                        </View>
                    ) : (
                        <ScrollView 
                            style={styles.promoListScroll}
                            contentContainerStyle={styles.promoListContent}
                            nestedScrollEnabled={true} 
                            showsVerticalScrollIndicator={true} 
                            indicatorStyle="black" 
                        >
                            {promosRes?.data?.map((promo: DataPromo) => {
                                const isActive = selectedPromo?.command === promo.command;
                                
                                return (
                                <Pressable
                                    key={promo.command}
                                    style={({ pressed }) => [
                                      styles.promoCard, 
                                      isActive && styles.activeCardStyle,
                                      pressed && { transform: [{ scale: 0.98 }] } 
                                    ]}
                                    onPress={() => setSelectedPromo(promo)}
                                >
                                    <View style={styles.promoHeader}>
                                        <View style={styles.promoTitleWrapper}>
                                            {isActive && (
                                                <Ionicons name="checkmark-circle" size={20} color="#0066cc" style={{ marginRight: 6 }} />
                                            )}
                                            <Text 
                                              style={[styles.promoTitle, isActive && styles.activeTextHeavy]}
                                              numberOfLines={1}
                                            >
                                                {promo.command}
                                            </Text>
                                        </View>
                                        
                                        <View style={[styles.priceBadge, isActive && styles.activePriceBadge]}>
                                            <Text style={[styles.promoPrice, isActive && styles.activePriceText]}>
                                                ₱{promo.amount}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.promoDesc, isActive && styles.activePromoDesc]}>
                                        {promo.description}
                                    </Text>
                                </Pressable>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            )}

            {loadType === 'REGULAR' && (
            <View style={styles.section}>
                <Text style={styles.label}>Enter Load Amount (₱)</Text>
                <View style={styles.inputWrapper}>
                <Ionicons name="cash-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 50"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    value={customAmount}
                    onChangeText={setCustomAmount}
                />
                </View>
            </View>
            )}

            {/* 4. Payment Button */}
            <View style={styles.footer}>
            <Pressable 
                style={({ pressed }) => [
                  styles.paymentButton, 
                  !isFormValid() && styles.paymentButtonDisabled,
                  pressed && isFormValid() && { opacity: 0.8 }
                ]}
                disabled={!isFormValid()}
                onPress={() => setShowPaymentModal(true)}
            >
                <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
            </View>
            
            <LoadPaymentSelectionModal
              visible={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              // ✨ CHANGED: Pass the correct amount based on current loadType
              amount={
                loadType === 'COMMERCIAL' ? Number(commercialAmount) : 
                (selectedPromo ? selectedPromo.amount : Number(customAmount))
              }
              onConfirmPayment={handleConfirmPayment}
              isProcessing={isProcessingPayment}
            />
        </ScrollView>
      </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, 
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14, 
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
  },
  activeCardStyle: {
    borderColor: '#0066cc',
    backgroundColor: '#e6f0fa',
  },
  activeTextHeavy: {
    color: '#0066cc',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  staticPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    paddingRight: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 18, 
    fontWeight: '500',
    color: '#1C1C1E'
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5, 
    borderColor: '#E5E5EA',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  typeText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%', 
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  gridItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  promoListContainer: {
    gap: 12,
  },
  promoCard: {
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    flexShrink: 1,
  },
  promoPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  promoDesc: {
    fontSize: 13,
    color: '#8E8E93', 
    lineHeight: 18,
  },
  footer: {
    marginTop: 8,
  },
  paymentButton: {
    backgroundColor: '#0066cc',
    flexDirection: 'row',
    height: 60, 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  paymentButtonDisabled: {
    backgroundColor: '#D1D1D6',
    shadowOpacity: 0,
    elevation: 0,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loaderContainer: {
    padding: 30, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  loaderText: {
    marginTop: 12, 
    color: '#8E8E93', 
    fontSize: 14,
    fontWeight: '500'
  },
  networkContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', 
    gap: 8,
  },
  networkCard: {
    width: '31.5%', 
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  networkCardText: {
    fontSize: 14, 
    fontWeight: '700',
    color: '#333',
  },
  promoTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12, 
  },
  priceBadge: {
    backgroundColor: '#F2F2F7', 
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePriceBadge: {
    backgroundColor: '#0066cc', 
  },
  activePriceText: {
    color: '#ffffff', 
  },
  activePromoDesc: {
    color: '#004a99', 
  },
  promoListScroll: {
    maxHeight: 280, 
    marginTop: 4,
    borderRadius: 12, 
  },
  promoListContent: {
    gap: 12,
    paddingRight: 6, 
    paddingBottom: 8, 
  },
});