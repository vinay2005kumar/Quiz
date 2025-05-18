import axios from 'axios';
import { config } from './config';

// Create configured axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add /api prefix to all requests that don't already have it
    if (!config.url.startsWith('/api/')) {
      config.url = `/api${config.url}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle unauthorized errors
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle other errors
    const errorMessage = error.response.data?.message || error.message || 'An error occurred';
    console.error('API Error:', {
      status: error.response.status,
      message: errorMessage,
      url: error.config.url
    });
    return Promise.reject(new Error(errorMessage));
  }
);

export default api; 