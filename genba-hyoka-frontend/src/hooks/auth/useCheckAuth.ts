import { useState, useCallback } from 'react';
import axios from 'axios';
import { storage } from '../../utils/storage';
import { useAuthStore } from '../../store/authStore';

export const useCheckAuth = (initialLoading: boolean = false) => {
  const { setAuth, clearAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(initialLoading);

  const checkAuth = useCallback(async () => {
    setIsChecking(true);
    try {
      const refreshToken = await storage.getItem('refreshToken');
      if (refreshToken) {
        // Attempt to refresh token
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Get user profile
          const profileResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (profileResponse.data.success) {
            await setAuth(profileResponse.data.data, accessToken, newRefreshToken);
            return true;
          }
        }
      }
    } catch (error) {
      console.log('Failed to restore session:', error);
      await clearAuth();
    } finally {
      setIsChecking(false);
    }
    return false;
  }, [setAuth, clearAuth]);

  return { isChecking, checkAuth };
};
