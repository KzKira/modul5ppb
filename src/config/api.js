import axios from 'axios';

// Base URL configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

if (!BASE_URL) {
  // helpful during development if env var is missing
  // eslint-disable-next-line no-console
  console.warn('[api] VITE_API_BASE_URL is not set. API requests will use relative URLs.');
}

// Log base URL for easier debugging in development
/* eslint-disable no-console */
console.log('[api] BASE_URL =', BASE_URL);
/* eslint-enable no-console */

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Network error (no response) vs HTTP error with response
    if (!error.response) {
      // This is likely a network/CORS/timeout error
      const msg = error.message || 'Network Error';
      return Promise.reject({ message: msg, network: true, original: error });
    }

    const errData = error.response.data || {};
    const errorMessage = errData.message || error.message || 'An error occurred';
    return Promise.reject({ message: errorMessage, status: error.response.status, data: errData });
  },
);

export { apiClient, BASE_URL };