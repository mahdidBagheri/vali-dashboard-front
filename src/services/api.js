// src/services/api.js
import axios from 'axios';

const api = axios.create({
  // baseURL is intentionally left out to use Vite proxy
});

api.interceptors.request.use(
  (config) => {
    // 1. Read the exact key you used during login
    const token = localStorage.getItem('token'); 
    
    // 2. Attach it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
