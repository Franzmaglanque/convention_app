import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

interface LoaderProps {
  size?: 'small' | 'large' | number;
  color?: string;
  containerStyle?: ViewStyle;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color = '#007AFF',
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default Loader;