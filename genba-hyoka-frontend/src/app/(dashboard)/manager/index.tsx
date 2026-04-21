import React from 'react';
import { View, Text, YStack, XStack, ScrollView, Card, Circle, Button, Image } from 'tamagui';
import { useAuthStore } from '../../../store/authStore';
import { MENU_ITEMS, ROLE_BIT } from '../../../config/menu';
import { useRouter } from 'expo-router';
import { User, ClipboardList, AlertCircle, TrendingUp, Clock, AlertTriangle } from '@tamagui/lucide-icons';

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const managerMenus = MENU_ITEMS.filter(item => (item.requiredRoleValue & ROLE_BIT.MANAGER) !== 0);

  return (
    <ScrollView flex={1} backgroundColor="#F8FAFC">
      <YStack padding="$4" gap="$5">
        {/* Welcome Section */}
        <YStack>
          <Text fontSize="$6" fontWeight="800" color="$gray12">
            Halo, {user?.fullName.split(' ')[0] || 'User'}!
          </Text>
          <Text fontSize="$3" color="$gray10">
            Semoga harimu produktif dan aman.
          </Text>
        </YStack>

        {/* Stats Section */}
        <XStack gap="$3" justifyContent="space-between">
          <StatCard 
            title="Tugas" 
            value="12" 
            subtitle="Hari ini" 
            icon={<ClipboardList size={20} color="#10B981" />}
            color="#10B981"
          />
          <StatCard 
            title="Pending" 
            value="3" 
            subtitle="Butuh review" 
            icon={<Clock size={20} color="#F59E0B" />}
            color="#F59E0B"
          />
          <StatCard 
            title="Kendala" 
            value="1" 
            subtitle="Kritis" 
            icon={<AlertTriangle size={20} color="#EF4444" />}
            color="#EF4444"
          />
        </XStack>

        {/* Menu Grid */}
        <YStack gap="$4">
          <Text fontSize="$4" fontWeight="bold" color="$gray11">Layanan Utama</Text>
          <XStack flexWrap="wrap" gap="$3" justifyContent="flex-start">
            {managerMenus.map((item) => (
              <MenuIcon 
                key={item.title} 
                title={item.title} 
                icon={item.icon} 
                onPress={() => router.push(item.href as any)} 
              />
            ))}
          </XStack>
        </YStack>

        {/* Task List Placeholder */}
        <YStack gap="$3" marginTop="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" fontWeight="bold" color="$gray11">Aktivitas Terkini</Text>
            <Button size="$2" unstyled>
              <Text color="$green10">Lihat Semua</Text>
            </Button>
          </XStack>
          
          <YStack gap="$2">
            {[1, 2].map((i) => (
              <Card key={i} padding="$3" elevation={2} borderRadius="$4" backgroundColor="white">
                <XStack alignItems="center" gap="$3">
                  <Circle size={40} backgroundColor="$green2">
                    <TrendingUp size={20} color="$green10" />
                  </Circle>
                  <YStack flex={1}>
                    <Text fontWeight="bold" fontSize="$3">Pengecekan Rutin Area A</Text>
                    <Text fontSize="$2" color="$gray10">Oleh: Budi Santoso</Text>
                  </YStack>
                  <Text fontSize="$2" color="$gray9">14:20</Text>
                </XStack>
              </Card>
            ))}
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  return (
    <Card flex={1} padding="$3" elevation={1} borderRadius="$4" backgroundColor="white" borderLeftWidth={4} borderLeftColor={color}>
      <YStack gap="$1">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$2" color="$gray10" fontWeight="bold">{title}</Text>
          {icon}
        </XStack>
        <Text fontSize="$7" fontWeight="bold">{value}</Text>
        <Text fontSize="$1" color="$gray8">{subtitle}</Text>
      </YStack>
    </Card>
  );
}

function MenuIcon({ title, icon, onPress }: any) {
  return (
    <YStack alignItems="center" gap="$2" width="30%">
      <Button 
        onPress={onPress}
        circular 
        size="$6" 
        backgroundColor="white" 
        elevation={2}
        padding={0}
        borderWidth={1}
        borderColor="$gray3"
        pressStyle={{ scale: 0.95, backgroundColor: '$gray1' }}
      >
        <View padding="$3" alignItems="center" justifyContent="center">
           <Circle size={40} backgroundColor="$green1" alignItems="center" justifyContent="center">
              <ClipboardList color="$green10" size={24} />
           </Circle>
        </View>
      </Button>
      <Text fontSize="$2" textAlign="center" fontWeight="500" color="$gray11" numberOfLines={2}>
        {title}
      </Text>
    </YStack>
  );
}

