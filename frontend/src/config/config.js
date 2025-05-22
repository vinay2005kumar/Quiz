const isDevelopment = import.meta.env.MODE === 'development';

// Function to get the backend port from localStorage or default to 5000
const getBackendPort = () => {
  return localStorage.getItem('backendPort') || '5000';
};

export const config = {
  apiUrl: isDevelopment ? `http://localhost:5000` : 'https://quiz-qigc.onrender.com',
  tokenKey: 'token',
  setBackendPort: (port) => {
    localStorage.setItem('backendPort', port);
  }
};

// Log configuration in development mode only
if (isDevelopment) {
  console.log('Environment:', import.meta.env.MODE);
  console.log('API URL:', config.apiUrl);
} 