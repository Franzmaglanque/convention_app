import { useFetchOrderItems } from '@/hooks/useOrder';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface OrderItem {
    id: number;
    barcode: string;
    description: string;
    line_total: string;
    quantity: number;
    sku: number;
    unit_price: string;
}

interface OrderItemListProps {
    order_no:string;
    visible: boolean;
    onClose: () => void;
}

const MOCK_ORDER_ITEMS = [
  { id: 1, description: 'BUY 8 PCS OF ANY NAGARAYA PRETZEL 30G FOR ONLY P50.00', sku: 'CB-001', barcode: '8901234567890', price: 450.00, quantity: 2 },
  { id: 2, description: 'Organic Green Tea', sku: 'GT-002', barcode: '8901234567891', price: 320.50, quantity: 1 },
  { id: 3, description: 'Chocolate Chip Cookies', sku: 'CC-003', barcode: '8901234567892', price: 180.75, quantity: 3 },
  { id: 4, description: 'Stainless Steel Tumbler', sku: 'ST-004', barcode: '8901234567893', price: 890.00, quantity: 1 },
  { id: 5, description: 'Gourmet Popcorn', sku: 'GP-005', barcode: '8901234567894', price: 240.25, quantity: 2 },
  { id: 6, description: 'BUY 8 PCS OF ANY NAGARAYA PRETZEL 30G FOR ONLY P50.00', sku: 'NP-006', barcode: '8901234567895', price: 50.00, quantity: 8 },
];

const OrderItem = ({item} : { item: OrderItem } ) => {
  return (
    <View style={styles.itemCard}>
        {/* Description only in header */}
        <View style={styles.itemHeader}>
        <Text 
            style={styles.itemDescription}
            numberOfLines={2}
            ellipsizeMode="tail"
        >
            {item.description}
        </Text>
        </View>
        
        {/* SKU and barcode information */}
        <View style={styles.itemCodesContainer}>
        <View style={styles.codeRow}>
            <View style={styles.codeItem}>
            <Ionicons name="pricetag-outline" size={14} color="#666" />
            <Text style={styles.codeLabel}>SKU:</Text>
            <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode="tail">
                {item.sku}
            </Text>
            </View>
            <View style={styles.codeItem}>
            <Ionicons name="barcode-outline" size={14} color="#666" />
            <Text style={styles.codeLabel}>Barcode:</Text>
            <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode="tail">
                {item.barcode}
            </Text>
            </View>
        </View>
        </View>

        {/* Quantity, price, and subtotal */}
        <View style={styles.itemDetails}>
        <View style={styles.quantityPriceContainer}>
            <View style={styles.quantitySection}>
            <View style={styles.quantityInfo}>
                <Ionicons name="cube-outline" size={16} color="#0066cc" />
                <Text style={styles.quantityLabel}>Quantity:</Text>
                <Text style={styles.quantityValue}>{item.quantity}</Text>
            </View>
            <View style={styles.priceInfo}>
                <Ionicons name="pricetag" size={16} color="#28a745" />
                <Text style={styles.priceLabel}>Price:</Text>
                <Text style={styles.priceValue}>₱{item.unit_price}</Text>
            </View>
            </View>
            <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalLabel}>Subtotal:</Text>
            <Text style={styles.subtotalValue}>₱{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</Text>
            </View>
        </View>
        </View>
    </View>
  );
};

const OrderItemList: React.FC<OrderItemListProps> = ({ order_no,visible, onClose, }) => {
    const {
        data: order_items,
        isLoading,
        isError,
        refetch
    } = useFetchOrderItems(order_no);

  if(isLoading){
    return(
       <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading Order Items...</Text>
        </View>
    )
  }
//   console.log('order item list',order_items?.data);
  return (
     <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                Order Items {order_no}
                </Text>
                <Pressable 
                style={styles.closeButton}
                onPress={() => onClose()}
                >
                <Ionicons name="close" size={24} color="#333" />
                </Pressable>
            </View>
            
            <View style={styles.modalContent}>
                <FlatList
                    data={order_items?.data}
                    renderItem={({ item }) => (
                        <OrderItem 
                            item={item} 
                        />
                    )}
                    // renderItem={({ item }) => console.log('dsadsadsa')}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyItemsContainer}>
                        <Ionicons name="cube-outline" size={48} color="#CCCCCC" />
                        <Text style={styles.emptyItemsText}>No items found</Text>
                        </View>
                    }
                />
            </View>
            
            <View style={styles.modalFooter}>
                <View style={styles.footerRow}>
                <View style={styles.footerItem}>
                    <Ionicons name="cube-outline" size={16} color="#666" />
                    <Text style={styles.footerLabel}>Total Items:</Text>
                    <Text style={styles.footerValue}>
                    {order_items?.data.reduce((sum:number, item:OrderItem) => sum + item.quantity, 0)}
                    </Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.footerLabel}>Total Amount:</Text>
                    <Text style={styles.footerValue}>
                    ₱{order_items?.data.reduce((sum:number, item:OrderItem) => sum + (parseFloat(item.unit_price) * item.quantity), 0).toFixed(2)}
                    </Text>
                </View>
                </View>
            </View>
            </View>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
    maxHeight: '70%',
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flexWrap: 'wrap',
  },
  itemSku: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  itemDetails: {
    marginTop: 8,
  },
  quantityPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySection: {
    flex: 1,
  },
  quantityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  itemCodesContainer: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 4,
  },
  codeValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  subtotalContainer: {
    alignItems: 'flex-end',
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  emptyItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyItemsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
});

export default OrderItemList;
