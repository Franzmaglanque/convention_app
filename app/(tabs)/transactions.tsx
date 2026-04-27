import OrderItemList from '@/components/OrderItems';
import OrderPaymentList from '@/components/OrderPayments';
import ReturnedItemsList from '@/components/ReturnedItems';
import { TRANSACTION_STATUS_COLORS } from '@/constants/transaction';
import { fetchSupplierOrders } from '@/hooks/useOrder';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  const [searchQuery,setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  
  const {
      data: transactions,
      isLoading,
      isError,
      refetch,
      isRefetching
  } = fetchSupplierOrders();

  // State for modal visibility and selected order
  const [isItemsModalVisible, setIsItemsModalVisible] = useState(false);
  const [isPaymentsModalVisible, setIsPaymentsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [isReturnedItemsModalVisible, setIsReturnedItemsModalVisible] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<any>(null);

  const handleViewItems = (transaction: any) => {
    setSelectedOrder(transaction.order_no);
    setIsItemsModalVisible(true);
  };

  const handleViewPayments = (transaction: any) => {
    setSelectedOrder(transaction.order_no);
    setIsPaymentsModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredData = useMemo(() => {
      if (!transactions?.data) return [];
      if (!searchQuery.trim()) return transactions?.data;
  
      const lowerCaseQuery = searchQuery.toLowerCase();
      
      return transactions.data.filter((transaction:any) => {
        const matchOrderNo = transaction.order_no?.toLowerCase().includes(lowerCaseQuery);
        const matchCustomerCard = transaction.customer_card_no?.toLowerCase().includes(lowerCaseQuery);
        const matchStatus = transaction.order_status?.toLowerCase().includes(lowerCaseQuery);
        
        return matchOrderNo || matchCustomerCard || matchStatus;
      });
    }, [transactions, searchQuery])


    const renderItem = ({ item: transaction }: any) => {
      // Check if this transaction has a return attached
      const isReturned = transaction?.return_id !== null && transaction?.return_id !== undefined;

      return (
        
        <View key={transaction?.id} style={styles.transactionCard}>
          {/* ROW 1: Order Number & Status */}
          <View style={styles.transactionHeader}>
            <View style={styles.orderNumberContainer}>
              <Text style={styles.orderNumber} numberOfLines={1}>
                Order # {transaction?.order_no}
              </Text>

              {/* NEW: Display E-Load Badge if applicable */}
              {transaction?.order_type === 'LOAD' && (
                <View style={styles.loadBadge}>
                  <Ionicons name="phone-portrait-outline" size={12} color="#0066cc" />
                  <Text style={styles.loadText}>E-Load Transaction</Text>
                </View>
              )}


              {/* NEW: Display Replacement Order No. if applicable */}
              {isReturned && transaction?.new_order_no && (
                <View style={styles.exchangeBadge}>
                  <Ionicons name="swap-horizontal" size={12} color="#e53935" />
                  <Text style={styles.exchangeText}>
                    Exchanged to #{transaction.new_order_no}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: TRANSACTION_STATUS_COLORS[transaction?.order_status as keyof typeof TRANSACTION_STATUS_COLORS] || '#666'
              }
            ]}>
              <Text style={styles.statusText}>{transaction?.order_status}</Text>
            </View>
          </View>

          {/* ROW 2: Date & Cashier Name */}
          <View style={styles.transactionSubHeader}>
            <View style={styles.metaDataContainer}>
              <Ionicons name="calendar-outline" size={14} color="#666" style={styles.metaIcon} />
              <Text style={styles.transactionDate}>
                {formatDate(transaction?.created_at)}
              </Text>
            </View>
            <View style={styles.metaDataContainer}>
              <Ionicons name="person-outline" size={14} color="#666" style={styles.metaIcon} />
              <Text style={styles.cashierName} numberOfLines={1}>
                {transaction?.full_name || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Divider Line */}
          <View style={styles.divider} />

          {/* ROW 3: Transaction Details */}
          <View style={styles.transactionDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="cash-outline" size={16} color="#666" />
                <Text style={styles.detailLabel}>Total Amount:</Text>
              </View>
              <Text style={styles.detailValue}>{transaction?.total}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="cube-outline" size={16} color="#666" />
                <Text style={styles.detailLabel}>Items:</Text>
              </View>
              <Text style={styles.detailValue}>{transaction?.item_count} items</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="card-outline" size={16} color="#666" />
                <Text style={styles.detailLabel}>Card Number:</Text>
              </View>
              <Text style={styles.detailValue}>{transaction?.customer_card_no}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.transactionActions}>
            <Pressable 
              style={styles.actionButton}
              onPress={() => handleViewItems(transaction)}
            >
              <Ionicons name="list-outline" size={16} color="#0066cc" />
              <Text style={styles.actionButtonText} numberOfLines={1} adjustsFontSizeToFit>
                Items
              </Text>
            </Pressable>

            {/* Conditionally Rendered Returns Button */}
            {isReturned && (
              <Pressable 
                style={[styles.actionButton, { backgroundColor: '#ffebee' }]}
                onPress={() => handleViewReturnedItems(transaction)}
              >
                <Ionicons name="return-down-back" size={16} color="#e53935" />
                <Text style={[styles.actionButtonText, { color: '#e53935' }]} numberOfLines={1} adjustsFontSizeToFit>
                  Returns
                </Text>
              </Pressable>
            )}

            <Pressable 
              style={styles.actionButton}
              onPress={() => handleViewPayments(transaction)}
            >
              <Ionicons name="receipt-outline" size={16} color="#495057" />
              <Text style={[styles.actionButtonText, { color: '#495057' }]} numberOfLines={1} adjustsFontSizeToFit>
                Payments
              </Text>
            </Pressable>
          </View>
        </View>
      )
    }

  const onRefresh = async () => {
      setRefreshing(true);
      try {
      if (refetch) {
          await refetch(); // Call your API again to get fresh data
      }
      } catch (error) {
        console.error("Failed to refresh data", error);
      } finally {
        setRefreshing(false); // Stop the spinning loader
      }
  };

  const handleViewReturnedItems = (transaction: any) => {
    setSelectedReturnId(transaction.return_id); // Pass the return_id to your future modal
    setIsReturnedItemsModalVisible(true);
  };

  if(isLoading){
    return(
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>
          View and manage your past transactions
        </Text>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, barcode, or SKU..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Transactions List */}
      <FlatList
          data={filteredData || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          // contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
      />

      <OrderItemList 
        order_no={selectedOrder}
        visible={isItemsModalVisible}
        onClose={() => setIsItemsModalVisible(false)}
      />

      <ReturnedItemsList 
        returned_id={selectedReturnId}
        visible={isReturnedItemsModalVisible}
        onClose={() => setIsReturnedItemsModalVisible(false)}
      />

      <OrderPaymentList
        order_no={selectedOrder}
        visible={isPaymentsModalVisible}
        onClose={() => setIsPaymentsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authRequiredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  authRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
 filterContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
    height: 60,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginTop: 10,
  },
  filterButtonActive: {
    backgroundColor: '#0066cc',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed to center
    marginBottom: 8, // Reduced margin
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1, // This allows the text to truncate if it gets too long!
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
  },
  transactionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
    marginLeft: 6,
  },
  actionButtonTextSecondary: {
    color: '#666',
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

  // --- New Search Bar Styles ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearIcon: {
    position: 'absolute',
    right: 28,
  },

  // --- Add these new styles for Date & Cashier ---
  transactionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1, // Prevents overflow on small screens
  },
  metaIcon: {
    marginRight: 4,
  },
  cashierName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  orderNumberContainer: {
    flex: 1,
    marginRight: 8,
  },
  exchangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#ffebee', // light red background
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  exchangeText: {
    fontSize: 11,
    color: '#e53935',
    fontWeight: '600',
    marginLeft: 4,
  },
  loadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#e7f1fc', // Light blue background
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  loadText: {
    fontSize: 11,
    color: '#0066cc', // Matches the globe/load theme
    fontWeight: '600',
    marginLeft: 4,
  },
});
