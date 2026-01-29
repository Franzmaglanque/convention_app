/**
 * Transaction-related Constants
 */

export const TRANSACTION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  VOID: 'void',
  CANCELLED: 'cancelled',
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  [TRANSACTION_STATUS.DRAFT]: 'Draft',
  [TRANSACTION_STATUS.PENDING]: 'Pending',
  [TRANSACTION_STATUS.COMPLETED]: 'Completed',
  [TRANSACTION_STATUS.VOID]: 'Void',
  [TRANSACTION_STATUS.CANCELLED]: 'Cancelled',
};

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  [TRANSACTION_STATUS.DRAFT]: '#9E9E9E',
  [TRANSACTION_STATUS.PENDING]: '#FFA500',
  [TRANSACTION_STATUS.COMPLETED]: '#4CAF50',
  [TRANSACTION_STATUS.VOID]: '#F44336',
  [TRANSACTION_STATUS.CANCELLED]: '#757575',
};

export const TRANSACTION_TYPES = {
  SALE: 'sale',
  RETURN: 'return',
  VOID: 'void',
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];