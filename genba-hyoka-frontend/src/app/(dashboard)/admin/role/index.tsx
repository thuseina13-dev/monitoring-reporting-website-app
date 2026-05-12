import React, { useState } from 'react';
import { YStack, Text, Button, Popover } from 'tamagui';
import { ChevronDown, Check } from '@tamagui/lucide-icons';
import { COLORS } from '../../../../constants/theme';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import RoleCard from '../../../../components/roles/RoleCard';
import { useGetRoles } from '../../../../hooks/roles/useGetRoles';
import { router } from 'expo-router';
import { useDeleteRole } from '../../../../hooks/roles/useDeleteRole';

const roleTypeOptions = [
  { name: 'Semua', type: null },
  { name: 'Administrator', type: 'admin' },
  { name: 'Manager', type: 'manager' },
  { name: 'Pekerja', type: 'employee' },
];

const RoleListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { 
    data, 
    isLoading, 
    isError, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useGetRoles({
    search: searchQuery || undefined,
    type: selectedType || undefined,
    limit: 10,
  });

  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();

  // Gabungkan data dari semua halaman (Infinite Data flattening)
  const roles = data?.pages.flatMap(page => page.data) || [];

  const handleAddRole = () => {
    router.push('/admin/role/create');
  };

  const handleEditRole = (id: string) => {
    router.push(`/admin/role/edit/${id}`);
  };

  const handleDeleteRole = (id: string) => {
    deleteRole(id);
  };

  const currentTypeLabel = roleTypeOptions.find(opt => opt.type === selectedType)?.name || 'Semua';

  const TypeFilter = (
    <Popover placement="bottom-end" size="$2" allowFlip>
      <Popover.Trigger asChild>
        <Button
          backgroundColor="white"
          borderWidth={1}
          borderColor={COLORS.borderLight}
          borderRadius={8}
          paddingHorizontal="$3"
          height={45}
          pressStyle={{ backgroundColor: '$gray2' }}
          iconAfter={<ChevronDown size={18} color={COLORS.textSecondary} />}
        >
          <Text color={COLORS.textMain} fontSize={14}>{currentTypeLabel}</Text>
        </Button>
      </Popover.Trigger>

      <Popover.Content
        borderWidth={1}
        borderColor={COLORS.borderLight}
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        elevate
        padding="$0"
        overflow="hidden"
        width={160}
      >
        <YStack backgroundColor="white">
          {roleTypeOptions.map((opt) => (
            <Button
              key={opt.name}
              size="$4"
              justifyContent="space-between"
              backgroundColor="transparent"
              borderRadius={0}
              borderWidth={0}
              pressStyle={{ backgroundColor: COLORS.bgSoft }}
              onPress={() => setSelectedType(opt.type)}
              paddingHorizontal="$4"
            >
              <Text fontSize={14} color={selectedType === opt.type ? COLORS.primary : COLORS.textMain}>
                {opt.name}
              </Text>
              {selectedType === opt.type && <Check size={16} color={COLORS.primary} />}
            </Button>
          ))}
        </YStack>
      </Popover.Content>
    </Popover>
  );

  return (
    <BaseListScreen
      title="Daftar Role"
      searchPlaceholder="Cari nama role..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && roles.length === 0}
      data={roles}
      onRetry={refetch}
      onAdd={handleAddRole}
      customRightElement={TypeFilter}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      renderItem={(role: any) => (
        <RoleCard
          key={role.id}
          id={role.id}
          name={role.name}
          code={role.code}
          description={role.description}
          isActive={!role.deletedAt}
          type={role.type ? role.type.charAt(0).toUpperCase() + role.type.slice(1) : '-'}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          isDeleting={isDeleting}
        />
      )}
    />
  );
};

export default RoleListPage;
