import { TRANSACTION_STATUS_COLORS } from '@/constants/transaction';
import { fetchSupplierOrders } from '@/hooks/useOrder';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

// Updated transaction data type to support multi-tender and card numbers
interface Transaction {
  id: string;
  orderNo: string;
  totalAmount: number;
  paymentMethods: string[]; // Array to support multi-tender payments
  status: string;
  createdAt: string;
  itemsCount: number;
  cardNumber?: string; // Replaced customerName with cardNumber
}

export default function TransactionsScreen() {
  const {
      data: transactions,
      isLoading,
      isError,
      refetch,
      isRefetching
  } = fetchSupplierOrders();

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

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>
          View and manage your past transactions
        </Text>
      </View>

      {/* Transactions List */}
      <ScrollView 
        style={styles.transactionsList}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching} // Spinner visible while refetching
            onRefresh={refetch}        // Calls the hook's refetch function
            colors={['#0066cc']}      // Spinner color (Android)
            tintColor={'#0066cc'}     // Spinner color (iOS)
          />
        }  
      >
        {transactions.data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              You have not made any transactions yet
            </Text>
          </View>
        ) :  (
          transactions.data.map((transaction:any) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>Order # {transaction.order_no}</Text>
                  {/* <View style={[styles.statusBadge, { backgroundColor: TRANSACTION_STATUS_COLORS[transaction.order_status as TRANSACTION_STATUS] }]}> */}
                  {/* <View style={[
                    styles.statusBadge, 
                    { backgroundColor: TRANSACTION_STATUS_COLORS[transaction.order_status as TransactionStatus] }
                  ]}> */}
                  <View style={[
                    styles.statusBadge, 
                    { 
                      backgroundColor: TRANSACTION_STATUS_COLORS[transaction.order_status as keyof typeof TRANSACTION_STATUS_COLORS] 
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {/* {TRANSACTION_STATUS_LABELS[transaction.status as keyof typeof TRANSACTION_STATUS_LABELS]} */}
                      {transaction.order_status}
               
                    </Text>
                  </View>
                </View>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.created_at)}
                </Text>
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Total Amount:</Text>
                  </View>
                  <Text style={styles.detailValue}>{formatCurrency(transaction.total)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons name="cube-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Items:</Text>
                  </View>
                  <Text style={styles.detailValue}>{transaction.item_count} items</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Ionicons name="card-outline" size={16} color="#666" />
                      <Text style={styles.detailLabel}>Card Number:</Text>
                    </View>
                    <Text style={styles.detailValue}>{transaction.customer_card_no}</Text>
                  </View>
              </View>

              <View style={styles.transactionActions}>
                <Pressable style={styles.actionButton}>
                  <Ionicons name="list-outline" size={18} color="#0066cc" />
                  <Text style={styles.actionButtonText}>View Items</Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Ionicons name="receipt-outline" size={18} color="#666" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>View Payments</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
    alignItems: 'flex-start',
    marginBottom: 12,
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
    fontSize: 12,
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
});