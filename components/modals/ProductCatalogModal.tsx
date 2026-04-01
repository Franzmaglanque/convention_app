import { useFetchProductList } from '@/hooks/useProduct';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
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

// interface ProductCatalogModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onAdd: (item: Product) => void;
//   onRemove: (item: Product) => void;
//   cartItems: any[]; 
// }
interface ProductCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Product) => void;
  onRemove: (item: Product) => void;
  cartItemsMap: Record<string | number, number>; // ← changed from cartItems array
}

// ✨ OPTIMIZATION 1: Memoize the individual row so it doesn't re-render 
// every time the user types in the search bar.
const CatalogItem = React.memo(({ 
  item, 
  currentQty, 
  onAdd, 
  onRemove 
}: { 
  item: Product, 
  currentQty: number, 
  onAdd: (item: Product) => void, 
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
  // Only re-render this specific row if its quantity in the cart changes!
//   return prevProps.currentQty === nextProps.currentQty;
    // Now this is the COMPLETE check — all props that affect rendering
    return (
        prevProps.currentQty === nextProps.currentQty &&
        prevProps.onAdd === nextProps.onAdd &&       // ← stable because of useCallback
        prevProps.onRemove === nextProps.onRemove     // ← stable because of useCallback
    );
});


// export default function ProductCatalogModal({ visible, onClose, onAdd, onRemove, cartItems }: ProductCatalogModalProps) {
export default function ProductCatalogModal({ 
visible, onClose, onAdd, onRemove, cartItemsMap  // ← cartItemsMap
}: ProductCatalogModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    
    const { data: products, isLoading, isError, refetch } = useFetchProductList({
      enabled: visible
    }); 

    // ✨ OPTIMIZATION 2: useMemo prevents the app from re-filtering the entire 
    // array 60 times a second while animating.
    const filteredProducts = useMemo(() => {
      if (!products?.data) return [];
      if (!searchQuery) return products.data; // Don't filter if search is empty

      const query = searchQuery.toLowerCase();
      return products.data.filter((item: any) => {
          return (
              item.description?.toLowerCase().includes(query) ||
              item.sku?.toString().includes(query) ||
              item.price?.toString().includes(query) 
          );
      });
    }, [products?.data, searchQuery]);


    // ✨ OPTIMIZATION 3: Stable renderItem callback for FlatList
    // const renderItem = useCallback(({ item }: { item: Product }) => {
    //   // Find how many of this item are currently in the exchange cart
    //   const currentQty = cartItems.find(cartItem => cartItem.id === item.id)?.qty || 0;

    //   return (
    //     <CatalogItem 
    //       item={item} 
    //       currentQty={currentQty} 
    //       onAdd={onAdd} 
    //       onRemove={onRemove} 
    //     />
    //   );
    // }, [cartItems, onAdd, onRemove]);


    const renderItem = useCallback(({ item }: { item: Product }) => {
      const currentQty = cartItemsMap[item.id] || 0; // ← O(1) lookup, not O(n) find()
      return (
        <CatalogItem 
          item={item} 
          currentQty={currentQty} 
          onAdd={onAdd} 
          onRemove={onRemove} 
        />
      );
    }, [cartItemsMap, onAdd, onRemove]);

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
                      data={filteredProducts}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={renderItem}
                      style={styles.sheetList}
                      contentContainerStyle={{ paddingBottom: 40 }}
                      showsVerticalScrollIndicator={false}
                      
                      // 🚀 MASSIVE PERFORMANCE BOOSTERS FOR LOW-END PHONES 🚀
                      initialNumToRender={8}      // Only draw 8 items before sliding the modal up
                      maxToRenderPerBatch={8}     // Draw 8 items per frame while scrolling
                      windowSize={5}              // Unload items far off-screen to save RAM
                      removeClippedSubviews={true} // Physically remove invisible items
                    />
                )}

            </View>
        </View>
    </Modal>
  );
}

// KEEP ALL YOUR EXISTING STYLES AT THE BOTTOM
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
   
    // ...
});