import React from 'react';
import { YStack, Text, View } from 'tamagui';
import { PackageOpen } from '@tamagui/lucide-icons';

export default function AdminDashboard() {
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
