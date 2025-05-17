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
    console.log('Making request to:', config.baseURL + config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - Unable to connect to API:', config.apiUrl);
      console.error('Full error details:', error);
    } else {
      console.error('API Error:', error.response?.data || error);
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Verify authentication with backend
  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // User login
  const login = async (email, password) => {
    try {
      console.log('Attempting login to:', config.apiUrl + '/auth/login');
      const response = await api.post('/auth/login', {
        email,
        password
      });
          
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // User registration with improved error handling
  const register = async (userData) => {
    try {
      console.log('Sending registration data:', userData);
      
      if (userData.role === 'student' && !userData.section) {
        return {
          success: false,
          error: 'Section is required for students'
        };
      }
      
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  // User logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('Updating profile:', profileData);
      const response = await api.put('/auth/update-profile', profileData);
      
      if (response.status === 200) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  const value = {
    user,
    loading,
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