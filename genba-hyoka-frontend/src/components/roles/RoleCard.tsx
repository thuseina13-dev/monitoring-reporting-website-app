import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button, AlertDialog } from 'tamagui';
import { ChevronDown, ChevronUp, Trash2 } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';

export interface RoleCardProps {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  type: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ id, name, code, description, isActive, type, onEdit, onDelete }) => {
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay key="overlay" opacity={0.5} />
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
                Hapus Role
              </AlertDialog.Title>
              <AlertDialog.Description fontSize={14} color={COLORS.textSecondary} lineHeight={20}>
                Apakah Anda yakin ingin menghapus role &quot;{name}&quot;? Tindakan ini tidak dapat dibatalkan.
              </AlertDialog.Description>

              <XStack justifyContent="flex-end" marginTop="$2" gap="$2">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined" borderColor={COLORS.borderLight} backgroundColor="white">
                    Batal
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild onPress={handleConfirmDelete}>
                  <Button backgroundColor={COLORS.danger}>
                    <Text color="white" fontWeight="bold">Hapus</Text>
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

export default RoleCard;
