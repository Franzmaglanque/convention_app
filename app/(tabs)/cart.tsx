
import BarcodeScanner from '@/components/BarcodeScanner';
import ItemList from '@/components/ItemList';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/hooks/useAuth';
import { newOrder } from '@/hooks/useOrder';
import { usePwalletDebit, useScanPwalletQr } from '@/hooks/usePayment';
import { useScanProduct } from '@/hooks/useProduct';
import { Product } from '@/types/product.types';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { z } from 'zod';

// Validation schema using Zod
const paymentSchema = z.object({
  paymentType: z.enum(['PWALLET', 'GCASH', 'CASH']),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Please enter a valid amount',
    }),
  referenceNumber: z.string().optional(),
  cashBill: z.string().optional(),
  cashChange: z.string().optional()
})
.refine((data) => data.paymentType, {
  message: 'Payment method is required',
  path: ['paymentType'],
})
.refine((data) => {
  // Custom validation for reference number based on payment type
  if (data.paymentType === 'PWALLET' || data.paymentType === 'GCASH') {
    return data.referenceNumber && data.referenceNumber.trim().length > 0;
  }
  return true;
}, {
  message: 'Reference number is required for PWALLET and GCASH',
  path: ['referenceNumber'],
})
.refine((data)=> {
  if(data.paymentType === 'CASH'){
    // For CASH payments, cashBill is required and must be valid
    if (!data.cashBill || isNaN(parseFloat(data.cashBill)) || parseFloat(data.cashBill) <= 0) {
      return false;
    }
    const cashBill = parseFloat(data.cashBill);
    const amount = parseFloat(data.amount || '0');
    return cashBill >= amount;
  }
  return true;
}, {
  message: 'Cash bill must be greater than or equal to the amount',
  path: ['cashBill'],
})
.refine((data)=> {
  if(data.paymentType === 'CASH'){
    // For CASH payments, cashBill must be present and valid
    return data.cashBill && !isNaN(parseFloat(data.cashBill)) && parseFloat(data.cashBill) > 0;
  }
  return true;
}, {
  message: 'Please enter a valid cash bill amount',
  path: ['cashBill'],
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface CartItem {
  product: Product & {
    barcode: string;
  };
  quantity: number;
}

// Debounce function
function useDebounce(callback: Function, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export default function CartScreen() {
  const { showSuccess, showError, showInfo } = useToast();
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionTypeModal, setShowTransactionTypeModal] = useState(false);
  const [showCardInputModal, setShowCardInputModal] = useState(false);
  const [customerCardNumber, setCustomerCardNumber] = useState('');
  const [isCardedTransaction, setIsCardedTransaction] = useState(false);
  const [isScanningCard, setIsScanningCard] = useState(false);
  const [payments, setPayments] = useState<Array<{
    type: 'PWALLET' | 'GCASH' | 'CASH';
    amount: number;
    referenceNumber?: string;
    cashBill?:number;
    cashChange?: number;
  }>>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentType: undefined as any,
      amount: '',
      referenceNumber: '',
      cashBill: '',
      cashChange: '0.00'
    },
    mode: 'onChange',
  });

  const paymentType = watch('paymentType');
  const amount = watch('amount');
  const referenceNumber = watch('referenceNumber');

  const newOrderMutation = newOrder();
  const scanProductMutation = useScanProduct();
  const scanPwalletQrMutation = useScanPwalletQr();
  const pwalletDebitMutation = usePwalletDebit();

  const [showScanner, setShowScanner] = useState(false);
  const [paymentScanner, setPaymentScanner] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [showItemList,setShowItemList] = useState(false);


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
          // The scanned productData should match the Product interface from product.types.ts
          // We need to extend it with additional fields for our cart
          const cartProduct: CartItem['product'] = {
            // Base Product fields from the API response
            description: productData.description || '',
            category: productData.category || 'General',
            price: productData.price,
            sku: productData.sku || barcodeData,
            // Additional fields for our cart
            id: productData.id,
            barcode: barcodeData
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
            showSuccess(`Added another ${cartProduct.description} to cart`);
          } else {
            // Add new product to cart
            const newItem: CartItem = {
              product: cartProduct,
              quantity: 1
            };
            setCartItems([...cartItems, newItem]);
            showSuccess(`Added ${cartProduct.description} to cart`);
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

  const updateQuantity = (itemId: number, newQuantity: number) => {
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

  const removeItem = (itemId: number) => {
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
      (total, item) => total + (parseFloat(item.product.price) * item.quantity),
      0
    );
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // Remove tax
  };

  const calculateRemainingBalance = () => {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return calculateTotal() - totalPaid;
  };

  const handleAddPayment = async (data: PaymentFormData) => {
    console.log('handle add payment data', data);

    // Ensure paymentType is defined
    if (!data.paymentType) {
      showError('Please select a payment method');
      return false;
    }

    // Validate reference number for PWALLET/GCASH
    if ((data.paymentType === 'PWALLET' || data.paymentType === 'GCASH') && 
        (!data.referenceNumber || data.referenceNumber.trim().length === 0)) {
      showError('Reference number is required for PWALLET and GCASH');
      return false;
    }

    const amountNum = parseFloat(data.amount);
    const remainingBalance = calculateRemainingBalance();
    console.log('amountNum', amountNum);
    console.log('remainingBalance', remainingBalance);

    // Additional validation for amount exceeding remaining balance
    if (amountNum > remainingBalance) {
      showError('Payment amount cannot exceed remaining balance');
      return false;
    }

    if (data.paymentType === 'PWALLET') {
      try {
        // Use mutateAsync to wait for the API response
        const foo = await pwalletDebitMutation.mutateAsync({
          reference_no: data?.referenceNumber ?? "",
          amount: amountNum,
          store_code: 901
        });
   
        // If we reach here, mutation was successful
      } catch (error) {
        console.log('debit error',error);
        // If mutation fails, it throws an error here
        showError('Debit failed. Please try again.');
        return false; 
      }
    }
    

    // For CASH payments, include cashBill and cashChange
    const newPayment = {
      type: data.paymentType,
      amount: amountNum,
      referenceNumber: (data.paymentType === 'PWALLET' || data.paymentType === 'GCASH') ? data.referenceNumber : undefined,
      cashBill: data.paymentType === 'CASH' ? parseFloat(data.cashBill || '0') : undefined,
      cashChange: data.paymentType === 'CASH' ? parseFloat(data.cashChange || '0') : undefined
    };

    setPayments([...payments, newPayment]);
    
    showSuccess(`Payment of ₱${amountNum.toFixed(2)} added. Remaining balance: ₱${(remainingBalance - amountNum).toFixed(2)}`);
    
    // Reset form
    reset({
      paymentType: undefined,
      amount: '',
      referenceNumber: '',
      cashBill: '',
      cashChange: '0.00'
    });
    
    return true;
  };

  const handleCompleteTransaction = () => {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalAmount = calculateTotal();
    
    console.log('Processing payment with details:');
    console.log('Payments:', payments);
    console.log('Total Paid:', totalPaid);
    console.log('Total Amount:', totalAmount);
    console.log('Order No:', orderNo);
    console.log('Carded Transaction:', isCardedTransaction);

    setShowPaymentModal(false);
    
    let successMessage = `Transaction ${orderNo} completed!`;
    if (payments.length > 1) {
      successMessage += ` (Multi-tender: ${payments.map(p => `${p.type}: ₱${p.amount.toFixed(2)}`).join(', ')})`;
    } else if (payments.length === 1) {
      successMessage += ` via ${payments[0].type}`;
    }
    
    if (isCardedTransaction) {
      successMessage += ' (Carded)';
    }
    
    showSuccess(successMessage);
    
    // Reset the form
    reset({
      paymentType: undefined,
      amount: '',
      referenceNumber: '',
    });
    setPayments([]);
    setCartItems([]);
    setOrderNo(null);
  }

  const handlePaymentScanned = async (barcodeData: string) => {
    console.log('barcodeData', barcodeData);
    await scanPwalletQrMutation.mutate({
            QrCode: barcodeData,
        },{
        onSuccess: (response) => {
          console.log('scanPwalletQrMutation',response);
          setValue('referenceNumber', (response.data.reference_no).toString());
          trigger('referenceNumber');
          setPaymentScanner(false);
        },
        onError: () => {
           showError('Failed to create new transaction. Please try again.');
        },
        onSettled: () => {
      
        }
    });
 

  }

  // Create a debounced version of computeChange
  const computeChange = useCallback(() => {
    const cashBill = parseFloat(watch('cashBill') || '0');
    const amount = parseFloat(watch('amount') || '0');
    
    if (cashBill > 0 && amount > 0) {
      if (cashBill >= amount) {
        const change = cashBill - amount;
        setValue('cashChange', change.toFixed(2));
        console.log('Change calculated:', change);
      } else {
        // If cashBill is less than amount, set change to 0 or negative
        const change = cashBill - amount;
        setValue('cashChange', change.toFixed(2));
        console.log('Change calculated (negative):', change);
      }
    } else {
      setValue('cashChange', '0.00');
    }
  }, [watch, setValue]);

  // Create debounced function with 500ms delay
  const debouncedComputeChange = useDebounce(computeChange, 500);

  const handleBrowseItems = async(product:any) => {

    showInfo(`Selected: ${product.description}`);


    const cartProduct: CartItem['product'] = {
      // Base Product fields from the API response
      description: product.description || '',
      category: product.category || 'General',
      price: product.price,
      sku: product.sku,
      id: product.id,
      barcode: product.barcode
    };


    // console.log('cartProduct',cartProduct);

    const existingItemIndex = cartItems.findIndex(
      item => item.product.barcode === product.barcode
    );


    if (existingItemIndex >= 0) {
      
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
      showSuccess(`Added another ${product.description} to cart`);

    }else{

      const newItem: CartItem = {
        product: cartProduct,
        quantity: 1
      };
      setCartItems([...cartItems, newItem]);
      showSuccess(`Added ${cartProduct.description} to cart`);

    }

    console.log('existingItemIndex',existingItemIndex);

  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
                <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Convention Cart</Text>
          <TouchableOpacity
            style={[
              styles.newTransactionButton, 
              !orderNo && styles.activeTransactionButton,
              (orderNo && payments.length > 0) && styles.cancelOrderButtonDisabled
            ]}
            onPress={orderNo ? handleCancelOrder : handleNewTransaction}
            disabled={isCreatingTransaction || !!(orderNo && payments.length > 0)}
          >
            {isCreatingTransaction ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons 
                  name={orderNo ? "close-circle-outline" : "receipt-outline"} 
                  size={20} 
                  color={(orderNo && payments.length > 0) ? "#CCCCCC" : "#FFFFFF"} 
                />
                <Text style={[
                  styles.newTransactionButtonText,
                  (orderNo && payments.length > 0) && styles.cancelOrderButtonTextDisabled
                ]}>
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
              {calculateTotalItems()} items • ₱{calculateSubtotal().toFixed(2)}
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
                <Text style={styles.productName}>{item.product.description}</Text>
                <Text style={styles.productDetails}>
                  Barcode: {item.product.barcode}
                </Text>
                <Text style={styles.productDetails}>
                  Category: {item.product.category}
                </Text>
                <Text style={styles.productPrice}>
                  ₱{item.product.price} each
                </Text>
              </View>

              <View style={styles.cartItemControls}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      payments.length > 0 && styles.quantityButtonDisabled
                    ]}
                    onPress={() => {
                      if (payments.length > 0) return;
                      updateQuantity(item.product.id, item.quantity - 1);
                    }}
                    disabled={payments.length > 0}
                  >
                    <Ionicons 
                      name="remove" 
                      size={20} 
                      color={payments.length > 0 ? "#CCCCCC" : "#007AFF"} 
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.quantityDisplay}>
                    <Text style={[
                      styles.quantityText,
                      payments.length > 0 && styles.quantityTextDisabled
                    ]}>
                      {item.quantity}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      payments.length > 0 && styles.quantityButtonDisabled
                    ]}
                    onPress={() => {
                      if (payments.length > 0) return;
                      updateQuantity(item.product.id, item.quantity + 1);
                    }}
                    disabled={payments.length > 0}
                  >
                    <Ionicons 
                      name="add" 
                      size={20} 
                      color={payments.length > 0 ? "#CCCCCC" : "#007AFF"} 
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[
                  styles.itemTotal,
                  payments.length > 0 && styles.itemTotalDisabled
                ]}>
                  ₱{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    payments.length > 0 && styles.removeButtonDisabled
                  ]}
                  onPress={() => {
                    if (payments.length > 0) return;
                    removeItem(item.product.id);
                  }}
                  disabled={payments.length > 0}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={20} 
                    color={payments.length > 0 ? "#CCCCCC" : "#FF3B30"} 
                  />
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
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>
              ₱{calculateTotal().toFixed(2)}
            </Text>
          </View>
          {payments.map((payment, index) => (
            <View key={index} style={styles.summaryRow}>
              <View style={styles.paymentInfoContainer}>
                <Text style={styles.paymentLabel}>- {payment.type}</Text>
                {payment.referenceNumber && (
                  <Text style={styles.paymentRefLabel}>Ref: {payment.referenceNumber}</Text>
                )}
              </View>
              <Text style={styles.paymentValue}>
                ₱{payment.amount.toFixed(2)}
              </Text>
            </View>
          ))}
          {payments.length > 0 && (
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Remaining Balance</Text>
              <Text style={styles.totalValue}>
                ₱{calculateRemainingBalance().toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons - Neatly Aligned */}
      <View style={styles.actionButtonsContainer}>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.iconButton, 
              styles.clearButton,
              (cartItems.length === 0 || payments.length > 0 ) && styles.clearButtonDisabled
            ]}
            onPress={clearCart}
            disabled={cartItems.length === 0 || payments.length > 0}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color={(cartItems.length === 0 || payments.length > 0 ) ? "#CCCCCC" : "#FF3B30"} 
            />
            <Text style={[
              styles.buttonLabel,
              (cartItems.length === 0 || payments.length > 0 ) && styles.buttonLabelDisabled
            ]}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.scanButton,
              (!orderNo || payments.length > 0 ) && styles.scanButtonDisabled
            ]}
            onPress={() => {
              if (!orderNo) {
                showError('Please start a transaction first');
                return;
              }
              setShowScanner(true);
            }}
            disabled={!orderNo || payments.length > 0}
          >
            <Ionicons 
              name="barcode-outline" 
              size={28} 
              color={(!orderNo|| payments.length > 0 ) ? "#CCCCCC"  : "#FFFFFF"} 
            />
            <Text style={[
              styles.buttonLabel,
              //  orderNo ? styles.buttonLabelActive : styles.buttonLabelDisabled
              (orderNo || cartItems.length === 0 || payments.length > 0 ) ? styles.buttonLabelDisabled : styles.buttonLabelActive
              ]}>
              Scan
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.iconButton, 
              styles.browseButton,
              (!orderNo || payments.length > 0 ) && styles.scanButtonDisabled
            ]}
            onPress={() => {
              if (!orderNo) {
                showError('Please start a transaction first');
                return;
              }
              setShowItemList(true);
            }}
            disabled={!orderNo}
          >
            <Ionicons 
              name="list-outline" 
              size={28} 
              color={(!orderNo|| payments.length > 0 ) ? "#CCCCCC"  : "#FFFFFF"} 
            />
            <Text style={[
              styles.buttonLabel,
              (!orderNo|| payments.length > 0 ) ? styles.buttonLabelDisabled : styles.buttonLabelActive
            ]}>Browse</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.iconButton, 
              styles.checkoutButton,
              (cartItems.length === 0 || calculateRemainingBalance() <= 0.01) && styles.checkoutButtonDisabled
            ]}
            onPress={() => {
              if (cartItems.length === 0 || calculateRemainingBalance() <= 0.01) return;
              setShowPaymentModal(true);
            }}
            disabled={cartItems.length === 0 || calculateRemainingBalance() <= 0.01}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={28} 
              color={(cartItems.length === 0 || calculateRemainingBalance() <= 0.01) ? "#CCCCCC" : "#FFFFFF"} 
            />
            <Text style={[
              styles.buttonLabel,
              (cartItems.length === 0 || calculateRemainingBalance() <= 0.01) && styles.buttonLabelDisabled
            ]}>Pay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.iconButton, 
              styles.postActionButton,
              (cartItems.length === 0 || payments.length === 0 || calculateRemainingBalance() > 0.01) && styles.postActionButtonDisabled
            ]}
            disabled={cartItems.length === 0 || payments.length === 0 || calculateRemainingBalance() > 0.01}
            onPress={handleCompleteTransaction}
          >
            <Ionicons 
              name="card-outline" 
              size={28} 
              color={(cartItems.length === 0 || payments.length === 0 || calculateRemainingBalance() > 0.01) ? "#CCCCCC" : "#FFFFFF"} 
            />
            <Text style={[
              styles.buttonLabel,
              (cartItems.length === 0 || payments.length === 0 || calculateRemainingBalance() > 0.01) && styles.buttonLabelDisabled
            ]}>Post</Text>
          </TouchableOpacity>
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
        onRequestClose={() => {
          setShowPaymentModal(false);
          reset({
            paymentType: undefined,
            amount: '',
            referenceNumber: '',
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.paymentModalContent,{ maxHeight: '90%' } ]}>
            <Text style={styles.modalTitle}>Add Payment</Text>
            
            {/* Total and Remaining Balance */}
            <View style={styles.balanceContainer}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Total Amount:</Text>
                <Text style={styles.balanceValue}>₱{calculateTotal().toFixed(2)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Total Paid:</Text>
                <Text style={styles.balanceValue}>
                  ₱{payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.balanceRow, styles.remainingBalanceRow]}
                onPress={() => {
                  setValue('amount', calculateRemainingBalance().toFixed(2));
                  trigger('amount');
                }}
              >
                <View style={styles.remainingBalanceContent}>
                  <Text style={styles.remainingBalanceLabel}>Remaining Balance:</Text>
                  <View style={styles.remainingBalanceValueContainer}>
                    <Text style={styles.remainingBalanceValue}>
                      ₱{calculateRemainingBalance().toFixed(2)}
                    </Text>
                    <Ionicons name="arrow-forward-circle" size={20} color="#007AFF" style={styles.remainingBalanceIcon} />
                  </View>
                </View>
                <Text style={styles.remainingBalanceHint}>Tap to use full amount</Text>
              </TouchableOpacity>
            </View>

            {/* Add New Payment Section */}
            <View style={styles.addPaymentSection}>
              <Text style={styles.sectionTitle}>Payment Methods</Text>
              
              <Controller
                name="paymentType"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.paymentOptions}>
                    {(['PWALLET', 'GCASH', 'CASH'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.paymentOption,
                          value === type && styles.paymentOptionSelected,
                          errors.paymentType && styles.errorBorder
                        ]}
                        onPress={() => {
                          // Clear reference number and amount when payment type changes
                          // But only if the new type is different from the current value
                          if (value !== type) {
                            // Reset amount and reference number fields
                            setValue('amount', '');
                            setValue('referenceNumber', '');
                            setValue('cashBill', '');
                            setValue('cashChange', '0.00');
                            // Trigger validation to clear any errors
                            trigger(['amount', 'referenceNumber', 'cashBill', 'cashChange']);
                          }
                          // Set the new payment type
                          onChange(type);
                        }}
                      >
                        <Text style={[
                          styles.paymentOptionText,
                          value === type && styles.paymentOptionTextSelected
                        ]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.paymentType && (
                <Text style={styles.errorText}>{errors.paymentType.message}</Text>
              )}

              {/* Reference Number Input for PWALLET/GCASH */}
              {(paymentType === 'PWALLET' || paymentType === 'GCASH') && (
                <Controller
                  name="referenceNumber"
                  control={control}
                  render={({ field: { value } }) => (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>{paymentType} Reference Number</Text>
                      <View style={styles.referenceInputRow}>
                        <TextInput
                          style={[
                            styles.textInput,
                            styles.flex1,
                            styles.disabledInput,
                            errors.referenceNumber && styles.errorInput
                          ]}
                          placeholder="Scan QR code to get reference number"
                          value={value}
                          editable={false}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={styles.scanReferenceButton}
                          onPress={() => setPaymentScanner(true)}
                        >
                          <Ionicons name="barcode-outline" size={24} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                      {errors.referenceNumber && (
                        <Text style={styles.errorText}>{errors.referenceNumber.message}</Text>
                      )}
                      <Text style={styles.helperText}>
                        Reference number can only be set by scanning the payment QR code
                      </Text>
                    </View>
                  )}
                />
              )}

              {/* Amount Input */}
              <Controller
                name="amount"
                control={control}
                render={({ field: { onChange, value, onBlur } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Amount to Pay</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        errors.amount && styles.errorInput,
                      ]}
                      placeholder={`Enter amount (max: ₱${calculateRemainingBalance().toFixed(2)})`}
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        // Trigger validation
                        trigger('amount');
                        if(paymentType == 'CASH'){
                          debouncedComputeChange();
                        }
                      }}
                      onBlur={() => {
                        onBlur();
                        // Also compute change when user leaves the field
                        if(paymentType == 'CASH'){
                          computeChange();
                        }
                      }}
                      keyboardType="numeric"
                    />
                    {errors.amount && (
                      <Text style={styles.errorText}>{errors.amount.message}</Text>
                    )}
                    <TouchableOpacity onPress={() => {
                      setValue('amount', calculateRemainingBalance().toFixed(2));
                      trigger('amount');
                      if(paymentType == 'CASH'){
                        computeChange();
                      }
                    }}>
                      <Text style={styles.helperText}>
                        Remaining balance: ₱{calculateRemainingBalance().toFixed(2)} (Tap to use full amount)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />

              {/* CASH BILL */}
                {(paymentType == 'CASH') && (
                <Controller
                  name="cashBill"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => {
                    const cashBillNum = parseFloat(value || '0');
                    const amountNum = parseFloat(watch('amount') || '0');
                    const isCashBillLessThanAmount = cashBillNum > 0 && amountNum > 0 && cashBillNum < amountNum;
                    
                    return (
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Enter Bill</Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            errors.cashBill && styles.errorInput,
                            isCashBillLessThanAmount && styles.errorInput
                          ]}
                          placeholder={`Minimum: ₱${parseFloat(watch('amount') || '0').toFixed(2)}`}
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            // Trigger validation
                            trigger('cashBill');
                            if(paymentType == 'CASH'){
                              debouncedComputeChange();
                            }
                          }}
                          onBlur={() => {
                            onBlur();
                            // Also compute change when user leaves the field
                            if(paymentType == 'CASH'){
                              computeChange();
                            }
                          }}
                          keyboardType="numeric"
                        />
                        {errors.cashBill && (
                          <Text style={styles.errorText}>{errors.cashBill.message}</Text>
                        )}
                        {isCashBillLessThanAmount && !errors.cashBill && (
                          <Text style={styles.errorText}>
                            Cash bill must be at least ₱{amountNum.toFixed(2)}
                          </Text>
                        )}
                        <Text style={styles.helperText}>
                          Enter the cash amount received from customer
                        </Text>
                      </View>
                    );
                  }}
                />
              )}
              
              {(paymentType == 'CASH') && (
                <Controller
                  name="cashChange"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Cash Change</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.disabledInput,
                        ]}
                        placeholder={``}
                        value={value}
                        onBlur={onBlur}
                        editable={false}
                      />
                    </View>
                  )}
                />
              )}
              
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setShowPaymentModal(false);
                  reset({
                    paymentType: undefined,
                    amount: '',
                    referenceNumber: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.addPaymentButton,
                  (!paymentType || 
                  !amount || 
                  isNaN(parseFloat(amount)) || 
                  parseFloat(amount) <= 0 || 
                  ((paymentType === 'PWALLET' || paymentType === 'GCASH') && (!referenceNumber || referenceNumber.trim().length === 0)) ||
                  (paymentType === 'CASH' && (!watch('cashBill') || isNaN(parseFloat(watch('cashBill') || '0')) || parseFloat(watch('cashBill') || '0') < parseFloat(amount || '0')))) && 
                  styles.addPaymentButtonDisabled
                ]}
                disabled={
                  !paymentType || 
                  !amount || 
                  isNaN(parseFloat(amount)) || 
                  parseFloat(amount) <= 0 || 
                  ((paymentType === 'PWALLET' || paymentType === 'GCASH') && (!referenceNumber || referenceNumber.trim().length === 0)) ||
                  (paymentType === 'CASH' && (!watch('cashBill') || isNaN(parseFloat(watch('cashBill') || '0')) || parseFloat(watch('cashBill') || '0') < parseFloat(amount || '0')))
                }
                onPress={() => {
                  console.log('Button pressed - paymentType:', paymentType, 'amount:', amount, 'referenceNumber:', referenceNumber, 'cashBill:', watch('cashBill'));

                  trigger().then(async (isValid) => {
                    console.log('Form errors:', errors);
                    if (isValid) {
                      await handleSubmit(async (data) => {
                        console.log('handle add payment data', data);
                        const success = await handleAddPayment(data);

                        if (success) {
                          setShowPaymentModal(false);
                        }
                      })();
                    } else {
                      console.log('Form has validation errors');
                    }
                  });
                }}
              >
                <Text style={styles.addPaymentButtonText}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ItemList 
        visible={showItemList}
        onClose={() => setShowItemList(false)}
        onProductSelect={(product) => {
          handleBrowseItems(product);
        }}
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
  cancelOrderButtonDisabled: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  newTransactionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelOrderButtonTextDisabled: {
    color: '#CCCCCC',
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
  quantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
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
  quantityTextDisabled: {
    color: '#CCCCCC',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    marginVertical: 8,
  },
  itemTotalDisabled: {
    color: '#CCCCCC',
  },
  removeButton: {
    padding: 6,
  },
  removeButtonDisabled: {
    opacity: 0.5,
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
  paymentLabel: {
    fontSize: 14,
    color: '#FF3B30',
    fontStyle: 'italic',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  paymentInfoContainer: {
    flexDirection: 'column',
  },
  paymentRefLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontStyle: 'normal',
  },
    actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  buttonGroup: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
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
  clearButtonDisabled: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  scanButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  browseButton: {
    backgroundColor: '#FF9500',
  },
  browseButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  checkoutButton: {
    backgroundColor: '#34C759',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  postActionButton: {
    backgroundColor: '#34C759',
  },
  postActionButtonDisabled: {
    backgroundColor: '#E5E5EA',
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
    maxHeight: '80%',
  },
  balanceContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  remainingBalanceRow: {
    marginTop: 8,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666666',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  remainingBalanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  remainingBalanceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  remainingBalanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainingBalanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 8,
  },
  remainingBalanceIcon: {
    marginLeft: 4,
  },
  remainingBalanceHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
  },
  paymentsListContainer: {
    marginBottom: 20,
  },
  paymentsListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1D1D1F',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentItemInfo: {
    flex: 1,
  },
  paymentItemType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  paymentItemAmount: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  paymentItemRef: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  removePaymentButton: {
    padding: 4,
  },
  addPaymentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1D1D1F',
  },
  addPaymentButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  addPaymentButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  addPaymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  postPaymentButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  postPaymentButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  postPaymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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
  errorInput: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorBorder: {
    borderColor: '#FF3B30',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
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
  paymentModeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentModeOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentModeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  paymentModeOptionText: {
    fontWeight: '600',
    color: '#666666',
  },
  paymentModeOptionTextSelected: {
    color: '#007AFF',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginLeft: 4,
  },
  fullAmountDisplay: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  fullAmountText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
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
