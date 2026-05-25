import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button } from 'tamagui';
import { ChevronDown, ChevronUp, ClipboardList } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';

export interface DelegationCardProps {
  role: any;
  assignedTasks: any[];
  onManage?: (role: any) => void;
}

export const DelegationCard: React.FC<DelegationCardProps> = ({
  role,
  assignedTasks,
  onManage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <YStack
      backgroundColor="white"
      borderRadius={12}
      borderWidth={1.5}
      borderColor={isExpanded ? COLORS.primary : COLORS.borderLight}
      overflow="hidden"
      marginBottom="$3"
      elevation={0.5}
    >
      {/* Accordion Header */}
      <XStack
        padding="$4"
        alignItems="center"
        justifyContent="space-between"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <YStack gap="$1" flex={1}>
          <Text fontSize={17} fontWeight="700" color={COLORS.textMain}>
            {role.name}
          </Text>
          <Text fontSize={13} color={COLORS.textSecondary} fontWeight="600">
            {assignedTasks.length} Tugas Terdelegasi
          </Text>
        </YStack>

        <XStack gap="$3" alignItems="center">
          <Button
            backgroundColor={COLORS.primary}
            height={32}
            paddingHorizontal="$3.5"
            borderRadius={6}
            pressStyle={{ opacity: 0.85 }}
            onPress={(e: any) => {
              e.stopPropagation(); // Prevent accordion collapse/expand
              onManage?.(role);
            }}
          >
            <Text color="white" fontSize={12} fontWeight="700">Kelola</Text>
          </Button>
          {isExpanded ? (
            <ChevronUp size={22} color={COLORS.textSecondary} />
          ) : (
            <ChevronDown size={22} color={COLORS.textSecondary} />
          )}
        </XStack>
      </XStack>

      {/* Accordion Content */}
      {isExpanded && (
        <YStack paddingHorizontal="$4" paddingBottom="$4">
          <YStack gap="$2.5" paddingTop="$2" borderTopWidth={1} borderTopColor={COLORS.bgSoft}>
            <Text fontSize={13} fontWeight="700" color={COLORS.textSecondary}>
              Tugas Terdelegasi Saat Ini:
            </Text>
            {assignedTasks.length > 0 ? (
              <YStack gap="$2">
                {assignedTasks.map((t: any) => (
                  <XStack
                    key={t.id}
                    alignItems="center"
                    gap="$2.5"
                    backgroundColor={COLORS.bgSoft}
                    padding="$2.5"
                    borderRadius={8}
                  >
                    <ClipboardList size={16} color={COLORS.textSecondary} />
                    <Text fontSize={14} fontWeight="500" color={COLORS.textMain}>
                      {t.taskName || 'Tugas Tanpa Nama'}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            ) : (
              <Text fontSize={14} color={COLORS.textMuted} fontStyle="italic" paddingVertical="$1">
                Belum ada tugas yang didelegasikan ke role ini.
              </Text>
            )}
          </YStack>
        </YStack>
      )}
    </YStack>
  );
};
