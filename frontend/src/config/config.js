const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.MODE === 'development';

console.log('Environment mode:', process.env.NODE_ENV || import.meta.env.MODE);
console.log('Is development:', isDevelopment);

export const config = {
  apiUrl: isDevelopment 
    ? 'http://localhost:5000/api'
    : 'https://quiz-qigc.onrender.com/api',
  tokenKey: 'token',
  authCheckInterval: 30000, // Check auth every 30 seconds
}; 

console.log('API URL:', config.apiUrl); 