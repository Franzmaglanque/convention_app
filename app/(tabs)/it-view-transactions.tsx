import LoadOrderItems from '@/components/LoadOrderItems';
import OrderItemList from '@/components/OrderItems';
import OrderPaymentList from '@/components/OrderPayments';
import ReturnedItemsList from '@/components/ReturnedItems';
import { TRANSACTION_STATUS_COLORS } from '@/constants/transaction';
import { useFetchActiveSuppliers } from '@/hooks/useIt';
import { useFetchItSupplierOrders } from '@/hooks/useOrder';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// You will need to import whatever Picker/Select component you use in your app
// import { Picker } from '@react-native-picker/picker'; 
interface Vendor {
  code: string;
  name: string;
  vendor_code:string;
  vendor_name:string;
  id:number;
}
interface VendorSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (vendor: Vendor) => void;
  selected: Vendor | null;
  vendorList: Vendor[];
}
const C = {
  bg: "#F5F8FF",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF4FF",
  border: "#DCE8FF",
  accent: "#2F80ED",
  accentLight: "#D6E8FF",
  accentMid: "#5B9CF6",
  textPrimary: "#0F1F3D",
  textSecondary: "#5A6A85",
  textMuted: "#A0AEC0",
  danger: "#E53E3E",
  dangerLight: "#FFF0F0",
  success: "#2F9E44",
  successLight: "#EBFBEE",
  warn: "#D97706",
  warnLight: "#FFFBEB",
  shadow: "rgba(47,128,237,0.10)",
};
const VendorSelectorModal: React.FC<VendorSelectorModalProps> = ({
  visible, onClose, onSelect, selected,vendorList
}) => (
  <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayDismiss} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Select Vendor</Text>
        <FlatList
            //   data={VENDORS}
          data={vendorList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isActive = selected?.vendor_code === item.vendor_code;
            return (
              <TouchableOpacity
                style={[styles.vendorRow, isActive && styles.vendorRowActive]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={[styles.codePill, isActive && styles.codePillActive]}>
                  <Text style={[styles.codePillText, isActive && styles.codePillTextActive]}>
                    {item.vendor_code}
                  </Text>
                </View>
                <Text style={[styles.vendorRowName, isActive && { color: C.accent }]}>
                  {item.vendor_name}
                </Text>
                {isActive && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity style={styles.sheetCancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);


export default function ItTransactionsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [selectedVendorCode, setSelectedVendorCode] = useState<string | null>(null);
    const [vendorModalOpen, setVendorModalOpen] = useState<boolean>(false);
    
    const { data:activeVendors } = useFetchActiveSuppliers();
    const {
        data: transactions,
        isLoading,
        isError,
        refetch,
        isRefetching
    } = useFetchItSupplierOrders(selectedVendorCode);

    // Modal States
    const [isItemsModalVisible, setIsItemsModalVisible] = useState(false);
    const [isLoadModalVisible, setIsLoadModalVisible] = useState(false);
    const [isPaymentsModalVisible, setIsPaymentsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isReturnedItemsModalVisible, setIsReturnedItemsModalVisible] = useState(false);
    const [selectedReturnId, setSelectedReturnId] = useState<any>(null);

    const handleViewItems = (transaction: any) => {
      console.log("Selected Transaction:", transaction); // Debug log to check transaction data
  
      setSelectedOrder(transaction.order_no);
      transaction?.order_type === 'LOAD' ? setIsLoadModalVisible(true) : setIsItemsModalVisible(true);
    };
  
    const handleViewPayments = (transaction: any) => {
      setSelectedOrder(transaction.order_no);
      setIsPaymentsModalVisible(true);
    };
  
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      
      return dayjs(dateString).format('MMM D, YYYY, hh:mm A');
    };

    const filteredData = useMemo(() => {
        if (!transactions?.data) return [];
        if (!searchQuery.trim()) return transactions?.data;

        const lowerCaseQuery = searchQuery.toLowerCase();
        
        return transactions.data.filter((transaction:any) => {
        const matchOrderNo = transaction.order_no?.toLowerCase().includes(lowerCaseQuery);
        const matchCustomerCard = transaction.customer_card_no?.toLowerCase().includes(lowerCaseQuery);
        const matchStatus = transaction.order_status?.toLowerCase().includes(lowerCaseQuery);
        const matchCashier = transaction.full_name?.toLowerCase().includes(lowerCaseQuery);
        
        return matchOrderNo || matchCustomerCard || matchStatus || matchCashier;
        });
    }, [transactions, searchQuery]);

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
        if (!selectedVendorCode) return; // Don't refresh if no vendor is selected
        
        setRefreshing(true);
        try {
        if (refetch) await refetch(); 
        } catch (error) {
        console.error("Failed to refresh data", error);
        } finally {
        setRefreshing(false);
        }
    };

    const handleViewReturnedItems = (transaction: any) => {
        setSelectedReturnId(transaction.return_id); // Pass the return_id to your future modal
        setIsReturnedItemsModalVisible(true);
    };
    const handleSelectVendor = (vendor: Vendor): void => {
        console.log('select vendor');
        setSelectedVendor(vendor);
        setSelectedVendorCode(vendor.vendor_code)
        console.log('vendor',vendor);
    };

    return (
        <SafeAreaView style={styles.container}>
           {/* ✨ OPTIMIZED: Compact Header & Toolbar Group */}
            <View style={styles.toolbarContainer}>
            <Text style={styles.title}>IT Support: Transactions</Text>

            {/* Vendor Selector - Now styled like a compact button/pill */}
            <TouchableOpacity 
                style={styles.vendorSelector}
                onPress={() => {
                    setVendorModalOpen(true)
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="business" size={18} color="#0066cc" style={{ marginRight: 8 }} />
                <Text style={selectedVendorCode ? styles.vendorTextActive : styles.vendorTextPlaceholder}>
                    {selectedVendorCode ? `Vendor: ${selectedVendorCode}` : 'Select a Vendor...'}
                </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#666" />
            </TouchableOpacity>

            {/* Search Bar - Tightly integrated below the vendor selector */}
            {selectedVendorCode && (
                <View style={styles.compactSearchContainer}>
                <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                    style={styles.compactSearchInput}
                    placeholder="Search by name, barcode, or SKU..."
                    placeholderTextColor="#8E8E93"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                    <Ionicons name="close-circle" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                )}
                </View>
            )}
            </View>

            {/* ✨ CONDITIONAL RENDERING FOR CONTENT */}
            {!selectedVendorCode ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={56} color="#ccc" />
                <Text style={styles.emptyText}>No Vendor Selected</Text>
                <Text style={styles.emptySubtext}>Tap the selector above to view transactions.</Text>
            </View>
            ) : isLoading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
            ) : (
            <FlatList
                data={filteredData || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }} // Added slight top padding
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No transactions found.</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
            )}

            {/* Keep your modals here */}
            <OrderItemList order_no={selectedOrder} visible={isItemsModalVisible} onClose={() => setIsItemsModalVisible(false)} />
            <LoadOrderItems order_no={selectedOrder} visible={isLoadModalVisible} onClose={() => setIsLoadModalVisible(false)} />
            <ReturnedItemsList returned_id={selectedReturnId} visible={isReturnedItemsModalVisible} onClose={() => setIsReturnedItemsModalVisible(false)} />
            <OrderPaymentList order_no={selectedOrder} visible={isPaymentsModalVisible} onClose={() => setIsPaymentsModalVisible(false)} />
            <VendorSelectorModal
                visible={vendorModalOpen}
                onClose={() => setVendorModalOpen(false)}
                onSelect={handleSelectVendor}
                selected={selectedVendor}
                vendorList={activeVendors?.data}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    toolbarContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 10, // Creates consistent, tight spacing between title, selector, and search
    elevation: 2, // Slight shadow on Android to separate toolbar from list
    shadowColor: '#000', // Shadow on iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    zIndex: 10, 
  },
  title: {
    fontSize: 20, // Slightly reduced from typical 24 to save space
    fontWeight: '700',
    color: '#1C1C1E',
  },
  vendorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7', // iOS grey background
    paddingHorizontal: 12,
    paddingVertical: 10, // Tighter than before
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  vendorTextPlaceholder: {
    fontSize: 15,
    color: '#8E8E93',
  },
  vendorTextActive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  compactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40, // Fixed compact height
  },
  searchIcon: {
    marginRight: 6,
  },
  compactSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    height: '100%',
  },
  clearIcon: {
    padding: 4,
  },
    vendorRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        gap: 12,
    },
    vendorRowActive: {
        backgroundColor: C.accentLight,
    },
    vendorRowName: {
        flex: 1,
        fontSize: 14,
        color: C.textSecondary,
        fontWeight: "500",
    },
    codePill: {
        backgroundColor: C.surfaceAlt,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: C.border,
    },
    codePillActive: {
        backgroundColor: C.accentLight,
        borderColor: C.accentMid,
    },
    codePillText: {
        fontSize: 11,
        fontWeight: "800",
        color: C.textSecondary,
        letterSpacing: 0.8,
    },
    codePillTextActive: {
        color: C.accent,
    },
    checkmark: {
        fontSize: 16,
        fontWeight: "700",
        color: C.accent,
    },
    sheetCancelBtn: {
        marginHorizontal: 20,
        marginTop: 14,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: C.border,
        alignItems: "center",
        backgroundColor: C.surfaceAlt,
    },
    sheetCancelText: {
        color: C.textSecondary,
        fontSize: 15,
        fontWeight: "600",
    },
     overlay: {
        flex: 1,
        backgroundColor: "rgba(15,31,61,0.35)",
        justifyContent: "flex-end",
      },
      overlayDismiss: {
        ...StyleSheet.absoluteFillObject,
      },
      sheet: {
        backgroundColor: C.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 36 : 28,
        borderTopWidth: 1.5,
        borderColor: C.border,
      },
      sheetHandle: {
        width: 36,
        height: 4,
        backgroundColor: C.border,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
      },
      sheetTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: C.textPrimary,
        paddingHorizontal: 20,
        marginBottom: 8,
      },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
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
  searchInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1C1C1E',
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
  vendorSelectContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorSelectLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  vendorDropdownPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  vendorDropdownText: {
    fontSize: 16,
    color: '#333',
  },
});


