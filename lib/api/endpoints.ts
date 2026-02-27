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
    NEW_ORDER: '/order/new',
    ADD_ITEM: '/order/add-item',
    UPDATE_ITEM: '/order/item',
    REMOVE_ITEM: '/order/item',
    COMPLETE_ORDER: '/order/complete',
    CANCEL_ORDER: '/order/cancel',
    SUPPLIER_ORDER_LIST: '/order/list',
    ORDER_ITEM_LIST: (order_no:string) => `order/items-list/${order_no}`,
    ORDER_PAYMENT_LIST: (order_no:string) => `order/payments-list/${order_no}`
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