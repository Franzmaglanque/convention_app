import { useFetchProductList } from '@/hooks/useProduct';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Product {
  id: number;
  description: string;
  price: string;
  sku: string;
}

interface ItemListProps {
  visible: boolean;
  onClose: () => void;
  onProductSelect?: (product: Product) => void;
}

const ProductItem: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => {
  return (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.description}
        </Text>
        <Text style={styles.productPrice}>
          ₱{parseFloat(product.price).toFixed(2)}
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

const EmptyListComponent = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="search-outline" size={48} color="#CCC" />
    <Text style={styles.emptyText}>No products found.</Text>
    <Text style={styles.emptySubText}>Try refreshing or check back later.</Text>
  </View>
);

const ItemList: React.FC<ItemListProps> = ({ visible, onClose, onProductSelect }) => {
  const {
    data: products,
    isLoading,
    isError,
    refetch
  } = useFetchProductList();

  const handleProductPress = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
    onClose();
  };

  if(isLoading){
    return(
       <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading products...</Text>
        </View>
    )
  }

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
            {/* <Text style={styles.productCount}>{products.length || 0} items</Text> */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          { isError ? (
            <View style={styles.centerContainer}>
              <Text>Failed to load products.</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                <Text style={{ color: 'white' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList<Product>
              data={products?.data ?? []} 
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ProductItem 
                  product={item} 
                  onPress={() => handleProductPress(item)} 
                />
              )}
             ListEmptyComponent={EmptyListComponent}
              contentContainerStyle={[
                styles.listContent,
                products?.data?.length === 0 && { flex: 1, justifyContent: 'center' }
              ]}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              onRefresh={refetch}
              refreshing={isLoading}
            />
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});

export default ItemList;
