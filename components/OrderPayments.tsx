import { PAYMENT_STATUS_COLORS } from '@/constants/payment';
import { useFetchOrderPayments } from '@/hooks/useOrder';
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

interface Payment {
    id: string;
    payment_method: string;
    amount: string;
    status: string;
    reference_no?: string;
    cash_bill?: number;
    cash_change?: number;
    created_at: string;
}

interface OrderPaymentListProps {
    order_no: string;
    visible: boolean;
    onClose: () => void;
}

const PaymentItem = ({ item }: { item: Payment }) => {
    console.log('item payment',item);
    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'CASH': return 'cash-outline';
            case 'PWALLET': return 'wallet-outline';
            case 'CARD': return 'card-outline';
            default: return 'help-circle-outline';
        }
    };

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return '₱0.00';
        return `₱${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
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

    const statusColor = PAYMENT_STATUS_COLORS[item.status as keyof typeof PAYMENT_STATUS_COLORS] || '#666';

    return (
        <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
                <View style={styles.methodContainer}>
                    <Ionicons name={getMethodIcon(item.payment_method) as any} size={20} color="#0066cc" />
                    <Text style={styles.methodText}>{item.payment_method}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount Tendered:</Text>
                    {/* <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text> */}
                    <Text style={styles.amountValue}>{item.amount}</Text>
                </View>
                
                {item.payment_method === 'CASH' && (
                    <>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Cash Bill:</Text>
                            <Text style={styles.detailValue}>{formatCurrency(item.cash_bill)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Cash Change:</Text>
                            <Text style={styles.detailValue}>{formatCurrency(item.cash_change)}</Text>
                        </View>
                    </>
                )}

                {item.reference_no && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Ref No:</Text>
                        <Text style={styles.detailValue}>{item.reference_no}</Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
                </View>
            </View>
        </View>
    );
};

const OrderPaymentList: React.FC<OrderPaymentListProps> = ({ order_no, visible, onClose }) => {
    const {
        data: order_payments,
        isLoading,
        isError,
        refetch,
        isRefetching
    } = useFetchOrderPayments(order_no);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>Loading Payments...</Text>
            </View>
        );
    }

    const totalPaid = order_payments?.data.reduce((sum:number, p:Payment) => sum + parseFloat(p.amount), 0);

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
                            Order Payments {order_no}
                        </Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#333" />
                        </Pressable>
                    </View>

                    <View style={styles.modalContent}>
                        <FlatList
                            data={order_payments?.data}
                            renderItem={({ item }) => <PaymentItem item={item} />}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
                                    <Text style={styles.emptyText}>No payments found</Text>
                                </View>
                            }
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefetching}
                                    onRefresh={refetch}
                                    colors={['#0066cc']}
                                    tintColor={'#0066cc'}
                                />
                            }
                        />
                    </View>

                    <View style={styles.modalFooter}>
                        <View style={styles.footerRow}>
                            <View style={styles.footerItem}>
                                <Ionicons name="cash-outline" size={16} color="#666" />
                                <Text style={styles.footerLabel}>Total Paid:</Text>
                                <Text style={styles.footerValue}>₱{totalPaid}</Text>
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
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
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
    paymentCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#0066cc',
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    methodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    methodText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    paymentDetails: {
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    amountValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28a745',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
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
        justifyContent: 'flex-end',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    footerValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0066cc',
    },
});

export default OrderPaymentList;
