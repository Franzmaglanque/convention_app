/**
 * Success and Error Messages
 */

export const ERROR_MESSAGES = {
  // Network
  NETWORK_ERROR: 'No internet connection. Please check your network.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  
  // Authentication
  UNAUTHORIZED: 'Your session has expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  
  // Server
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  
  // Products
  PRODUCT_NOT_FOUND: 'Product not found.',
  BARCODE_NOT_FOUND: 'Product not found for this barcode.',
  INSUFFICIENT_STOCK: 'Insufficient stock available.',
  
  // Transactions
  TRANSACTION_ERROR: 'Failed to process transaction. Please try again.',
  TRANSACTION_NOT_FOUND: 'Transaction not found.',
  CANNOT_VOID_TRANSACTION: 'This transaction cannot be voided.',
  
  // Payments
  PAYMENT_ERROR: 'Payment processing failed. Please try again.',
  PAYMENT_DECLINED: 'Payment was declined. Please try a different payment method.',
  
  // General
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  
  // Transactions
  TRANSACTION_CREATED: 'Transaction created successfully',
  TRANSACTION_UPDATED: 'Transaction updated successfully',
  TRANSACTION_COMPLETED: 'Transaction completed successfully',
  TRANSACTION_VOIDED: 'Transaction voided successfully',
  
  // Payments
  PAYMENT_SUCCESS: 'Payment processed successfully',
  PAYMENT_REFUNDED: 'Payment refunded successfully',
  
  // Products
  PRODUCT_ADDED: 'Product added to cart',
  PRODUCT_REMOVED: 'Product removed from cart',
  PRODUCT_UPDATED: 'Product quantity updated',
  
  // General
  SAVED: 'Changes saved successfully',
  DELETED: 'Deleted successfully',
} as const;

export const INFO_MESSAGES = {
  SCANNING: 'Point camera at barcode to scan',
  PROCESSING: 'Processing...',
  LOADING: 'Loading...',
  NO_DATA: 'No data available',
  EMPTY_CART: 'Your cart is empty',
  OFFLINE_MODE: 'You are currently offline',
} as const;