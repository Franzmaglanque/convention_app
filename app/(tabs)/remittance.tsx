import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    LayoutAnimation,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Updated Mock Data for 3-Day Convention ---
const mockData = [
  {
    id: '1',
    receipt_no: '000035',
    convention_day: 'Day 3',
    date: 'Apr 24, 2026',
    amount: 85000.00,
    remitted_by: 'Lovely Doris Tibar',
    short_name: 'Lovely Doris',
    verified_by: 'Admin',
    supplier_code: '11460',
    type: 'FULL'
  },
  {
    id: '2',
    receipt_no: '000030',
    convention_day: 'Day 2',
    date: 'Apr 23, 2026',
    amount: 71334.00,
    remitted_by: 'Lovely Doris Tibar',
    short_name: 'Lovely Doris',
    verified_by: 'Dionela, Daiserie',
    supplier_code: '11460',
    type: 'FULL'
  },
  {
    id: '3',
    receipt_no: '000029',
    convention_day: 'Day 1',
    date: 'Apr 22, 2026',
    amount: 42500.00,
    remitted_by: 'Marco Reyes',
    short_name: 'Marco Reyes',
    verified_by: 'Admin',
    supplier_code: '11460',
    type: 'PARTIAL'
  },
  {
    id: '4',
    receipt_no: '000028',
    convention_day: 'Day 1',
    date: 'Apr 22, 2026',
    amount: 20000.00,
    remitted_by: 'Marco Reyes',
    short_name: 'Marco Reyes',
    verified_by: 'Admin',
    supplier_code: '11460',
    type: 'FULL'
  }
];

export default function RemittanceScreen() {
  const [selectedDay, setSelectedDay] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    // Abbreviate large numbers for the summary boxes (e.g., 150000 -> 150k)
    if (amount >= 1000) {
      return `₱${(amount / 1000).toFixed(1)}k`;
    }
    return `₱${amount.toFixed(2)}`;
  };

  const formatFullCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- Dynamic Calculations based on selected filter ---
  const filteredData = useMemo(() => {
    if (selectedDay === 'All') return mockData;
    return mockData.filter(item => item.convention_day === selectedDay);
  }, [selectedDay]);

  const summary = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      acc.total += item.amount;
      if (item.type === 'FULL') acc.full += item.amount;
      if (item.type === 'PARTIAL') acc.partial += item.amount;
      return acc;
    }, { total: 0, full: 0, partial: 0 });
  }, [filteredData]);

  // --- Header & Summaries Component ---
  const ListHeader = () => (
    <View>
      <View style={styles.blueHeader}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.supplierText}>SUPPLIER #11460</Text>
            <Text style={styles.pageTitle}>Remittances</Text>
          </View>
        </View>

        {/* Dynamic Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>GRAND TOTAL</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>FULL</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.full)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>PARTIAL</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.partial)}</Text>
          </View>
        </View>
      </View>

      {/* Convention Day Filters */}
      <View style={styles.filterRow}>
        {['All', 'Day 1', 'Day 2', 'Day 3'].map((day, index) => {
          const isActive = selectedDay === day;
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedDay(day);
                setExpandedId(null); // Close any open accordion when switching tabs
              }}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // --- Individual Card Component ---
  const renderItem = ({ item }: { item: typeof mockData[0] }) => {
    const isExpanded = expandedId === item.id;
    const isFull = item.type === 'FULL';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={styles.iconBox}>
              <Ionicons name="receipt-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.receiptNo}>Receipt #{item.receipt_no}</Text>
              <Text style={styles.dateText}>{item.convention_day} • {item.date}</Text>
            </View>
          </View>
          
          <View style={styles.cardTopRight}>
            <Text style={styles.mainAmount}>{formatFullCurrency(item.amount)}</Text>
            <View style={[styles.statusPill, isFull ? styles.statusFull : styles.statusPartial]}>
              <View style={[styles.statusDot, isFull ? styles.dotFull : styles.dotPartial]} />
              <Text style={[styles.statusText, isFull ? styles.textFull : styles.textPartial]}>
                {item.type}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.toggleRow} onPress={() => toggleExpand(item.id)}>
          <View style={styles.toggleLeft}>
            <Ionicons name="person-outline" size={16} color="#868e96" />
            <Text style={styles.toggleLabel}> By: <Text style={styles.toggleName}>{item.short_name}</Text></Text>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#adb5bd" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <DetailRow icon="document-text-outline" label="Receipt No." value={`#${item.receipt_no}`} />
            <DetailRow icon="business-outline" label="Supplier Code" value={item.supplier_code} />
            <DetailRow icon="person-outline" label="Remitted By" value={item.remitted_by} />
            <DetailRow icon="checkmark-circle-outline" label="Verified By" value={item.verified_by} />
            
            <View style={styles.detailRow}>
               <View style={styles.detailLeft}>
                 <Ionicons name="time-outline" size={16} color="#adb5bd" style={styles.detailIcon} />
                 <Text style={styles.detailLabel}>Type</Text>
               </View>
               <View style={[styles.statusPill, isFull ? styles.statusFull : styles.statusPartial]}>
                 <View style={[styles.statusDot, isFull ? styles.dotFull : styles.dotPartial]} />
                 <Text style={[styles.statusText, isFull ? styles.textFull : styles.textPartial]}>{item.type}</Text>
               </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const DetailRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={16} color="#adb5bd" style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6f9' },
  listContent: { paddingBottom: 24 },
  
  blueHeader: {
    backgroundColor: '#0a6cdc',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8, marginRight: 16 },
  supplierText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  pageTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#e9ecef', borderRadius: 20 },
  filterPillActive: { backgroundColor: '#0a6cdc' },
  filterText: { color: '#495057', fontWeight: '600', fontSize: 14 },
  filterTextActive: { color: '#fff' },
  
  card: {
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { backgroundColor: '#0a6cdc', width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  receiptNo: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
  dateText: { fontSize: 12, color: '#868e96', marginTop: 2 },
  cardTopRight: { alignItems: 'flex-end', gap: 6 },
  mainAmount: { fontSize: 16, fontWeight: 'bold', color: '#0a6cdc' },
  
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusFull: { backgroundColor: '#d3f9d8' },
  statusPartial: { backgroundColor: '#fff3cd' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotFull: { backgroundColor: '#2b8a3e' },
  dotPartial: { backgroundColor: '#f59f00' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  textFull: { color: '#2b8a3e' },
  textPartial: { color: '#f59f00' },
  
  divider: { height: 1, backgroundColor: '#f1f3f5', marginVertical: 12 },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { fontSize: 13, color: '#868e96', marginLeft: 6 },
  toggleName: { color: '#212529', fontWeight: '600' },
  
  expandedContent: { marginTop: 16, gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLeft: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { marginRight: 8 },
  detailLabel: { fontSize: 13, color: '#868e96' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#212529' },
  
  totalBox: { backgroundColor: '#e7f1fc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 8 },
  totalBoxLabel: { color: '#0a6cdc', fontWeight: '600', fontSize: 14 },
  totalBoxAmount: { color: '#0a6cdc', fontWeight: 'bold', fontSize: 18 },
});