/**
 * Payment-related Constants
 */

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  GCASH: 'gcash',
  PAYMAYA: 'paymaya',
  CREDIT: 'credit',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.CARD]: 'Credit/Debit Card',
  [PAYMENT_METHODS.GCASH]: 'GCash',
  [PAYMENT_METHODS.PAYMAYA]: 'PayMaya',
  [PAYMENT_METHODS.CREDIT]: 'Credit Terms',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PROCESSING]: 'Processing',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: '#FFA500',
  [PAYMENT_STATUS.PROCESSING]: '#0066cc',
  [PAYMENT_STATUS.COMPLETED]: '#4CAF50',
  [PAYMENT_STATUS.FAILED]: '#F44336',
  [PAYMENT_STATUS.REFUNDED]: '#9E9E9E',
};