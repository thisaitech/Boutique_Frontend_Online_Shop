import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('thisai_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('thisai_refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/user/refresh-token`, {
            refreshToken,
          });

          // Backend returns { success, message, data: { user, accessToken, refreshToken } }
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Store new tokens only
          localStorage.setItem('thisai_accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('thisai_refreshToken', newRefreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('thisai_accessToken');
          localStorage.removeItem('thisai_refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available - redirect to login
        localStorage.removeItem('thisai_accessToken');
        localStorage.removeItem('thisai_refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.message || error.response.statusText || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Network error - please check your connection';
  } else {
    // Request setup error
    return error.message || 'An error occurred';
  }
};
