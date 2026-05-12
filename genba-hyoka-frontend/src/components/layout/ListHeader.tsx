import React from 'react';
import { XStack, Text, Button } from 'tamagui';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/theme';

interface HeaderProps {
  title: string;
}

const ListHeader: React.FC<HeaderProps> = ({ title }) => {
  const router = useRouter();

  return (
    <XStack
      backgroundColor={COLORS.cardBackground}
      paddingVertical="$4"
      paddingHorizontal="$4"
      alignItems="center"
      justifyContent="space-between"
      borderBottomWidth={1}
      borderBottomColor={COLORS.borderLight}
    >
      <Button
        icon={<ArrowLeft size={24} color={COLORS.textMain} />}
        circular
        width={40}
        height={40}
        backgroundColor="transparent"
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(dashboard)'); // Kembali ke halaman utama dashboard jika tidak ada riwayat
          }
        }}
        padding={0}
      />
      
      <Text
        fontSize={18}
        fontWeight="bold"
        color={COLORS.textMain}
        flex={1}
        textAlign="center"
      >
        {title}
      </Text>

      <XStack width={40} />
    </XStack>
  );
};

export default ListHeader;
