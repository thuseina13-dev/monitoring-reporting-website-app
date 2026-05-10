import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button, AlertDialog } from 'tamagui';
import { ChevronDown, ChevronUp, Mail, Smartphone, MapPinned, Edit3, Key, Power, Trash2 } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';

export interface UserCardProps {
  id: string;
  name: string;
  role: string;
  company: string;
  isActive: boolean;
  email?: string;
  phone?: string;
  address?: string;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onResetPassword?: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ id, name, role, company, isActive, email, phone, address, onToggleStatus, onDelete, onResetPassword }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ isOpen: boolean, type: 'status' | 'delete' | null }>({ isOpen: false, type: null });

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const handleToggleStatusClick = () => {
    setDialogConfig({ isOpen: true, type: 'status' });
  };

  const handleDeleteClick = () => {
    setDialogConfig({ isOpen: true, type: 'delete' });
  };

  const handleConfirmAction = () => {
    if (dialogConfig.type === 'status' && onToggleStatus) {
      onToggleStatus();
    } else if (dialogConfig.type === 'delete' && onDelete) {
      onDelete();
    }
    setDialogConfig({ isOpen: false, type: null });
  };

  return (
    <YStack
      backgroundColor={COLORS.cardBackground}
      borderRadius={12}
      borderWidth={1.5}
      // Garis pinggir hijau muncul jika kartu dibuka dan user aktif
      borderColor={isExpanded && isActive ? COLORS.primary : COLORS.borderLight}
      overflow="hidden"
    >
      {/* Header Kartu (Selalu Terlihat) */}
      <XStack padding="$4" alignItems="center" justifyContent="space-between" onPress={() => setIsExpanded(!isExpanded)}>
        <XStack gap="$3" alignItems="center" flex={1}>
          <View
            width={46}
            height={46}
            borderRadius={23}
            backgroundColor={COLORS.bgSoft}
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            borderColor={COLORS.borderLight}
          >
            <Text fontSize={14} fontWeight="700" color={COLORS.textMain}>{initials}</Text>
          </View>

          <YStack flex={1}>
            <Text fontSize={17} fontWeight="700" color={COLORS.textMain}>{name}</Text>
            <Text fontSize={14} color={COLORS.textSecondary}>{company}</Text>
          </YStack>
        </XStack>

        <XStack gap="$2" alignItems="center">
          <XStack
            backgroundColor={isActive ? COLORS.transparent.primary : COLORS.transparent.gray}
            paddingHorizontal="$2.5"
            paddingVertical="$1"
            borderRadius={20}
            alignItems="center"
            gap="$1.5"
          >
            <View width={6} height={6} borderRadius={3} backgroundColor={isActive ? COLORS.primary : COLORS.textSecondary} />
            <Text fontSize={12} fontWeight="600" color={isActive ? COLORS.primary : COLORS.textSecondary}>
              {isActive ? 'Aktif' : 'Off'}
            </Text>
          </XStack>
          
          {isExpanded ? <ChevronUp size={24} color={COLORS.textSecondary} /> : <ChevronDown size={24} color={COLORS.textSecondary} />}
        </XStack>
      </XStack>

      {/* Bagian Detail Informasi (Yang Anda sebut Pop-up/Expandable) */}
      {isExpanded && (
        <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$5">
          <YStack gap="$4" paddingTop="$4" borderTopWidth={1} borderTopColor={COLORS.borderSeparator}>
            {email && (
              <XStack gap="$4" alignItems="center">
                <Mail size={22} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text fontSize={15} color={COLORS.textMain}>{email}</Text>
              </XStack>
            )}
            {phone && (
              <XStack gap="$4" alignItems="center">
                <Smartphone size={22} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text fontSize={15} color={COLORS.textMain}>{phone}</Text>
              </XStack>
            )}
            {address && (
              <XStack gap="$4" alignItems="flex-start">
                <MapPinned size={22} color={COLORS.textSecondary} strokeWidth={1.5} marginTop={2} />
                <Text fontSize={15} color={COLORS.textMain} flex={1} lineHeight={20}>{address}</Text>
              </XStack>
            )}
          </YStack>

          {/* Tombol Aksi di bagian bawah detail */}
          <XStack gap="$2" justifyContent="space-between" alignItems="center">
            <XStack gap="$2" flex={1}>
              <ActionButton icon={<Edit3 size={14} />} label="Edit" />
              <ActionButton 
                icon={<Key size={14} />} 
                label="Reset Sandi" 
                onPress={() => onResetPassword?.(id)}
              />
              <ActionButton 
                icon={<Power size={14} />} 
                label={isActive ? "Non-aktifkan" : "Aktifkan"} 
                color={isActive ? COLORS.danger : COLORS.primary} 
                onPress={handleToggleStatusClick}
              />
            </XStack>
            <Button
              size="$3.5"
              circular
              backgroundColor="transparent"
              icon={<Trash2 size={20} color={COLORS.danger} />}
              pressStyle={{ backgroundColor: COLORS.transparent.danger }}
              onPress={handleDeleteClick}
            />
          </XStack>
        </YStack>
      )}

      {/* AlertDialog Kustom dari Tamagui */}
      <AlertDialog 
        open={dialogConfig.isOpen} 
        onOpenChange={(isOpen) => setDialogConfig(prev => ({ ...prev, isOpen }))}
        disableRemoveScroll // Menghilangkan celah putih di kanan pada browser web
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            opacity={0.5}
          />
          <AlertDialog.Content
            bordered
            elevate
            key="content"
            x={0}
            scale={1}
            opacity={1}
            y={0}
            maxWidth={400}
            width="90%"
            backgroundColor="white"
            borderRadius={12}
            padding="$5"
          >
            <YStack gap="$4">
              <AlertDialog.Title fontSize={18} fontWeight="bold" color={COLORS.textMain}>
                {dialogConfig.type === 'status' ? 'Konfirmasi Status' : 'Hapus User'}
              </AlertDialog.Title>
              <AlertDialog.Description fontSize={14} color={COLORS.textSecondary} lineHeight={20}>
                {dialogConfig.type === 'status' 
                  ? `Apakah Anda yakin ingin ${isActive ? 'menonaktifkan' : 'mengaktifkan'} user ${name}?`
                  : `Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus ${name}?`
                }
              </AlertDialog.Description>

              <XStack justifyContent="flex-end" marginTop="$2" gap="$2">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined" borderColor={COLORS.borderLight} backgroundColor="white">
                    Batal
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild onPress={handleConfirmAction}>
                  <Button 
                    backgroundColor={dialogConfig.type === 'delete' || isActive ? COLORS.danger : COLORS.primary} 
                  >
                    <Text color="white" fontWeight="bold">
                      {dialogConfig.type === 'status' ? 'Ya, Lanjutkan' : 'Hapus'}
                    </Text>
                  </Button>
                </AlertDialog.Action>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

    </YStack>
  );
};

const ActionButton = ({ icon, label, color = COLORS.textMain, onPress }: { icon: any, label: string, color?: string, onPress?: () => void }) => (
  <Button
    size="$3.5"
    variant="outlined"
    borderColor={COLORS.borderLight}
    paddingHorizontal="$3"
    backgroundColor="white"
    pressStyle={{ backgroundColor: COLORS.bgSoft }}
    onPress={onPress}
  >
    <XStack gap="$1.5" alignItems="center">
      {React.cloneElement(icon, { color })}
      <Text fontSize={13} fontWeight="700" color={color}>{label}</Text>
    </XStack>
  </Button>
);

export default UserCard;
