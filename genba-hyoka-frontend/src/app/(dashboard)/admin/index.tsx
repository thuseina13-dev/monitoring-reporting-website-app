import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Circle, Button } from 'tamagui';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';
import { Users, Shield, Settings, Activity } from '@tamagui/lucide-icons';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const adminMenus = MENU_ITEMS.filter(item => (item.requiredRoleValue & ROLE_BIT.ADMIN) !== 0);

  return (
    <ScrollView flex={1} backgroundColor="#F8FAFC">
      <YStack padding="$4" gap="$5">
        <YStack>
          <Text fontSize="$6" fontWeight="800">Panel Administrator</Text>
          <Text fontSize="$3" color="$gray10">Pengaturan sistem dan manajemen pengguna.</Text>
        </YStack>

        <XStack gap="$3" justifyContent="space-between">
          <StatCard title="Total User" value="150" icon={<Users size={20} color="$blue10" />} />
          <StatCard title="Sistem" value="99%" icon={<Activity size={20} color="$green10" />} />
        </XStack>

        <YStack gap="$4">
          <Text fontSize="$4" fontWeight="bold">Manajemen</Text>
          <XStack flexWrap="wrap" gap="$3">
            {adminMenus.map((item) => (
              <MenuIcon 
                key={item.title} 
                title={item.title} 
                onPress={() => router.push(item.href as any)} 
              />
            ))}
          </XStack>
        </YStack>

        <YStack gap="$4" marginTop="$2">
          <Text fontSize="$4" fontWeight="bold">Keamanan</Text>
          <Card padding="$4" backgroundColor="white" elevation={1} borderRadius="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$3" alignItems="center">
                <Shield color="$red10" size={24} />
                <Text fontWeight="600">Audit Log Terakhir</Text>
              </XStack>
              <Button size="$2" unstyled>
                <Text color="$blue10">Lihat</Text>
              </Button>
            </XStack>
          </Card>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card flex={1} padding="$4" elevation={1} borderRadius="$4" backgroundColor="white" alignItems="center">
      {icon}
      <Text fontSize="$8" fontWeight="bold" marginTop="$2">{value}</Text>
      <Text fontSize="$2" color="$gray9">{title}</Text>
    </Card>
  );
}

function MenuIcon({ title, onPress }: any) {
  return (
    <YStack alignItems="center" gap="$2" width="30%">
      <Button circular size="$6" backgroundColor="white" elevation={2} onPress={onPress}>
        <Circle size={40} backgroundColor="$blue1">
           <Settings color="$blue10" size={24} />
        </Circle>
      </Button>
      <Text fontSize="$2" textAlign="center" numberOfLines={2}>{title}</Text>
    </YStack>
  );
}

