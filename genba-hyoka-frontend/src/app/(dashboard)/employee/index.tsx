import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Circle, Button } from 'tamagui';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';
import { ClipboardList, AlertTriangle, CheckSquare, Search } from '@tamagui/lucide-icons';

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const employeeMenus = MENU_ITEMS.filter(item => (item.requiredRoleValue & ROLE_BIT.EMPLOYEE) !== 0);

  return (
    <ScrollView flex={1} backgroundColor="#F8FAFC">
      <YStack padding="$4" gap="$5">
        <YStack>
          <Text fontSize="$6" fontWeight="800">Halo, {user?.fullName.split(' ')[0]}!</Text>
          <Text fontSize="$3" color="$gray10">Sudahkah Anda mengecek tugas hari ini?</Text>
        </YStack>

        <XStack gap="$3" justifyContent="space-between">
          <StatCard title="Tugas Aktif" value="5" color="#10B981" />
          <StatCard title="Selesai" value="8" color="$blue10" />
        </XStack>

        <YStack gap="$4">
          <Text fontSize="$4" fontWeight="bold">Menu Utama</Text>
          <XStack flexWrap="wrap" gap="$3">
            {employeeMenus.map((item) => (
              <MenuIcon 
                key={item.title} 
                title={item.title} 
                onPress={() => router.push(item.href as any)} 
              />
            ))}
          </XStack>
        </YStack>

        <Card padding="$4" backgroundColor="$green10" borderRadius="$5">
          <XStack alignItems="center" gap="$4">
            <YStack flex={1}>
              <Text color="white" fontWeight="bold" fontSize="$5">Butuh Bantuan?</Text>
              <Text color="white" opacity={0.8} fontSize="$2">Laporkan kendala lapangan segera.</Text>
            </YStack>
            <Button size="$3" borderRadius="$4" backgroundColor="white">
              <Text color="$green10" fontWeight="bold">Lapor</Text>
            </Button>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <Card flex={1} padding="$3" elevation={1} borderRadius="$4" backgroundColor="white">
      <YStack alignItems="center">
        <Text fontSize="$2" color="$gray10">{title}</Text>
        <Text fontSize="$7" fontWeight="bold" color={color}>{value}</Text>
      </YStack>
    </Card>
  );
}

function MenuIcon({ title, onPress }: any) {
  return (
    <YStack alignItems="center" gap="$2" width="30%">
      <Button circular size="$6" backgroundColor="white" elevation={2} onPress={onPress}>
        <Circle size={40} backgroundColor="$green1">
           <ClipboardList color="$green10" size={24} />
        </Circle>
      </Button>
      <Text fontSize="$2" textAlign="center" numberOfLines={2}>{title}</Text>
    </YStack>
  );
}

