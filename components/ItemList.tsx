import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface ItemListProps {
  visible: boolean;
  onClose: () => void;
  onProductSelect?: (product: Product) => void;
}

// Sample data for demonstration
const sampleProducts: Product[] = [
  { id: '1', name: 'Premium Coffee Beans', price: 12.99, imageUrl: 'https://via.placeholder.com/60' },
  { id: '2', name: 'Organic Green Tea', price: 8.50, imageUrl: 'https://via.placeholder.com/60' },
  { id: '3', name: 'Wireless Headphones', price: 89.99, imageUrl: 'https://via.placeholder.com/60' },
  { id: '4', name: 'Yoga Mat', price: 24.95, imageUrl: 'https://via.placeholder.com/60' },
  { id: '5', name: 'Smartphone Case', price: 15.75, imageUrl: 'https://via.placeholder.com/60' },
  { id: '6', name: 'Laptop Stand', price: 32.49, imageUrl: 'https://via.placeholder.com/60' },
  { id: '7', name: 'Desk Lamp', price: 28.00, imageUrl: 'https://via.placeholder.com/60' },
  { id: '8', name: 'Water Bottle', price: 18.99, imageUrl: 'https://via.placeholder.com/60' },
  { id: '9', name: 'Running Shoes', price: 65.00, imageUrl: 'https://via.placeholder.com/60' },
  { id: '10', name: 'Backpack', price: 45.25, imageUrl: 'https://via.placeholder.com/60' },
];

// Product item component
const ProductItem: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => {
  return (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>
          ₱{product.price.toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={onPress}
      >
        <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main component
const ItemList: React.FC<ItemListProps> = ({ visible, onClose, onProductSelect }) => {
  const handleProductPress = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}>Products</Text>
            <Text style={styles.productCount}>{sampleProducts.length} items</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={sampleProducts}
            renderItem={({ item }) => (
              <ProductItem 
                product={item} 
                onPress={() => handleProductPress(item)} 
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  productCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066cc',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 4,
  },
  separator: {
    height: 12,
  },
});

export default ItemList;
