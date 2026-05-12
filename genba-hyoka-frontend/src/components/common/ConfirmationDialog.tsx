import React from 'react';
import { AlertDialog, Button, YStack, XStack, Text, Spinner } from 'tamagui';
import { COLORS } from '../../constants/theme';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  onConfirm,
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description fontSize={14} color={COLORS.textSecondary} lineHeight={20}>
              {description}
            </AlertDialog.Description>

            <XStack justifyContent="flex-end" marginTop="$2" gap="$3">
              <AlertDialog.Cancel asChild>
                <Button 
                  variant="outlined" 
                  borderColor={COLORS.borderLight} 
                  backgroundColor="white"
                  height="$3.5"
                  paddingHorizontal="$4"
                  disabled={isLoading}
                  opacity={isLoading ? 0.5 : 1}
                >
                  <Text color={COLORS.textMain}>{cancelLabel}</Text>
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild onPress={onConfirm} disabled={isLoading}>
                <Button 
                  backgroundColor={variant === 'danger' ? COLORS.danger : COLORS.primary}
                  height="$3.5"
                  paddingHorizontal="$4"
                  pressStyle={{ opacity: 0.8 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <XStack ai="center" gap="$2">
                      <Spinner size="small" color="white" />
                      <Text color="white" fontWeight="bold">Proses...</Text>
                    </XStack>
                  ) : (
                    <Text color="white" fontWeight="bold">{confirmLabel}</Text>
                  )}
                </Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
};
