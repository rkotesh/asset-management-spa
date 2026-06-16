import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors uniformly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Shape error to match the uniform server error schema
    const customError = {
      error: true,
      message: error.response?.data?.message || 'Network error, please try again.',
      code: error.response?.status || 500
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
