import React, { useState, useEffect } from 'react';
import { View, ScrollView, XStack, YStack, Input, Spinner, Text, Button } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, AlertCircle, Plus } from '@tamagui/lucide-icons';
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
  customRightElement?: React.ReactNode;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
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
  customRightElement,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: BaseListScreenProps<T>) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Debounce logic: Update parent search value after 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch]);

  // Sync internal state if external searchValue changes (e.g. cleared from parent)
  useEffect(() => {
    if (searchValue !== localSearch) {
      setLocalSearch(searchValue);
    }
  }, [searchValue]);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    
    if (isCloseToBottom && hasNextPage && !isFetchingNextPage && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <View flex={1} backgroundColor={COLORS.pageBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <ListHeader title={title} />
        
        {/* Search Bar Container */}
        <XStack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2" gap="$2">
          <XStack 
            flex={1}
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
              value={localSearch}
              onChangeText={setLocalSearch}
              height={45}
              focusStyle={{ borderWidth: 0, outlineWidth: 0 }}
            />
          </XStack>
          {customRightElement}
        </XStack>
        
        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {isLoading && data.length === 0 ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$4">
              <Spinner size="large" color={COLORS.primary} />
              <Text color={COLORS.textSecondary}>Memuat data...</Text>
            </YStack>
          ) : isError ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$4">
              <AlertCircle size={48} color={COLORS.danger} />
              <Text color={COLORS.textMain} textAlign="center">{errorMessage}</Text>
              <Button 
                backgroundColor={COLORS.primary} 
                onPress={onRetry}
                pressStyle={{ opacity: 0.8 }}
              >
                <Text color="white" fontWeight="700">Coba Lagi</Text>
              </Button>
            </YStack>
          ) : isEmpty ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$2">
              <Text color={COLORS.textSecondary} textAlign="center">{emptyMessage}</Text>
            </YStack>
          ) : (
            <YStack gap="$3">
              {data.map((item, index) => renderItem(item, index))}
              
              {isFetchingNextPage && (
                <YStack padding="$4" alignItems="center">
                  <Spinner color={COLORS.primary} />
                </YStack>
              )}
            </YStack>
          )}
        </ScrollView>
        
        {onAdd && <FloatingActionButton onPress={onAdd} />}
      </SafeAreaView>
    </View>
  );
}

export default BaseListScreen;
