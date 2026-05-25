import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button } from 'tamagui';
import { ChevronDown, ChevronUp, Edit3, Trash2 } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

interface TemplateCardProps {
  template: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete, isDeleting = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isActive = template.isActive;

  return (
    <YStack
      backgroundColor={COLORS.cardBackground}
      borderRadius={12}
      borderWidth={1.5}
      borderColor={isExpanded && isActive ? COLORS.primary : COLORS.borderLight}
      overflow="hidden"
      marginBottom="$3"
    >
      <XStack padding="$4" alignItems="center" justifyContent="space-between" onPress={() => setIsExpanded(!isExpanded)}>
        <YStack flex={1} paddingRight="$2">
          <Text fontSize={17} fontWeight="700" color={COLORS.textMain}>{template.name}</Text>
        </YStack>

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
              {isActive ? 'Aktif' : 'Non-aktif'}
            </Text>
          </XStack>

          {isExpanded ? <ChevronUp size={24} color={COLORS.textSecondary} /> : <ChevronDown size={24} color={COLORS.textSecondary} />}
        </XStack>
      </XStack>

      {isExpanded && (
        <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$5">
          <YStack gap="$4" paddingTop="$4" borderTopWidth={1} borderTopColor={COLORS.borderSeparator}>
            {template.description ? (
              <Text fontSize={15} color={COLORS.textMain} lineHeight={20}>
                {template.description}
              </Text>
            ) : (
              <Text fontSize={14} color={COLORS.textMuted} fontStyle="italic">
                Tidak ada deskripsi.
              </Text>
            )}
          </YStack>

          <XStack gap="$2" justifyContent="space-between" alignItems="center">
            <XStack gap="$2" flex={1}>
              <ActionButton
                icon={<Edit3 size={14} />}
                label="Edit"
                onPress={() => onEdit(template.id)}
              />
            </XStack>
            <Button
              size="$3.5"
              circular
              backgroundColor="transparent"
              icon={<Trash2 size={20} color={COLORS.danger} />}
              pressStyle={{ backgroundColor: COLORS.transparent.danger }}
              onPress={() => setIsDeleteDialogOpen(true)}
            />
          </XStack>
        </YStack>
      )}

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Template"
        description={`Apakah Anda yakin ingin menghapus template "${template.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={() => {
          onDelete(template.id);
          setIsDeleteDialogOpen(false);
        }}
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
