import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Button } from 'tamagui';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';

import { Users, Activity, BadgeCheck, Building2, Settings } from '@tamagui/lucide-icons';
import { COLORS } from '../../../constants/theme';
import { useLogout } from '@/hooks/auth/useLogout';
import { MainDashboardMenu } from '../../../components/dashboard/MainDashboardMenu';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const adminMenus = MENU_ITEMS.filter(item => (item.requiredRoleValue & ROLE_BIT.ADMIN) !== 0);
  const handleActionLogout = useLogout();
  
  const getIcon = (title: string) => {
    switch (title) {
      case 'ROLE': return <BadgeCheck color={COLORS.info} size={44} />;
      case 'USER': return <Users color={COLORS.info} size={44} />;
      case 'PROFIL PERUSAHAAN': return <Building2 color={COLORS.info} size={44} />;
      default: return <Settings color={COLORS.info} size={44} />;
    }
  };

  return (
    <ScrollView flex={1} backgroundColor={COLORS.pageBackground}>
      <YStack padding="$4" gap="$5" minHeight="100%">
        
        {/* Section Menu Utama */}
        <MainDashboardMenu 
          items={adminMenus} 
          getIcon={getIcon} 
          onLogout={handleActionLogout}
          onItemPress={(href) => router.push(href as any)}
        />

        {/* Panel Administrator */}
        <YStack gap="$4" marginTop="$2">
          <YStack>
            <Text fontSize="$6" fontWeight="800" color={COLORS.textDark}>Panel Administrator</Text>
            <Text fontSize="$3" color={COLORS.textMuted}>Pengaturan sistem dan manajemen pengguna.</Text>
          </YStack>

          <XStack gap="$3" justifyContent="space-between">
            <StatCard title="Total User" value="150" icon={<Users size={20} color={COLORS.info} />} />
            <StatCard title="Sistem" value="99%" icon={<Activity size={20} color={COLORS.primary} />} />
          </XStack>
        </YStack>

        {/* Security Section */}
        <YStack gap="$4">
          <Text fontSize="$4" fontWeight="bold" color={COLORS.textMuted}>KEAMANAN</Text>
          <Card padding="$4" backgroundColor={COLORS.cardBackground} elevation={1} borderRadius="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$3" alignItems="center">
                <BadgeCheck color={COLORS.warning} size={24} />
                <Text fontWeight="600" color={COLORS.textDark}>Audit Log Terakhir</Text>
              </XStack>
              <Button size="$2" unstyled>
                <Text color={COLORS.info}>Lihat</Text>
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
    <Card flex={1} padding="$4" elevation={1} borderRadius="$4" backgroundColor={COLORS.cardBackground} alignItems="center">
      {icon}
      <Text fontSize="$8" fontWeight="bold" marginTop="$2" color={COLORS.textDark}>{value}</Text>
      <Text fontSize="$2" color={COLORS.textMuted}>{title}</Text>
    </Card>
  );
}




