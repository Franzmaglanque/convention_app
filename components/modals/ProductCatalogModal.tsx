import { useFetchProductList } from '@/hooks/useProduct';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(numericValue || 0);
};

interface Product {
  id: string | number;
  description: string;
  price: string | number;
  sku?: string | number;
  barcode?: string | number;
}

// 1. UPDATE: Added cartItems and split the actions into onAdd and onRemove
interface ProductCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Product) => void;
  onRemove: (item: Product) => void;
  cartItems: any[]; // We need the cart to know the current quantity!
}

export default function ProductCatalogModal({ visible, onClose, onAdd, onRemove, cartItems }: ProductCatalogModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    
    const {
      data: products,
      isLoading,
      isError,
      refetch
    } = useFetchProductList({
      enabled: visible
    }); 

    // Added optional chaining (?.) to description to prevent crashes if a product is missing data
    const filteredProducts = products?.data.filter((item: any) => {
        const query = searchQuery.toLowerCase();
        return (
            item.description?.toLowerCase().includes(query) ||
            item.sku?.toString().includes(query) ||
            item.price?.toString().includes(query) 
        );
    });

    return (
    <Modal visible={visible} transparent animationType="slide">
        <View style={styles.bottomSheetOverlay}>
            <View style={styles.bottomSheetContent}>
                
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Store Catalog</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={28} color="#C7C7CC" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, SKU, or Barcode..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                </View>

                <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.centerText}>Loading catalog...</Text>
                        </View>
                    ) : isError ? (
                        <View style={styles.centerContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
                            <Text style={styles.centerText}>Failed to load products.</Text>
                            <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                                <Text style={styles.retryButtonText}>Tap to Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredProducts?.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyStateText}>No products found.</Text>
                        </View>
                    ) : ( 
                        filteredProducts?.map((item: any) => {
                            // 2. LOGIC: Find out how many of this item are already in the cart
                            const itemInCart = cartItems.find(cartItem => cartItem.id === item.id);
                            const currentQty = itemInCart ? itemInCart.qty : 0;

                            return (
                                <View key={item.id} style={styles.browseItemRow}>
                                    <View style={styles.browseItemInfo}>
                                        <Text style={styles.itemName} numberOfLines={3}>{item.description}</Text>
                                        
                                        <View style={styles.skuRow}>
                                            <Text style={styles.itemSubDetail}>SKU: {item.sku || 'N/A'}</Text>
                                            <Text style={styles.itemSubDetail}> • </Text>
                                            <Text style={styles.itemSubDetail}>UPC: {item.barcode || 'N/A'}</Text>
                                        </View>

                                        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                                    </View>
                                    
                                    {/* 3. UPDATE: Replaced single button with Stepper */}
                                    <View style={styles.stepper}>
                                        <TouchableOpacity 
                                            style={[styles.stepperBtn, currentQty === 0 && styles.stepperDisabled]} 
                                            onPress={() => onRemove(item)}
                                            disabled={currentQty === 0}
                                        >
                                            <Ionicons name="remove" size={20} color={currentQty === 0 ? "#C7C7CC" : "#007AFF"} />
                                        </TouchableOpacity>
                                        
                                        <Text style={styles.stepperValue}>{currentQty}</Text>
                                        
                                        <TouchableOpacity 
                                            style={styles.stepperBtn} 
                                            onPress={() => onAdd(item)}
                                        >
                                            <Ionicons name="add" size={20} color="#007AFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                    <View style={{ height: 40 }} /> 
                </ScrollView>
            </View>
        </View>
    </Modal>
    );
}

const styles = StyleSheet.create({
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', margin: 16, borderRadius: 10, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 16 },
  sheetList: { paddingHorizontal: 16 },
  browseItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  browseItemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', lineHeight: 20 },
  skuRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4, flexWrap: 'wrap' },
  itemSubDetail: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  itemPrice: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  emptyStateText: { textAlign: 'center', color: '#8E8E93', marginTop: 20, fontSize: 15 },
  centerContainer: { paddingTop: 40, alignItems: 'center', justifyContent: 'center' },
  centerText: { marginTop: 12, fontSize: 15, color: '#8E8E93', fontWeight: '500' },
  retryButton: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F2F2F7', borderRadius: 8 },
  retryButtonText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
  
  // NEW: Stepper Styles
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  stepperBtn: { padding: 8 },
  stepperDisabled: { opacity: 0.5 },
  stepperValue: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center', color: '#1C1C1E' },
});