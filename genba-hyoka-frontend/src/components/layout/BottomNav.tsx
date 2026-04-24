import React from 'react';
import { XStack, YStack, Text } from 'tamagui';
import { useAuthStore } from '../../store/authStore';
import { MENU_ITEMS, ROLE_BIT, MenuItem } from '../../config/menu';
import { useRouter, usePathname } from 'expo-router';
import * as Icons from '@tamagui/lucide-icons';

export function BottomNav() {
  const { activeRole, roles } = useAuthStore() as any;
  const router = useRouter();
  const pathname = usePathname();

  // Get current role bit based on activeRole code's type
  const currentRole = roles?.find((r: any) => r.code === activeRole);
  const roleType = currentRole?.type;

  let currentRoleBit = ROLE_BIT.EMPLOYEE;
  if (roleType === 'admin' || roleType === 'super_admin') currentRoleBit = ROLE_BIT.ADMIN;
  if (roleType === 'manager') currentRoleBit = ROLE_BIT.MANAGER;

  const accessibleMenus = MENU_ITEMS.filter((m: MenuItem) => (m.requiredRoleValue & currentRoleBit) === currentRoleBit).slice(0, 3);

  return (
    <XStack width="100%" justifyContent="space-around" alignItems="center" backgroundColor="white" borderTopWidth={1} borderTopColor="$gray4" height={65}>
      {accessibleMenus.map((menu: MenuItem, idx: number) => {
        const IconComponent = (Icons as any)[menu.icon];
        const isActive = pathname.startsWith(menu.href);
        const color = isActive ? '#10B981' : '$gray10';

        return (
          <YStack 
            key={idx} 
            alignItems="center" 
            justifyContent="center"
            flex={1}
            height="100%"
            borderTopWidth={3}
            borderTopColor={isActive ? '#10B981' : 'transparent'}
            //@ts-ignore
            cursor="pointer" 
            onPress={() => router.push(menu.href as any)}
          >
            {IconComponent && <IconComponent size={24} color={color} />}
            <Text fontSize={10} fontWeight={isActive ? 'bold' : 'normal'} marginTop="$1" color={color}>
              {menu.title}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );
}

