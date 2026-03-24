import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const screenWidth = Dimensions.get('window').width;

  // --- NEW: Refresh State & Function ---
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate an API network call. 
    // TODO: Replace this setTimeout with your actual API refetch function later!
    setTimeout(() => {
      console.log('Dashboard data refreshed!');
      setRefreshing(false); // Hides the spinner
    }, 1500);
    
  }, []);

  // Mock data for dashboard
  const salesData = {
    currentDay: 125430.75,
    overallConvention: 387650.50,
    topItems: [
      { name: 'BUY 2 TIES GREAT TASTE WHITE TWIN 50GX10S FOR ONLY PHP215.00', sold: 245, revenue: 61250 },
      { name: 'BUY 2 CASES C2 SOLO GREEN TEA APPLE 230ML X 24S FREE 8 PIECES JNJ MANG JUAN SUKANG PAOMBONG 26G', sold: 189, revenue: 28350 },
      { name: 'BUY 1 BOTTLE LE MINERALE 600ML FOR ONLY PHP16.00', sold: 156, revenue: 23400 },
      { name: 'BUY 1 BOTTLE KOPIKO LUCKY DAY 180ML FOR ONLY PHP20.00', sold: 132, revenue: 19800 },
      { name: 'BUY 1 TIE KOPIKO BROWN TWIN 53GX10S FOR ONLY PHP122.00', sold: 98, revenue: 14700 },
    ],
    paymentBreakdown: [
      { type: 'P-Wallet', amount: 155320, percentage: 40, color: '#9C27B0', legendFontColor: '#3A3A3C', legendFontSize: 12 },
      { type: 'GCash', amount: 116490, percentage: 30, color: '#007AFF', legendFontColor: '#3A3A3C', legendFontSize: 12 },
      { type: 'Cash', amount: 115840.50, percentage: 30, color: '#34C759', legendFontColor: '#3A3A3C', legendFontSize: 12 },
    ],
    chartLabels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Today'],
    chartData: [45000, 52000, 48000, 61000, 125430],
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Brand Blue
    labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`, // Muted Gray
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#F2F2F7',
      strokeDasharray: '', // Solid subtle lines instead of dashes
    },
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Dynamic Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Masayang Araw,</Text>
          <Text style={styles.userName}>{user?.fullname || 'Supervisor'}</Text>
        </View>
        <View style={styles.headerIconBg}>
          <Ionicons name="storefront-outline" size={24} color="#007AFF" />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} // Spinner visible while refetching
            onRefresh={onRefresh}        // Calls the hook's refetch function
            colors={['#0066cc']}      // Spinner color (Android)
            tintColor={'#0066cc'}     // Spinner color (iOS)
          />
        }  
      >
        {/* At-a-Glance Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.todayCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.summaryLabelLight}>Today's Revenue</Text>
              <Ionicons name="trending-up" size={20} color="#E8F4FF" />
            </View>
            <Text style={styles.summaryValueLight}>{formatCurrency(salesData.currentDay)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.overallCard]}>
             <View style={styles.cardHeader}>
              <Text style={styles.summaryLabelDark}>Total Convention</Text>
              <Ionicons name="wallet-outline" size={20} color="#8E8E93" />
            </View>
            <Text style={styles.summaryValueDark}>{formatCurrency(salesData.overallConvention)}</Text>
          </View>
        </View>

        {/* Sales Trend Chart */}
        {/* <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sales Trend</Text>
            <Ionicons name="bar-chart-outline" size={20} color="#8E8E93" />
          </View>
          <BarChart
            data={{
              labels: salesData.chartLabels,
              datasets: [{ data: salesData.chartData }],
            }}
            width={screenWidth - 48} // Width minus padding
            height={220}
            yAxisLabel="₱"
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
          />
        </View> */}

        {/* Top Selling Items */}
        <View style={styles.sectionCard}>
           <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Selling Items</Text>
            <Ionicons name="star-outline" size={20} color="#FF9500" />
          </View>
          
          {/* {salesData.topItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <View style={[styles.rankBadge, index === 0 && styles.rankBadgeTop]}>
                  <Text style={[styles.rankText, index === 0 && styles.rankTextTop]}>
                    #{index + 1}
                  </Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSold}>{item.sold} units sold</Text>
                </View>
              </View>
              <Text style={styles.itemRevenue}>{formatCurrency(item.revenue)}</Text>
            </View>
          ))} */}
          {salesData.topItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <View style={[styles.rankBadge, index === 0 && styles.rankBadgeTop]}>
                  <Text style={[styles.rankText, index === 0 && styles.rankTextTop]}>
                    #{index + 1}
                  </Text>
                </View>
                {/* ADDED styles.itemDetails HERE */}
                <View style={styles.itemDetails}>
                  <Text 
                    style={styles.itemName} 
                    numberOfLines={2} // Allows 2 lines, then truncates
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.itemSold}>{item.sold} units sold</Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemRevenue}>{formatCurrency(item.revenue)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Breakdown */}
        <View style={styles.sectionCard}>
           <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenue by Payment Method</Text>
            <Ionicons name="pie-chart-outline" size={20} color="#8E8E93" />
          </View>
          
          <PieChart
            // 1. Map over the data to map "type" to "name" to prevent internal library warnings
            data={salesData.paymentBreakdown.map(item => ({ ...item, name: item.type }))}
            width={screenWidth - 48}
            height={180}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft={(screenWidth / 4 - 40).toString()} // Centers the pie chart dynamically
            absolute
            hasLegend={false} // 2. THIS IS THE FIX: Hides the broken default legend
          />
          
          {/* Custom Legend for cleaner look */}
          <View style={styles.legendContainer}>
            {salesData.paymentBreakdown.map((method, index) => (
              <View key={index} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.colorDot, { backgroundColor: method.color }]} />
                  <Text style={styles.legendType}>{method.type}</Text>
                  <Text style={styles.legendPercent}>({method.percentage}%)</Text>
                </View>
                <Text style={styles.legendAmount}>{formatCurrency(method.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS App Background Gray
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerIconBg: {
    backgroundColor: '#F0F7FF',
    padding: 10,
    borderRadius: 12,
  },

  // --- Summary Grid ---
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCard: {
    backgroundColor: '#007AFF', // Solid brand color for the primary metric
  },
  overallCard: {
    backgroundColor: '#FFFFFF', // White for secondary metric
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabelLight: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E8F4FF',
  },
  summaryLabelDark: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  summaryValueLight: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryValueDark: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },

  // --- Section Cards ---
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
    marginLeft: -10, // Pulls the chart slightly left to align with card padding
  },

  // --- Top Items List ---
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Centers the badge and revenue vertically with the text block
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // CRITICAL: Forces the left side to respect screen width
    marginRight: 12, // Ensures text never touches the revenue numbers
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeTop: {
    backgroundColor: '#FFFBE6', 
    borderColor: '#FFCC00',
    borderWidth: 1,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },
  rankTextTop: {
    color: '#FF9500', 
  },
  itemDetails: {
    flex: 1, // CRITICAL: Allows the text container to shrink and wrap
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 13, // Slightly reduced font size to accommodate long promo names
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    lineHeight: 18, // Added line-height for better readability when it wraps to 2 lines
  },
  itemSold: {
    fontSize: 12,
    color: '#8E8E93',
  },
 itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0, // CRITICAL: This makes the container invincible to shrinking!
    paddingLeft: 8, // Adds a little extra safety buffer from the text
  },
  itemRevenue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    flexShrink: 0, 
  },

  // --- Payment Legend ---
  legendContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginRight: 6,
  },
  legendPercent: {
    fontSize: 13,
    color: '#8E8E93',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});