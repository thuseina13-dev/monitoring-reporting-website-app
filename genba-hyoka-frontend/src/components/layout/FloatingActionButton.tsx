import React from 'react';
import { Button } from 'tamagui';
import { Plus } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
}

const FloatingActionButton: React.FC<FABProps> = ({ onPress }) => {
  return (
    <Button
      position="absolute"
      bottom={24}
      right={24}
      width={56}
      height={56}
      borderRadius={28}
      backgroundColor={COLORS.primary}
      icon={<Plus size={24} color={COLORS.textLight} />}
      onPress={onPress}
      shadowColor="black"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.3}
      shadowRadius={4.65}
      elevation={8}
      pressStyle={{ opacity: 0.8, scale: 0.95 }}
    />
  );
};

export default FloatingActionButton;
