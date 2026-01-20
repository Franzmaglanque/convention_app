/**
 * Validation Rules and Constraints
 */

export const VALIDATION = {
  // Password
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Barcode
  BARCODE_MIN_LENGTH: 8,
  BARCODE_MAX_LENGTH: 13,
  BARCODE_PATTERN: /^[0-9]{8,13}$/,
  
  // Quantity
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 9999,
  
  // Price
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
  
  // Email
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone
  PHONE_PATTERN: /^(09|\+639)\d{9}$/,
  
  // Transaction
  MAX_ITEMS_PER_TRANSACTION: 100,
  MAX_TRANSACTION_AMOUNT: 1000000,
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid Philippine phone number',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be less than ${VALIDATION.MAX_PASSWORD_LENGTH} characters`,
  INVALID_BARCODE: 'Invalid barcode format',
  INVALID_QUANTITY: `Quantity must be between ${VALIDATION.MIN_QUANTITY} and ${VALIDATION.MAX_QUANTITY}`,
  INVALID_PRICE: 'Please enter a valid price',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
} as const;