import { Toast, useToastState } from '@tamagui/toast';
import { YStack, Text } from 'tamagui';

export const CustomToast = () => {
  const currentToast = useToastState();

  if (!currentToast || currentToast.isHandledNatively) {
    return null;
  }

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: -20 }}
      exitStyle={{ opacity: 0, scale: 0.5, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      viewportName={currentToast.viewportName}
      backgroundColor={currentToast.type === 'error' ? '$red10' : '$green10'}
      borderRadius="$4"
      padding="$4"
      shadowColor="$shadowColor"
      shadowRadius={10}
    >
      <YStack>
        <Toast.Title fontWeight="bold" color="white">
          {currentToast.title}
        </Toast.Title>
        {!!currentToast.message && (
          <Toast.Description color="white">{currentToast.message}</Toast.Description>
        )}
      </YStack>
    </Toast>
  );
};
