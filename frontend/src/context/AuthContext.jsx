import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { config } from '../config/config';

// Create the auth context
const AuthContext = createContext(null);

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Create axios instance with configuration
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log API configuration
console.log('API Configuration:', {
  baseURL: api.defaults.baseURL,
  environment: process.env.NODE_ENV || import.meta.env.MODE
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Request Config:', {
      url: config.baseURL + config.url,
      hasToken: !!token,
      method: config.method
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Authentication error - clearing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - Unable to connect to API:', config.apiUrl);
      console.error('Full error details:', error);
    } else {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Initial auth check:', { hasToken: !!token });
    
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        navigate('/login');
      }
    }
  }, [navigate]);

  // Verify authentication with backend
  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const response = await api.get('/auth/me');
      
      console.log('Auth check response:', {
        success: true,
        hasUser: !!response.data?.user
      });

      if (response.data && response.data.user) {
        setUser(response.data.user);
        setAuthError(null);
      } else {
        console.warn('Auth check: Valid response but no user data');
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Auth check failed:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setAuthError(error.message);
      localStorage.removeItem('token');
      setUser(null);
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // User login
  const login = async (email, password) => {
    try {
      setAuthError(null);
      console.log('Attempting login...');
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      console.log('Login successful:', {
        hasToken: !!response.data.token,
        hasUser: !!response.data.user
      });
          
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      
      // Don't verify token immediately to avoid race condition
      return { success: true };
    } catch (error) {
      console.error('Login failed:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setAuthError(error.response?.data?.message || 'Login failed');
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // User registration with improved error handling
  const register = async (userData) => {
    try {
      setAuthError(null);
      console.log('Starting registration...');
      
      if (userData.role === 'student' && !userData.section) {
        return {
          success: false,
          error: 'Section is required for students'
        };
      }
      
      const response = await api.post('/auth/register', userData);
      console.log('Registration successful:', {
        hasToken: !!response.data.token,
        hasUser: !!response.data.user
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      
      // Don't verify token immediately to avoid race condition
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setAuthError(error.response?.data?.message || 'Registration failed');
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  // User logout
  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);
    navigate('/login');
  };

  const updateProfile = async (profileData) => {
    try {
      setAuthError(null);
      console.log('Updating profile...');
      const response = await api.put('/auth/update-profile', profileData);
      
      console.log('Profile update response:', {
        status: response.status,
        hasUser: !!response.data.user
      });
      
      if (response.status === 200) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Profile update error:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setAuthError(error.response?.data?.message || 'Failed to update profile');
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  const value = {
    user,
    loading,
    authError,
    login,
    register,
    logout,
    checkAuth,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;