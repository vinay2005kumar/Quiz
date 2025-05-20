import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
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
  const isCheckingAuth = useRef(false);
  const authCheckTimeout = useRef(null);

  const checkAuth = useCallback(async () => {
    if (isCheckingAuth.current) return;
    
    try {
      isCheckingAuth.current = true;
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Don't check auth if we're on a public route
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register', '/events'];
      if (publicPaths.includes(currentPath)) {
        setLoading(false);
        return;
      }

      const response = await api.get('/api/auth/me');
      if (response?.user) {
        setUser(response.user);
        setLoading(false);
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      if (error.response?.status === 401) {
        // Only redirect to login if not on a public route
        const currentPath = window.location.pathname;
        const publicPaths = ['/', '/login', '/register', '/events'];
        if (!publicPaths.includes(currentPath)) {
          navigate('/login');
        }
      }
    } finally {
      isCheckingAuth.current = false;
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register', '/events'];
      if (!publicPaths.includes(currentPath)) {
        navigate('/login');
      }
    }

    return () => {
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
    };
  }, [checkAuth, navigate]);

  const login = async (email, password) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const response = await api.post('/api/auth/login', { 
        email, 
        password 
      });
      
      if (!response?.token || !response?.user) {
        throw new Error('Invalid response from server');
      }

      // Store token and user data
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setLoading(false);
      
      // Enhanced role-based navigation with new paths
      switch (response.user.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'faculty':
          navigate('/faculty/dashboard', { replace: true });
          break;
        case 'student':
          navigate('/student/dashboard', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      setAuthError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const response = await api.post('/api/auth/register', userData);
      
      if (!response?.token || !response?.user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', response.token);
      setUser(response.user);
      setLoading(false);
      
      // Navigate based on role
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);
    setLoading(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    user,
    loading,
    authError,
    login,
    logout,
    register,
    checkAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;