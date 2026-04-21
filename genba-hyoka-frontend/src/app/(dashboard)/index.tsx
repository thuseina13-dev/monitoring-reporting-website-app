import React from 'react';
import { YStack, Text, View } from 'tamagui';
import { PackageOpen } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/authStore';
import { Redirect } from 'expo-router';

export default function DashboardIndex() {
  const { activeRole } = useAuthStore();

  if (activeRole === 'manager') return <Redirect href={"/(dashboard)/manager" as any} />;
  if (activeRole === 'admin' || activeRole === 'super_admin') return <Redirect href={"/(dashboard)/admin" as any} />;
  if (activeRole === 'employee') return <Redirect href={"/(dashboard)/employee" as any} />;

  return (
    <YStack f={1} jc="center" ai="center" p="$4">
      <View 
        bg="$gray2" 
        p="$6" 
        borderRadius="$6" 
        bw={2} 
        borderColor="$gray4" 
        borderStyle="dashed"
        ai="center"
        jc="center"
        w="100%"
        minHeight={300}
      >
        <PackageOpen size={64} color="$gray8" />
        <Text fontSize="$6" fontWeight="bold" mt="$4" color="$gray12" textAlign="center">
          No Modules Configured
        </Text>
        <Text fontSize="$3" color="$gray10" mt="$3" textAlign="center" lineHeight={22}>
          The current workspace requires initial configuration. Select a module from the terminal or contact your system administrator to provision tactical assets.
        </Text>
      </View>
    </YStack>
  );
}
