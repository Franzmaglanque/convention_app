
import BarcodeScanner from '@/components/BarcodeScanner';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/hooks/useAuth';
import { newOrder } from '@/hooks/useOrder';
import { useScanProduct } from '@/hooks/useProduct';
import { Product } from '@/types/product.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface CartItem {
  product: Product & {
    id: string;
    barcode: string;
    name: string;
    stock: number;
    imageUrl?: string;
  };
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'PWALLET' | 'GCASH' | 'CASH' | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [showTransactionTypeModal, setShowTransactionTypeModal] = useState(false);
  const [showCardInputModal, setShowCardInputModal] = useState(false);
  const [customerCardNumber, setCustomerCardNumber] = useState('');
  const [isCardedTransaction, setIsCardedTransaction] = useState(false);
  const [isScanningCard, setIsScanningCard] = useState(false);

  const { user } = useAuth();
  const newOrderMutation = newOrder();
  const scanProductMutation = useScanProduct();
  const [showScanner, setShowScanner] = useState(false);
  const [paymentScanner, setPaymentScanner] = useState(false);

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
            onPress: () => setShowTransactionTypeModal(true)
          }
        ]
      );
    } else {
      setShowTransactionTypeModal(true);
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
 
  const createNewTransaction = async (isCarded: boolean = false, cardNumber: string = '') => {
    setIsCreatingTransaction(true);
    try {

      await newOrderMutation.mutate({
            user_id: user?.id || null,
            vendor_code: user?.supplier_code || null,
            customerCardNumber : cardNumber
        },{
        onSuccess: (response) => {
          console.log('New order mutation result:', response);
                
          // Extract order_no from the response
          const orderNo = response.data?.order_no;
          if (orderNo) {
            setOrderNo(orderNo.toString());
            setCartItems([]);
            setIsCardedTransaction(isCarded);
            
            if (isCarded && cardNumber) {
              showSuccess(`Carded transaction started: ${orderNo}\nCustomer Card: ${cardNumber}`);
            } else {
              showSuccess(`New transaction started: ${orderNo}`);
            }
          } else {
            showError('Failed to get order number from response');
          }
        },
        onError: () => {
           showError('Failed to create new transaction. Please try again.');
        },
        onSettled: () => {
          setIsCreatingTransaction(false);
        }
      });
      
    } catch (error) {
      showError('Failed to create new transaction. Please try again.');
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  const handleBarcodeScanned = (barcodeData: string) => {
    if (!orderNo) {
      showError('Please start a new transaction first');
      return;
    }

    scanProductMutation.mutate(
      { barcode: barcodeData },
      {
        onSuccess: (response) => {
          // The response should match ScanProductResponse from product.types.ts
          const productData = response.data;
          
          console.log('Scanned product response:', productData);
          
          // Create a product for the cart with the scanned data
          const cartProduct = {
            id: Date.now().toString(),
            barcode: barcodeData,
            name: productData.description || `Product ${barcodeData.substring(0, 6)}`,
            price: productData.price,
            stock: Math.floor(Math.random() * 100) + 1,
            category: productData.category || 'General',
            // Include the original product data
            // ...productData
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
            showSuccess(`Added another ${cartProduct.name} to cart`);
          } else {
            // Add new product to cart
            const newItem: CartItem = {
              product: cartProduct,
              quantity: 1
            };
            setCartItems([...cartItems, newItem]);
            showSuccess(`Added ${cartProduct.name} to cart`);
          }

          setShowScanner(false);
        },
        onError: (error: any) => {
          // Handle API error (product not found, network error, etc.)
          console.error('Scan error:', error);
          setShowScanner(false);
          
          // Check if it's a "not found" error
          if (error.response?.status === 404 || error.message?.includes('not found')) {
            showError('Product not found. Please try manual entry.');
          } else if (error.response?.status === 401) {
            showError('Session expired. Please login again.');
          } else {
            showError('Failed to scan product. Please try again.');
          }
        }
      }
    );
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

  const handleCompleteTransaction = () => {
    console.log('Processing payment with details:');
    console.log('Payment Type:', paymentType);
    console.log('Reference Number:', referenceNumber);
    console.log('Order No:', orderNo);
    console.log('Subtotal Amount:', calculateSubtotal().toFixed(2));
    console.log('Carded Transaction:', isCardedTransaction);

    setShowPaymentModal(false);
    
    let successMessage = `Transaction ${orderNo} completed via ${paymentType}!`;
    if (isCardedTransaction) {
      successMessage += ' (Carded)';
    }
    
    showSuccess(successMessage);
    setCartItems([]);
    setOrderNo(null);
    setIsCardedTransaction(false);
    setPaymentType(null);
    setReferenceNumber('');
  }

  const handlePaymentScanned = (barcodeData: string) => {
    setReferenceNumber(barcodeData);
    setPaymentScanner(false)
    console.log('barcodeData',barcodeData);
  }

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
            <View style={styles.orderBadgeRow}>
              <View style={styles.orderBadge}>
                <Ionicons name="document-text-outline" size={16} color="#007AFF" />
                <Text style={styles.orderNoText}>{orderNo}</Text>
              </View>
              {isCardedTransaction && (
                <View style={styles.cardedBadge}>
                  <Ionicons name="id-card-outline" size={14} color="#007AFF" />
                  <Text style={styles.cardedBadgeText}>Carded</Text>
                </View>
              )}
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
                  ${item.product.price} each
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
            // <TouchableOpacity
            //   style={[styles.iconButton, styles.checkoutButton]}
              // onPress={() => {
              //   Alert.alert(
              //     'Complete Transaction',
              //     `Process transaction ${orderNo} for $${(calculateSubtotal() * 1.085).toFixed(2)}?`,
              //     [
              //       { text: 'Cancel', style: 'cancel' },
              //       {
              //         text: 'Process Payment',
              //         onPress: () => {
              //           showSuccess(`Transaction ${orderNo} completed successfully!`);
              //           setCartItems([]);
              //           setOrderNo(null);
              //         }
              //       }
              //     ]
              //   );
              // }}
            // >
            //   <Ionicons name="checkmark-circle-outline" size={28} color="#FFFFFF" />
            //   <Text style={styles.buttonLabel}>Checkout</Text>
            // </TouchableOpacity>
            // Inside your return statement, update the Checkout Button:
            <TouchableOpacity
              style={[styles.iconButton, styles.checkoutButton]}
              onPress={() => setShowPaymentModal(true)} // Open payment selection instead of direct Alert
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

      {/* Card Scanner Modal */}
      <BarcodeScanner
        isVisible={isScanningCard}
        onBarcodeScanned={(barcodeData) => {
          createNewTransaction(true, barcodeData);
          setCustomerCardNumber('');
          setIsScanningCard(false);
          // setCustomerCardNumber(barcodeData);
          // setIsScanningCard(false);
          // showSuccess(`Card scanned: ${barcodeData}`);
        }}
        onClose={() => setIsScanningCard(false)}
        scanDelay={1000}
      />

      {/* Payment Scanner Modal */}
       <BarcodeScanner
        isVisible={paymentScanner}
        onBarcodeScanned={(barcodeData) => {
          handlePaymentScanned(barcodeData)
        }}
        onClose={() => setPaymentScanner(false)}
        scanDelay={1000}
      />

      {/* Transaction Type Selection Modal */}
      <Modal
        visible={showTransactionTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransactionTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transactionTypeModalContent}>
            <Text style={styles.modalTitle}>Select Transaction Type</Text>
            
            <View style={styles.transactionTypeOptions}>
              <TouchableOpacity
                style={[styles.transactionTypeOption, styles.uncardedOption]}
                onPress={() => {
                  setShowTransactionTypeModal(false);
                  createNewTransaction(false);
                }}
              >
                <Ionicons name="card-outline" size={32} color="#34C759" />
                <Text style={styles.transactionTypeText}>Uncarded</Text>
                <Text style={styles.transactionTypeSubtext}>Regular transaction</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.transactionTypeOption, styles.cardedOption]}
                onPress={() => {
                  setShowTransactionTypeModal(false);
                  setShowCardInputModal(true);
                }}
              >
                <Ionicons name="id-card-outline" size={32} color="#007AFF" />
                <Text style={styles.transactionTypeText}>Carded</Text>
                <Text style={styles.transactionTypeSubtext}>Customer card required</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelTransactionTypeButton}
              onPress={() => setShowTransactionTypeModal(false)}
            >
              <Text style={styles.cancelTransactionTypeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Card Input Modal */}
    <Modal
      visible={showCardInputModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowCardInputModal(false);
        setCustomerCardNumber('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cardInputModalContent}>
          <Text style={styles.modalTitle}>Enter Customer Card</Text>
          
          <View style={styles.cardInputContainer}>
            <Text style={styles.inputLabel}>Customer Card Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Scan or enter card number"
              value={customerCardNumber}
              onChangeText={setCustomerCardNumber}
              autoFocus={true}
            />
            
            <TouchableOpacity
              style={styles.scanCardButton}
              onPress={() => {
                setShowCardInputModal(false);
                setIsScanningCard(true);
              }}
            >
              <Ionicons name="barcode-outline" size={24} color="#007AFF" />
              <Text style={styles.scanCardButtonText}>Scan Card</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowCardInputModal(false);
                setCustomerCardNumber('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.processButton, !customerCardNumber && styles.processButtonDisabled]}
              disabled={!customerCardNumber}
              onPress={() => {
                if (customerCardNumber.trim()) {
                  setShowCardInputModal(false);
                  createNewTransaction(true, customerCardNumber.trim());
                  setCustomerCardNumber('');
                }
              }}
            >
              <Text style={styles.processButtonText}>Start Carded Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

      {/* Payment Selection Modal */}
    <Modal
      visible={showPaymentModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.paymentModalContent}>
          <Text style={styles.modalTitle}>Select Payment Method</Text>
          
          <View style={styles.paymentOptions}>
            {(['PWALLET', 'GCASH', 'CASH'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.paymentOption,
                  paymentType === type && styles.paymentOptionSelected
                ]}
                onPress={() => {
                  // Set the payment type first
                  setPaymentType(type);
                  // Only open scanner for PWALLET and GCASH, not for CASH
                  if (type === 'PWALLET' || type === 'GCASH') {
                    setPaymentScanner(true);
                  }
                }}
              >
                <Text style={[
                  styles.paymentOptionText,
                  paymentType === type && styles.paymentOptionTextSelected
                ]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reference Number Input - Only for PWALLET and GCASH */}
          {(paymentType === 'PWALLET' || paymentType === 'GCASH') && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{paymentType} Reference Number</Text>
                <View style={styles.referenceInputRow}>
                  <TextInput
                    style={[styles.textInput, styles.flex1]}
                    placeholder="Enter reference number"
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                  />
                  <TouchableOpacity
                    style={styles.scanReferenceButton}
                    onPress={() => setPaymentScanner(true)}
                  >
                    <Ionicons name="barcode-outline" size={24} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Amount"
                  value={calculateSubtotal().toFixed(2)}
                  editable={false}
                />
              </View>
            </>
          )}
          
          {/* For CASH payment, show amount only */}
          {paymentType === 'CASH' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount to Collect</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Amount"
                value={calculateSubtotal().toFixed(2)}
                editable={false}
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setShowPaymentModal(false);
                setPaymentType(null);
                setReferenceNumber('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.processButton, 
                (!paymentType || ((paymentType === 'PWALLET' || paymentType === 'GCASH') && !referenceNumber)) && styles.processButtonDisabled
              ]}
              disabled={!paymentType || ((paymentType === 'PWALLET' || paymentType === 'GCASH') && !referenceNumber)}
              onPress={async () => {
                Alert.alert(
                  'Payment Confirmation',
                  // `Process transaction ${orderNo} for $${(calculateSubtotal() * 1.085).toFixed(2)}?`,
                  `Confirm payment receive of $${calculateSubtotal().toFixed(2)} via ${paymentType} `,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Complete Transaction',
                    onPress: () => {
                      handleCompleteTransaction();
                    }
                  }
                ]);
                // handleProcessPayment();
                // Finalize Transaction Logic
                // showSuccess(`Transaction ${orderNo} completed via ${paymentType}!`);
                // setCartItems([]);
                // setOrderNo(null);
                // setPaymentType(null);
                // setReferenceNumber('');
                // setShowPaymentModal(false);
              }}
            >
              <Text style={styles.processButtonText}>Process Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  cardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cardedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  paymentOptionText: {
    fontWeight: '600',
    color: '#666666',
  },
  paymentOptionTextSelected: {
    color: '#007AFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  flex1: {
    flex: 1,
  },
  referenceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanReferenceButton: {
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  processButton: {
    flex: 2,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  processButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
    processButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  transactionTypeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  transactionTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  transactionTypeOption: {
    flex: 1,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncardedOption: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  cardedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  transactionTypeText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  transactionTypeSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  cancelTransactionTypeButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelTransactionTypeButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 16,
  },
  cardInputModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  cardInputContainer: {
    marginBottom: 20,
  },
  scanCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  scanCardButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
