import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button, Image } from 'tamagui';
import { router } from 'expo-router';
import { ChevronDown, ChevronUp, Mail, Smartphone, MapPinned, Edit3, Key, Power, Trash2 } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { getImageUrl } from '@/utils/getImageUrl';

export interface UserCardProps {
  id: string;
  name: string;
  role: string;
  company: string;
  isActive: boolean;
  email?: string;
  phone?: string;
  address?: string;
  photoProfile?: string | null;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onResetPassword?: (id: string) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ id, name, role, company, isActive, email, phone, address, photoProfile, onToggleStatus, onDelete, onResetPassword, isDeleting = false, isUpdating = false }) => {
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
      borderColor={isExpanded && isActive ? COLORS.primary : COLORS.borderLight}
      overflow="hidden"
    >
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
            overflow="hidden"
          >
            {photoProfile ? (
              <Image src={getImageUrl(photoProfile)} width="100%" height="100%"/>
            ) : (
              <Text fontSize={14} fontWeight="700" color={COLORS.textMain}>{initials}</Text>
            )}
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

          <XStack gap="$2" justifyContent="space-between" alignItems="center">
            <XStack gap="$2" flex={1}>
              <ActionButton 
                icon={<Edit3 size={14} />} 
                label="Edit" 
                onPress={() => router.push(`/admin/user/edit/${id}`)}
              />
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

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={dialogConfig.isOpen && dialogConfig.type === 'status'}
        onOpenChange={(isOpen) => setDialogConfig(prev => ({ ...prev, isOpen }))}
        title="Konfirmasi Status"
        description={`Apakah Anda yakin ingin ${isActive ? 'menonaktifkan' : 'mengaktifkan'} user ${name}?`}
        onConfirm={handleConfirmAction}
        confirmLabel="Ya, Lanjutkan"
        variant={isActive ? 'danger' : 'primary'}
        isLoading={isUpdating}
      />

      <ConfirmationDialog
        isOpen={dialogConfig.isOpen && dialogConfig.type === 'delete'}
        onOpenChange={(isOpen) => setDialogConfig(prev => ({ ...prev, isOpen }))}
        title="Hapus User"
        description={`Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus ${name}?`}
        onConfirm={handleConfirmAction}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={isDeleting}
      />
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
