import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { storage } from '../utils/storage';
import { Spinner, YStack } from 'tamagui';
import axios from 'axios';
import { authService } from '../services/api/authService';

export default function Index() {
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (refreshToken) {
          // Attempt to refresh token or just check if it's valid
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
            }
          }
        }
      } catch (error) {
        console.log('Failed to restore session:', error);
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(dashboard)/manager" as any} />;
  }

  return <Redirect href={"/(auth)/login" as any} />;
}
