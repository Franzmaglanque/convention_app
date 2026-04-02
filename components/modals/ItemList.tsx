import { useFetchProductList } from '@/hooks/useProduct';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Product {
  id: number;
  description: string;
  price: string;
  sku: string;
  barcode?: string;
}

interface ItemListProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Product) => void;
  onRemove: (item: Product) => void;
  cartItems: any[];
    // cartItemsMap:Record<number, number>
}
const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(numericValue || 0);
};

const ProductItem = React.memo(({ item,onAdd,currentQty,onRemove }:{ 
  item: Product;
  currentQty: number;
  onAdd: (item: Product) => void;
  onRemove: (item: Product) => void
}) => {
  return (
    <View style={styles.browseItemRow}>
      <View style={styles.browseItemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.skuRow}>
          <Text style={styles.itemSubDetail}>SKU: {item.sku || 'N/A'}</Text>
          <Text style={styles.itemSubDetail}> • </Text>
          <Text style={styles.itemSubDetail}>UPC: {item.barcode || 'N/A'}</Text>
        </View>
        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
      </View>
      
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
}, (prevProps, nextProps) => {
  // ✨ PERFORMANCE BOOST: Only re-render if the quantity changes!
  return prevProps.currentQty === nextProps.currentQty;
});

// const ItemList: React.FC<ItemListProps> = ({ visible, onClose,onAdd,cartItemsMap }) => {
const ItemList: React.FC<ItemListProps> = ({ visible, onClose, onAdd, onRemove, cartItems }) => {
  const [searchQuery,setSearchQuery] = useState('');
  
  const {
    data: products,
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useFetchProductList({
    enabled: visible
  });
  //   const {
  //   data: products,
  //   isLoading,
  //   isError,
  //   refetch
  // } = useFetchProductList({
  //   // ✨ Remove 'enabled: visible'. Let it fetch quietly in the 
  //   // background as soon as the Cart screen mounts!
  //   staleTime: 1000 * 60 * 30, // Tell React Query: "This data is good for 30 minutes, don't refetch it every time the modal opens"
  // });

  const filteredData = useMemo(() => {
      if (!products?.data) return [];
      if (!searchQuery.trim()) return products?.data;
  
      const lowerCaseQuery = searchQuery.toLowerCase();
      
      return products.data.filter((product: Product) => {
        const matchName = product.description?.toLowerCase().includes(lowerCaseQuery);
        const matchBarcode = product.barcode?.toLowerCase().includes(lowerCaseQuery);
        const matchSku = product.sku?.toLowerCase().includes(lowerCaseQuery);
        const matchPrice = product.price?.toLowerCase().includes(lowerCaseQuery);
        
        return matchName || matchBarcode || matchSku || matchPrice;
      });
    }, [products, searchQuery])


  const cartQtyMap = useMemo(() => {
    const map: Record<number, number> = {};
    cartItems.forEach(cartItem => {
      if (cartItem.product?.id) {
        map[cartItem.product.id] = cartItem.quantity;
      }
    });
    return map;
  }, [cartItems]); // Only recalculates when the cart actually changes!
    // ✨ FIX: Create a proper renderItem callback
  const renderItem = useCallback(({ item }: { item: Product }) => {
    // const currentQty = cartItemsMap[item.id] || 0;
    // return (
    //   <ProductItem 
    //     item={item}
    //     onAdd={onAdd}
    //     currentQty={currentQty}
    //   />
    // );
    // const currentQty = cartItems.find(cartItem => cartItem.product?.id === item.id)?.quantity || 0;
    // ✨ INSTANT LOOKUP! No more .find() loops.
    const currentQty = cartQtyMap[item.id] || 0;
    return (
      <ProductItem 
        item={item} 
        currentQty={currentQty} 
        onAdd={onAdd} 
        onRemove={onRemove} 
      />
    );
  }, [,cartItems,onAdd,onRemove]);

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
                        autoCorrect={false}
                    />
                </View>

                {/* ✨ OPTIMIZATION 4: The FlatList replaces the ScrollView */}
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
                            <Text>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                      data={filteredData}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={renderItem}
                      style={styles.sheetList}
                      contentContainerStyle={{ paddingBottom: 40 }}
                      showsVerticalScrollIndicator={false}
                    
                      initialNumToRender={8}     
                      maxToRenderPerBatch={8}  
                      windowSize={5}    
                      removeClippedSubviews={true}
                      refreshControl={
                      <RefreshControl
                          refreshing={isRefetching}
                          onRefresh={refetch}
                          tintColor="#007AFF" // iOS spinner color
                          colors={['#007AFF']} // Android spinner color
                        />
                      }
                    />
                )}

            </View>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 20 },
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

export default ItemList;
