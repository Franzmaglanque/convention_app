import { useFetchDataPromos, useFetchTelcos } from '@/hooks/useLoad';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type LoadType = 'COMMERCIAL' | 'DATA' | 'REGULAR' | null;
type TelcoNetwork = {
  id: string | number;
  telco: string;
};

// 1. Define the Promo Type
type DataPromo = {
  command: string;
  description: string;
  amount: number;
};

export default function LoadScreen() {
    const [mobileNumber, setMobileNumber] = useState('');
    const [loadType, setLoadType] = useState<LoadType>(null);
    
    // Conditional States
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    // const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<TelcoNetwork | null>(null);
    const [customAmount, setCustomAmount] = useState('');

    const [selectedPromo, setSelectedPromo] = useState<DataPromo | null>(null);

    const COMMERCIAL_PRESETS = [500, 1000, 1500, 2000];
    const NETWORK_PROVIDERS = ['Globe', 'TM', 'GOMO'];


    const {
        data: telcos,
        isLoading,
        isError,
        refetch,
        isRefetching
    } = useFetchTelcos(loadType == 'DATA' ? true : false);

    // 3. Fetch Promos ONLY when a network is actually selected
    // Note: You need to create this hook in your useLoad.ts file!
    const {
        data: promosRes,
        isLoading: isPromosLoading,
        isError: isPromosError
    } = useFetchDataPromos(selectedNetwork?.telco!);

    // Check if form is ready for payment
    const isFormValid = () => {
        if (mobileNumber.length < 10) return false;
        if (loadType === 'COMMERCIAL' && !selectedPreset) return false;
        if (loadType === 'DATA' && (!selectedNetwork || !selectedPromo)) return false;
        if (loadType === 'REGULAR' && (!customAmount || isNaN(Number(customAmount)))) return false;
        return true;
    };

    const handlePayment = () => {
        // Collect the final data payload
        const payload = {
            mobileNumber,
            type: loadType,
            amount: loadType === 'COMMERCIAL' ? selectedPreset : loadType === 'REGULAR' ? Number(customAmount) : null,
            network: loadType === 'DATA' ? selectedNetwork : null,
        };
        
        console.log('Proceeding to payment with:', payload);
        Alert.alert('Success', 'Proceeding to Payment Screen...');
        // TODO: Navigate to your actual payment/checkout screen here
    };

    const handleLoadTypeChange = (type: LoadType) => {
        setLoadType(type);

        // Reset conditional states when changing load type
        setSelectedPreset(null);
        setSelectedNetwork(null);
        setCustomAmount('');
    };
    console.log('Telcos Data:', telcos);
    return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 1. Mobile Number Input (Always Visible) */}
        <View style={styles.section}>
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
            style={styles.input}
            placeholder="0917 123 4567"
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            maxLength={11}
            />
        </View>
        </View>

        {/* 2. Load Type Selection */}
        <View style={styles.section}>
        <Text style={styles.label}>Select Load Type</Text>
        <View style={styles.typeContainer}>
            <Pressable 
            style={[styles.typeCard, loadType === 'COMMERCIAL' && styles.typeCardActive]}
            onPress={() => handleLoadTypeChange('COMMERCIAL')}
            >
            <Ionicons name="briefcase-outline" size={24} color={loadType === 'COMMERCIAL' ? '#0066cc' : '#666'} />
            <Text style={[styles.typeText, loadType === 'COMMERCIAL' && styles.typeTextActive]}>Commercial</Text>
            </Pressable>

            <Pressable 
            style={[styles.typeCard, loadType === 'DATA' && styles.typeCardActive]}
            onPress={() => handleLoadTypeChange('DATA')}
            >
            <Ionicons name="wifi-outline" size={24} color={loadType === 'DATA' ? '#0066cc' : '#666'} />
            <Text style={[styles.typeText, loadType === 'DATA' && styles.typeTextActive]}>Data Load</Text>
            </Pressable>

            <Pressable 
            style={[styles.typeCard, loadType === 'REGULAR' && styles.typeCardActive]}
            onPress={() => handleLoadTypeChange('REGULAR')}
            >
            <Ionicons name="phone-portrait-outline" size={24} color={loadType === 'REGULAR' ? '#0066cc' : '#666'} />
            <Text style={[styles.typeText, loadType === 'REGULAR' && styles.typeTextActive]}>Regular</Text>
            </Pressable>
        </View>
        </View>

        {/* 3. Conditional Rendering based on Load Type */}
        {loadType === 'COMMERCIAL' && (
        <View style={styles.section}>
            <Text style={styles.label}>Select Preset Amount</Text>
            <View style={styles.gridContainer}>
            {COMMERCIAL_PRESETS.map((amount) => (
                <Pressable
                key={amount}
                style={[styles.gridItem, selectedPreset === amount && styles.gridItemActive]}
                onPress={() => setSelectedPreset(amount)}
                >
                <Text style={[styles.gridItemText, selectedPreset === amount && styles.gridItemTextActive]}>
                    ₱{amount}
                </Text>
                </Pressable>
            ))}
            </View>
        </View>
        )}

        {loadType === 'DATA' && (
        <View style={styles.section}>
            <Text style={styles.label}>Select Network Provider</Text>
            
            {/* Show Spinner if loading */}
            {isLoading ? (
            <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={{ marginTop: 10, color: '#666', fontSize: 14 }}>
                Loading networks...
                </Text>
            </View>
            ) : isError ? (
            /* Optional: Show error state if the fetch fails */
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: 'red' }}>Failed to load networks.</Text>
            </View>
            ) : (
            /* Show Grid when loading is done */
            <View style={styles.gridContainer}>
                {telcos.data.map((network: any) => (
                <Pressable
                    key={network.telco}
                    // Pro-tip: Compare IDs instead of the whole object to ensure the active style applies correctly!
                    style={[styles.gridItem, selectedNetwork?.telco === network.telco && styles.gridItemActive]}
                    onPress={() => setSelectedNetwork(network)}
                >
                    <Text style={[styles.gridItemText, selectedNetwork?.telco === network.telco && styles.gridItemTextActive]}>
                    {network.telco}
                    </Text>
                </Pressable>
                ))}
            </View>
            )}
        </View>
        )}

        {/* 5. NEW: Promo List Section (Only shows when Network is selected) */}
        {loadType === 'DATA' && selectedNetwork && (
            <View style={styles.section}>
                <Text style={styles.label}>Select Promo Data</Text>

                {isPromosLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#0066cc" />
                        <Text style={styles.loaderText}>Fetching promos for {selectedNetwork.telco}...</Text>
                    </View>
                ) : isPromosError ? (
                    <View style={styles.loaderContainer}><Text style={{ color: 'red' }}>Failed to fetch promos.</Text></View>
                ) : (
                    <View style={styles.promoListContainer}>
                        {promosRes?.data?.map((promo: DataPromo) => (
                            <Pressable
                                key={promo.command}
                                style={[styles.promoCard, selectedPromo?.command === promo.command && styles.promoCardActive]}
                                onPress={() => setSelectedPromo(promo)}
                            >
                                <View style={styles.promoHeader}>
                                    <Text style={[styles.promoTitle, selectedPromo?.command === promo.command && styles.promoTextActive]}>
                                        {promo.command}
                                    </Text>
                                    <Text style={[styles.promoPrice, selectedPromo?.command === promo.command && styles.promoTextActive]}>
                                        ₱{promo.amount}
                                    </Text>
                                </View>
                                <Text style={[styles.promoDesc, selectedPromo?.command === promo.command && styles.promoTextActive]}>
                                    {promo.description}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        )}

        {loadType === 'REGULAR' && (
        <View style={styles.section}>
            <Text style={styles.label}>Enter Load Amount (₱)</Text>
            <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder="e.g. 50"
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
            style={[styles.paymentButton, !isFormValid() && styles.paymentButtonDisabled]}
            disabled={!isFormValid()}
            onPress={handlePayment}
        >
            <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
        </View>

    </ScrollView>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  typeCardActive: {
    borderColor: '#0066cc',
    backgroundColor: '#e6f0fa',
  },
  typeText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  typeTextActive: {
    color: '#0066cc',
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  gridItemActive: {
    borderColor: '#0066cc',
    backgroundColor: '#0066cc',
  },
  gridItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gridItemTextActive: {
    color: '#fff',
  },
  footer: {
    marginTop: 8,
  },
  paymentButton: {
    backgroundColor: '#0066cc',
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paymentButtonDisabled: {
    backgroundColor: '#a0c4e8',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  

  // --- NEW STYLES FOR PROMO CARDS ---

  promoListContainer: {
    gap: 12,
  },
  promoCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  promoCardActive: {
    borderColor: '#0066cc',
    backgroundColor: '#e6f0fa',
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
    color: '#333',
    flex: 1,
  },
  promoPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    marginLeft: 12,
  },
  promoDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  promoTextActive: {
    color: '#005bb5',
  },
  loaderContainer: {
    padding: 20, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  loaderText: {
    marginTop: 10, 
    color: '#666', 
    fontSize: 14
  },
});