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
  environment: process.env.NODE_ENV || import.meta.env.MODE,
  isDevelopment: process.env.NODE_ENV === 'development' || import.meta.env.MODE === 'development'
});

// Add request interceptor for authentication
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

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
      if (!window.location.pathname.includes('/login')) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    authError,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;