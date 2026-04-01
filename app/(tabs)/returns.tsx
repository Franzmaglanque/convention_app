import PaymentSelectionModal, { PaymentDetails } from '@/components/modals/PaymentSelectionModal';
import ProductCatalogModal from '@/components/modals/ProductCatalogModal';
import { useToast } from '@/components/ToastProvider';
import { useOriginalOrderItems, usePostReturn, useProcessReturn, useSyncExchangeCart, useValidateReturnOrderMutation } from '@/hooks/useOrder';
import { usePwalletDebit, useSaveCashPayment, useSaveCreditCardPayment, useScanPwalletQr } from '@/hooks/usePayment';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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

// Utility formatter
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value);
};

type Step = 'search' | 'override' | 'selectReturns' | 'newExchangeCart';
export type PaymentMethod = 'CASH' | 'CARD' | 'E_WALLET';

export default function ReturnsScreen() {
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const { showSuccess, showError, showInfo } = useToast();
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('search');
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Basic States
  const [searchInput, setSearchInput] = useState(''); // ito yung original order no na i rereturn
  const [managerPin, setManagerPin] = useState('');
  const {refetch} = useOriginalOrderItems(searchInput)
  
  // Cart & Order States
  const [originalItems, setOriginalItems] = useState<any[]>([]); // Background validation list
  const [returnItems, setReturnItems] = useState<any[]>([]); // Items being returned (starts blank)
  const [exchangeItems, setExchangeItems] = useState<any[]>([]); // cart Items ng exchange
  const [newOrderNo, setNewOrderNo] = useState<string | null>(null); // Yung bagong Order NO
  const [appliedPayments, setAppliedPayments] = useState<PaymentDetails[]>([]);  // Tracking ng applied multi-tender payments
  const [isCartSynced, setIsCartSynced] = useState(false);

  const validateOrderMutation = useValidateReturnOrderMutation();
  const useProcessReturnMutation = useProcessReturn();
  const usePostReturnMutation = usePostReturn();
  const scanPwalletQrMutation = useScanPwalletQr();
  const pwalletDebitMutation = usePwalletDebit();
  const cashPaymentMutation = useSaveCashPayment();
  const creditCardPaymentMutation = useSaveCreditCardPayment();
  const syncExchangeCartMutation = useSyncExchangeCart();

  const totalReturnCredit = returnItems.reduce((sum, item) => sum + (item.price * item.returnQty), 0);
  const totalExchangeCost = exchangeItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const balanceDue = totalExchangeCost - totalReturnCredit;
  const isExchangeValid = totalExchangeCost >= totalReturnCredit;
  // NEW: Calculate how much they have paid so far and what is left
  const totalPaid = appliedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const remainingBalance = Math.max(0, balanceDue - totalPaid);

  
  const handleValidateOrder = () => {
    if (searchInput.length < 5) {
      Alert.alert('Error', 'Please enter a valid Order Number');
      return;
    }
    validateOrderMutation.mutate(searchInput, {
      onSuccess: () => {

        setCurrentStep('override');
      },
      onError: () => {
        Alert.alert('Not Found', 'Order not found for this vendor.');
      }
    });
  };

  const handleManagerLogin = async () => {
    
    if (managerPin !== '1234') { 
      Alert.alert('Access Denied', 'Invalid Manager PIN');
      setManagerPin('');
      return;
    }
    const { data } = await refetch();
    const fetchedOriginalItems = data.data; 
    console.log('fetchedOriginalItems',fetchedOriginalItems);
    
    // 2. Save original items to background state for validation
    setOriginalItems(fetchedOriginalItems);
    
    // 3. Start the return cart COMPLETELY BLANK
    setReturnItems([]); 
    
    setManagerPin('');
    setCurrentStep('selectReturns');
  };

  const handleAddReturnItem = (itemId: string) => {
    // VALIDATION 1: Did they actually buy this?
    const originalItem = originalItems.find(item => item.id === itemId);
    if (!originalItem) {
      Alert.alert('Invalid Scan', 'This item was not part of the original order.');
      return;
    }

    setReturnItems(prev => {
      const existingItem = prev.find(i => i.id === itemId);
      
      if (existingItem) {
        // VALIDATION 2: Are they trying to return more than they bought?
        if (existingItem.returnQty >= originalItem.maxQty) {
          Alert.alert('Limit Reached', `Customer only bought ${originalItem.maxQty} of this item.`);
          return prev;
        }
        // Increment quantity
        return prev.map(i => i.id === itemId ? { ...i, returnQty: i.returnQty + 1 } : i);
      } else {
        // Add new item to the blank cart
        return [...prev, { ...originalItem, returnQty: 1 }];
      }
    });
  };

  const updateReturnQty = (id: string, delta: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.returnQty + delta;
        if (newQty >= 0 && newQty <= item.maxQty) {
          return { ...item, returnQty: newQty };
        }
      }
      return item;
    }).filter(item => item.returnQty > 0)); // Auto-remove from list if qty hits 0
  };

  const handleProceedToExchange = () => {
    if (totalReturnCredit === 0) {
      Alert.alert('Empty Cart', 'Please scan or select items to return.');
      return;
    }
    const params = {
      order_no:searchInput,
      return_items:returnItems,
      total_return_credit:totalReturnCredit.toFixed(2)
    }
    console.log('originalItems',originalItems);
    useProcessReturnMutation.mutate(params, {
      onSuccess: (res) => {
        console.log('useProcessReturnMutation',res);
        setNewOrderNo(res.data.new_order_no);
        setCurrentStep('newExchangeCart');
      },
      onError: () => {

      }
    });
  };

  // const handleAddNewExchangeItem = (selectedItem: any) => {
  //   setIsCartSynced(false);
  //   setExchangeItems(prev => {
  //     // Check if it's already in the cart to increment qty
  //     const existingItem = prev.find(i => i.id === selectedItem.id);
  //     if (existingItem) {
  //       return prev.map(i => i.id === selectedItem.id ? { ...i, qty: i.qty + 1 } : i);
  //     }
  //     // Add new item with qty: 1
  //     return [...prev, { ...selectedItem, qty: 1 }];
  //   });
  // };

  // const handleDecrementExchangeItem = (selectedItem: any) => {
  //   setIsCartSynced(false);
  //   setExchangeItems(prev => {
  //     const existingItem = prev.find(i => i.id === selectedItem.id);
      
  //     if (existingItem && existingItem.qty > 1) {
  //       // Just subtract 1
  //       return prev.map(i => i.id === selectedItem.id ? { ...i, qty: i.qty - 1 } : i);
  //     } else {
  //       // If it was at 1, completely remove it from the array
  //       return prev.filter(i => i.id !== selectedItem.id);
  //     }
  //   });
  // };

  const handleAddNewExchangeItem = useCallback((selectedItem: any) => {
    setIsCartSynced(false);
    setExchangeItems(prev => {
      const existingItem = prev.find(i => i.id === selectedItem.id);
      if (existingItem) {
        return prev.map(i => i.id === selectedItem.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...selectedItem, qty: 1 }];
    });
  }, []); // ← empty deps because we use the `prev` functional update pattern

  const handleDecrementExchangeItem = useCallback((selectedItem: any) => {
    setIsCartSynced(false);
    setExchangeItems(prev => {
      const existingItem = prev.find(i => i.id === selectedItem.id);
      if (existingItem && existingItem.qty > 1) {
        return prev.map(i => i.id === selectedItem.id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== selectedItem.id);
    });
  }, []);

  // check remaining balance if may balance show payment
  // if wala nang balance post return na
  const handleProceedToCheckout = async () => {

    
    if (remainingBalance > 0) {

      if (!isCartSynced) {

        try {

          if (!newOrderNo) throw new Error("Missing Order Number");

          await syncExchangeCartMutation.mutateAsync({
            order_no: newOrderNo.toString(),
            return_items: exchangeItems
          });

          setIsCartSynced(true);
          setShowPaymentModal(true);

        } catch (error) {
          Alert.alert("Network Error", "Failed to secure cart to the database. Please check connection and try again.");
          return; // STOP! Do not open the payment modal!
        }

      } else {

        setShowPaymentModal(true);
      }
    } else {

      if (!newOrderNo) return;

      usePostReturnMutation.mutate({
        order_no:newOrderNo?.toString(),
        total:totalReturnCredit,
        balance_due:balanceDue
      }, {
        onSuccess: (res) => {
          console.log('res',res);
          showSuccess('Exchange Complete!');
          setCurrentStep('search');
          setSearchInput('')
          setReturnItems([]);
          setOriginalItems([])
          setAppliedPayments([]);
          setExchangeItems([])
          setNewOrderNo(null)
        },
        onError: (err) => {
          console.error("Mutation failed:", err);
          showError('Failed to process return.');
        }
      }); 
    }
  };

  // KAPAG MAY SOBRANG PINAMILI
  const handleConfirmPayment = async (details: PaymentDetails) => {
    setShowPaymentModal(false);
    try {
      if (!newOrderNo) {
        showError("Missing Order Number!");
        return;
      }
      switch (details.method){
        // case 'PWALLET':
        //   try {
        //     await pwalletDebitMutation.mutateAsync({
        //       reference_no: details?.referenceNumber ?? "",
        //       amount: amountNum,
        //       store_code: 901,
        //       order_no:orderNo!,
        //       payment_method:details.paymentType
        //     });


      
        //   } catch (error) {
        //     console.log('debit error',error);
        //     showError('Debit failed. Please try again.');
        //     return false; 
        //   }
        //   break;
        
        case 'CASH':
          try {
            await cashPaymentMutation.mutateAsync({
              cash_bill:(details.cashReceived)!.toString(),
              cash_change:(details.change)!.toString(),
              amount:details.amountPaid,
              payment_method:details.method,
              order_no:newOrderNo.toString(),
            });
          } catch (error) {
            showError('Cash Payment Failed.');
            return false; 
          }
          break;

        case 'CREDIT_CARD':

          try {

            await creditCardPaymentMutation.mutateAsync({
              amount: details.amountPaid,
              payment_method: details.method,
              order_no: newOrderNo.toString(),
              reference_no: details.referenceNumber || '',
              qr_code_data:''

            });

          } catch (error) {
            showError('Credit Card Payment Failed.');
            return false; 
          }
          break;
      }

      // 2. Update local UI to show the payment
      setAppliedPayments(prev => [...prev, details]);
      showSuccess(`Payment of ${formatCurrency(details.amountPaid)} applied!`);

    } catch (error) {
      
    }

  };

  // UI ng type order_no
  const renderSearchStep = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="swap-horizontal-outline" size={80} color="#007AFF" style={styles.iconSpaced} />
      <Text style={styles.headerTitle}>Return / Exchange</Text>
      <Text style={styles.subtext}>Enter the order number to begin the return process.</Text>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.largeInput}
          placeholder="e.g. 1724054143"
          value={searchInput}
          onChangeText={setSearchInput}
          keyboardType="number-pad"
        />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleValidateOrder}>
        <Text style={styles.primaryButtonText}>Validate Order</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelectReturnsStep = () => (
    <View style={styles.flexContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Return Items</Text>
        <Text style={styles.subtextSm}>Original Order #{searchInput}</Text>
      </View>

      <ScrollView style={styles.itemsList}>
        {returnItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>Scan or browse products the customer is returning.</Text>
          </View>
        ) : (
          returnItems.map((item) => (
            <View key={item.id} style={styles.returnItemCard}>
              <View style={styles.returnItemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)} each</Text>
                <Text style={styles.maxQtyText}>Original Purchase: {item.maxQty}</Text>
              </View>
              
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => updateReturnQty(item.id, -1)}>
                  <Ionicons name="remove" size={20} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{item.returnQty}</Text>
                <TouchableOpacity 
                  style={[styles.stepperBtn, item.returnQty === item.maxQty && styles.stepperDisabled]} 
                  onPress={() => updateReturnQty(item.id, 1)}
                  disabled={item.returnQty === item.maxQty}
                >
                  <Ionicons name="add" size={20} color={item.returnQty === item.maxQty ? "#C7C7CC" : "#007AFF"} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.actionRow}>
          {/* <TouchableOpacity style={styles.halfButton} onPress={handleAddReturnItem}> */}
          <TouchableOpacity style={styles.halfButton}>

            <Ionicons name="barcode-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Scan Item</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.halfButton} 
            onPress={() => setShowBrowseModal(true)}
          >
            <Ionicons name="search-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Browse Items</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Return Credit:</Text>
          <Text style={styles.returnCreditValue}>{formatCurrency(totalReturnCredit)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutButton, totalReturnCredit === 0 && styles.buttonDisabled]}
          disabled={totalReturnCredit === 0}
          onPress={handleProceedToExchange}
        >
          <Text style={styles.checkoutButtonText}>Confirm Returns</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNewExchangeCart = () => {
    const isCartLocked = appliedPayments.length > 0;
    return (
      <View style={styles.flexContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Exchange Cart</Text>
          <Text style={styles.subtextSm}>New Order #{newOrderNo}</Text>
        </View>

        <ScrollView style={styles.itemsList}>
          {exchangeItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>Scan or browse replacement items.</Text>
            </View>
          ) : (
            exchangeItems.map((item) => {
              const lineTotal = item.price * item.qty;

              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price)} each</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1C1E' }}>
                      {formatCurrency(lineTotal)}
                    </Text>

                    {/* --- UPDATED STEPPER UI --- */}
                    <View style={[styles.stepper, isCartLocked && styles.stepperLocked]}>
                      <TouchableOpacity 
                        style={styles.stepperBtn} 
                        onPress={() => handleDecrementExchangeItem(item)}
                        disabled={isCartLocked} // Disables the button!
                      >
                        <Ionicons 
                          name={item.qty === 1 ? "trash-outline" : "remove"} 
                          size={20} 
                          // Turns gray if locked, otherwise normal red/blue
                          color={isCartLocked ? "#C7C7CC" : (item.qty === 1 ? "#FF3B30" : "#007AFF")} 
                        />
                      </TouchableOpacity>
                      
                      <Text style={[styles.stepperValue, isCartLocked && { color: '#8E8E93' }]}>
                        {item.qty}
                      </Text>
                      
                      <TouchableOpacity 
                        style={styles.stepperBtn} 
                        onPress={() => handleAddNewExchangeItem(item)}
                        disabled={isCartLocked} // Disables the button!
                      >
                        <Ionicons 
                          name="add" 
                          size={20} 
                          color={isCartLocked ? "#C7C7CC" : "#007AFF"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

            {/* NEW: Lock Warning Banner */}
            {isCartLocked && (
              <View style={styles.lockWarningBanner}>
                <Ionicons name="lock-closed" size={16} color="#8E8E93" />
                <Text style={styles.lockWarningText}>Cart is locked because a payment was applied.</Text>
              </View>
            )}
            {/* UPDATED: Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.halfButton, isCartLocked && styles.buttonDisabled]} 
                onPress={() => Alert.alert('Scan', 'Scanner active')}
                disabled={isCartLocked}
              >
                <Ionicons name="barcode-outline" size={20} color={isCartLocked ? "#8E8E93" : "#007AFF"} />
                <Text style={[styles.actionButtonText, isCartLocked && { color: '#8E8E93' }]}>Scan Item</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.halfButton, isCartLocked && styles.buttonDisabled]} 
                onPress={() => setShowCatalogModal(true)}
                disabled={isCartLocked}
              >
                <Ionicons name="search-outline" size={20} color={isCartLocked ? "#8E8E93" : "#007AFF"} />
                <Text style={[styles.actionButtonText, isCartLocked && { color: '#8E8E93' }]}>Browse Items</Text>
              </TouchableOpacity>
            </View>
          
        </ScrollView>

        <View style={styles.footer}>
          
          {/* ZONE 1: THE BILL (Initial Math) */}
          <View style={styles.billContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Return Credit:</Text>
              <Text style={styles.returnCreditValue}>- {formatCurrency(totalReturnCredit)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>New Items Total:</Text>
              <Text style={[styles.summaryValue, !isExchangeValid && styles.errorText]}>
                {formatCurrency(totalExchangeCost)}
              </Text>
            </View>
            {/* Add the Initial Exchange Balance right here! */}
            <View style={styles.initialBalanceRow}>
              <Text style={styles.initialBalanceLabel}>Exchange Balance:</Text>
              <Text style={styles.initialBalanceValue}>{formatCurrency(balanceDue)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ZONE 2: APPLIED PAYMENTS (Only shows if they paid something) */}
          {appliedPayments.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.paymentsHeader}>Applied Payments</Text>
              {appliedPayments.map((payment, index) => (
                <View key={index} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{payment.method}</Text>
                  <Text style={styles.paymentValue}>- {formatCurrency(payment.amountPaid)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ZONE 3: THE FOCUS AREA (Huge Remaining Balance) */}
          {isCartLocked && <View style={[
            styles.remainingBalanceContainer, 
            remainingBalance === 0 ? styles.balanceZero : styles.balanceOwed
          ]}>
            <Text style={[
              styles.remainingBalanceLabel,
              remainingBalance === 0 && { color: '#248A3D' }
            ]}>
              Remaining Balance
            </Text>
            <Text style={[
              styles.remainingBalanceHuge,
              remainingBalance === 0 && { color: '#34C759' }
            ]}>
              {formatCurrency(remainingBalance)}
            </Text>
          </View>}

          {!isExchangeValid && (
            <Text style={styles.warningText}>
              <Ionicons name="warning" size={14} /> Cart must be {formatCurrency(totalReturnCredit)} or higher.
            </Text>
          )}

          <TouchableOpacity 
            style={[styles.checkoutButton, !isExchangeValid && styles.buttonDisabled]}
            disabled={!isExchangeValid}
            onPress={handleProceedToCheckout}
          >
            <Text style={styles.checkoutButtonText}>
              {remainingBalance === 0 ? 'Complete Exchange' : 'Add Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  };

  const renderBrowseModal = () => (
    <Modal visible={showBrowseModal} transparent animationType="slide">
      <View style={styles.bottomSheetOverlay}>
        <View style={styles.bottomSheetContent}>
          
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Original Order Items</Text>
            <TouchableOpacity onPress={() => setShowBrowseModal(false)}>
              <Ionicons name="close-circle" size={28} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {originalItems.length === 0 ? (
              <Text style={styles.emptyStateText}>No items found in original order.</Text>
            ) : (
              originalItems.map((item) => {
                // Check how many of this item are already in the return cart
                const currentlyReturning = returnItems.find(i => i.id === item.id)?.returnQty || 0;
                const isFullyReturned = currentlyReturning >= item.maxQty;

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.browseItemRow, isFullyReturned && styles.browseItemDisabled]}
                    disabled={isFullyReturned}
                    onPress={() => handleAddReturnItem(item.id)}
                  >
                    <View style={styles.browseItemInfo}>
                      {/* numberOfLines={3} allows wrapping but prevents it from taking over the screen */}
                      <Text style={styles.itemName} numberOfLines={3}>
                        {item.name}
                      </Text>
                      
                      <View style={styles.skuRow}>
                        <Text style={styles.itemSubDetail}>SKU: {item.sku || 'N/A'}</Text>
                        <Text style={styles.itemSubDetail}> • </Text>
                        <Text style={styles.itemSubDetail}>UPC: {item.barcode || 'N/A'}</Text>
                      </View>

                      <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                    
                    <View style={styles.browseItemAction}>
                      <Text style={styles.browseItemCount}>
                        {currentlyReturning} / {item.maxQty} Returned
                      </Text>
                      {!isFullyReturned ? (
                        <Ionicons name="add-circle" size={28} color="#007AFF" />
                      ) : (
                        <Ionicons name="checkmark-circle" size={28} color="#34C759" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );

  const exchangeItemsMap = useMemo(() => {
    return exchangeItems.reduce((acc: Record<string | number, number>, item) => {
      acc[item.id] = item.qty;
      return acc;
    }, {});
  }, [exchangeItems]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {currentStep === 'search' && renderSearchStep()}
        {currentStep === 'selectReturns' && renderSelectReturnsStep()}
        {currentStep === 'newExchangeCart' && renderNewExchangeCart()}

        {renderBrowseModal()}

        <Modal visible={currentStep === 'override'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="shield-checkmark" size={40} color="#FF9500" style={{ marginBottom: 12 }} />
              <Text style={styles.modalTitle}>Manager Override</Text>
              <Text style={styles.modalSubtext}>Enter PIN to authorize return.</Text>
              <TextInput
                style={styles.pinInput}
                placeholder="****"
                secureTextEntry
                keyboardType="number-pad"
                value={managerPin}
                onChangeText={setManagerPin}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setCurrentStep('search')}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalApprove} onPress={handleManagerLogin}>
                  <Text style={styles.modalApproveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
        
        {/* <ProductCatalogModal 
          visible={showCatalogModal} 
          onClose={() => setShowCatalogModal(false)}
          onAdd={handleAddNewExchangeItem}         
          onRemove={handleDecrementExchangeItem}   
          cartItems={exchangeItems}              
        /> */}
        <ProductCatalogModal 
          visible={showCatalogModal} 
          onClose={() => setShowCatalogModal(false)}
          onAdd={handleAddNewExchangeItem}         
          onRemove={handleDecrementExchangeItem}   
          cartItemsMap={exchangeItemsMap}   // ← was: cartItems={exchangeItems}
        />

        {/* NEW PAYMENT MODAL */}
        <PaymentSelectionModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          balanceDue={remainingBalance}
          // onSelectPayment={handlePaymentSelected}
          onConfirmPayment={handleConfirmPayment}
        />
   
    </SafeAreaView>
    
  );
}

// ... Use the exact same styles object from the previous step ...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    flexContainer: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', padding: 24 },
    iconSpaced: { alignSelf: 'center', marginBottom: 24 },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#1C1C1E' },
    subtext: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 32 },
    subtextSm: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
    inputWrapper: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 },
    largeInput: { height: 60, fontSize: 20, textAlign: 'center', fontWeight: '600' },
    primaryButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
    
    itemsList: { flex: 1, padding: 16 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 16, textTransform: 'uppercase' },
    
    // Return Item Card & Stepper
    returnItemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F2F2F7' },
    returnItemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
    itemPrice: { fontSize: 14, color: '#007AFF', marginTop: 4, fontWeight: '500' },
    maxQtyText: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
    stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' },
    stepperBtn: { padding: 8 },
    stepperDisabled: { opacity: 0.5 },
    stepperValue: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  
    // Exchange Cart
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyStateText: { color: '#8E8E93', textAlign: 'center', marginTop: 16, fontSize: 15, paddingHorizontal: 20 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    removeBtn: { padding: 8 },
    scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, marginTop: 16 },
    scanButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    
    // Footer
    footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 16, color: '#8E8E93' },
    summaryValue: { fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
    returnCreditValue: { fontSize: 16, fontWeight: '700', color: '#34C759' }, // Green for credit
    divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 12 },
    balanceLabel: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
    balanceValue: { fontSize: 18, fontWeight: '700', color: '#007AFF' },
    warningText: { color: '#FF3B30', fontSize: 13, marginTop: 8, textAlign: 'center' },
    checkoutButton: { backgroundColor: '#34C759', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    buttonDisabled: { backgroundColor: '#E5E5EA' },
    checkoutButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    errorText: { color: '#FF3B30' },
  
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', textAlign: 'center', marginBottom: 8 },
    modalSubtext: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 20 },
    pinInput: { backgroundColor: '#F2F2F7', width: '100%', height: 50, borderRadius: 10, textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
    modalCancel: { flex: 1, padding: 14, backgroundColor: '#F2F2F7', borderRadius: 10, alignItems: 'center' },
    modalCancelText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
    modalApprove: { flex: 1, padding: 14, backgroundColor: '#FF9500', borderRadius: 10, alignItems: 'center' },
    modalApproveText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

    actionRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 12, // Adds perfect spacing between the two buttons
      marginTop: 16,
    },
    halfButton: {
      flex: 1, // Makes the buttons split the width 50/50
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F2F2F7',
      padding: 16,
      borderRadius: 12,
    },
    actionButtonText: {
      color: '#007AFF',
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 8,
    },
    bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Pushes the content to the bottom
  },
  bottomSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%', // Don't let it cover the whole screen
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  sheetList: {
    padding: 16,
  },
  browseItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  browseItemDisabled: {
    opacity: 0.5, // Fades out the item if they've maxed out the return limit
  },
  browseItemInfo: {
    flex: 1,
  },
  browseItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  browseItemCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
    flexWrap: 'wrap', // Ensures it wraps to the next line if the barcode is really long
  },
  itemSubDetail: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },

  billContainer: {
    marginBottom: 8,
  },
  initialBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E5EA',
  },
  initialBalanceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  initialBalanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  paymentsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentValue: {
    fontSize: 16,
    color: '#FF3B30', // Keeps it red to show deduction!
    fontWeight: '600',
  },
  
  // The Huge Focus Area
  remainingBalanceContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceOwed: {
    backgroundColor: '#F2F2F7', // Neutral gray when they owe money
  },
  balanceZero: {
    backgroundColor: '#E8F8EE', // Turns light green when balance is 0!
  },
  remainingBalanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  remainingBalanceHuge: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  stepperLocked: {
    backgroundColor: '#F2F2F7', // Gray out the stepper background
    borderColor: '#E5E5EA',
  },
  lockWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  lockWarningText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
});