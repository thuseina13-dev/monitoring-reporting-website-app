import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Circle, Button, useToastController } from 'tamagui';
import { useWindowDimensions } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';

import { LogOut, Users, Shield, Settings, Activity, BadgeCheck, Building2 } from '@tamagui/lucide-icons';
import { storage } from '../../../utils/storage';
import { authService } from '../../../services/api/authService';
import { COLORS } from '../../../constants/theme';

export default function AdminDashboard() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const numColumns = isMobile ? 4 : 8;
  const itemWidth = isMobile ? '23%' : '11%';

  const toast = useToastController();

  const handleLogout = async () => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      const msg = `Sampai jumpa, ${user?.fullName}`;
      await clearAuth();
      router.replace({ pathname: '/(auth)/login', params: { logout: msg } });
    } catch (error) {
      console.error('Logout API failed:', error);
    }
  };

  const adminMenus = MENU_ITEMS.filter(item => (item.requiredRoleValue & ROLE_BIT.ADMIN) !== 0);

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
        <YStack backgroundColor={COLORS.cardBackground} padding="$4" borderRadius="$5" elevation={2} gap="$3">
          <Text fontSize="$4" fontWeight="bold" color={COLORS.textDark}>MENU UTAMA</Text>
          
          <XStack flexWrap="wrap" rowGap="$4" justifyContent="space-between">
            {adminMenus.map((item) => (
              <MenuIcon 
                key={item.title} 
                title={item.title} 
                icon={getIcon(item.title)}
                onPress={() => router.push(item.href as any)} 
                itemWidth={itemWidth}
              />
            ))}
            {/* Fill empty spots with grid columns */}
            {[...Array(numColumns - (adminMenus.length % numColumns || numColumns))].map((_, i) => (
              <View key={`empty-${i}`} width={itemWidth} />
            ))}
          </XStack>

          {/* Logout Footer Button with Text */}
          <XStack justifyContent="flex-end" marginTop="$2">
            <Button 
               size="$3" 
               backgroundColor="transparent" 
               icon={<LogOut color={COLORS.warning} size={18} />} 
               onPress={handleLogout}
               borderWidth={0}
               pressStyle={{ backgroundColor: '$red2', opacity: 0.7 }}
            >
              <Text color={COLORS.warning} fontWeight="800" fontSize="$2">LOGOUT</Text>
            </Button>
          </XStack>
        </YStack>

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
                <Shield color={COLORS.warning} size={24} />
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




