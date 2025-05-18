import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

// Create the auth context
const AuthContext = createContext(null);

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response?.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
      const publicPaths = ['/login', '/register'];
      if (!publicPaths.some(path => window.location.pathname.includes(path))) {
        navigate('/login');
      }
    }
  }, [navigate, checkAuth]);

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const response = await api.post('/auth/login', { 
        email, 
        password 
      }, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // The response is already the data due to axios interceptor
      if (!response?.token || !response?.user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', response.token);
      setUser(response.user);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setAuthError(null);
      const response = await api.post('/auth/register', userData, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // The response is already the data due to axios interceptor
      if (!response?.token || !response?.user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', response.token);
      setUser(response.user);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    loading,
    authError,
    login,
    logout,
    register,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;