import { useAuthStore } from '@/stores/auth.store';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TIMEOUT = 15000;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add token to all requests except login
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip adding token for login endpoint
    if (config.url === '/supplier/login') {
      return config;
    }

    // Get token from Zustand store
    const token = useAuthStore.getState().token;
    console.log('Attaching token to request:', token);
    
    if (token) {
      config.headers['x-account-session-token'] = token;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    if (serverMessage) {
      error.message = serverMessage; // "Token expired"
    }

    if(status === 401){
      useAuthStore.getState().logout();
      router.replace('/');

    }
    return Promise.reject(error);
  }
);