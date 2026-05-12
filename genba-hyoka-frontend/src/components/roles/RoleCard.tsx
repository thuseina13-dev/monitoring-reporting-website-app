import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button } from 'tamagui';
import { ChevronDown, ChevronUp, Trash2 } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

export interface RoleCardProps {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  type: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({ id, name, code, description, isActive, type, onEdit, onDelete, isDeleting = false }) => {
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
        <YStack gap="$1" flex={1}>
          <Text fontSize={17} fontWeight="700" color={COLORS.textMain}>
            {name}
          </Text>
          <Text fontSize={12} fontWeight="700" color={COLORS.textSecondary}>
            KODE: {code.toUpperCase()}
          </Text>
        </YStack>

        <XStack gap="$3" alignItems="center">
          <View
            backgroundColor={COLORS.bgLight}
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius={20}
          >
            <Text fontSize={12} fontWeight="700" color={COLORS.textGray}>
              {type}
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={22} color={COLORS.textSecondary} />
          ) : (
            <ChevronDown size={22} color={COLORS.textSecondary} />
          )}
        </XStack>
      </XStack>

      {isExpanded && (
        <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$4">
          <YStack gap="$2" paddingTop="$3" borderTopWidth={1} borderTopColor={COLORS.bgSoft}>
            <Text fontSize={13} fontWeight="700" color={COLORS.textSecondary}>
              Deskripsi:
            </Text>
            <Text fontSize={14} color={COLORS.textMain} lineHeight={20}>
              {description}
            </Text>
          </YStack>

          <XStack justifyContent="space-between" alignItems="center" paddingTop="$2">
            <Button
              backgroundColor="white"
              borderWidth={1}
              borderColor={COLORS.borderLight}
              height={36}
              paddingHorizontal="$6"
              pressStyle={{ backgroundColor: COLORS.bgSoft }}
              onPress={() => onEdit?.(id)}
            >
              <Text fontSize={14} fontWeight="700" color={COLORS.textMain}>Edit</Text>
            </Button>
            
            <Button
              size="$3"
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
        title="Hapus Role"
        description={`Apakah Anda yakin ingin menghapus role "${name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={isDeleting}
      />
    </YStack>
  );
};

export default RoleCard;
