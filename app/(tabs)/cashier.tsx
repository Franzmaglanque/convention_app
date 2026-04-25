import { useFetchCashiers } from '@/hooks/useSupplier';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    UIManager,
    View
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupervisorDashboard() {
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: cashiersData, isLoading: cashiersLoading,refetch } = useFetchCashiers();
  console.log('cashiersData', cashiersData);
  const activeCashier = cashiersData?.data.cashiers.find((c:any) => c.id === selectedCashierId);

  const handleSelectCashier = (id: string) => {
    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCashierId(id);
    setIsModalVisible(false); // Close modal after selecting
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTenderConfig = (type: string) => {
    switch(type) {
      case 'CASH': return { icon: 'cash-outline', color: '#2b8a3e', bg: '#d3f9d8' };
      case 'PWALLET': return { icon: 'wallet-outline', color: '#0a6cdc', bg: '#e7f1fc' };
      case 'GCASH': return { icon: 'phone-portrait-outline', color: '#0b7285', bg: '#c5f6fa' };
      default: return { icon: 'card-outline', color: '#495057', bg: '#e9ecef' };
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.blueHeader}>
        <View style={styles.headerTopRow}>
          <View>
            {/* <Text style={styles.dateSubtitle}>{cashiersData.shift_date}</Text> */}
            <Text style={styles.dateSubtitle}>Apr 24, 2026</Text>


            
            <Text style={styles.pageTitle}>Team Performance</Text>
          </View>
        </View>

        {/* --- Dropdown Selector Button --- */}
        <Text style={styles.selectorLabel}>SELECT CASHIER</Text>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setIsModalVisible(true)}
        >
          <View style={styles.dropdownButtonLeft}>
            <Ionicons name="person-circle-outline" size={24} color="#0a6cdc" />
            <Text style={[styles.dropdownButtonText, !activeCashier && styles.dropdownPlaceholder]}>
              {activeCashier ? activeCashier.full_name : 'Tap to select a cashier...'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#868e96" />
        </TouchableOpacity>

        {/* Expanding Statistics Section */}
        {activeCashier && (
          <View style={styles.statsContainer}>
            <View style={styles.totalOrdersContainer}>
              <Text style={styles.totalOrdersLabel}>TOTAL ORDERS HANDLED</Text>
              <Text style={styles.totalOrdersValue}>{activeCashier.total_orders}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: 'rgba(43, 138, 62, 0.4)' }]}>
                <View style={styles.summaryCardHeader}>
                  <Ionicons name="checkmark-circle" size={14} color="#69db7c" />
                  <Text style={styles.summaryLabel}>COMPLETED</Text>
                </View>
                <Text style={styles.summaryValue}>{activeCashier.status_breakdown.completed}</Text>
              </View>
              
              <View style={[styles.summaryCard, { borderColor: 'rgba(245, 159, 0, 0.4)' }]}>
                <View style={styles.summaryCardHeader}>
                  <Ionicons name="time" size={14} color="#ffd43b" />
                  <Text style={styles.summaryLabel}>PENDING</Text>
                </View>
                <Text style={styles.summaryValue}>{activeCashier.status_breakdown.pending}</Text>
              </View>
              
              <View style={[styles.summaryCard, { borderColor: 'rgba(224, 49, 49, 0.4)' }]}>
                <View style={styles.summaryCardHeader}>
                  <Ionicons name="close-circle" size={14} color="#ff8787" />
                  <Text style={styles.summaryLabel}>CANCELLED</Text>
                </View>
                <Text style={styles.summaryValue}>{activeCashier.status_breakdown.cancelled}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {activeCashier && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tender Breakdown</Text>
          <Text style={styles.sectionSubtitle}>Collection per payment method</Text>
        </View>
      )}
    </View>
  );

    //   const renderItem = ({ item }: { item: typeof cashiersData.data.cashiers['tenders'][0] }) => {
    //     const config = getTenderConfig(item.type);
    //     return (
    //       <View style={styles.card}>
    //         <View style={styles.cardLeft}>
    //           <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
    //             <Ionicons name={config.icon as any} size={24} color={config.color} />
    //           </View>
    //           <View>
    //             <Text style={styles.tenderType}>{item.type}</Text>
    //             <Text style={styles.tenderCount}>{item.count} Transactions</Text>
    //           </View>
    //         </View>
    //         <View style={styles.cardRight}>
    //           <Text style={styles.tenderTotal}>{formatCurrency(item.total)}</Text>
    //         </View>
    //       </View>
    //     );
    //   };
    const renderItem = ({ item }: { item: any }) => {
    const config = getTenderConfig(item.type);
    console.log('Rendering tender item', item);
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon as any} size={24} color={config.color} />
          </View>
          <View>
            <Text style={styles.tenderType}>{item.type}</Text>
            <Text style={styles.tenderCount}>{item.count} Transactions</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.tenderTotal}>{formatCurrency(item.total)}</Text>
        </View>
      </View>
    );
  };

//   const renderEmptyState = () => (
//     <View style={styles.emptyStateContainer}>
//       <View style={styles.emptyIconCircle}>
//         <Ionicons name="cash-outline" size={48} color="#adb5bd" />
//       </View>
//       <Text style={styles.emptyStateTitle}>Ready for Z-Reading</Text>
//       <Text style={styles.emptyStateSubtitle}>
//         Use the dropdown menu above to select a cashier and view their shift totals.
//       </Text>
//     </View>
//   );
    const renderEmptyState = () => {
    // If a cashier IS selected, but their tenders array is empty
    if (activeCashier) {
        return (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={48} color="#adb5bd" />
            </View>
            <Text style={styles.emptyStateTitle}>No Transactions</Text>
            <Text style={styles.emptyStateSubtitle}>
            {activeCashier.name} hasn't processed any orders yet.
            </Text>
        </View>
        );
    }

    // Default state: No cashier selected yet
    return (
        <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconCircle}>
            <Ionicons name="cash-outline" size={48} color="#adb5bd" />
        </View>
        <Text style={styles.emptyStateTitle}>Ready for Z-Reading</Text>
        <Text style={styles.emptyStateSubtitle}>
            Use the dropdown menu above to select a cashier and view their shift totals.
        </Text>
        </View>
    );
    };

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
  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={activeCashier ? activeCashier.tenders : []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* --- Bottom Sheet Modal for Cashier Selection --- */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Cashier</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#dee2e6" />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={cashiersData?.data.cashiers ?? []}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: 400 }} // Prevents modal from taking up the entire screen if there are 20 cashiers
                  renderItem={({ item }) => {
                    const isSelected = selectedCashierId === item.id;
                    return (
                      <TouchableOpacity 
                        style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                        onPress={() => handleSelectCashier(item.id)}
                      >
                        <View style={styles.modalOptionLeft}>
                          <Ionicons 
                            name="person" 
                            size={20} 
                            color={isSelected ? '#0a6cdc' : '#adb5bd'} 
                          />
                          <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                            {item.full_name}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark" size={24} color="#0a6cdc" />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6f9' },
  listContent: { paddingBottom: 24, flexGrow: 1 },
  
  blueHeader: {
    backgroundColor: '#0a6cdc', paddingTop: 40, paddingBottom: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 },
  backButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8, marginRight: 16 },
  dateSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  pageTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  // --- Dropdown Button Styles ---
  selectorLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', marginLeft: 20, marginBottom: 8, letterSpacing: 0.5 },
  dropdownButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownButtonText: { fontSize: 16, fontWeight: '600', color: '#212529' },
  dropdownPlaceholder: { color: '#868e96', fontWeight: '400' },

  statsContainer: { marginTop: 24, paddingHorizontal: 20 },
  totalOrdersContainer: { alignItems: 'center', marginBottom: 24 },
  totalOrdersLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  totalOrdersValue: { color: '#fff', fontSize: 48, fontWeight: 'bold', lineHeight: 52 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  summaryCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  summaryLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '700' },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  sectionSubtitle: { fontSize: 13, color: '#868e96', marginTop: 2 },

  card: {
    backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 12, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tenderType: { fontSize: 16, fontWeight: 'bold', color: '#212529', marginBottom: 4 },
  tenderCount: { fontSize: 13, color: '#868e96', fontWeight: '500' },
  cardRight: { alignItems: 'flex-end' },
  tenderTotal: { fontSize: 18, fontWeight: 'bold', color: '#212529' },

  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#495057', marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, color: '#868e96', textAlign: 'center', lineHeight: 20 },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Pushes the modal to the bottom
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Extra padding for iOS home indicator
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  modalOptionActive: { backgroundColor: '#e7f1fc' },
  modalOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalOptionText: { fontSize: 16, color: '#495057', fontWeight: '500' },
  modalOptionTextActive: { color: '#0a6cdc', fontWeight: 'bold' },
});