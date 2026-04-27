import { useFetchLoadDetails } from '@/hooks/useLoad';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';

// 1. Update the interface to match your new load_items table
interface LoadItem {
    id: number;
    load_type: string;    // e.g., 'regular', 'commercial', 'data load'
    command: string;      // e.g., 'EasySURF50'
    description: string;  // e.g., '500 MB + Unli Allnet Calls & Texts for 3 days.'
    amount: string | number;
    promo_amount: string | number;
    mobile_number?: string;
}

interface LoadItemListProps {
    order_no: string;
    visible: boolean;
    onClose: () => void;
}

const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₱${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Formats the load type (e.g., 'data load' -> 'Data Load')
const formatLoadType = (type: string) => {
    if (!type) return 'Load';
    return type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const LoadItemComponent = ({ item }: { item: LoadItem }) => {
  return (
    <View style={styles.itemCard}>
        {/* ROW 1: Command & Amount */}
        <View style={styles.itemHeader}>
            <View style={styles.commandContainer}>
                <Ionicons name="phone-portrait-outline" size={18} color="#0066cc" />
                {/* Fallback to 'Regular Load' if command is empty for regular loads */}
                <Text style={styles.commandText} numberOfLines={1}>
                    {item.command || 'Load'}
                </Text>
            </View>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
        </View>
        
        {/* ROW 2: Description (Only renders if there is a description) */}
        {item.description ? (
             <Text style={styles.itemDescription}>
                 {item.description}
             </Text>
        ) : null}
        
        {/* ROW 3: Metadata (Load Type & Promo Amount) */}
        <View style={styles.itemCodesContainer}>

            {/* NEW: Customer Mobile Number Row */}
            {item.mobile_number && (
                <View style={[styles.codeRow, styles.mobileRow]}>
                    <View style={styles.codeItem}>
                        <Ionicons name="call-outline" size={14} color="#0066cc" />
                        <Text style={[styles.codeLabel, { color: '#0066cc' }]}>Loaded to:</Text>
                        <Text style={styles.mobileValue}>0{item.mobile_number}</Text>
                    </View>
                </View>
            )}
            <View style={styles.codeRow}>
                <View style={styles.codeItem}>
                    <Ionicons name="pricetag-outline" size={14} color="#666" />
                    <Text style={styles.codeLabel}>Type:</Text>
                    <Text style={styles.codeValue}>{formatLoadType(item.load_type)}</Text>
                </View>
                
                {/* Conditionally render promo amount if it exists and is greater than 0 */}
                {parseFloat(item.promo_amount as string) > 0 && (
                    <View style={styles.codeItemRight}>
                        <Ionicons name="star-outline" size={14} color="#e53935" />
                        <Text style={[styles.codeLabel, { color: '#e53935' }]}>Promo:</Text>
                        <Text style={[styles.codeValue, { color: '#e53935' }]}>
                            {formatCurrency(item.promo_amount)}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    </View>
  );
};

export default function LoadOrderItems({ order_no, visible, onClose }: LoadItemListProps) {
  // IMPORTANT: Ensure this hook calls your new load_items endpoint!
  const { data: loadItems, isLoading, isError, refetch } = useFetchLoadDetails(order_no);

  const calculateTotal = () => {
    if (!loadItems?.data) return 0;
    return loadItems.data.reduce((total: number, item: LoadItem) => {
      return total + parseFloat(item.amount as string || '0');
    }, 0);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>E-Load Details</Text>
              <Text style={styles.modalSubtitle}>Order #{order_no}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0066cc" />
            </View>
          ) : isError ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#e53935" />
              <Text style={styles.errorText}>Failed to load transaction details.</Text>
              <Pressable style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FlatList
                data={loadItems?.data || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <LoadItemComponent item={item} />}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={() => (
                  <View style={styles.emptyItemsContainer}>
                    <Ionicons name="phone-portrait-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyItemsText}>No load items found for this order.</Text>
                  </View>
                )}
              />

              {/* Footer Summary */}
              {loadItems?.data && loadItems.data.length > 0 && (
                <View style={styles.modalFooter}>
                  <View style={styles.subtotalContainer}>
                    <Text style={styles.subtotalLabel}>Total Amount</Text>
                    <Text style={styles.subtotalValue}>{formatCurrency(calculateTotal())}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f4f6f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  
  // --- Updated Card Styles ---
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  commandText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  itemDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 12,
  },
  itemCodesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // --- NEW: Mobile Row Styles ---
  mobileRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef', // Light divider between mobile number and the load type
  },
  mobileValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    letterSpacing: 0.5, // Makes the phone number slightly easier to read
  },
  // ------------------------------

  codeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 4,
  },
  codeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  
  modalFooter: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 40,
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
    fontSize: 22,
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
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});