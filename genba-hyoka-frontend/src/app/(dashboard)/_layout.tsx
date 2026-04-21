import React from 'react';
import { View, YStack, XStack, Text, Button, Accordion, Square } from 'tamagui';
import { Slot, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/layout/Header';
import { BottomNav } from '../../components/layout/BottomNav';
import { useAuthStore } from '../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../config/menu';
import * as Icons from '@tamagui/lucide-icons';
import { LogOut, ChevronDown } from '@tamagui/lucide-icons';

export default function DashboardLayout() {
  const insets = useSafeAreaInsets();
  const { activeRole, clearAuth } = useAuthStore();
  const router = useRouter();

  let currentRoleBit = ROLE_BIT.EMPLOYEE;
  if (activeRole === 'admin' || activeRole === 'super_admin') currentRoleBit = ROLE_BIT.ADMIN;
  if (activeRole === 'manager') currentRoleBit = ROLE_BIT.MANAGER;

  const accessibleMenus = MENU_ITEMS.filter(m => (m.requiredRoleValue & currentRoleBit) === currentRoleBit);

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <YStack f={1} bg="$gray1" pt={insets.top}>
      <Header />
      
      <View f={1} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Menu Utama Accordion */}
        <Accordion type="multiple" defaultValue={['menu']} bg="white" borderBottomWidth={1} borderBottomColor="$gray4">
          <Accordion.Item value="menu">
            <Accordion.Trigger flexDirection="row" justifyContent="space-between" p="$4" bg="white" bw={0}>
              {({ open }: { open: boolean }) => (
                <>
                  <Text fontSize="$5" fontWeight="bold" color="$gray12">Menu Utama</Text>
                  <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                    <ChevronDown size={20} color="$gray11" />
                  </Square>
                </>
              )}
            </Accordion.Trigger>
            
            <Accordion.Content px="$4" pb="$4">
              <XStack flexWrap="wrap" gap="$3" jc="flex-start">
                {accessibleMenus.map((menu, idx) => {
                  const IconComponent = (Icons as any)[menu.icon];
                  return (
                    <YStack 
                      key={idx} 
                      bg="white" 
                      borderWidth={1} 
                      borderColor="$gray4" 
                      borderRadius="$4" 
                      p="$3" 
                      w="30%" 
                      ai="center" 
                      jc="center"
                      shadowColor="$gray5"
                      shadowOffset={{ width: 0, height: 2 }}
                      shadowOpacity={0.1}
                      shadowRadius={4}
                      //@ts-ignore
                      cursor="pointer"
                      onPress={() => router.push(menu.href as any)}
                    >
                      {IconComponent && <IconComponent size={24} color="$gray11" />}
                      <Text textAlign="center" fontSize="$1" mt="$2" fontWeight="bold" color="$gray11">
                        {menu.title.toUpperCase()}
                      </Text>
                    </YStack>
                  );
                })}
              </XStack>

              <XStack mt="$4" jc="flex-end">
                <Button 
                  icon={LogOut} 
                  color="$red10" 
                  chromeless 
                  onPress={handleLogout}
                  size="$3"
                  fontWeight="bold"
                >
                  LOGOUT
                </Button>
              </XStack>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>

        {/* Dashboard Content Placeholder/Slot */}
        <YStack p="$4" f={1}>
          {/* Default view when no submodule is selected */}
          <Slot />
        </YStack>
      </View>

      <BottomNav />
    </YStack>
  );
}
