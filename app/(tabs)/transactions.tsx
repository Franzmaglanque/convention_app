import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/constants/payment';
import { TRANSACTION_STATUS, TRANSACTION_STATUS_COLORS, TRANSACTION_STATUS_LABELS } from '@/constants/transaction';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Mock transaction data type - replace with actual API types
interface Transaction {
  id: string;
  orderNo: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  itemsCount: number;
  customerName?: string;
}

// Mock transaction data - replace with actual API call
const mockTransactions: Transaction[] = [
  {
    id: '1',
    orderNo: 'ORD-2024-001',
    totalAmount: 1250.75,
    paymentMethod: PAYMENT_METHODS.PWALLET,
    status: TRANSACTION_STATUS.COMPLETED,
    createdAt: '2024-01-15T10:30:00Z',
    itemsCount: 5,
    customerName: 'John Doe'
  },
  {
    id: '2',
    orderNo: 'ORD-2024-002',
    totalAmount: 850.50,
    paymentMethod: PAYMENT_METHODS.GCASH,
    status: TRANSACTION_STATUS.COMPLETED,
    createdAt: '2024-01-15T11:15:00Z',
    itemsCount: 3,
    customerName: 'Jane Smith'
  },
  {
    id: '3',
    orderNo: 'ORD-2024-003',
    totalAmount: 2250.25,
    paymentMethod: PAYMENT_METHODS.CASH,
    status: TRANSACTION_STATUS.PENDING,
    createdAt: '2024-01-15T12:45:00Z',
    itemsCount: 8,
    customerName: 'Robert Johnson'
  },
  {
    id: '4',
    orderNo: 'ORD-2024-004',
    totalAmount: 450.00,
    paymentMethod: PAYMENT_METHODS.PWALLET,
    status: TRANSACTION_STATUS.COMPLETED,
    createdAt: '2024-01-14T09:20:00Z',
    itemsCount: 2,
    customerName: 'Maria Garcia'
  },
  {
    id: '5',
    orderNo: 'ORD-2024-005',
    totalAmount: 1750.00,
    paymentMethod: PAYMENT_METHODS.GCASH,
    status: TRANSACTION_STATUS.CANCELLED,
    createdAt: '2024-01-14T14:10:00Z',
    itemsCount: 6,
    customerName: 'David Wilson'
  },
  {
    id: '6',
    orderNo: 'ORD-2024-006',
    totalAmount: 3200.00,
    paymentMethod: PAYMENT_METHODS.CASH,
    status: TRANSACTION_STATUS.COMPLETED,
    createdAt: '2024-01-13T16:30:00Z',
    itemsCount: 12,
    customerName: 'Sarah Miller'
  },
];

export default function TransactionsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'completed', 'pending', 'cancelled'

  useEffect(() => {
    // Simulate API call
    const fetchTransactions = async () => {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await transactionService.getUserTransactions(user?.id);
      // setTransactions(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        setTransactions(mockTransactions);
        setLoading(false);
      }, 1000);
    };

    if (isAuthenticated) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filter);

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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case PAYMENT_METHODS.PWALLET:
        return 'wallet-outline';
      case PAYMENT_METHODS.GCASH:
        return 'phone-portrait-outline';
      case PAYMENT_METHODS.CASH:
        return 'cash-outline';
      default:
        return 'card-outline';
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.authRequiredContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#CCCCCC" />
          <Text style={styles.authRequiredTitle}>Authentication Required</Text>
          <Text style={styles.authRequiredText}>
            Please log in to view your transaction history
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>
          View and manage your past transactions
        </Text>
      </View>

      {/* Filter Buttons */}
      {/* <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <Pressable
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All Transactions
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === TRANSACTION_STATUS.COMPLETED && styles.filterButtonActive]}
          onPress={() => setFilter(TRANSACTION_STATUS.COMPLETED)}
        >
          <View style={[styles.statusDot, { backgroundColor: TRANSACTION_STATUS_COLORS[TRANSACTION_STATUS.COMPLETED] }]} />
          <Text style={[styles.filterButtonText, filter === TRANSACTION_STATUS.COMPLETED && styles.filterButtonTextActive]}>
            Completed
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === TRANSACTION_STATUS.PENDING && styles.filterButtonActive]}
          onPress={() => setFilter(TRANSACTION_STATUS.PENDING)}
        >
          <View style={[styles.statusDot, { backgroundColor: TRANSACTION_STATUS_COLORS[TRANSACTION_STATUS.PENDING] }]} />
          <Text style={[styles.filterButtonText, filter === TRANSACTION_STATUS.PENDING && styles.filterButtonTextActive]}>
            Pending
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === TRANSACTION_STATUS.CANCELLED && styles.filterButtonActive]}
          onPress={() => setFilter(TRANSACTION_STATUS.CANCELLED)}
        >
          <View style={[styles.statusDot, { backgroundColor: TRANSACTION_STATUS_COLORS[TRANSACTION_STATUS.CANCELLED] }]} />
          <Text style={[styles.filterButtonText, filter === TRANSACTION_STATUS.CANCELLED && styles.filterButtonTextActive]}>
            Cancelled
          </Text>
        </Pressable>
      </ScrollView> */}

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'You haven\'t made any transactions yet' 
                : `No ${filter} transactions found`}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>{transaction.orderNo}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: TRANSACTION_STATUS_COLORS[transaction.status as keyof typeof TRANSACTION_STATUS_COLORS] }]}>
                    <Text style={styles.statusText}>
                      {TRANSACTION_STATUS_LABELS[transaction.status as keyof typeof TRANSACTION_STATUS_LABELS]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Total Amount:</Text>
                  </View>
                  <Text style={styles.detailValue}>{formatCurrency(transaction.totalAmount)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons name={getPaymentMethodIcon(transaction.paymentMethod)} size={16} color="#666" />
                    <Text style={styles.detailLabel}>Payment Method:</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {PAYMENT_METHOD_LABELS[transaction.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || transaction.paymentMethod}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons name="cube-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Items:</Text>
                  </View>
                  <Text style={styles.detailValue}>{transaction.itemsCount} items</Text>
                </View>

                {transaction.customerName && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Ionicons name="person-outline" size={16} color="#666" />
                      <Text style={styles.detailLabel}>Customer:</Text>
                    </View>
                    <Text style={styles.detailValue}>{transaction.customerName}</Text>
                  </View>
                )}
              </View>

              <View style={styles.transactionActions}>
                <Pressable style={styles.actionButton}>
                  <Ionicons name="eye-outline" size={18} color="#0066cc" />
                  <Text style={styles.actionButtonText}>View Details</Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Ionicons name="print-outline" size={18} color="#666" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Print Receipt</Text>
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
    height: 40, // Fixed button height
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginTop: 10, // Position from top (60-40=20, so 10 from top leaves 10 at bottom)
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