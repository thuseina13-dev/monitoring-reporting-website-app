import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import tamaguiConfig from '../../tamagui.config';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { COLORS } from '../constants/theme';
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

  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleElement = document.createElement('style');
      styleElement.id = 'theme-css-variables';
      styleElement.innerHTML = `
        :root {
          --primary-color: ${COLORS.primary};
          --danger-color: ${COLORS.danger};
          --border-light: ${COLORS.borderLight};
          --input-bg: ${COLORS.inputBackground};
          --text-main: ${COLORS.textMain};
          --bg-light: ${COLORS.bgLight};
          --text-secondary: ${COLORS.textSecondary};
          --card-bg: ${COLORS.cardBackground};
        }
      `;
      document.head.appendChild(styleElement);
      return () => {
        const el = document.getElementById('theme-css-variables');
        if (el) el.remove();
      };
    }
  }, []);

  if (!loaded) return null;

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <ToastProvider swipeDirection="horizontal" duration={1500}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Home' }} />
          </Stack>
          <CustomToast />
          <ToastViewport top="$8" left={0} right={0} />
        </ToastProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
