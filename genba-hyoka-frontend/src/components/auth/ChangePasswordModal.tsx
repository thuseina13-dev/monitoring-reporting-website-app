import React, { useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { YStack, XStack, Text, Input, Button, View, Label, Spinner, Theme } from 'tamagui';
import { X, Eye, EyeOff, Lock, CheckCircle2, Circle } from '@tamagui/lucide-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordFormInputs } from '../../utils/validations';
import { useChangePassword } from '../../hooks/auth/useChangePassword';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '@/store/authStore';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetUserName?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, targetUserId, targetUserName }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: changePassword, isPending } = useChangePassword();
  const { user } = useAuthStore() as any;

  const isSelf = !targetUserId || targetUserId === user?.id;
  const userRoles = user?.roles || [];
  const isSuperAdmin = isSelf ? userRoles.some((r: any) => r.type === 'super_admin') : false;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormInputs>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
  });

  const newPassword = watch('new_password') || '';

  const onSubmit = (data: ChangePasswordFormInputs) => {
    console.log('--- ChangePasswordModal: onSubmit triggered ---');
    changePassword({ 
      newPassword: data.new_password, 
      userId: targetUserId 
    }, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    console.log('--- ChangePasswordModal: handleClose triggered ---');
    if (isPending) return;
    reset();
    onClose();
  };

  const passwordRequirements = [
    { label: 'Minimal 8 karakter', met: newPassword.length >= 8 },
    { label: 'Minimal 1 huruf besar', met: /[A-Z]/.test(newPassword) },
    { label: 'Minimal 1 huruf kecil', met: /[a-z]/.test(newPassword) },
    { label: 'Minimal 1 angka', met: /[0-9]/.test(newPassword) },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop - No onPress to prevent auto-close */}
        <View style={styles.backdrop} />
        
        <YStack
          width="90%"
          maxWidth={450}
          backgroundColor="white"
          borderRadius={16}
          padding="$5"
          elevation={10}
          gap="$4"
          zIndex={100}
        >
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2" alignItems="center">
              <View backgroundColor="$blue2" padding="$2" borderRadius="$3">
                <Lock size={20} color={COLORS.primary} />
              </View>
              <Text fontSize={18} fontWeight="bold" color={COLORS.textMain}>
                {targetUserName ? `Reset Sandi: ${targetUserName}` : 'Ganti Password'}
              </Text>
            </XStack>
            <Button
              size="$3"
              circular
              chromeless
              icon={<X size={24} color={COLORS.textSecondary} />}
              onPress={handleClose}
              disabled={isPending}
            />
          </XStack>

          <Text fontSize={14} color={COLORS.textSecondary} marginBottom="$2">
            {targetUserName 
              ? `Anda sedang mereset password untuk akun ${targetUserName}.`
              : 'Silakan masukkan password baru Anda. Pastikan password kuat dan mudah diingat.'
            }
          </Text>

          {/* Form */}
          <YStack gap="$4">
            <YStack gap="$1.5">
              <Label fontSize={14} fontWeight="600" color={COLORS.textMain}>
                Password Baru
              </Label>
              <Controller
                control={control}
                name="new_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack ai="center" bg={COLORS.inputBackground} br="$3" px="$3" h={50} bw={1} bc={errors.new_password ? COLORS.danger : COLORS.borderLight} position="relative">
                    <Input
                      flex={1}
                      bw={0}
                      bg="transparent"
                      secureTextEntry={!showPassword}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password baru"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      paddingRight={40}
                      disabled={isPending}
                      autoComplete="new-password"
                    />
                    <Button
                      size="$3"
                      chromeless
                      icon={showPassword ? <EyeOff size={20} color={COLORS.textSecondary} /> : <Eye size={20} color={COLORS.textSecondary} />}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                      position="absolute"
                      right={5}
                    />
                  </XStack>
                )}
              />
              {errors.new_password && (
                <Text fontSize={12} color={COLORS.danger}>
                  {errors.new_password.message}
                </Text>
              )}
            </YStack>

            <YStack backgroundColor={COLORS.bgSoft} padding="$3" borderRadius="$3" gap="$2">
              <Text fontSize={12} fontWeight="700" color={COLORS.textSecondary} marginBottom="$1">
                Persyaratan Password:
              </Text>
              {passwordRequirements.map((req, index) => (
                <XStack key={index} gap="$2" alignItems="center">
                  {req.met ? (
                    <CheckCircle2 size={14} color={COLORS.primary} />
                  ) : (
                    <Circle size={14} color={COLORS.textSecondary} opacity={0.5} />
                  )}
                  <Text 
                    fontSize={12} 
                    color={req.met ? COLORS.textMain : COLORS.textSecondary}
                    fontWeight={req.met ? "600" : "400"}
                  >
                    {req.label}
                  </Text>
                </XStack>
              ))}
            </YStack>

            <YStack gap="$1.5">
              <Label fontSize={14} fontWeight="600" color={COLORS.textMain}>
                Konfirmasi Password Baru
              </Label>
              <Controller
                control={control}
                name="confirm_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack ai="center" bg={COLORS.inputBackground} br="$3" px="$3" h={50} bw={1} bc={errors.confirm_password ? COLORS.danger : COLORS.borderLight} position="relative">
                    <Input
                      flex={1}
                      bw={0}
                      bg="transparent"
                      secureTextEntry={!showConfirmPassword}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Ulangi password baru"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      paddingRight={40}
                      disabled={isPending}
                      autoComplete="new-password"
                    />
                    <Button
                      size="$3"
                      chromeless
                      icon={showConfirmPassword ? <EyeOff size={20} color={COLORS.textSecondary} /> : <Eye size={20} color={COLORS.textSecondary} />}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isPending}
                      position="absolute"
                      right={5}
                    />
                  </XStack>
                )}
              />
              {errors.confirm_password && (
                <Text fontSize={12} color={COLORS.danger}>
                  {errors.confirm_password.message}
                </Text>
              )}
            </YStack>
          </YStack>

          {isSuperAdmin && (
            <YStack backgroundColor={COLORS.dangerLight} padding="$3" borderRadius="$3" gap="$2" borderWidth={1} borderColor={COLORS.dangerBorder}>
              <Text fontSize={13} color={COLORS.dangerDark} fontWeight="bold">
                ⚠️ Akses Dibatasi
              </Text>
              <Text fontSize={12} color={COLORS.dangerDark} lineHeight={16}>
                Akun Master Sistem (Super Admin) tidak diperbolehkan mengganti password melalui fitur ini untuk menjaga integritas sistem.
              </Text>
            </YStack>
          )}

          <XStack gap="$3" marginTop="$4">
            <Button
              flex={1}
              variant="outlined"
              borderColor={COLORS.borderLight}
              onPress={handleClose}
              disabled={isPending}
              height={45}
            >
              Batal
            </Button>
            <Button
              flex={1}
              backgroundColor={isSuperAdmin ? COLORS.borderLight : COLORS.primary}
              disabled={isPending || isSuperAdmin}
              onPress={handleSubmit(onSubmit)}
              opacity={isSuperAdmin ? 0.6 : 1}
              pressStyle={{ opacity: 0.8 }}
              height={45}
            >
              {isPending ? <Spinner color="white" /> : <Text color="white" fontWeight="bold">Simpan</Text>}
            </Button>
          </XStack>
        </YStack>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
