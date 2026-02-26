/**
 * API Endpoints for Puregold Convention POS App
 * Centralized endpoint definitions for type safety and maintainability
 */

export const API_ENDPOINTS = {
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
    ADD_ITEM: '/supplier/order/add-item',
    UPDATE_ITEM: '/supplier/order/item',
    REMOVE_ITEM: '/supplier/order/item',
    COMPLETE_ORDER: '/supplier/complete-order',
    SUPPLIER_ORDER_LIST: '/supplier/order-list',

  },

  PRODUCTS: {
    SCAN: '/product/scan',
    PRODUCT_LIST: '/product/fetch-list',
  },

  PAYMENTS:{
    PWALLET_PARSE_QR: 'payment/pwallet/qrparse',
    PWALLET_DEBIT: 'payment/pwallet/debit',
    SAVE_CASH: 'payment/cash/save'
  }

} as const;

export type Endpoints = typeof API_ENDPOINTS;