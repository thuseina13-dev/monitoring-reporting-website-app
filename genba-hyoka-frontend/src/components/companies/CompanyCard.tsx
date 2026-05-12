import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button, Image } from 'tamagui';
import { ChevronDown, ChevronUp, MapPin, Mail, Phone, Trash2, Users } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { getImageUrl } from '@/utils/getImageUrl';

export interface CompanyCardProps {
  id: string;
  name: string;
  address: string;
  logo?: string;
  email?: string;
  phone?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ id, name, address, logo, email, phone, onEdit, onDelete, isDeleting = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete?.(id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <YStack
      backgroundColor="white"
      borderRadius={12}
      borderWidth={1.5}
      borderColor={isExpanded ? COLORS.primary : COLORS.borderLight}
      overflow="hidden"
    >
      <XStack padding="$4" alignItems="center" justifyContent="space-between" onPress={() => setIsExpanded(!isExpanded)}>
        <XStack gap="$3" flex={1} alignItems="center">
          <View
            width={55}
            height={55}
            borderRadius={27.5}
            backgroundColor={COLORS.bgSoft}
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            borderWidth={1}
            borderColor={COLORS.borderMedium}
          >
            {logo && typeof logo === 'string' && logo.trim().length > 0 ? (
              <Image src={getImageUrl(logo)} width="100%" height="100%" />
            ) : (
              <XStack alignItems="center" justifyContent="center" flex={1}>
                <Users size={26} color={COLORS.primary} />
              </XStack>
            )}
          </View>

          <YStack flex={1}>
            <Text fontSize={17} fontWeight="700" color={COLORS.textMain} numberOfLines={1}>
              {name}
            </Text>
            <Text fontSize={13} color={COLORS.textSecondary} numberOfLines={1}>
              {address}
            </Text>
          </YStack>
        </XStack>

        {isExpanded ? (
          <ChevronUp size={22} color={COLORS.textSecondary} />
        ) : (
          <ChevronDown size={22} color={COLORS.textSecondary} />
        )}
      </XStack>

      {isExpanded && (
        <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$4">
          <YStack gap="$2.5" paddingTop="$3" borderTopWidth={1} borderTopColor={COLORS.bgSoft}>
            {email && (
              <XStack alignItems="center" gap="$3">
                <Mail size={18} color={COLORS.textSecondary} />
                <Text fontSize={14} color={COLORS.textMain}>{email}</Text>
              </XStack>
            )}
            {phone && (
              <XStack alignItems="center" gap="$3">
                <Phone size={18} color={COLORS.textSecondary} />
                <Text fontSize={14} color={COLORS.textMain}>{phone}</Text>
              </XStack>
            )}
            <XStack alignItems="flex-start" gap="$3">
              <MapPin size={18} color={COLORS.textSecondary} marginTop={2} />
              <Text fontSize={14} color={COLORS.textMain} flex={1} lineHeight={20}>
                {address}
              </Text>
            </XStack>
          </YStack>

          <XStack justifyContent="space-between" alignItems="center" paddingTop="$2" gap="$2">
            <XStack gap="$2" flex={1}>           
              <Button
                backgroundColor="white"
                borderWidth={1}
                borderColor={COLORS.borderLight}
                height={40}
                paddingHorizontal="$4"
                pressStyle={{ backgroundColor: COLORS.bgSoft }}
                onPress={() => onEdit?.(id)}
              >
                <Text fontSize={13} fontWeight="700" color={COLORS.textMain}>Edit</Text>
              </Button>
            </XStack>
            
            <Button
              size="$3.5"
              circular
              backgroundColor="transparent"
              borderWidth={1}
              borderColor={COLORS.danger}
              icon={<Trash2 size={18} color={COLORS.danger} />}
              pressStyle={{ backgroundColor: COLORS.transparent.danger }}
              onPress={() => setIsDeleteDialogOpen(true)}
            />
          </XStack>
        </YStack>
      )}

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Konfirmasi Hapus"
        description="Apakah Anda yakin ingin menghapus profil perusahaan ini? Seluruh data terkait akan terpengaruh dan tindakan ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={isDeleting}
      />
    </YStack>
  );
};

export default CompanyCard;
