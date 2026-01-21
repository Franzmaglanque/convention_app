import { View, Text, StyleSheet } from 'react-native';
import MessageToastExample from '@/components/MessageToastExample';

export default function CartScreen() {
  return (
    <View style={styles.container}>
      <MessageToastExample />
      <Text style={styles.title}>Your Cart</Text>
      <Text style={styles.emptyText}>Your cart is empty</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});