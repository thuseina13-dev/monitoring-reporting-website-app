import React, { useState, useEffect } from 'react';
import {
  View,
  SizableText,
  Input,
  Button,
  YStack,
  XStack,
  H1,
  Spinner,
  Form,
  Card,
  Paragraph,
  Label
} from 'tamagui';
import { Image as RNImage } from 'react-native';
import { LinearGradient } from 'tamagui/linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormInputs } from '../../utils/validations';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/api/authService';
import { useAuthStore } from '../../store/authStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Mail, Eye, EyeOff } from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';
import { COLORS } from '../../constants/theme';
import LogoTumpuk from '../../assets/images/logo-tumpuk-compress-removebg-preview.png';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToastController();
  const [showPassword, setShowPassword] = useState(false);
  const params = useLocalSearchParams<{ logout?: string }>();

  // Dengar parameter kedatangan (lemparan pesan dari router URL navigation dasbor sebelumnya)
  useEffect(() => {
    if (params.logout) {
      setTimeout(() => {
        toast.show('Logout Berhasil', {
          message: params.logout,
          native: false,
        });
      }, 100);
      
      // Bersihkan parameter dari URL agar ketika direfresh popup tidak terulang
      router.replace('/(auth)/login');
    }
  }, [params.logout]);

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

      router.replace('/(dashboard)' as any);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Email atau password salah';
      toast.show('Login Gagal', {
        message: msg,
        type: 'error',
        native: false,
      });
    },
  });

  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data);
  };

  return (
    <YStack f={1} bc={COLORS.pageBackground} jc="center" ai="center" p="$4">
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

          <Form onSubmit={handleSubmit(onSubmit)} gap="$4">
            <YStack gap="$4">
              {/* Email field */}
              <YStack gap="$1.5">
                <Label color={COLORS.textDark} fontWeight="600" size="$3" ml="$1">Login Email</Label>
                <XStack ai="center" bg={COLORS.inputBackground} br="$3" px="$3" h={50}>
                  <Mail size={18} color={COLORS.textMuted} opacity={0.5} marginRight={15} />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        f={1}
                        bw={0}
                        bg="transparent"
                        placeholder="Masukkan Email"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        h="100%"
                        size="$4"
                      />
                    )}
                  />
                </XStack>
                {errors.email && (
                  <SizableText color="$red10" size="$1" mt="$1" ml="$1">
                    {errors.email.message}
                  </SizableText>
                )}
              </YStack>

              {/* Password field */}
              <YStack gap="$1.5">
                <Label color={COLORS.textDark} fontWeight="600" size="$3" ml="$1">Password</Label>
                <XStack ai="center" bg={COLORS.inputBackground} br="$3" px="$3" h={50}  >
                  <Lock size={18} color={COLORS.textMuted} opacity={0.5} marginRight={15}/>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        f={1}
                        bw={0}
                        bg="transparent"
                        placeholder="Masukkan Password"
                        secureTextEntry={!showPassword}
                        type={showPassword ? 'text' : 'password'}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        h="100%"
                        size="$4"
                      />
                    )}
                  />
                  <Button
                    chromeless
                    p={1}
                    m={5}
                    width={35}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    icon={showPassword ? <EyeOff size={18} color={COLORS.textMuted} opacity={0.5} /> : <Eye size={18} color={COLORS.textMuted} opacity={0.5} />}
                  />
                </XStack>
                {errors.password && (
                  <SizableText color="$red10" size="$1" mt="$1" ml="$1">
                    {errors.password.message}
                  </SizableText>
                )}
              </YStack>
            </YStack>

            {/* Login Button with Gradient Fixed */}
            <Button
              mt="$4"
              h={55}
              br="$3"
              onPress={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending}
              bg="transparent"
              p={0}
              pressStyle={{ opacity: 0.8 }}
              overflow="hidden"
              pos="relative"
              accessibilityLabel="Tombol Login"
            >
              <LinearGradient
                colors={COLORS.gradients.primary}
                start={[0, 0]}
                end={[1, 1]}
                fullscreen
                borderRadius={12}
                zIndex={0}
              />
              <XStack ai="center" jc="center" gap="$2" f={1} w="100%" h="100%" zIndex={1}>
                {loginMutation.isPending ? (
                  <Spinner color="white" />
                ) : (
                  <>
                    <SizableText color={COLORS.textLight} fontWeight="800" size="$5">LOGIN KESINI</SizableText>
                    <SizableText color={COLORS.textLight} fontWeight="800" size="$5">→</SizableText>
                  </>
                )}
              </XStack>
            </Button>
          </Form>

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
