import React from 'react';
import { Slot, useRouter } from 'expo-router';
import { YStack, Spinner, View } from 'tamagui';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from '../../components/layout/BottomNav';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useCheckAuth } from '@/hooks/auth/useCheckAuth';
import { useWebSocket } from '@/hooks/useWebSocket';

function WebSocketManager() {
  useWebSocket();
  return null;
}

export default function DashboardLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const { isChecking, checkAuth} = useCheckAuth();

  useEffect(() => {
    const verifySession = async () => {
      if (!isAuthenticated || !user) {
        const isValid = await checkAuth();
        if (!isValid) {
          router.replace('/(auth)/login');
        }
      }
    };
    verifySession();
  }, [isAuthenticated, user, checkAuth, router]);

  // Selama masih ngecek API atau belum ada data user, tahan layar dengan Spinner
  if (isChecking || !isAuthenticated || !user) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$green10" />
      </View>
    );
  }

  return (
    <YStack flex={1} backgroundColor="#F8FAFC">
      <WebSocketManager />
      <Header />
      
      <View flex={1}>
        <Slot />
      </View>

      <BottomNav />
    </YStack>
  );
}

