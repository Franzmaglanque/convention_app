import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';


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