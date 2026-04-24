import React, { useEffect, useState } from 'react';
import { View, Text, XStack, YStack, Avatar, Select, Circle, Popover, Button, ScrollView } from 'tamagui';
import { Bell, ChevronDown } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/authStore';
import { useInfiniteQuery } from '@tanstack/react-query';
import { COLORS } from '@/constants/theme';
import { useRouter } from 'expo-router';

// Dummy fetcher for notifications
const fetchNotifications = async ({ pageParam = 1 }) => {
  return new Promise((resolve) => setTimeout(() => {
    resolve({
      data: Array(10).fill(null).map((_, i) => ({
        id: `notif-${pageParam}-${i}`,
        message: `Notification ${i} on page ${pageParam}`,
      })),
      nextPage: pageParam > 3 ? undefined : pageParam + 1,
    });
  }, 1000));
};

import { useWSStore } from '../../store/wsStore';

export function Header() {
  const { activeRole, setActiveRole, roles } = useAuthStore() as any;
  const wsStatus = useWSStore((state) => state.status);
  const router = useRouter()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 1,
    queryFn: fetchNotifications,
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
  });

  const notifications = data?.pages.flatMap((page: any) => page.data) || [];

  useEffect(() => {
    console.log('active Role', activeRole)
  }, [activeRole])

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const hanldeChangeRole = (code: string) => {
    setActiveRole(code);
    const roleType = roles.find((r: any) => r.code === code)?.type;

    if(roleType === 'admin' || roleType === 'super_admin') {
      router.push('/(dashboard)/admin')
      return 
    }
    if(roleType === 'employee') {
      router.push('/(dashboard)/employee')
      return
    }
    if(roleType === 'manager') {
      router.push('/(dashboard)/manager')
      return
    }
  }

  return (
    <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$4" paddingVertical="$3" backgroundColor="white" borderBottomWidth={1} borderBottomColor="$gray4">
      {/* Left side: Logo/Profile */}
      <XStack gap="$3" alignItems="center">
        <Avatar circular size="$4">
          <Avatar.Image source={require('../../assets/images/logo-compress-removebg-preview.png')} />
          <Avatar.Fallback backgroundColor="$gray5" />
        </Avatar>
        <YStack>
          <Text fontWeight="bold" fontSize="$3">GENBA-HYOKA</Text>
        </YStack>
      </XStack>

      {/* Right side: Role Switcher, WS Status, Notifications */}
      <XStack gap="$3" alignItems="center">
        {roles && roles.length > 1 ? (
          <Select
            value={activeRole || ''}
            onValueChange={hanldeChangeRole}
            size="$3"
          >
            <Select.Trigger iconAfter={ChevronDown} width={110} backgroundColor="$gray2" borderRadius="$4" borderWidth={0} paddingHorizontal="$2" height="$3">
              <Select.Value placeholder="Role" />
            </Select.Trigger>

            <Select.Content>
              <Select.Viewport>
                {roles.map((role: any, i: number) => (
                  <Select.Item index={i} key={role.code} value={role.code}>
                    <Select.ItemText fontSize="$2">{role.name.toUpperCase()}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
        ) : (
          <View backgroundColor="$gray2" borderRadius="$4" paddingHorizontal="$3" paddingVertical="$1.5">
            <Text fontSize="$2" fontWeight="bold">
              {activeRole ? (roles.find((r: any) => r.code === activeRole)?.name || activeRole).toUpperCase() : 'USER'}
            </Text>
          </View>
        )}

        {/* Websocket status */}
        <Circle 
          size={10} 
          backgroundColor={
            wsStatus === 'OPEN' ? COLORS['primary'] : 
            wsStatus === 'CONNECTING' ? '#F1C40F' : 
            COLORS['warning']
          } 
        />

        {/* Notification Bell */}
        <Popover size="$5" allowFlip placement="bottom">
          <Popover.Trigger asChild>
            <Button
              circular
              size="$3"
              unstyled
              icon={<Bell size={20} color="$gray10" alignSelf='center' marginTop={5} />} />
          </Popover.Trigger>
          <Popover.Content borderWidth={1}
            borderColor="$borderColor"
            enterStyle={{ y: -10, opacity: 0 }}
            exitStyle={{ y: -10, opacity: 0 }}
            x={0}
            y={0}
            opacity={1}
          >
            <Popover.Arrow />

            <ScrollView padding="$4" minWidth={250} maxHeight={300} onScroll={handleScroll} scrollEventThrottle={400}>
              <Text fontWeight="bold" marginBottom="$2">Notifikasi</Text>
              {notifications.length > 0 ? (
                notifications.map((notif: any) => (
                  <View key={notif.id} paddingVertical="$2" borderBottomWidth={1} borderColor="$gray4">
                    <Text fontSize="$2" color="$gray11">{notif.message}</Text>
                  </View>
                ))
              ) : (
                <Text color="$gray10" marginTop="$2">Belum ada notifikasi.</Text>
              )}
              {isFetchingNextPage && <Text fontSize="$2" marginTop="$2" color="$gray8" textAlign="center">Memuat...</Text>}
            </ScrollView>
          </Popover.Content>
        </Popover>
      </XStack>
    </XStack>
  );
}
