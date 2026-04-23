import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Button, useToastController } from 'tamagui';
import { useWindowDimensions } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';

import { LogOut, ClipboardList, AlertTriangle, CheckSquare } from '@tamagui/lucide-icons';
import { storage } from '../../../utils/storage';
import { authService } from '../../../services/api/authService';
import { COLORS } from '../../../constants/theme';
import { useLogout } from '@/hooks/auth/useLogout';

export default function EmployeeDashboard() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const numColumns = isMobile ? 4 : 8;
  const itemWidth = isMobile ? '23%' : '11%';
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
        <YStack>
          <Text fontSize="$6" fontWeight="800" color={COLORS.textDark}>Halo, {user?.fullName.split(' ')[0]}!</Text>
          <Text fontSize="$3" color={COLORS.textMuted}>Sudahkah Anda mengecek tugas hari ini?</Text>
        </YStack>

        <XStack gap="$3" justifyContent="space-between">
          <StatCard title="Tugas Aktif" value="5" color={COLORS.primary} />
          <StatCard title="Selesai" value="8" color={COLORS.info} />
        </XStack>

        {/* Section Menu Utama - Square Grid (10 Columns) */}
        <YStack backgroundColor={COLORS.cardBackground} padding="$4" borderRadius="$5" elevation={2} gap="$3">
          <Text fontSize="$4" fontWeight="bold" color={COLORS.textDark}>MENU UTAMA</Text>
          
          <XStack flexWrap="wrap" rowGap="$4" justifyContent="space-between">
            {employeeMenus.map((item) => (
              <MenuIcon 
                key={item.title} 
                title={item.title} 
                icon={getIcon(item.title)}
                onPress={() => router.push(item.href as any)} 
                itemWidth={itemWidth}
              />
            ))}
            {/* Fill empty spots */}
            {[...Array(numColumns - (employeeMenus.length % numColumns || numColumns))].map((_, i) => (
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

        <Card padding="$4" backgroundColor={COLORS.primary} borderRadius="$5" marginTop="$4">
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

function StatCard({ title, value, color }: any) {
  return (
    <Card flex={1} padding="$3" elevation={1} borderRadius="$4" backgroundColor={COLORS.cardBackground}>
      <YStack alignItems="center">
        <Text fontSize="$2" color={COLORS.textMuted}>{title}</Text>
        <Text fontSize="$7" fontWeight="bold" color={color}>{value}</Text>
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









