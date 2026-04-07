import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// If you are using React Navigation, you can pass the vendorCode through route.params
// For this example, we'll accept it as a prop.
interface VendorQRScreenProps {
  vendorCode?: string; 
  onClose?: () => void;
}

export default function VendorQRScreen({ vendorCode = "11460", onClose }: VendorQRScreenProps) {
  
  return (
    <SafeAreaView style={styles.container}>
      
      {/* Main Centered Content */}
      <View style={styles.centerWrapper}>
        
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Ionicons name="storefront" size={40} color="#007AFF" style={styles.icon} />
          <Text style={styles.title}>Vendor ID</Text>
          <Text style={styles.subtitle}>Scan this code to identify this terminal.</Text>
        </View>

        {/* The QR Code Card */}
        <View style={styles.qrCard}>
          <QRCode
            value={vendorCode}
            size={220}
            color="#1C1C1E"
            backgroundColor="#FFFFFF"
            // Optional: You can even put your logo in the middle of the QR!
            // logo={require('../assets/your-logo.png')}
            // logoSize={50}
            // logoBackgroundColor="white"
          />
          
          <View style={styles.divider} />
          
          {/* Display the raw code below the QR */}
          <Text style={styles.vendorCodeText}>Code: <Text style={styles.vendorCodeHighlight}>{vendorCode}</Text></Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS light gray background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60, // Slight offset to visually center it better
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    // ✨ iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    // ✨ Android Elevation
    elevation: 10, 
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    width: '100%',
    marginTop: 32,
    marginBottom: 20,
  },
  vendorCodeText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  vendorCodeHighlight: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: 1,
  }
});