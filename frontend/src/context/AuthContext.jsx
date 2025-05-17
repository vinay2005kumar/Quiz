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
  },
  timeout: 10000 // 10 second timeout
});

// Log API configuration
console.log('API Configuration:', {
  baseURL: api.defaults.baseURL,
  environment: process.env.NODE_ENV || import.meta.env.MODE,
  isDevelopment: process.env.NODE_ENV === 'development' || import.meta.env.MODE === 'development'
});

// Add request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem(config.tokenKey);
    
    console.log('Making request:', {
      url: config.baseURL + config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : null,
      timestamp: new Date().toISOString()
    });
    
    // Skip token check for login and register endpoints
    if (config.url.includes('/auth/login') || config.url.includes('/auth/register')) {
      return config;
    }

    // Ensure we have a valid token
    if (!token) {
      console.log('No token found, redirecting to login');
      window.location.href = '/login';
      return Promise.reject(new Error('No authentication token'));
    }

    // Add token to request headers
    config.headers.Authorization = `Bearer ${token}`;
    
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
      hasData: !!response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  async (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error:', {
        url: error.config?.url,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      // For network errors, we'll retry the request once after a delay
      if (!error.config?._retry) {
        error.config._retry = true;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return api(error.config);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('Authentication error:', {
        status: error.response.status,
        message: error.response.data?.message,
        path: window.location.pathname,
        timestamp: new Date().toISOString()
      });

      // Only handle token removal if not in login process
      if (!error.config.url.includes('/auth/login')) {
        const currentPath = window.location.pathname;
        localStorage.removeItem(config.tokenKey);
        
        // Avoid redirect loops
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Log other errors
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });

    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);
  const navigate = useNavigate();

  // Check authentication on component mount and periodically
  useEffect(() => {
    const token = localStorage.getItem(config.tokenKey);
    console.log('Initial auth check:', { 
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : null,
      currentPath: window.location.pathname,
      apiUrl: config.apiUrl
    });
    
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        navigate('/login');
      }
    }

    // Set up periodic auth check
    const interval = setInterval(() => {
      const token = localStorage.getItem(config.tokenKey);
      const now = Date.now();
      // Only check if we have a token and enough time has passed since last check
      if (token && (now - lastAuthCheck) >= config.authCheckInterval) {
        checkAuth();
      }
    }, config.authCheckInterval);

    return () => clearInterval(interval);
  }, [navigate, lastAuthCheck]);

  // Verify authentication with backend
  const checkAuth = async () => {
    const token = localStorage.getItem(config.tokenKey);
    try {
      console.log('Starting auth check:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : null,
        currentPath: window.location.pathname,
        apiUrl: config.apiUrl,
        timestamp: new Date().toISOString()
      });

      if (!token) {
        console.log('No token found during auth check');
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setLastAuthCheck(Date.now());

      if (response.data && response.data.user) {
        setUser(response.data.user);
        setAuthError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Auth check error:', {
        error: error.message,
        status: error.response?.status,
        apiUrl: config.apiUrl,
        timestamp: new Date().toISOString()
      });

      if (error.response?.status === 401) {
        localStorage.removeItem(config.tokenKey);
        setUser(null);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          navigate('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // User login
  const login = async (email, password) => {
    try {
      setAuthError(null);
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data;
      localStorage.setItem(config.tokenKey, token);
      setUser(user);
      setLastAuthCheck(Date.now());
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  // User registration with improved error handling
  const register = async (userData) => {
    try {
      setAuthError(null);
      console.log('Starting registration for:', userData.email);
      
      if (userData.role === 'student' && !userData.section) {
        return {
          success: false,
          error: 'Section is required for students'
        };
      }
      
      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', {
        success: true,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        tokenPreview: response.data.token ? `${response.data.token.substring(0, 10)}...` : null
      });
      
      const { token, user } = response.data;
      localStorage.setItem(config.tokenKey, token);
      setUser(user);
      
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
    localStorage.removeItem(config.tokenKey);
    setUser(null);
    setAuthError(null);
    setLastAuthCheck(0);
    navigate('/login');
  };

  const updateProfile = async (profileData) => {
    try {
      setAuthError(null);
      console.log('Updating profile for user:', user?.email);
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