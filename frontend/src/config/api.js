// API configuration for different environments
const getApiUrl = () => {
  // In production (Vercel), use the Render backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://edutrack-r3kn.onrender.com';
  }
  
  // In development, use the proxy (which forwards to localhost:5000)
  return import.meta.env.VITE_API_URL || '';
};

export const API_BASE_URL = getApiUrl();
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

console.log('API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  isProduction,
  isDevelopment
});