import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import BarcodeScanner from '../../components/BarcodeScanner';
import { useMessageToast } from '../../hooks/useMessageToast';
import MessageToastExample from '@/components/MessageToastExample';

export default function CartScreen() {
  const [showScanner, setShowScanner] = useState(false);
  const { showSuccess, showError, showInfo } = useMessageToast();

  const handleBarcodeScanned = async (barcodeData: string) => {
    try {
 
      
      // 1. Look up product in your backend
      // const product = await storesService.findProductByBarcode(barcodeData);
      
      // 2. Add to cart logic here
      // addToCart(product);
      
      console.log(`scanned: ${barcodeData}`);
      setShowScanner(false); // Close scanner after successful scan
    } catch (error) {
      showError('Product not found. Try manual entry.');
      // Keep scanner open for retry
    }
  };

  return (
    <View style={styles.container}>

      <MessageToastExample />
      {/* Your existing cart UI */}
      <View style={styles.cartContent}>
        {/* Cart items list */}
      </View>

     {/* Scan Button */}
      <View style={styles.scanButtonContainer}>
        <Button 
          title="Scan Product Barcode" 
          onPress={() => setShowScanner(true)}
          color="#007AFF"
        />
      </View>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner 
        isVisible={showScanner}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
        scanDelay={1000}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cartContent: { flex: 1, padding: 16 },
  scanButtonContainer: { 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E5EA' 
  },
});