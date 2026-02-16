/**
 * API Endpoints for Puregold Convention POS App
 * Centralized endpoint definitions for type safety and maintainability
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/supplier/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_TOKEN: '/auth/verify',
  },

  STORES: {
    LIST: '/storeList',
  },

  ORDER: {
    NEW_ORDER: '/supplier/new-order',
  },

  PRODUCTS: {
    SCAN: '/product/scan',
    // SCAN: '/supplier/scan-product',

    FIND_BY_BARCODE: (barcode: string) => `/products/barcode/${barcode}`,
    SEARCH: '/products/search',
  },

  PAYMENTS:{
    PWALLET_PARSE_QR: 'payment/pwallet/qrparse',
    PWALLET_DEBIT: 'payment/pwallet/debit',
  }

} as const;

// Helper type to extract endpoint return types
export type Endpoints = typeof API_ENDPOINTS;