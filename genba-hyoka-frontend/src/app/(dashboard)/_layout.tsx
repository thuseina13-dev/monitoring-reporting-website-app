import React from 'react';
import { Slot, useRouter } from 'expo-router';
import { YStack, Spinner, View } from 'tamagui';
import { useAuthStore } from '../../store/authStore';
import { BottomNav } from '../../components/layout/BottomNav';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout() {
  const { isAuthenticated, user, activeRole } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$green10" />
      </View>
    );
  }

  return (
    <YStack flex={1} backgroundColor="#F8FAFC">
      <Header />
      
      <View flex={1}>
        <Slot />
      </View>

      <BottomNav />
    </YStack>
  );
}

