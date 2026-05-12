import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

export const useCheckAuth = (initialLoading: boolean = false) => {
  const { setAuth, clearAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(initialLoading);
  const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/${process.env.EXPO_PUBLIC_API_VERSION}`

  const checkAuth = useCallback(async () => {
    setIsChecking(true);
    try {
      // Attempt to refresh token using HttpOnly cookie
      const response = await axios.post(`${apiUrl}/auth/refresh-token`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        const { csrf_token } = response.data.data;

        // Get user profile using HttpOnly cookie
        const profileResponse = await axios.get(`${apiUrl}/auth/me`, {
          withCredentials: true
        });

        if (profileResponse.data.success) {
          setAuth(profileResponse.data.data, csrf_token);
          return true;
        }
      }
    } catch (error) {
      console.log('Failed to restore session:', error);
      clearAuth();
    } finally {
      setIsChecking(false);
    }
    return false;
  }, [setAuth, clearAuth]);

  return { isChecking, checkAuth };
};
