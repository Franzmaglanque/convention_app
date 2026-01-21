import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Button, 
  TouchableOpacity,
  Modal,
  ActivityIndicator 
} from 'react-native';
import { 
  CameraView, 
  CameraType, 
  useCameraPermissions,
  BarcodeScanningResult 
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ToastProvider';

interface BarcodeScannerProps {
  isVisible: boolean;
  onBarcodeScanned: (barcodeData: string) => void;
  onClose: () => void;
  scanDelay?: number;
}

export default function BarcodeScanner({ 
  isVisible, 
  onBarcodeScanned, 
  onClose,
  scanDelay = 1500 
}: BarcodeScannerProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const { showError } = useToast();

  // Request permissions when component mounts
  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission();
    }
  }, [isVisible]);

  const handleBarcodeScanned = ({ data, type }: BarcodeScanningResult) => {
    if (!scanned && data) {
      setScanned(true);
      console.log(`Scanned barcode: ${data} (type: ${type})`);
      
      // Pass the scanned data to parent component
      onBarcodeScanned(data);
      
      // Reset scanner after delay to allow next scan
      setTimeout(() => setScanned(false), scanDelay);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCameraReady = () => {
    setIsLoading(false);
  };

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    showError('Camera failed to load. Please try again.');
    setIsLoading(false);
  };

  if (!permission) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.permissionText}>Checking camera permissions...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={styles.centerContainer}>
          {/* FIXED: Using valid Ionicons name */}
          <Ionicons name="camera" size={64} color="#8E8E93" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Convention POS needs camera access to scan product barcodes for inventory management.
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Grant Camera Permission" onPress={requestPermission} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Initializing camera...</Text>
          </View>
        )}
        
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          onCameraReady={handleCameraReady}
          onMountError={handleCameraError}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr', 'pdf417', 'aztec', 'code39', 'code93', 
              'code128', 'codabar', 'ean13', 'ean8', 
              'upc_a', 'upc_e', 'itf14'
            ],
          }}
          ref={cameraRef}
        >
          <View style={styles.overlay}>
            {/* Scanner frame overlay */}
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <Text style={styles.scannerText}>
              {scanned ? 'Processing...' : 'Align barcode within frame'}
            </Text>
          </View>
        </CameraView>

        <View style={styles.controls}>
          {/* FIXED: Using valid Ionicons name */}
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Flip</Text>
          </TouchableOpacity>
          
          {/* FIXED: Using valid Ionicons name */}
          <TouchableOpacity style={styles.closeControlButton} onPress={onClose}>
            <Ionicons name="close-circle" size={48} color="#FF3B30" />
            <Text style={styles.closeControlButtonText}>Close</Text>
          </TouchableOpacity>
          
          <View style={styles.controlInfo}>
            <Text style={styles.infoText}>
              Scan product barcodes (EAN-13, UPC, QR)
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    marginBottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#007AFF',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 5,
  },
  closeControlButton: {
    alignItems: 'center',
    padding: 10,
  },
  closeControlButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
  },
  controlInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  infoText: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F2F2F7',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#3C3C43',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});