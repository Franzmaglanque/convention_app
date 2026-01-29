import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface MessageToastProps {
  /** The type of message to display */
  type: MessageType;
  /** The message text to display */
  message: string;
  /** Whether the toast is visible */
  visible: boolean;
  /** Duration in milliseconds before auto-hiding (0 for no auto-hide) */
  duration?: number;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Custom styles for the toast container */
  containerStyle?: ViewStyle;
  /** Custom styles for the message text */
  textStyle?: TextStyle;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Whether to show a close button */
  showCloseButton?: boolean;
  /** Position of the toast */
  position?: 'top' | 'bottom' | 'center';
}

const MessageToast: React.FC<MessageToastProps> = ({
  type = 'info',
  message,
  visible = false,
  duration = 4000,
  onDismiss,
  containerStyle,
  textStyle,
  showIcon = true,
  showCloseButton = true,
  position = 'top',
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only stop rendering after animation completes
        if (!visible) {
          setShouldRender(false);
        }
      });
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'close-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning' as const,
          iconColor: '#FFFFFF',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#3B82F6',
          icon: 'information-circle' as const,
          iconColor: '#FFFFFF',
        };
    }
  };

  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'top':
        return styles.positionTop;
      case 'bottom':
        return styles.positionBottom;
      case 'center':
        return styles.positionCenter;
      default:
        return styles.positionTop;
    }
  };

  const typeStyles = getTypeStyles();
  const positionStyle = getPositionStyle();

  if (!shouldRender && !visible) {
    return null;
  }

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        { backgroundColor: typeStyles.backgroundColor },
        animatedStyle,
        containerStyle,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={typeStyles.icon}
          size={24}
          color={typeStyles.iconColor}
          style={styles.icon}
        />
      )}
      
      <Text style={[styles.message, textStyle]} numberOfLines={3}>
        {message}
      </Text>

      {showCloseButton && (
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    minHeight: 50,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  positionTop: {
    top: 50,
    alignSelf: 'center',
  },
  positionBottom: {
    bottom: 50,
    alignSelf: 'center',
  },
  positionCenter: {
    top: 0,
    bottom: 0,
    marginTop: 'auto',
    marginBottom: 'auto',
    alignSelf: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});

export default MessageToast;