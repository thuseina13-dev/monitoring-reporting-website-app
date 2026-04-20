import React from 'react';
import { View, SizableText, Input, Button, YStack, XStack, H1, Spinner, Form, Card, Paragraph } from 'tamagui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormInputs } from '../../utils/validations';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/api/authService';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { Lock, Mail } from '@tamagui/lucide-icons';

import { useToastController } from '@tamagui/toast';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToastController();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      const { user, accessToken, refreshToken } = data.data;
      await setAuth(user, accessToken, refreshToken);
      
      toast.show('Login Berhasil', {
        message: `Selamat datang, ${user.fullName}`,
        native: false,
      });

      // router.replace('/(dashboard)/manager' as any); // Default redirect to dashboard
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Email atau password salah';
      toast.show('Login Gagal', {
        message: msg,
        type: 'error',
        native: false,
      });
      console.error('Login error:', error.response?.data || error.message);
    },
  });

  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data);
  };

  return (
    <YStack f={1} jc="center" ai="center" bg="$background" p="$4" gap="$4">
      <Card elevation={5} p="$6" width="100%" maxWidth={400} borderRadius="$4" borderWidth={1} borderColor="$borderColor">
        <YStack gap="$4">
          <YStack ai="center" gap="$2">
            <H1 size="$9" color="$color">Genba Hyoka</H1>
            <Paragraph theme="alt2">Monitoring & Reporting App</Paragraph>
          </YStack>

          <Form onSubmit={handleSubmit(onSubmit)} gap="$4">
            <YStack gap="$3">
              <YStack gap="$1">
                <XStack ai="center" gap="$2" bc="$borderColor" bw={1} br="$3" px="$3" py="$1">
                  <Mail size={20} color="$colorFocus" />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        f={1}
                        borderWidth={0}
                        bg="transparent"
                        placeholder="Email"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    )}
                  />
                </XStack>
                {errors.email && (
                  <SizableText color="$red10" size="$1" px="$3">
                    {errors.email.message}
                  </SizableText>
                )}
              </YStack>

              <YStack gap="$1">
                <XStack ai="center" gap="$2" bc="$borderColor" bw={1} br="$3" px="$3" py="$1">
                  <Lock size={20} color="$colorFocus" />
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        f={1}
                        borderWidth={0}
                        bg="transparent"
                        placeholder="Password"
                        secureTextEntry
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </XStack>
                {errors.password && (
                  <SizableText color="$red10" size="$1" px="$3">
                    {errors.password.message}
                  </SizableText>
                )}
              </YStack>
            </YStack>

            <Button
              theme="dark"
              onPress={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending}
              icon={loginMutation.isPending ? <Spinner /> : null}
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>
            
            {loginMutation.isError && (
              <SizableText color="$red10" textAlign="center" size="$2">
                {(loginMutation.error as any).response?.data?.message || 'Email atau password salah'}
              </SizableText>
            )}
          </Form>
        </YStack>
      </Card>
    </YStack>
  );
}
