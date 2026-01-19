/**
 * API Endpoints for Puregold Convention POS App
 * Centralized endpoint definitions for type safety and maintainability
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_TOKEN: '/auth/verify',
  },

  STORES: {
    LIST: '/storeList',
  }

} as const;

// Helper type to extract endpoint return types
export type Endpoints = typeof API_ENDPOINTS;