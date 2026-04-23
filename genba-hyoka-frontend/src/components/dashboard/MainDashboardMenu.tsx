import React, { useState } from 'react';
import { View, Text, XStack, YStack, Button } from 'tamagui';
import { LogOut, ChevronUp, ChevronDown } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';
import { MenuIcon } from './MenuIcon';
import { useWindowDimensions } from 'react-native';

interface MainDashboardMenuProps {
  items: any[];
  getIcon: (title: string) => React.ReactNode;
  onLogout: () => void;
  onItemPress: (href: string) => void;
}

export function MainDashboardMenu({ items, getIcon, onLogout, onItemPress }: MainDashboardMenuProps) {
  const [showMenu, setShowMenu] = useState(true);
  const { width } = useWindowDimensions();
  
  const isMobile = width < 768;
  const numColumns = isMobile ? 4 : 8;
  const itemWidth = isMobile ? '23%' : '11%';

  return (
    <YStack backgroundColor={COLORS.cardBackground} borderRadius="$5" elevation={2} overflow="hidden">
      <XStack 
        justifyContent="space-between" 
        alignItems="center" 
        padding="$4"
        onPress={() => setShowMenu(!showMenu)}
        pressStyle={{ backgroundColor: '$gray2' }}
        cursor="pointer"
      >
        <XStack alignItems="center" gap="$3">
          <Text fontSize="$4" fontWeight="bold" color={COLORS.textDark}>MENU UTAMA</Text>
          {!showMenu && (
            <View backgroundColor="$blue2" paddingHorizontal="$2" paddingVertical="$0.5" borderRadius="$2">
              <Text fontSize="$1" fontWeight="bold" color={COLORS.primary}>{items.length} ITEMS</Text>
            </View>
          )}
        </XStack>
        <View>
          {showMenu ? (
            <ChevronUp size={20} color={COLORS.textMuted} />
          ) : (
            <ChevronDown size={20} color={COLORS.textMuted} />
          )}
        </View>
      </XStack>
      
      {showMenu && (
        <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$4">
          <XStack flexWrap="wrap" rowGap="$4" justifyContent="space-between">
            {items.map((item) => (
              <MenuIcon 
                key={item.title} 
                title={item.title} 
                icon={getIcon(item.title)}
                onPress={() => onItemPress(item.href)} 
                itemWidth={itemWidth}
              />
            ))}
            {/* Fill empty spots with grid columns */}
            {[...Array(numColumns - (items.length % numColumns || numColumns))].map((_, i) => (
              <View key={`empty-${i}`} width={itemWidth} />
            ))}
          </XStack>

          {/* Logout Footer Button with Text */}
          <XStack justifyContent="flex-end" marginTop="$2">
            <Button 
               size="$3" 
               backgroundColor="transparent" 
               icon={<LogOut color={COLORS.warning} size={18} />} 
               onPress={onLogout}
               borderWidth={0}
               pressStyle={{ backgroundColor: '$red2', opacity: 0.7 }}
            >
              <Text color={COLORS.warning} fontWeight="800" fontSize="$2">LOGOUT</Text>
            </Button>
          </XStack>
        </YStack>
      )}
    </YStack>
  );
}
