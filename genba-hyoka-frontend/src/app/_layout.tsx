import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import tamaguiConfig from '../../tamagui.config';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { CustomToast } from '../components/CustomToast';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <ToastProvider swipeDirection="horizontal" duration={1500}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)/login" options={{ title: 'Login' }} />
            <Stack.Screen name="index" options={{ title: 'Home' }} />
          </Stack>
          <CustomToast />
          <ToastViewport top="$8" left={0} right={0} />
        </ToastProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
