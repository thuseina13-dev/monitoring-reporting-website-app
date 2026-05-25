import React, { useEffect } from 'react';
import {
  View,
  YStack,
  Card,
  Paragraph,
} from 'tamagui';
import { Image as RNImage } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/api/authService';
import { useAuthStore } from '../../store/authStore';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useToastController } from '@tamagui/toast';
import { COLORS } from '../../constants/theme';
import LogoTumpuk from '../../assets/images/logo-tumpuk-compress-removebg-preview.png';
import { DynamicFormRenderer } from '../../components/dynamicForm/DynamicFormRenderer';
import { FormSchema } from '../../components/dynamicForm/types';

import { parseBackendError } from '../../utils/errorParser';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToastController();
  const params = useLocalSearchParams<{ logout?: string }>();

  useEffect(() => {
    if (params.logout) {
      setTimeout(() => {
        toast.show('Logout Berhasil', {
          message: params.logout,
          native: false,
        });
      }, 100);

      router.replace('/(auth)/login');
    }
  }, [params.logout]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      const { user, csrf_token } = data.data;
      setAuth(user, csrf_token);

      toast.show('Login Berhasil', {
        message: `Selamat datang, ${user.fullName}`,
        native: false,
      });

      router.replace('/(dashboard)' as any);
    },
    onError: (error: any) => {
      const msg = parseBackendError(error);
      toast.show('Login Gagal', {
        message: msg,
        type: 'error',
        native: false,
      });
    },
  });

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  const loginFormSchema: FormSchema = {
    submit_label: 'LOGIN KESINI',
    hide_cancel: true,
    use_gradient: true,
    fields: [
      {
        id: 'email',
        label: 'Login Email',
        type: 'text',
        icon_left: 'mail',
        rules: {
          required: true,
          is_email: true
        }
      },
      {
        id: 'password',
        label: 'Password',
        type: 'password',
        icon_left: 'lock',
        rules: {
          required: true
        }
      }
    ]
  };

  return (
    <YStack f={1} bc={COLORS.pageBackground} jc="center" ai="center" p="$4">
      <Stack.Screen options={{ title: 'Halaman Login', headerShown: false }} />
      <Card
        elevation={5}
        p="$8"
        width="100%"
        maxWidth={400}
        br="$4"
        bg={COLORS.cardBackground}
        bw={1}
        bc={COLORS.borderColor}
      >
        <YStack gap="$2">
          {/* Logo Section */}
          <View ai="center" jc="center" h={180} w="100%">
            <RNImage
              source={LogoTumpuk}
              style={{ width: 300, height: 180 }}
              resizeMode="contain"
            />
          </View>

          <DynamicFormRenderer
            schema={loginFormSchema}
            onSubmit={onSubmit}
            isLoading={loginMutation.isPending}
          />

          {/* Footer Info */}
          <YStack ai="center" mt="$2">
            <Paragraph size="$1" color={COLORS.textMuted} opacity={0.6} textAlign="center">
              GENBA-HYOKA v.1.0.0{"\n"}
              Sistem Pengawasan dan Evaluasi Operasional Lapangan
            </Paragraph>
          </YStack>
        </YStack>
      </Card>
    </YStack>
  );
}
