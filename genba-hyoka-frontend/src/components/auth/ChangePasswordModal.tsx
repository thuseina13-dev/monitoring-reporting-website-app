import React, { useState } from 'react';
import { Modal, ModalProps, TouchableOpacity, StyleSheet } from 'react-native';
import { YStack, XStack, Text, Input, Button, View, Label } from 'tamagui';
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
  targetUserId?: string; // Jika ada, berarti sedang mereset password orang lain
  targetUserName?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, targetUserId, targetUserName }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: changePassword, isPending } = useChangePassword();
  const { user } = useAuthStore() as any;

  const isSelf = !targetUserId || targetUserId === user?.id;
  const isSuperAdmin = isSelf ? user?.isSuperAdmin : false; // Blokade hanya jika merubah diri sendiri dan dia SA? 
  // Tunggu, kriteria "blokade jika mencoba mengubah akun Super Admin" 
  // bisa juga berarti admin biasa dilarang mereset password Super Admin.

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<ChangePasswordFormInputs>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
  });

  const newPassword = watch('new_password');

  const onSubmit = (data: ChangePasswordFormInputs) => {
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
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose} 
        />
        
        <YStack
          width="90%"
          maxWidth={450}
          backgroundColor="white"
          borderRadius={16}
          padding="$5"
          elevation={5}
          gap="$4"
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
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </XStack>

          <Text fontSize={14} color={COLORS.textSecondary} marginBottom="$2">
            {targetUserName 
              ? `Anda sedang mereset password untuk akun ${targetUserName}.`
              : 'Silakan masukkan password baru Anda. Pastikan password kuat dan mudah diingat.'
            }
          </Text>

          {/* Form */}
          <YStack gap="$4">
            {/* New Password */}
            <YStack gap="$1.5">
              <Label fontSize={14} fontWeight="600" color={COLORS.textMain}>
                Password Baru
              </Label>
              <Controller
                control={control}
                name="new_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack position="relative">
                    <Input
                      flex={1}
                      secureTextEntry={!showPassword}
                      placeholder="Masukkan password baru"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      borderColor={errors.new_password ? '#E74C3C' : COLORS.borderLight}
                      focusStyle={{ borderColor: COLORS.primary }}
                      paddingRight={45}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={COLORS.textSecondary} />
                      ) : (
                        <Eye size={20} color={COLORS.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </XStack>
                )}
              />
              {errors.new_password && (
                <Text fontSize={12} color="#E74C3C">
                  {errors.new_password.message}
                </Text>
              )}
            </YStack>

            {/* Password Requirements Checklist */}
            <YStack backgroundColor="#F8F9FA" padding="$3" borderRadius="$3" gap="$2">
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

            {/* Confirm Password */}
            <YStack gap="$1.5">
              <Label fontSize={14} fontWeight="600" color={COLORS.textMain}>
                Konfirmasi Password Baru
              </Label>
              <Controller
                control={control}
                name="confirm_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack position="relative">
                    <Input
                      flex={1}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Ulangi password baru"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      borderColor={errors.confirm_password ? '#E74C3C' : COLORS.borderLight}
                      focusStyle={{ borderColor: COLORS.primary }}
                      paddingRight={45}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={COLORS.textSecondary} />
                      ) : (
                        <Eye size={20} color={COLORS.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </XStack>
                )}
              />
              {errors.confirm_password && (
                <Text fontSize={12} color="#E74C3C">
                  {errors.confirm_password.message}
                </Text>
              )}
            </YStack>
          </YStack>

          {/* Warning for Super Admin */}
          {isSuperAdmin && (
            <YStack backgroundColor="#FDEAEA" padding="$3" borderRadius="$3" gap="$2" borderWidth={1} borderColor="#F5B7B1">
              <Text fontSize={13} color="#943126" fontWeight="bold">
                ⚠️ Akses Dibatasi
              </Text>
              <Text fontSize={12} color="#943126" lineHeight={16}>
                Akun Master Sistem (Super Admin) tidak diperbolehkan mengganti password melalui fitur ini untuk menjaga integritas sistem.
              </Text>
            </YStack>
          )}

          {/* Actions */}
          <XStack gap="$3" marginTop="$4">
            <Button
              flex={1}
              variant="outlined"
              borderColor={COLORS.borderLight}
              onPress={handleClose}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              flex={1}
              backgroundColor={isValid && !isSuperAdmin ? COLORS.primary : COLORS.borderLight}
              disabled={!isValid || isPending || isSuperAdmin}
              onPress={handleSubmit(onSubmit)}
              opacity={isValid && !isSuperAdmin ? 1 : 0.6}
            >
              <Text color="white" fontWeight="bold">
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Text>
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
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 10,
  },
});
