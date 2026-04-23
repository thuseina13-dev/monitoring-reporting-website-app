import React from 'react';
import { View, Text, YStack } from 'tamagui';
import { COLORS } from '../../constants/theme';

interface MenuIconProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  itemWidth: any;
}

export function MenuIcon({ title, icon, onPress, itemWidth }: MenuIconProps) {
  return (
    <YStack 
      onPress={onPress}
      width={itemWidth}
      backgroundColor={COLORS.pageBackground} 
      borderRadius="$3" 
      alignItems="center" 
      justifyContent="center" 
      elevation={1}
      pressStyle={{ scale: 0.9, backgroundColor: COLORS.inputBackground }}
      paddingVertical="$3"
      paddingHorizontal="$1"
      minHeight={90}
      gap="$2"
    >
      <View>
          {icon}
      </View>
      <Text 
        fontSize="$1" 
        textAlign="center" 
        fontWeight="800" 
        color={COLORS.textDark} 
        numberOfLines={2}
      >
        {title}
      </Text>
    </YStack>
  );
}
