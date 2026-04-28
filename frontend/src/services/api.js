import axios from 'axios';
import { auth } from '../config/firebase';
import analytics, { EVENTS } from './analytics';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay in ms (will use exponential backoff)
  retryableMethods: ['get', 'head', 'options'], // Only retry idempotent read operations
};

// POST endpoints that are server-side idempotent and safe to retry on network errors.
// Network errors mean the request never reached the server, so retry won't double-execute.
const RETRYABLE_NETWORK_ERROR_POSTS = ['/auth/verify-email-token'];

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if the error is a network error (no response from server)
 */
const isNetworkError = (error) => {
  return (
    !error.response &&
    error.code !== 'ECONNABORTED' &&
    error.message === 'Network Error'
  );
};

/**
 * Check if the request is retryable for the given error.
 * GET/HEAD/OPTIONS are retryable for any network error.
 * POSTs in RETRYABLE_NETWORK_ERROR_POSTS are retryable only on network errors
 * (not HTTP errors), since a network error means the server never received the request.
 */
const isRetryable = (config, error) => {
  const method = config?.method?.toLowerCase();
  if (RETRY_CONFIG.retryableMethods.includes(method)) return true;
  if (method === 'post' && isNetworkError(error)) {
    const url = config?.url || '';
    return RETRYABLE_NETWORK_ERROR_POSTS.some((endpoint) => url.endsWith(endpoint));
  }
  return false;
};

/**
 * Retry a failed request with exponential backoff
 */
const retryRequest = async (error, retryCount = 0) => {
  const config = error.config;

  // Don't retry if we've exceeded max retries
  if (retryCount >= RETRY_CONFIG.maxRetries) {
    return Promise.reject(error);
  }

  // Don't retry if it's not a network error
  if (!isNetworkError(error)) {
    return Promise.reject(error);
  }

  // Don't retry non-retryable requests
  if (!isRetryable(config, error)) {
    return Promise.reject(error);
  }

  // Calculate delay with exponential backoff
  const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);

  console.log(
    `[API] Network error on ${config.method?.toUpperCase()} ${config.url}. ` +
    `Retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})...`
  );

  // Track retry attempt
  analytics.track(EVENTS.API_RETRY, {
    url: config.url,
    method: config.method?.toUpperCase(),
    retry_attempt: retryCount + 1,
    delay_ms: delay,
  });

  // Wait before retrying
  await sleep(delay);

  // Mark this as a retry attempt
  config.__retryCount = retryCount + 1;

  try {
    // Retry the request
    return await api.request(config);
  } catch (retryError) {
    // If retry also failed, try again or give up
    return retryRequest(retryError, retryCount + 1);
  }
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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

// Response interceptor - handle errors, retry network errors, and track them
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const url = config?.url;
    const method = config?.method?.toUpperCase();
    const retryCount = config?.__retryCount || 0;

    // For network errors on retryable requests, attempt retry
    if (isNetworkError(error) && isRetryable(config, error) && retryCount === 0) {
      return retryRequest(error, 0);
    }

    // Track API error (only if not a retry attempt, or if all retries failed)
    if (retryCount === 0 || retryCount >= RETRY_CONFIG.maxRetries) {
      analytics.track(EVENTS.API_ERROR, {
        status: status || 'network_error',
        url: url,
        method: method,
        error_message: error.response?.data?.detail || error.message,
        error_type: status ? 'http_error' : 'network_error',
        retry_attempts: retryCount,
      });
    }

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
