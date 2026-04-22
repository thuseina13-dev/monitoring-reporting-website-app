import { Toast, useToastState, useToastController } from '@tamagui/toast';
import { YStack, XStack, Text, Button, Circle } from 'tamagui';
import { X, CheckCircle, AlertCircle, Info } from '@tamagui/lucide-icons';
import { LinearGradient } from 'tamagui/linear-gradient';
import { COLORS } from '../constants/theme';

export const CustomToast = () => {
  const currentToast = useToastState();
  const toast = useToastController();

  if (!currentToast || currentToast.isHandledNatively) {
    return null;
  }

  const isError = currentToast.type === 'error';
  const Icon = isError ? AlertCircle : (currentToast.type === 'success' ? CheckCircle : Info);
  
  const bgColors = isError 
    ? COLORS.gradients.warning 
    : COLORS.gradients.primary;


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
      borderRadius="$5"
      padding={0}
      overflow="hidden"
      elevation={10}
      width={340}
    >
      <LinearGradient
        colors={bgColors as any}
        start={[0, 0]}
        end={[1, 1]}
        padding="$3"
        minHeight={65}
      >
        <XStack alignItems="center" gap="$3" >
          <Circle backgroundColor="rgba(255,255,255,0.2)" size={38} alignItems="center" justifyContent="center" zIndex={1}>
            <Icon size={22} color="white" />
          </Circle>

          <YStack flex={1} gap="$0.5">
            <Toast.Title fontWeight="800" color="white" fontSize="$4" lineHeight={20} zIndex={1}>
              {currentToast.title}
            </Toast.Title>
            {!!currentToast.message && (
              <Toast.Description color="white" fontSize="$2" opacity={0.9} lineHeight={16} zIndex={1}>
                {currentToast.message}
              </Toast.Description>
            )}
          </YStack>
          
          <Toast.Action altText="Close" >
            <Button 
              size="$2.5" 
              circular 
              backgroundColor="rgba(0,0,0,0.1)"
              padding={0}
              borderWidth={0}
              onPress={() => toast.hide()}
              pressStyle={{ backgroundColor: 'rgba(0,0,0,0.2)', scale: 0.9 }}
              zIndex={1}
            >
              <X size={18} color="white" />
            </Button>
          </Toast.Action>
        </XStack>
      </LinearGradient>
    </Toast>
  );
};


