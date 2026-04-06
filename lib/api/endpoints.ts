/**
 * API Endpoints for Puregold Convention POS App
 * Centralized endpoint definitions for type safety and maintainability
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
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
    ORDER_PAYMENT_LIST: (order_no:string) => `order/payments-list/${order_no}`,
    VALIDATE_RETURN_ORDER: (order_no:string) => `order/return/validate/${order_no}`,
    RETURN_REPLACE_FETCH_ORIGINAL_ORDER_ITEMS: (order_no:string) => `order/return/fetch-items/${order_no}`,
    PROCESS_RETURN: 'order/return/process',
    POST_RETURN: 'order/return/post',
    SYNC_EXCHANGE_CART: 'order/return/sync-cart',
    SYNC_CART: 'order/sync-cart'
  },

  PRODUCTS: {
    SCAN: '/product/scan',
    PRODUCT_LIST: '/product/fetch-list',
  },

  PAYMENTS:{
    PWALLET_PARSE_QR: 'payment/pwallet/qrparse',
    PWALLET_DEBIT: 'payment/pwallet/debit',
    SAVE_CASH: 'payment/cash/save',
    SAVE_CREDIT_CARD: 'payment/credit/save',
    PROCESS_PAYMENT: 'payment/process'
  },

  SUPPLIER:{
    DASHBOARD_SALES: 'supplier/app/dashboard_sales',
  }

} as const;

export type Endpoints = typeof API_ENDPOINTS;