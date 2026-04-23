import { useEffect, useState } from 'react';
import { Redirect, useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { storage } from '../utils/storage';
import { Spinner, YStack } from 'tamagui';
import axios from 'axios';
import { useCheckAuth } from '../hooks/auth/useCheckAuth';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const { isChecking, checkAuth } = useCheckAuth(true);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isChecking || !rootNavigationState?.key) {
    return (
      <YStack f={1} jc="center" ai="center" bg="$background">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(dashboard)" as any} />;
  }

  return <Redirect href={"/(auth)/login" as any} />;
}
