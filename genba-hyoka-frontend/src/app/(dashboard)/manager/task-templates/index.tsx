import React, { useState, useMemo } from 'react';
import { Select, Adapt, Sheet } from 'tamagui';
import { Filter, ChevronDown, Check } from '@tamagui/lucide-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { taskDefinitionService } from '../../../../services/api/taskDefinitionService';
import { TemplateCard } from '../../../../components/task-templates/TemplateCard';
import { COLORS } from '../../../../constants/theme';
import { useToastController } from '@tamagui/toast';
import BaseListScreen from '../../../../components/layout/BaseListScreen';

export default function TaskTemplatesListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToastController();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['task-definitions', search, statusFilter],
    queryFn: async ({ pageParam }) => {
      const params: any = { limit: 10 };
      if (pageParam) params.cursor = pageParam;
      if (search) params.search = search;
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
      return taskDefinitionService.getTaskDefinitionsCursor(params);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.next_cursor || undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskDefinitionService.deleteTaskDefinition(id),
    onSuccess: () => {
      toast.show('Berhasil', { message: 'Template berhasil dihapus', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['task-definitions'] });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.show('Gagal', { message: error.response?.data?.message || 'Gagal menghapus template', type: 'error' });
      setDeletingId(null);
    }
  });



  const handleEdit = (id: string) => {
    router.push(`/manager/task-templates/edit/${id}`);
  };

  const handleDeletePress = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const templates = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data || []);
  }, [data]);

  const renderItem = (item: any) => (
    <TemplateCard
      key={item.id}
      template={item}
      onEdit={handleEdit}
      onDelete={handleDeletePress}
      isDeleting={deletingId === item.id && deleteMutation.isPending}
    />
  );

  const FilterElement = (
    <Select value={statusFilter} onValueChange={setStatusFilter} disablePreventBodyScroll>
      <Select.Trigger iconAfter={ChevronDown} width={130} bg={COLORS.inputBackground} bw={1} bc={COLORS.borderLight} h={45}>
        <Filter size={16} color={COLORS.textMuted} mr="$2" />
        <Select.Value placeholder="Status" />
      </Select.Trigger>
      <Adapt when="sm">
        <Sheet modal dismissOnSnapToBottom snapPoints={[30]}>
          <Sheet.Overlay />
          <Sheet.Handle />
          <Sheet.Frame><Sheet.ScrollView><Adapt.Contents /></Sheet.ScrollView></Sheet.Frame>
        </Sheet>
      </Adapt>
      <Select.Content>
        <Select.Viewport>
          <Select.Group>
            <Select.Item index={0} value="all"><Select.ItemText>Semua</Select.ItemText><Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator></Select.Item>
            <Select.Item index={1} value="active"><Select.ItemText>Aktif</Select.ItemText><Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator></Select.Item>
            <Select.Item index={2} value="inactive"><Select.ItemText>Non-aktif</Select.ItemText><Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator></Select.Item>
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select>
  );

  return (
    <BaseListScreen
      title="Daftar Template"
      searchPlaceholder="Cari nama template..."
      searchValue={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && templates.length === 0}
      data={templates}
      onRetry={refetch}
      onAdd={() => router.push('/manager/task-templates/create')}
      customRightElement={FilterElement}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      renderItem={renderItem}
    />
  );
}
