import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Circle, Button } from 'tamagui';
import { useWindowDimensions } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';
import { LogOut, ClipboardList, Clock, AlertTriangle, TrendingUp, Users, FileText, FileCheck, Star, AlertCircle } from '@tamagui/lucide-icons';
import { storage } from '../../../utils/storage';
import { authService } from '../../../services/api/authService';
import { COLORS } from '../../../constants/theme';
import { useLogout } from '@/hooks/auth/useLogout';

export default function ManagerDashboard() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const numColumns = isMobile ? 4 : 8;
  const itemWidth = isMobile ? '23%' : '11%';

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
        {/* Welcome Section */}
        <YStack>
          <Text fontSize="$6" fontWeight="800" color={COLORS.textDark}>
            Halo, {user?.fullName.split(' ')[0] || 'User'}!
          </Text>
          <Text fontSize="$3" color={COLORS.textMuted}>
            Semoga harimu produktif dan aman.
          </Text>
        </YStack>

        {/* Stats Section */}
        <XStack gap="$2" justifyContent="space-between">
          <StatCard
            title="Tugas"
            value="12"
            icon={<ClipboardList size={18} color={COLORS.primary} />}
            color={COLORS.primary}
          />
          <StatCard
            title="Pending"
            value="3"
            icon={<Clock size={18} color="#F59E0B" />}
            color="#F59E0B"
          />
          <StatCard
            title="Kendala"
            value="1"
            icon={<AlertTriangle size={18} color={COLORS.warning} />}
            color={COLORS.warning}
          />
        </XStack>

        {/* Section Menu Utama - Boxes Grid (10 Columns) */}
        <YStack backgroundColor={COLORS.cardBackground} padding="$4" borderRadius="$5" elevation={2} gap="$3">
          <Text fontSize="$4" fontWeight="bold" color={COLORS.textDark}>MENU UTAMA</Text>

          <XStack flexWrap="wrap" rowGap="$4" justifyContent="space-between">
            {managerMenus.map((item) => (
              <MenuIcon
                key={item.title}
                title={item.title}
                icon={getIcon(item.title)}
                onPress={() => router.push(item.href as any)}
                itemWidth={itemWidth}
              />
            ))}
            {/* Fill empty spots */}
            {[...Array(numColumns - (managerMenus.length % numColumns || numColumns))].map((_, i) => (
              <View key={`empty-${i}`} width={itemWidth} />
            ))}
          </XStack>

          {/* Logout Footer Button with Text */}
          <XStack justifyContent="flex-end" marginTop="$2">
            <Button
              size="$3"
              backgroundColor="transparent"
              icon={<LogOut color={COLORS.warning} size={18} />}
              onPress={handleActionLogout}
              borderWidth={0}
              pressStyle={{ backgroundColor: '$red2', opacity: 0.7 }}
            >
              <Text color={COLORS.warning} fontWeight="800" fontSize="$2">LOGOUT</Text>
            </Button>
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

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card f={1} padding="$2" elevation={1} borderRadius="$4" backgroundColor={COLORS.cardBackground} borderLeftWidth={4} borderLeftColor={color}>
      <YStack gap="$1" ai="center">
        <XStack gap="$2" alignItems="center">
          {icon}
          <Text fontSize="$1" color={COLORS.textMuted} fontWeight="bold">{title}</Text>
        </XStack>
        <Text fontSize="$5" fontWeight="bold" color={COLORS.textDark}>{value}</Text>
      </YStack>
    </Card>
  );
}

function MenuIcon({ title, icon, onPress, itemWidth }: any) {
  return (
    <YStack
      onPress={onPress}
      width={itemWidth}
      backgroundColor={COLORS.pageBackground}
      borderRadius="$3"
      alignItems="center"
      justifyContent="center"
      elevation={1}
      pressStyle={{ scale: 0.9, backgroundColor: COLORS.inputBackground }}
      paddingVertical="$3"
      paddingHorizontal="$1"
      minHeight={90}
      gap="$2"
    >
      <View>
        {icon}
      </View>
      <Text
        fontSize="$1"
        textAlign="center"
        fontWeight="800"
        color={COLORS.textDark}
        numberOfLines={2}
      >
        {title}
      </Text>
    </YStack>
  );
}





