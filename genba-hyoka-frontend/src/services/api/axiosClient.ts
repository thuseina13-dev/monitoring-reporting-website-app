import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';

const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// ── Request Interceptor ───────────────────────────────────────
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const csrfToken = useAuthStore.getState().csrfToken;
    const method = config.method?.toUpperCase();
    
    // Inject CSRF token for mutation requests
    if (csrfToken && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor ──────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Jika error 401 dan bukan dari endpoint login/refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Update CSRF header on retry if necessary
            const csrfToken = useAuthStore.getState().csrfToken;
            const method = originalRequest.method?.toUpperCase();
            if (csrfToken && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
              originalRequest.headers['X-CSRF-TOKEN'] = csrfToken;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Hit refresh-token endpoint, cookies sent automatically
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh-token`, {}, {
          withCredentials: true,
        });

        const { csrf_token } = response.data.data;
        
        // Update store
        useAuthStore.getState().updateCsrfToken(csrf_token);

        processQueue(null);
        
        const method = originalRequest.method?.toUpperCase();
        if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          originalRequest.headers['X-CSRF-TOKEN'] = csrf_token;
        }

        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        await useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
