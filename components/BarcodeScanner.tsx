import { useToast } from '@/components/ToastProvider';
import { Ionicons } from '@expo/vector-icons';
import {
  BarcodeScanningResult,
  CameraType,
  CameraView,
  useCameraPermissions
} from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Dimensions,
  LayoutChangeEvent,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  const [frameLayout, setFrameLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Request permissions when component mounts
  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission();
    }
  }, [isVisible]);

  const onFrameLayout = (event: LayoutChangeEvent) => {
    // We need to calculate absolute coordinates relative to the screen
    // Since the frame is centered in an overlay, we estimate its position
    const { width, height } = event.nativeEvent.layout;
    const x = (screenWidth - width) / 2;
    const y = (screenHeight - height) / 2.5; // Matches 'justifyContent: center' offset
    setFrameLayout({ x, y, width, height });
  };

  // const handleBarcodeScanned = ({ data, type }: BarcodeScanningResult) => {
  //   if (!scanned && data) {
  //     setScanned(true);
  //     console.log(`Scanned barcode: ${data} (type: ${type})`);
      
  //     // Pass the scanned data to parent component
  //     onBarcodeScanned(data);
      
  //     // Reset scanner after delay to allow next scan
  //     setTimeout(() => setScanned(false), scanDelay);
  //   }
  // };
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    const { data, bounds } = result;

    if (!scanned && data && bounds) {
      const { origin, size } = bounds;
      
      // ✨ BOX CONSTRAINT LOGIC: 
      // Check if the center of the barcode is within our frameLayout
      const barcodeCenterX = origin.x + size.width / 2;
      const barcodeCenterY = origin.y + size.height / 2;

      const isInside = 
        barcodeCenterX >= frameLayout.x &&
        barcodeCenterX <= (frameLayout.x + frameLayout.width) &&
        barcodeCenterY >= frameLayout.y &&
        barcodeCenterY <= (frameLayout.y + frameLayout.height);

      if (isInside) {
        setScanned(true);
        onBarcodeScanned(data);
        setTimeout(() => setScanned(false), scanDelay);
      }
    }
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
            {/* <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <Text style={styles.scannerText}>
              {scanned ? 'Processing...' : 'Align barcode within frame'}
            </Text> */}
            <View style={styles.scannerFrame} onLayout={onFrameLayout}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* ✨ VISUAL FEEDBACK: A scanning line animation could go here */}
              <View style={styles.scanLine} />
            </View>
          </View>
        </CameraView>

        <View style={styles.controls}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker background for focus
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 280, // Slightly wider for EAN-13 barcodes
    height: 180,
    borderWidth: 2,
    borderColor: '#FFFFFF', // White border makes the box pop
    position: 'relative',
    backgroundColor: 'transparent', // This creates the "hole" effect
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: '50%',
    height: 2,
    backgroundColor: '#007AFF',
    opacity: 0.5,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
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