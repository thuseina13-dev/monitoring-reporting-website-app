import React from 'react';
import { View, ScrollView, XStack, YStack, Input, Spinner, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, AlertCircle } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';
import ListHeader from './ListHeader';
import FloatingActionButton from './FloatingActionButton';

interface BaseListScreenProps<T> {
  title: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  data: T[];
  onRetry: () => void;
  onAdd?: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
}

function BaseListScreen<T>({
  title,
  searchPlaceholder = 'Cari...',
  searchValue,
  onSearchChange,
  isLoading,
  isError,
  isEmpty,
  data,
  onRetry,
  onAdd,
  renderItem,
  emptyMessage = 'Tidak ada data ditemukan.',
  errorMessage = 'Terjadi kesalahan saat mengambil data dari server.',
}: BaseListScreenProps<T>) {
  return (
    <View flex={1} backgroundColor={COLORS.pageBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <ListHeader title={title} />
        
        {/* Search Bar Container */}
        <View paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2">
          <XStack 
            backgroundColor="white" 
            borderRadius={8} 
            borderWidth={1} 
            borderColor={COLORS.borderLight} 
            alignItems="center" 
            paddingHorizontal="$3"
          >
            <Search size={20} color={COLORS.textSecondary} />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor="transparent"
              placeholder={searchPlaceholder}
              placeholderTextColor={COLORS.textSecondary as any}
              value={searchValue}
              onChangeText={onSearchChange}
              height={45}
              focusStyle={{ borderWidth: 0, outlineWidth: 0 }}
            />
          </XStack>
        </View>
        
        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$4">
              <Spinner size="large" color={COLORS.primary} />
              <Text color={COLORS.textSecondary}>Memuat data...</Text>
            </YStack>
          ) : isError ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$4">
              <AlertCircle size={40} color={COLORS.warning} />
              <Text color={COLORS.textMain} fontWeight="bold">Gagal memuat data</Text>
              <Text color={COLORS.textSecondary} textAlign="center">
                {errorMessage}
              </Text>
              <View 
                onPress={onRetry} 
                backgroundColor={COLORS.primary} 
                paddingHorizontal="$4" 
                paddingVertical="$2" 
                borderRadius="$2"
                marginTop="$2"
              >
                <Text color="white" fontWeight="600">Coba Lagi</Text>
              </View>
            </YStack>
          ) : isEmpty ? (
            <YStack padding="$10" alignItems="center" justifyContent="center">
              <Text color={COLORS.textSecondary}>{emptyMessage}</Text>
            </YStack>
          ) : (
            <YStack gap="$5">
              {data.map((item, index) => renderItem(item, index))}
            </YStack>
          )}
        </ScrollView>

        {onAdd && <FloatingActionButton onPress={onAdd} />}
      </SafeAreaView>
    </View>
  );
}

export default BaseListScreen;
