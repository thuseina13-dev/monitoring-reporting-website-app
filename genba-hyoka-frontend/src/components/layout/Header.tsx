import React, { useState } from 'react';
import { View, Text, XStack, YStack, Avatar, Select, Circle, Popover, Button, ScrollView } from 'tamagui';
import { Bell, ChevronDown } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/authStore';
import { useInfiniteQuery } from '@tanstack/react-query';

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

export function Header() {
  const { user, activeRole, setActiveRole } = useAuthStore() as any;
  const [isOnline, setIsOnline] = useState(true); // TODO: actual websocket status

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 1,
    queryFn: fetchNotifications,
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
  });

  const notifications = data?.pages.flatMap((page: any) => page.data) || [];

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$4" paddingVertical="$3" backgroundColor="white" borderBottomWidth={1} borderBottomColor="$gray4">
      {/* Left side: Logo/Profile */}
      <XStack gap="$3" alignItems="center">
        <Avatar circular size="$4">
          <Avatar.Image src="https://i.pravatar.cc/150?u=genba" />
          <Avatar.Fallback backgroundColor="$gray5" />
        </Avatar>
        <YStack>
          <Text fontWeight="bold" fontSize="$3">GENBA-</Text>
          <Text fontWeight="bold" fontSize="$3">HYOKA</Text>
        </YStack>
      </XStack>

      {/* Right side: Role Switcher, WS Status, Notifications */}
      <XStack gap="$3" alignItems="center">
        {user?.roles && user.roles.length > 1 ? (
          <Select 
            value={activeRole || ''} 
            onValueChange={setActiveRole}
            size="$3"
          >
            <Select.Trigger iconAfter={ChevronDown} width={110} backgroundColor="$gray2" borderRadius="$4" borderWidth={0} paddingHorizontal="$2" height="$3">
              <Select.Value placeholder="Role" />
            </Select.Trigger>
            
            <Select.Content>
              <Select.Viewport>
                {user.roles.map((role: string, i: number) => (
                  <Select.Item index={i} key={role} value={role}>
                    <Select.ItemText fontSize="$2">{role.toUpperCase()}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
        ) : (
          <View backgroundColor="$gray2" borderRadius="$4" paddingHorizontal="$3" paddingVertical="$1.5">
            <Text fontSize="$2" fontWeight="bold">
              {activeRole ? activeRole.toUpperCase() : 'USER'}
            </Text>
          </View>
        )}

        {/* Websocket status */}
        <Circle size={10} backgroundColor={isOnline ? '#10B981' : '$red10'} />

        {/* Notification Bell */}
        <Popover size="$5" allowFlip placement="bottom">
          <Popover.Trigger asChild>
            <Button circular size="$3" unstyled icon={<Bell size={20} color="$gray10" />} />
          </Popover.Trigger>
          <Popover.Content borderWidth={1} borderColor="$borderColor" enterStyle={{ y: -10, opacity: 0 }} exitStyle={{ y: -10, opacity: 0 }} x={0} y={0} opacity={1}>
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
