import axios from 'axios';
import { auth } from '../config/firebase';
import analytics, { EVENTS } from './analytics';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add Firebase ID token to all requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting ID token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and track them
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    // Track all API errors in analytics
    analytics.track(EVENTS.API_ERROR, {
      status: status || 'network_error',
      url: url,
      method: method,
      error_message: error.response?.data?.detail || error.message,
      error_type: status ? 'http_error' : 'network_error',
    });

    if (status === 401) {
      // Token expired or invalid
      console.error('Authentication error - signing out');
      await auth.signOut();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
