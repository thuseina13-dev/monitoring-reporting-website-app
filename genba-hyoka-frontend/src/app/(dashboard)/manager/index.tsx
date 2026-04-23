import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Circle, Button } from 'tamagui';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';
import { ClipboardList, Clock, AlertTriangle, TrendingUp, Users, FileText, FileCheck, Star, AlertCircle } from '@tamagui/lucide-icons';
import { COLORS } from '../../../constants/theme';
import { useLogout } from '@/hooks/auth/useLogout';
import { MainDashboardMenu } from '../../../components/dashboard/MainDashboardMenu';

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const managerMenus = MENU_ITEMS.filter(item => (item.requiredRoleValue & ROLE_BIT.MANAGER) !== 0);
  const handleActionLogout = useLogout();
  
  // Icon mapping for better visual representation
  const getIcon = (title: string) => {
    switch (title) {
      case 'Delegasi Tugas': return <Users color={COLORS.primary} size={44} />;
      case 'Template Tugas': return <FileText color={COLORS.primary} size={44} />;
      case 'Template Evaluasi': return <FileCheck color={COLORS.primary} size={44} />;
      case 'Evaluasi': return <Star color={COLORS.primary} size={44} />;
      case 'Laporan Kendala (M)': return <AlertCircle color={COLORS.primary} size={44} />;
      default: return <ClipboardList color={COLORS.primary} size={44} />;
    }
  };

  return (
    <ScrollView flex={1} backgroundColor={COLORS.pageBackground}>
      <YStack padding="$4" gap="$5" minHeight="100%">
        
        {/* Section Menu Utama */}
        <MainDashboardMenu 
          items={managerMenus} 
          getIcon={getIcon} 
          onLogout={handleActionLogout}
          onItemPress={(href) => router.push(href as any)}
        />

        {/* Welcome & Stats Section */}
        <YStack gap="$4">
          <YStack>
            <Text fontSize="$6" fontWeight="800" color={COLORS.textDark}>
              Halo, {user?.fullName.split(' ')[0] || 'User'}!
            </Text>
            <Text fontSize="$3" color={COLORS.textMuted}>
              Semoga harimu produktif dan aman.
            </Text>
          </YStack>

          <XStack gap="$3" justifyContent="space-between">
            <StatCard
              title="Tugas"
              value="12"
              icon={<ClipboardList size={20} color={COLORS.primary} />}
            />
            <StatCard
              title="Pending"
              value="3"
              icon={<Clock size={20} color="#F59E0B" />}
            />
            <StatCard
              title="Kendala"
              value="1"
              icon={<AlertTriangle size={20} color={COLORS.warning} />}
            />
          </XStack>
        </YStack>

        {/* Aktivitas Section */}
        <YStack gap="$3" marginTop="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" fontWeight="bold" color={COLORS.textMuted}>Aktivitas Terkini</Text>
            <Button size="$2" unstyled>
              <Text color={COLORS.primary}>Lihat Semua</Text>
            </Button>
          </XStack>

          <YStack gap="$2">
            {[1, 2].map((i) => (
              <Card key={i} padding="$3" elevation={1} borderRadius="$4" backgroundColor={COLORS.cardBackground}>
                <XStack alignItems="center" gap="$3">
                  <Circle size={40} backgroundColor={COLORS.pageBackground}>
                    <TrendingUp size={20} color={COLORS.primary} />
                  </Circle>
                  <YStack flex={1}>
                    <Text fontWeight="bold" fontSize="$3" color={COLORS.textDark}>Pengecekan Rutin Area A</Text>
                    <Text fontSize="$2" color={COLORS.textMuted}>Oleh: Budi Santoso</Text>
                  </YStack>
                  <Text fontSize="$2" color={COLORS.textMuted}>14:20</Text>
                </XStack>
              </Card>
            ))}
          </YStack>
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





