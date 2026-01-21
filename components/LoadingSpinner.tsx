import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  Modal,
  ViewStyle,
  TextStyle 
} from 'react-native';

interface LoadingSpinnerProps {
  visible?: boolean;
  size?: 'small' | 'large' | number;
  color?: string;
  overlayColor?: string;
  indicatorColor?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible = false,
  size = 'large',
  color = '#007AFF',
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  indicatorColor = color,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={styles.container}>
          <ActivityIndicator 
            size={size} 
            color={indicatorColor}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default LoadingSpinner;