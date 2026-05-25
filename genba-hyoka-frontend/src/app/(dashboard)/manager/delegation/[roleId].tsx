import React, { useState, useMemo, useEffect } from 'react';
import { YStack, XStack, Text, View, Button, Spinner, ScrollView, Input } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Search, Check, AlertCircle } from '@tamagui/lucide-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roleService } from '../../../../services/api/roleService';
import { roleTaskService } from '../../../../services/api/roleTaskService';
import { taskDefinitionService } from '../../../../services/api/taskDefinitionService';
import { COLORS } from '../../../../constants/theme';
import { useToastController } from '@tamagui/toast';

export default function ManageRoleDelegationScreen() {
  const router = useRouter();
  const { roleId } = useLocalSearchParams<{ roleId: string }>();
  const queryClient = useQueryClient();
  const toast = useToastController();

  const [localSearch, setLocalSearch] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // 1. Fetch Role Details and existing role tasks
  const {
    data: roleData,
    isLoading: isLoadingRole,
    isError: isErrorRole,
    refetch: refetchRole,
  } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => roleService.getRoleById(roleId!, { include: 'roleTasks' }),
    enabled: !!roleId,
  });

  // Initialize selectedTaskIds when role details are loaded
  useEffect(() => {
    if (roleData?.data?.roleTasks) {
      const ids = roleData.data.roleTasks.map((rt: any) => rt.taskDefinitionId);
      setSelectedTaskIds(ids);
    }
  }, [roleData]);

  // 2. Fetch all available Task Definitions (Cursor-Based Infinite Query)
  const {
    data: taskDefinitionsData,
    isLoading: isLoadingTaskDefs,
    isError: isErrorTaskDefs,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchTaskDefs,
  } = useInfiniteQuery({
    queryKey: ['task-definitions-cursor', search],
    queryFn: async ({ pageParam }) => {
      const params: any = { limit: 15 };
      if (pageParam) params.cursor = pageParam;
      if (search) params.search = search;
      return taskDefinitionService.getTaskDefinitionsCursor(params);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.next_cursor || undefined,
  });

  // 3. Save bulk update mutation
  const replaceMutation = useMutation({
    mutationFn: (data: { roleId: string; taskDefinitionIds: string[] }) =>
      roleTaskService.replaceBulkRoleTasks(data),
    onSuccess: () => {
      toast.show('Berhasil', { message: 'Delegasi tugas berhasil diperbarui', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-tasks'] });
      router.push('/manager/delegation');
    },
    onError: (error: any) => {
      toast.show('Gagal', {
        message: error.response?.data?.message || 'Gagal memperbarui delegasi tugas',
        type: 'error',
      });
    },
  });

  // Flatten infinite scroll pages to get all task definitions loaded so far
  const taskDefinitions = useMemo(() => {
    if (!taskDefinitionsData) return [];
    return taskDefinitionsData.pages.flatMap((page) => page.data || []);
  }, [taskDefinitionsData]);

  // Active task definitions only
  const activeTaskDefinitions = useMemo(() => {
    return taskDefinitions.filter((td: any) => td.isActive);
  }, [taskDefinitions]);

  // Selection toggle logic
  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Select all / deselect all loaded tasks logic
  const isAllSelected = useMemo(() => {
    if (activeTaskDefinitions.length === 0) return false;
    return activeTaskDefinitions.every((task) => selectedTaskIds.includes(task.id));
  }, [activeTaskDefinitions, selectedTaskIds]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Remove all loaded task IDs
      const loadedIds = activeTaskDefinitions.map((t) => t.id);
      setSelectedTaskIds((prev) => prev.filter((id) => !loadedIds.includes(id)));
    } else {
      // Add all loaded task IDs
      const loadedIds = activeTaskDefinitions.map((t) => t.id);
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...loadedIds])));
    }
  };

  const handleSave = () => {
    if (!roleId) return;
    replaceMutation.mutate({
      roleId: roleId,
      taskDefinitionIds: selectedTaskIds,
    });
  };

  const handleRetry = () => {
    refetchRole();
    refetchTaskDefs();
  };

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoadingRole) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor={COLORS.pageBackground}>
        <Spinner size="large" color={COLORS.primary} />
        <Text mt="$2" color={COLORS.textSecondary}>Memuat data...</Text>
      </YStack>
    );
  }

  if (isErrorRole || !roleData?.data) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor={COLORS.pageBackground} padding="$4">
        <AlertCircle size={48} color={COLORS.danger} />
        <Text color={COLORS.textMain} textAlign="center" mt="$3">Gagal memuat detail peran.</Text>
        <Button backgroundColor={COLORS.primary} mt="$4" onPress={handleRetry}>
          <Text color="white" fontWeight="700">Coba Lagi</Text>
        </Button>
      </YStack>
    );
  }

  const roleName = roleData.data.name;

  return (
    <View flex={1} backgroundColor={COLORS.pageBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          alignItems="center"
          borderBottomWidth={1}
          borderBottomColor={COLORS.borderSeparator}
          backgroundColor="white"
          gap="$3"
        >
          <Button
            size="$3.5"
            circular
            backgroundColor="transparent"
            pressStyle={{ backgroundColor: COLORS.bgSoft }}
            icon={<ChevronLeft size={24} color={COLORS.textMain} />}
            onPress={() => router.push('/manager/delegation')}
          />
          <Text fontSize={18} fontWeight="800" color={COLORS.textMain}>
            Atur Delegasi
          </Text>
        </XStack>

        {/* Pale Green Information Banner */}
        <XStack
          backgroundColor={COLORS.primaryLight}
          paddingHorizontal="$4"
          paddingVertical="$3.5"
          alignItems="center"
          gap="$2"
        >
          <Text fontSize={14} fontWeight="600" color={COLORS.primary} lineHeight={20}>
            Mengatur tugas untuk role:{' '}
            <Text fontWeight="800" color={COLORS.primary}>
              {roleName}
            </Text>
          </Text>
        </XStack>

        {/* Search Bar */}
        <XStack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2">
          <XStack
            flex={1}
            backgroundColor="white"
            borderRadius={8}
            borderWidth={1}
            borderColor={COLORS.borderLight}
            alignItems="center"
            paddingHorizontal="$3"
            height={46}
          >
            <Search size={18} color={COLORS.textSecondary} />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor="transparent"
              placeholder={`Cari dari tugas tersedia...`}
              placeholderTextColor={COLORS.textSecondary as any}
              value={localSearch}
              onChangeText={setLocalSearch}
              height="100%"
              focusStyle={{ borderWidth: 0, outlineWidth: 0 }}
              autoComplete="off"
              name="search-query"
            />
          </XStack>
        </XStack>

        {/* List Header Selection Info */}
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$2"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize={14} fontWeight="700" color={COLORS.textMain}>
            {selectedTaskIds.length} Tugas Terpilih
          </Text>
          {activeTaskDefinitions.length > 0 && (
            <Button
              pressStyle={{ opacity: 0.7 }}
              onPress={handleSelectAll}
            >
              <Text fontSize={14} fontWeight="700" color={COLORS.primary}>
                {isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </Text>
            </Button>
          )}
        </XStack>

        {/* Scrollable Task Checkbox List */}
        <ScrollView
          flex={1}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {isLoadingTaskDefs && activeTaskDefinitions.length === 0 ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$3">
              <Spinner size="large" color={COLORS.primary} />
              <Text color={COLORS.textSecondary}>Memuat daftar tugas...</Text>
            </YStack>
          ) : isErrorTaskDefs ? (
            <YStack padding="$10" alignItems="center" justifyContent="center" gap="$3">
              <AlertCircle size={36} color={COLORS.danger} />
              <Text color={COLORS.textMain} textAlign="center">Gagal memuat tugas.</Text>
              <Button backgroundColor={COLORS.primary} size="$3" onPress={handleRetry}>
                <Text color="white" fontWeight="700">Coba Lagi</Text>
              </Button>
            </YStack>
          ) : activeTaskDefinitions.length === 0 ? (
            <YStack padding="$10" alignItems="center" justifyContent="center">
              <Text color={COLORS.textSecondary} textAlign="center" fontStyle="italic">
                Tidak ada template tugas aktif tersedia.
              </Text>
            </YStack>
          ) : (
            <YStack gap="$3">
              {activeTaskDefinitions.map((task: any) => {
                const isChecked = selectedTaskIds.includes(task.id);
                return (
                  <XStack
                    key={task.id}
                    alignItems="center"
                    justifyContent="space-between"
                    padding="$4"
                    borderRadius={12}
                    borderWidth={1.5}
                    borderColor={isChecked ? COLORS.primary : COLORS.borderLight}
                    backgroundColor={isChecked ? COLORS.primaryLight : 'white'}
                    onPress={() => handleToggleTask(task.id)}
                    pressStyle={{ opacity: 0.8 }}
                    gap="$3"
                    elevation={0.5}
                  >
                    <YStack flex={1} gap="$1">
                      <Text fontSize={15} fontWeight="700" color={COLORS.textMain}>
                        {task.name}
                      </Text>
                      {task.description && (
                        <Text fontSize={13} color={COLORS.textSecondary} numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}
                    </YStack>
                    <View
                      width={24}
                      height={24}
                      borderRadius={6}
                      borderWidth={2}
                      borderColor={isChecked ? COLORS.primary : COLORS.borderLight}
                      backgroundColor={isChecked ? COLORS.primary : 'white'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      {isChecked && (
                        <Check color="white" size={14} strokeWidth={3} />
                      )}
                    </View>
                  </XStack>
                );
              })}

              {isFetchingNextPage && (
                <YStack padding="$4" alignItems="center">
                  <Spinner color={COLORS.primary} />
                </YStack>
              )}
            </YStack>
          )}
        </ScrollView>

        {/* Fixed Footer */}
        <XStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          backgroundColor="white"
          borderTopWidth={1}
          borderTopColor={COLORS.borderSeparator}
          padding="$4"
          justifyContent="space-between"
          gap="$3"
          elevation={10}
        >
          <Button
            flex={1}
            variant="outlined"
            borderColor={COLORS.borderLight}
            backgroundColor="white"
            height={46}
            borderRadius={8}
            disabled={replaceMutation.isPending}
            onPress={() => router.push('/manager/delegation')}
          >
            <Text color={COLORS.textMain} fontWeight="700">
              Batal
            </Text>
          </Button>

          <Button
            flex={1.2}
            backgroundColor={COLORS.primary}
            height={46}
            borderRadius={8}
            disabled={replaceMutation.isPending}
            pressStyle={{ opacity: 0.85 }}
            onPress={handleSave}
          >
            {replaceMutation.isPending ? (
              <Spinner size="small" color="white" />
            ) : (
              <Text color="white" fontWeight="700">
                Simpan Delegasi
              </Text>
            )}
          </Button>
        </XStack>
      </SafeAreaView>
    </View>
  );
}
