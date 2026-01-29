import BarcodeScanner from '@/components/BarcodeScanner';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/hooks/useAuth';
import { newOrder } from '@/hooks/useOrder';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Mock product interface - in a real app, this would come from your types
interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}



// Mock API service - replace with your actual API calls
const orderService = {
  createNewTransaction: async (): Promise<{ orderNo: string }> => {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const orderNo = `ORD-${Date.now().toString().slice(-8)}`;
        resolve({ orderNo });
      }, 500);
    });
  }
};

export default function CartScreen() {
  const { user, isAuthenticated } = useAuth();
  console.log('user in cart screen:', user);
  const newOrderMutation = newOrder({
      user_id: user?.id || null,
      vendor_code: user?.supplier_code || null,
  });
  const [showScanner, setShowScanner] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

    const handleNewTransaction = async () => {
    if (cartItems.length > 0) {
      Alert.alert(
        'Start New Transaction',
        'You have items in the current cart. Starting a new transaction will clear the current cart. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'New Transaction',
            style: 'destructive',
            onPress: () => createNewTransaction()
          }
        ]
      );
    } else {
      createNewTransaction();
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This will clear all items from the cart.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => {
            setCartItems([]);
            setOrderNo(null);
            showInfo('Order cancelled successfully');
          }
        }
      ]
    );
  };

  // const createNewTransaction = async () => {
  //   setIsCreatingTransaction(true);
  //   try {
  //     // Call the mutation with success/error handlers
  //     newOrderMutation.mutate(undefined, {
  //       onSuccess: (response) => {
  //         // The response here is the data from orderService.newOrder()
  //         console.log('New order mutation result:', response);
          
  //         // Extract order_no from the response
  //         const orderNo = response.data?.order_no;
  //         if (orderNo) {
  //           setOrderNo(orderNo.toString());
  //           setCartItems([]); // Clear existing cart items
  //           showSuccess(`New transaction started: ${orderNo}`);
  //         } else {
  //           showError('Failed to get order number from response');
  //         }
  //       },
  //       onError: (error) => {
  //         showError('Failed to create new transaction. Please try again.');
  //       }
  //     });
      
  //     // Note: You can remove the mock orderService.createNewTransaction() call
  //     // since you're now using the real API through the mutation
  //   } catch (error) {
  //     showError('Failed to create new transaction. Please try again.');
  //   } finally {
  //     setIsCreatingTransaction(false);
  //   }
  // };
  const createNewTransaction = async () => {
    setIsCreatingTransaction(true);
    try {
      // Use mutateAsync to get a Promise
      const response = await newOrderMutation.mutateAsync();
      console.log('New order mutation result:', response);
      
      // Extract order_no from the response
      const orderNo = response.data?.order_no;
      if (orderNo) {
        setOrderNo(orderNo.toString());
        setCartItems([]);
        showSuccess(`New transaction started: ${orderNo}`);
      } else {
        showError('Failed to get order number from response');
      }
    } catch (error) {
      showError('Failed to create new transaction. Please try again.');
    } finally {
      setIsCreatingTransaction(false);
    }
  };


  const handleBarcodeScanned = async (barcodeData: string) => {
    if (!orderNo) {
      showError('Please start a new transaction first');
      return;
    }

    try {
      // In a real app, you would fetch product data from your backend
      // const product = await storesService.findProductByBarcode(barcodeData);
      
      // Mock product data for demonstration
      const mockProduct: Product = {
        id: Date.now().toString(),
        barcode: barcodeData,
        name: `Product ${barcodeData.substring(0, 6)}`,
        price: Math.floor(Math.random() * 100) + 10,
        stock: Math.floor(Math.random() * 100) + 1,
        category: 'General'
      };

      // Check if product already exists in cart
      const existingItemIndex = cartItems.findIndex(
        item => item.product.barcode === barcodeData
      );

      if (existingItemIndex >= 0) {
        // Update quantity if product exists
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += 1;
        setCartItems(updatedItems);
        showSuccess(`Added another ${mockProduct.name} to cart`);
      } else {
        // Add new product to cart
        const newItem: CartItem = {
          product: mockProduct,
          quantity: 1
        };
        setCartItems([...cartItems, newItem]);
        showSuccess(`Added ${mockProduct.name} to cart`);
      }

      setShowScanner(false);
    } catch (error) {
      showError('Product not found. Please try manual entry.');
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCartItems(prevItems =>
              prevItems.filter(item => item.product.id !== itemId)
            );
            showInfo('Item removed from cart');
          }
        }
      ]
    );
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;
    
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setCartItems([]);
            showInfo('Cart cleared');
          }
        }
      ]
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.product.price * item.quantity),
      0
    );
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
                <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Convention Cart</Text>
          <TouchableOpacity
            style={[styles.newTransactionButton, !orderNo && styles.activeTransactionButton]}
            onPress={orderNo ? handleCancelOrder : handleNewTransaction}
            disabled={isCreatingTransaction}
          >
            {isCreatingTransaction ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name={orderNo ? "close-circle-outline" : "receipt-outline"} size={20} color="#FFFFFF" />
                <Text style={styles.newTransactionButtonText}>
                  {orderNo ? 'Cancel Order' : 'Start Transaction'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {orderNo ? (
          <View style={styles.orderInfoContainer}>
            <View style={styles.orderBadge}>
              <Ionicons name="document-text-outline" size={16} color="#007AFF" />
              <Text style={styles.orderNoText}>{orderNo}</Text>
            </View>
            <Text style={styles.headerStatsText}>
              {calculateTotalItems()} items • ${calculateSubtotal().toFixed(2)}
            </Text>
          </View>
        ) : (
          <View style={styles.instructionContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#FF9500" />
            <Text style={styles.instructionText}>
              Click "Start Transaction" to begin scanning products
            </Text>
          </View>
        )}
      </View>

      {/* Cart Items */}
      <ScrollView style={styles.cartItemsContainer}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            {orderNo ? (
              <>
                <Ionicons name="barcode-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyCartText}>
                  Scan products to add to transaction {orderNo}
                </Text>
                <Text style={styles.emptyCartSubtext}>
                  Use the scan button below to begin
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="cart-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyCartText}>
                  No active transaction
                </Text>
                <Text style={styles.emptyCartSubtext}>
                  Start a new transaction to begin scanning
                </Text>
              </>
            )}
          </View>
        ) : (
          cartItems.map((item) => (
            <View key={item.product.id} style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productDetails}>
                  Barcode: {item.product.barcode}
                </Text>
                <Text style={styles.productDetails}>
                  Category: {item.product.category}
                </Text>
                <Text style={styles.productPrice}>
                  ${item.product.price.toFixed(2)} each
                </Text>
              </View>

              <View style={styles.cartItemControls}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.quantityDisplay}>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemTotal}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </Text>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeItem(item.product.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ${calculateSubtotal().toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (8.5%)</Text>
            <Text style={styles.summaryValue}>
              ${(calculateSubtotal() * 0.085).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${(calculateSubtotal() * 1.085).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

            {/* Action Buttons - Neatly Aligned */}
      <View style={styles.actionButtonsContainer}>
        <View style={styles.buttonGroup}>
          {cartItems.length > 0 && (
            <TouchableOpacity
              style={[styles.iconButton, styles.clearButton]}
              onPress={clearCart}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={styles.buttonLabel}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.iconButton, styles.scanButton, !orderNo && styles.scanButtonDisabled]}
            onPress={() => {
              if (!orderNo) {
                showError('Please start a transaction first');
                return;
              }
              setShowScanner(true);
            }}
            disabled={!orderNo}
          >
            <Ionicons 
              name="barcode-outline" 
              size={28} 
              color={orderNo ? "#FFFFFF" : "#CCCCCC"} 
            />
            <Text style={[styles.buttonLabel, orderNo ? styles.buttonLabelActive : styles.buttonLabelDisabled]}>
              Scan
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          {cartItems.length > 0 && (
            <TouchableOpacity
              style={[styles.iconButton, styles.checkoutButton]}
              onPress={() => {
                Alert.alert(
                  'Complete Transaction',
                  `Process transaction ${orderNo} for $${(calculateSubtotal() * 1.085).toFixed(2)}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Process Payment',
                      onPress: () => {
                        showSuccess(`Transaction ${orderNo} completed successfully!`);
                        setCartItems([]);
                        setOrderNo(null);
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={28} color="#FFFFFF" />
              <Text style={styles.buttonLabel}>Checkout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isVisible={showScanner}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
        scanDelay={1000}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
    headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    flex: 1,
  },
  newTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginLeft: 12,
  },
  activeTransactionButton: {
    backgroundColor: '#FF3B30',
  },
  newTransactionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  orderNoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerStatsText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#FF9500',
    flex: 1,
  },
  cartItemsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 4,
  },
  cartItemControls: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    marginVertical: 8,
  },
  removeButton: {
    padding: 6,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
    actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  buttonGroup: {
    alignItems: 'center',
    minWidth: 80,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 6,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
  },
  buttonLabelActive: {
    color: '#007AFF',
  },
  buttonLabelDisabled: {
    color: '#CCCCCC',
  },
  clearButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  scanButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  checkoutButton: {
    backgroundColor: '#34C759',
  },
});