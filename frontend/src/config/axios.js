import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
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
      // Only remove token if it's an actual auth error
      const errorMessage = error.response.data?.message || '';
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('Invalid credentials')) {
        localStorage.removeItem('token');
      }
      return Promise.reject(new Error(errorMessage || 'Session expired. Please login again.'));
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