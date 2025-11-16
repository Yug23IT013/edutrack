// API configuration for different environments
const getApiUrl = () => {
  // Check if we're in production (Vercel deployment)
  const isProduction = import.meta.env.PROD || window.location.hostname.includes('vercel.app');
  
  if (isProduction) {
    // In production, always use the full Render backend URL
    return import.meta.env.VITE_API_URL || 'https://edutrack-r3kn.onrender.com';
  }
  
  // In development, use empty string to leverage Vite proxy
  return '';
};

export const API_BASE_URL = getApiUrl();
export const isProduction = import.meta.env.PROD || window.location.hostname.includes('vercel.app');
export const isDevelopment = import.meta.env.DEV;

// Create axios instance with proper configuration
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to ensure authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiClient };

console.log('API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  isProduction,
  isDevelopment,
  hostname: window.location.hostname
});