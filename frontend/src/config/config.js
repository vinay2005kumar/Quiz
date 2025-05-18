const isDevelopment = import.meta.env.MODE === 'development';

export const config = {
  apiUrl: isDevelopment ? 'http://localhost:5000' : 'https://quiz-qigc.onrender.com',
  tokenKey: 'token'
};

// Log configuration in development mode only
if (isDevelopment) {
  console.log('Environment:', import.meta.env.MODE);
  console.log('API URL:', config.apiUrl);
} 