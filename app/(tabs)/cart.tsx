
import BarcodeScanner from '@/components/BarcodeScanner';
import PaymentSelectionModal from '@/components/modals/CartPaymentSelectionModal';
import ItemList from '@/components/modals/ItemList';
import SMSModal from '@/components/modals/SmsModal';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/hooks/useAuth';
import { newOrder, useCancelOrder, useCompleteOrder, useSyncCart } from '@/hooks/useOrder';
import { useProcessPayment, usePwalletDebit, useSaveCashPayment, useSaveCreditCardPayment, useScanPwalletQr, useSkyroPayment } from '@/hooks/usePayment';
import { useScanProduct } from '@/hooks/useProduct';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

// Validation schema using Zod
const paymentSchema = z.object({
  paymentType: z.enum(['PWALLET', 'GCASH', 'CASH','CREDIT_DEBIT_CARD']),
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
export type TerminalType = 'GCASH' | 'TANGENT';
export type CardType = 'CREDIT' | 'DEBIT';
interface CartItem {
  product: {
    id: number;
    description: string;
    price: string;
    sku: string;
    barcode?: string;
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
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [customerCardNumber, setCustomerCardNumber] = useState('');
  const [isCardedTransaction, setIsCardedTransaction] = useState(false);
  const [isScanningCard, setIsScanningCard] = useState(false);
  const [payments, setPayments] = useState<Array<{
    type: 'PWALLET' | 'GCASH' | 'CASH' | 'CREDIT_DEBIT_CARD';
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
  // const updateOrderItemMutation = useUpdateOrderItem();
  // const removeOrderItemMutation = useRemoveOrderItem();
  // const addItemToOrderMutation = useAddItemToOrder();
  const cashPaymentMutation = useSaveCashPayment();
  const completeOrderMutation = useCompleteOrder();
  const cancelOrderMutation = useCancelOrder();
  const creditCardPaymentMutation = useSaveCreditCardPayment();
  const processPaymentMutation = useProcessPayment();
  const syncCartMutation = useSyncCart();
  const skyroPaymentMutation = useSkyroPayment();

  const [showScanner, setShowScanner] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [showItemList,setShowItemList] = useState(false);
  const [ccQrData,setCcQrData] = useState('');
  const [isCartSynced, setIsCartSynced] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState('');

  ////

  const amountNum = parseFloat(watch('amount') || '0');
  const cashBillNum = parseFloat(watch('cashBill') || '0');
  const currentPaymentType = watch('paymentType');
  const currentRefNumber = watch('referenceNumber');

  const isAmountValid = !isNaN(amountNum) && amountNum > 0;
  const isRefValid = currentRefNumber && currentRefNumber.trim().length > 0;
  const isCashBillValid = cashBillNum >= amountNum;

  const requiresRefNumber = currentPaymentType === 'PWALLET' || currentPaymentType === 'GCASH' || currentPaymentType === 'CREDIT_DEBIT_CARD';

  const isSubmitDisabled = 
    !currentPaymentType || 
    !isAmountValid || 
    (requiresRefNumber && !isRefValid) ||
    (currentPaymentType === 'CASH' && !isCashBillValid);

    ///
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
            cancelOrderMutation.mutate(
              { order_no:orderNo }, 
              {
                onSuccess: () => {
                  setCartItems([]);
                  setOrderNo(null);
                  setRemainingBalance('');
                  setPayments([]);
                  showSuccess('Order cancelled successfully');
                },
                onError: (error) => {
                  showError('Failed to cancel order on server');
                }
              }
            );
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
          const orderNo = response.data?.order_no;
          const is_active_transaction = response.data.is_active_transaction;
          console.log('API response',response.data);

          if(is_active_transaction == 'true'){
            console.log('is_active_transaction:');
            showInfo(response.data.message) // This means the user has an active transaction that was not completed. We will resume that transaction instead of creating a new one.
            setOrderNo(orderNo.toString());
            setCartItems(response.data.order_items);
            setPayments(response.data.order_payments);

            // setCustomerCardNumber(response.data.customer_card_no);
            // setCustomerCardNumber("423432");
            setIsCardedTransaction(response.data.isCarded)

            setIsCartSynced(true);
            if (response.data.remaining_balance !== undefined) {
              console.log('setting remaining balance', response.data.remaining_balance);
              setRemainingBalance(response.data.remaining_balance.toString());
            }
          }else{
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
          }
        },
        onError: (error) => {
            console.log('error',error.message)
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
      { barcode: barcodeData,order_no:orderNo },
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
            showError('Product not found.');
          } else if (error.response?.status === 401) {
            showError('Session expired. Please login again.');
          } else {
            showError('Failed to scan product. Please try again.');
          }
        }
      }
    );
  };

  const removeItem = (item: CartItem) => {
    Alert.alert('Remove Item', 'Remove this item from the cart?', [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
                // removeOrderItemMutation.mutate(
                //     { order_no: orderNo!, product_id: item.product.id },
                //     {
                //         onSuccess: () => {
                //             setCartItems(prev =>
                //                 prev.filter(i => i.product.id !== item.product.id)
                //             );
                //             showInfo('Item removed');
                //         },
                //         onError: () => {
                //             showError('Failed to remove item. Please try again.');
                //         }
                //     }
                // );
                setCartItems(prev =>
                    prev.filter(i => i.product.id !== item.product.id)
                );
                showInfo('Item removed');
            }
        }
    ]);
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
    
    if (remainingBalance !== '' && remainingBalance !== null) {
      console.log('remainingBalance',remainingBalance)
      return parseFloat(remainingBalance);
    }
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return calculateTotal() - totalPaid;
  };
  
  const handleCompleteTransaction = async(customerNumber?:string) => {
    
    setShowSmsModal(false);
    await completeOrderMutation.mutate({
      order_no:orderNo,
      customer_no:customerNumber || null,
      total:calculateTotal().toFixed(2)
    },{
      onSuccess: (response) => {
        console.log('handleCompleteTransaction',response);
        reset({
          paymentType: undefined,
          amount: '',
          referenceNumber: '',
        });
        setPayments([]);
        setCartItems([]);
        setOrderNo(null);
        setRemainingBalance('');
        showSuccess(`Order # ${orderNo} has been completed`);
      },
      onError: () => {
          showError('Failed to complete transaction. Please seek assistance for this issue.');
      },
      onSettled: () => {
    
      }
    })
  }

  const handleAdd = (item:CartItem['product']) => {
    setIsCartSynced(false);
    setRemainingBalance('');
    setCartItems(prev => {
      const existingItem = prev.find(i => i.product.id === item.id)
      if(existingItem){
        return prev.map(i => 
          i.product.id === item.id ? { ...i, quantity: i.quantity + 1 }  : i
        )
      }

      return [...prev,{product:item,quantity:1}]
    })
    console.log('add item',item)
  }

  const handleRemove = (item:CartItem['product']) => {
    setIsCartSynced(false);
    setRemainingBalance('');
    setCartItems(prev => {
      const existingItem = prev.find(i => i.product.id === item.id)
      if (existingItem) {
        // 1. If quantity is 2 or more, just decrement it
        if (existingItem.quantity > 1) {
          return prev.map(i => 
            i.product.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
          );
        } 
        // 2. If quantity is exactly 1, REMOVE it from the array entirely
        else {
          return prev.filter(i => i.product.id !== item.id); // Fixed typo here!
        }
      }
      // Fallback if item wasn't found
      return prev;
    })
  }

  const handleProceedToCheckout = async () => {
    
    console.log('isCartSynced',isCartSynced);
    if (!isCartSynced) {

        try {

          if (!orderNo) throw new Error("Missing Order Number");
          console.log('cart items',cartItems);
          const syncResponse = await syncCartMutation.mutateAsync({
            order_no: orderNo,
            cart_items: cartItems
          });

          if (syncResponse?.data?.remaining_balance !== undefined) {
             setRemainingBalance(syncResponse.data.remaining_balance.toString());
          }

          setIsCartSynced(true);
          setShowPaymentModal(true);

        } catch (error) {
          Alert.alert("Network Error", "Failed to secure cart to the database. Please check connection and try again.");
          return; // STOP! Do not open the payment modal!
        }

    } else {
        setShowPaymentModal(true);
    }
  };

  const handleConfirmPayment = async(payment_details:any) => {
    console.log('handleConfirmPayment',payment_details);

    const amountNum = parseFloat(payment_details.amountPaid);
    const remainingBalance = Number(calculateRemainingBalance().toFixed(2));
    console.log('amountNum',amountNum);
    console.log('remainingBalance',remainingBalance);

    if (!payment_details.method) {
      showError('Please select a payment method');
      return false;
    }

    // Validate reference number for PWALLET/GCASH
    if ((payment_details.method === 'PWALLET' || payment_details.method === 'GCASH') && 
        (!payment_details.referenceNumber || payment_details.referenceNumber.trim().length === 0)) {
      showError('Reference number is required for PWALLET and GCASH');
      return false;
    }

    if (amountNum > remainingBalance) {
      showError('Payment amount cannot exceed remaining balance');
      return false;
    }

    switch (payment_details.method){

      case 'PWALLET':
        try {
          const pwalletResponse = await pwalletDebitMutation.mutateAsync({
            reference_no: payment_details?.referenceNumber ?? "",
            amount: amountNum,
            store_code: 901,
            order_no:orderNo!,
            payment_method:payment_details.method
          });
          console.log('PWALLET PAYMENT RESPONSE',pwalletResponse.data);
          showSuccess('Pwallet payment success');
          setRemainingBalance(pwalletResponse.data.remaining_balance.toString());
          
        } catch (error:any) {
          console.log('P-WALLET error',error.message);
          setShowPaymentModal(false)
          showError(error.message);
          return false; 
        }
        break;
      
      case 'CASH':
        try {
          const cashPaymentResponse = await cashPaymentMutation.mutateAsync({
            cash_bill:payment_details.cashReceived.toString(),
            cash_change:payment_details.change.toString(),
            amount:amountNum,
            payment_method:payment_details.method,
            order_no:orderNo!,
          });
          console.log('CASH PAYMENT RESPONSE',cashPaymentResponse.data);
          showSuccess('Cash payment success');
          setRemainingBalance(cashPaymentResponse.data.remaining_balance.toString());
          // console.log('CASH PAYMENT RESPONSE',cashPaymentResponse);
        } catch (error) {
          console.log('CASH PAYMENT error',error);
          setShowPaymentModal(false)
          showError('Cash Payment Failed.');
          return false; 
        }
        break;

      case 'CREDIT_DEBIT_CARD':
        try {
          const ccResponse = await creditCardPaymentMutation.mutateAsync({
            amount:amountNum,
            payment_method:payment_details.method,
            order_no:orderNo!,
            reference_no:payment_details.referenceNumber!,
            qr_code_data:payment_details.ccQrData,
            terminal_type:payment_details.terminalType,
            card_type:payment_details.cardType ?? null,

          });
          console.log('CREDIT/DEBIT CARD PAYMENT RESPONSE',ccResponse.data);

          setRemainingBalance(ccResponse.data.remaining_balance.toString());
        } catch (error) {
          setShowPaymentModal(false)
          showError('Credit Card Payment Failed.');
          return false; 
        }
        break;

      case 'GCASH':
        try {
          const gcashResponse = await processPaymentMutation.mutateAsync({
            order_no:orderNo!,
            payment_method:payment_details.method,
            amount:amountNum,
            reference_no:payment_details.referenceNumber!
          });
          setRemainingBalance(gcashResponse.data.remaining_balance.toString());
          console.log('GCASH RESPONSE',gcashResponse);
        } catch (error:any) {
          console.log('GCASH error',error);
          setShowPaymentModal(false)
          showError(`Credit Card Payment Failed: ${error.message}`);
          return false; 
        }
        break;

      case 'SHOPEE_PAY':
        try {
          const shopeePayResponse = await processPaymentMutation.mutateAsync({
            order_no:orderNo!,
            payment_method:payment_details.method,
            amount:amountNum,
            reference_no:payment_details.referenceNumber!
          });
          setRemainingBalance(shopeePayResponse.data.remaining_balance.toString());
          console.log('SHOPEE PAY RESPONSE',shopeePayResponse);
        } catch (error:any) {
          console.log('SHOPEE PAY error',error);
          setShowPaymentModal(false)
          showError(`Shopee Pay Payment Failed: ${error.message}`);
          return false; 
        }
        break;
      
      case 'HOME_CREDIT':
        try {
          const homeCreditResponse = await processPaymentMutation.mutateAsync({
            order_no:orderNo!,
            payment_method:payment_details.method,
            amount:amountNum,
            reference_no:payment_details.referenceNumber!
          });
          setRemainingBalance(homeCreditResponse.data.remaining_balance.toString());
          console.log('HOME CREDIT RESPONSE',homeCreditResponse);
        } catch (error:any) {
          console.log('HOME CREDIT error',error);
          setShowPaymentModal(false)
          showError(`Home Credit Payment Failed: ${error.message}`);
          return false; 
        }
        break;

      case 'SKYRO':
        try {
          
          const skyroResponse = await skyroPaymentMutation.mutateAsync({
            amount:amountNum,
            payment_method:payment_details.method,
            order_no:orderNo!,
            reference_no:payment_details.referenceNumber!
          });
          setRemainingBalance(skyroResponse.data.remaining_balance.toString());
        } catch (error:any) {
          console.log('SKYRO error',error);
          setShowPaymentModal(false)
          showError(`Skyro Payment Failed: ${error.message}`);
          return false; 
        }
        break;

    }
    
    // For CASH payments, include cashBill and cashChange
    const newPayment = {
      type: payment_details.method,
      amount: amountNum,
      referenceNumber: (payment_details.method === 'PWALLET' || payment_details.method === 'GCASH' || payment_details.method === 'CREDIT_DEBIT_CARD' || payment_details.method === 'SHOPEE_PAY') ? payment_details.referenceNumber : undefined,
      cashBill: payment_details.method === 'CASH' ? parseFloat(payment_details.cashReceived || '0') : undefined,
      cashChange: payment_details.method === 'CASH' ? parseFloat(payment_details.change || '0') : undefined
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
    setShowPaymentModal(false)
  }

  const isProcessingPayment = 
    cashPaymentMutation.isPending || 
    creditCardPaymentMutation.isPending || 
    pwalletDebitMutation.isPending || 
    processPaymentMutation.isPending;
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
                      // updateQuantity(item, item.quantity - 1);
                      handleRemove(item.product);
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
                      // updateQuantity(item, item.quantity + 1);
                      handleAdd(item.product);
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
                    removeItem(item);
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
                {payment.cashBill && (
                  <>
                    <Text style={styles.paymentRefLabel}>Cash Bill: {payment.cashBill}</Text>
                    <Text style={styles.paymentRefLabel}>Cash Change: {payment.cashChange}</Text>
                  </>
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
                {`₱${calculateRemainingBalance().toFixed(2)}`}
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
              (cartItems.length === 0 || calculateRemainingBalance() <= 0.01 || syncCartMutation.isPending) && styles.payButtonDisabled
            ]}
            onPress={() => handleProceedToCheckout()} 
            // ✨ 1. ACTUALLY disable the button so it cannot be clicked:
            disabled={cartItems.length === 0 || calculateRemainingBalance() <= 0.01 || syncCartMutation.isPending}
          >
             <Ionicons 
              name="checkmark-circle-outline" 
              size={28} 
              color={(cartItems.length === 0 || calculateRemainingBalance() <= 0.01) ? "#CCCCCC" : "#FFFFFF"} 
            />
            {/* ✨ 2. Show a loading spinner if syncing, otherwise show "Pay" */}
            {syncCartMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.buttonLabel,
                (cartItems.length === 0 || calculateRemainingBalance() <= 0.01) && styles.buttonLabelDisabled
              ]}>
                Pay
              </Text>
            )}
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
            onPress={() => setShowSmsModal(true)}
          >
            <Ionicons 
              name="card-outline" 
              size={28} 
              color={(cartItems.length === 0 || payments.length === 0 || calculateRemainingBalance() > 0.01) ? "#CCCCCC" : "#FFFFFF"} 
            />
            <Text style={[
              styles.buttonLabel,
              (cartItems.length === 0 || payments.length === 0 || calculateRemainingBalance() > 0.01) && styles.buttonLabelDisabled
            ]}>Send SMS</Text>
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

        {/* Loyalty Card Scanner Modal */}
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
      {/* <BarcodeScanner
        isVisible={paymentScanner}
        onBarcodeScanned={(barcodeData) => {
          handlePaymentScanned(barcodeData)
        }}
        onClose={() => setPaymentScanner(false)}
        scanDelay={1000}
      /> */}

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
                onChangeText={(text) => setCustomerCardNumber(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
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

      <ItemList 
        visible={showItemList}
        onClose={() => setShowItemList(false)}
        onAdd={handleAdd}
        onRemove={handleRemove}
        // cartItemsMap={cartItemsMap }
        cartItems={cartItems}
      />

      {/* Payment Selection Modal */}
      <PaymentSelectionModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        balanceDue={calculateRemainingBalance()}
        // onSelectPayment={handlePaymentSelected}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingPayment}
      />


      {/* SMS Modal */}
      <SMSModal
        visible={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        onSubmit={handleCompleteTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // MAIN SCREEN & HEADER
  // ==========================================
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
  headerStatsText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  
  // ==========================================
  // TRANSACTION BADGES & BUTTONS (HEADER)
  // ==========================================
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

  // ==========================================
  // CART & ITEMS
  // ==========================================
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

  // ==========================================
  // CART SUMMARY & ACTION BOTTOM BAR
  // ==========================================
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
  scanButton: { backgroundColor: '#007AFF' },
  scanButtonDisabled: { backgroundColor: '#F2F2F7' },
  browseButton: { backgroundColor: '#FF9500' },
  browseButtonDisabled: { backgroundColor: '#F2F2F7' },
  checkoutButton: { backgroundColor: '#34C759' },
  checkoutButtonDisabled: { backgroundColor: '#F2F2F7' },
  postActionButton: { backgroundColor: '#34C759' },
  postActionButtonDisabled: { backgroundColor: '#E5E5EA' },

  // ==========================================
  // TRANSACTION & CARD MODALS
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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

  // ==========================================
  // NEW OPTIMIZED PAYMENT MODAL
  // ==========================================
  paymentModalContent: {
    backgroundColor: '#F2F2F7', 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeIcon: {
    position: 'absolute',
    right: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Payment Modal Summary Card
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  remainingBalanceAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingBalanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  remainingBalanceHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  remainingBalanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainingBalanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 8,
  },

  // Payment Modal Grid
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  paymentCard: {
    width: '31%', 
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentCardSelected: {
    borderColor: '#007AFF', 
  },
  paymentIcon: {
    marginBottom: 8,
  },
  paymentCardText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Payment Modal Footer
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  footerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  footerSubmitBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  footerSubmitBtnDisabled: {
    backgroundColor: '#A1C6EA',
  },
  footerSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  // ==========================================
  // SHARED INPUTS & UTILITIES
  // ==========================================
  inputSectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#3A3A3C',
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  disabledInput: {
    backgroundColor: '#E5E5EA',
    color: '#8E8E93',
  },
  errorInput: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B3010',
  },
  errorBorder: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  qrInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrScanButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  qrScanText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginLeft: 4,
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
  payButton: {
    backgroundColor: '#007AFF', // Your active primary blue (adjust if yours is different)
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  // ✨ Add this right below it:
  payButtonDisabled: {
    backgroundColor: '#E5E5EA', // A neutral, inactive gray
    opacity: 0.7, // Slightly fades the button to show it can't be tapped
  },
});
