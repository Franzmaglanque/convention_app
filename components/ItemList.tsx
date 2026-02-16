import React from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Define the Product interface
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
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
const ProductItem: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <TouchableOpacity style={styles.productItem} onPress={() => {}}>
      <View style={styles.productImageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>
          ₱{product.price.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Main component
const ItemList: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <Text style={styles.productCount}>{sampleProducts.length} items</Text>
      </View>
      
      <FlatList
        data={sampleProducts}
        renderItem={({ item }) => <ProductItem product={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
  },
  productCount: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
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
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#6c757d',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
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
  separator: {
    height: 12,
  },
});

export default ItemList;
