import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Button } from 'tamagui';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';

import { ClipboardList, AlertTriangle, CheckSquare } from '@tamagui/lucide-icons';
import { COLORS } from '../../../constants/theme';
import { useLogout } from '@/hooks/auth/useLogout';
import { MainDashboardMenu } from '../../../components/dashboard/MainDashboardMenu';

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const employeeMenus = MENU_ITEMS.filter(item => (item.requiredRoleValue & ROLE_BIT.EMPLOYEE) !== 0);
  const handleActionLogout = useLogout();

  const getIcon = (title: string) => {
    switch (title) {
      case 'Daftar Tugas': return <ClipboardList color={COLORS.primary} size={44} />;
      case 'Laporan Kendala': return <AlertTriangle color={COLORS.primary} size={44} />;
      case 'Daftar Evaluasi': return <CheckSquare color={COLORS.primary} size={44} />;
      default: return <ClipboardList color={COLORS.primary} size={44} />;
    }
  };

  return (
    <ScrollView flex={1} backgroundColor={COLORS.pageBackground}>
      <YStack padding="$4" gap="$5" minHeight="100%">
        
        {/* Section Menu Utama */}
        <MainDashboardMenu 
          items={employeeMenus} 
          getIcon={getIcon} 
          onLogout={handleActionLogout}
          onItemPress={(href) => router.push(href as any)}
        />

        {/* Welcome & Stats Section */}
        <YStack gap="$4">
          <YStack>
            <Text fontSize="$6" fontWeight="800" color={COLORS.textDark}>Halo, {user?.fullName.split(' ')[0]}!</Text>
            <Text fontSize="$3" color={COLORS.textMuted}>Sudahkah Anda mengecek tugas hari ini?</Text>
          </YStack>

          <XStack gap="$3" justifyContent="space-between">
            <StatCard title="Tugas Aktif" value="5" icon={<ClipboardList size={20} color={COLORS.primary} />} />
            <StatCard title="Selesai" value="8" icon={<CheckSquare size={20} color={COLORS.info} />} />
          </XStack>
        </YStack>

        {/* Promo/Help Card */}
        <Card padding="$4" backgroundColor={COLORS.primary} borderRadius="$5" marginTop="$2">
          <XStack alignItems="center" gap="$4">
            <YStack flex={1}>
              <Text color={COLORS.textLight} fontWeight="bold" fontSize="$5">Butuh Bantuan?</Text>
              <Text color={COLORS.textLight} opacity={0.8} fontSize="$2">Laporkan kendala lapangan segera.</Text>
            </YStack>
            <Button size="$3" borderRadius="$4" backgroundColor={COLORS.cardBackground}>
              <Text color={COLORS.primary} fontWeight="bold">Lapor</Text>
            </Button>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card flex={1} padding="$4" elevation={1} borderRadius="$4" backgroundColor={COLORS.cardBackground} alignItems="center">
      {icon}
      <Text fontSize="$8" fontWeight="bold" marginTop="$2" color={COLORS.textDark}>{value}</Text>
      <Text fontSize="$2" color={COLORS.textMuted}>{title}</Text>
    </Card>
  );
}


