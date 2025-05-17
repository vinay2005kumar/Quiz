const isDevelopment = import.meta.env.MODE === 'development';

export const config = {
  apiUrl: isDevelopment 
    ? 'http://localhost:5000/api'
    : 'https://quiz-qigc.onrender.com/api'
}; 