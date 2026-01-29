import { Link, router } from 'expo-router';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';


export default function HomeScreen() {
  // Mock data for dashboard
  const salesData = {
    currentDay: 125430.75,
    overallConvention: 387650.50,
    topItems: [
      { name: 'Premium Rice', sold: 245, revenue: 61250 },
      { name: 'Cooking Oil', sold: 189, revenue: 28350 },
      { name: 'Canned Goods', sold: 156, revenue: 23400 },
      { name: 'Bottled Water', sold: 132, revenue: 19800 },
      { name: 'Snacks', sold: 98, revenue: 14700 },
    ],
    paymentBreakdown: [
      { type: 'Pwallet', amount: 155320, percentage: 40 },
      { type: 'Gcash', amount: 116490, percentage: 30 },
      { type: 'Cash', amount: 115840.50, percentage: 30 },
    ],
    statusBreakdown: [
      { status: 'Completed', count: 342, percentage: 85 },
      { status: 'Pending', count: 45, percentage: 11 },
      { status: 'Cancelled', count: 13, percentage: 4 },
    ],
  };

  const screenWidth = Dimensions.get('window').width;

  // Prepare data for pie charts
  const paymentChartData = salesData.paymentBreakdown.map((item, index) => ({
    name: item.type,
    population: item.amount,
    color: ['#FF6384', '#36A2EB', '#FFCE56'][index],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const statusChartData = salesData.statusBreakdown.map((item, index) => ({
    name: item.status,
    population: item.count,
    color: ['#4CAF50', '#FF9800', '#F44336'][index],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  // Prepare data for bar chart (top items)
  const barChartData = {
    labels: salesData.topItems.map(item => item.name.substring(0, 8) + '...'),
    datasets: [{
      data: salesData.topItems.map(item => item.sold)
    }]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Dashboard</Text>
        <Text style={styles.subtitle}>Puregold Convention POS - Real-time Statistics</Text>
      </View>

      {/* Total Sales Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total Sales</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's Sales</Text>
            <Text style={styles.statValue}>₱{salesData.currentDay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statSubtext}>Current Day</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Convention Total</Text>
            <Text style={styles.statValue}>₱{salesData.overallConvention.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statSubtext}>3-Day Total</Text>
          </View>
        </View>
      </View>

      {/* Top Ranking Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Items</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={barChartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" sold"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#0066cc'
              }
            }}
            style={styles.chart}
          />
        </View>
        
        <View style={styles.itemsList}>
          {salesData.topItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemRank}>#{index + 1}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <View style={styles.itemStats}>
                <Text style={styles.itemSold}>{item.sold} sold</Text>
                <Text style={styles.itemRevenue}>₱{item.revenue.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Sales Breakdown by Payment Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales by Payment Type</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={paymentChartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        
        <View style={styles.breakdownList}>
          {salesData.paymentBreakdown.map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.colorDot, { backgroundColor: paymentChartData[index].color }]} />
                <Text style={styles.breakdownLabel}>{item.type}</Text>
              </View>
              <View style={styles.breakdownRight}>
                <Text style={styles.breakdownAmount}>₱{item.amount.toLocaleString()}</Text>
                <Text style={styles.breakdownPercentage}>{item.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Sales Breakdown by Order Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders by Status</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={statusChartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        
        <View style={styles.breakdownList}>
          {salesData.statusBreakdown.map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.colorDot, { backgroundColor: statusChartData[index].color }]} />
                <Text style={styles.breakdownLabel}>{item.status}</Text>
              </View>
              <View style={styles.breakdownRight}>
                <Text style={styles.breakdownAmount}>{item.count} orders</Text>
                <Text style={styles.breakdownPercentage}>{item.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Pressable
            style={styles.button}
            onPress={() => router.push('/(auth)/login')}
            >
            <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Link href="/products" asChild>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Browse Products</Text>
          </View>
        </Link>
      </View>
    </ScrollView>
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
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  itemsList: {
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginRight: 10,
    width: 30,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  itemStats: {
    alignItems: 'flex-end',
  },
  itemSold: {
    fontSize: 14,
    color: '#666',
  },
  itemRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  breakdownList: {
    marginTop: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  breakdownLabel: {
    fontSize: 16,
    color: '#333',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  breakdownPercentage: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});