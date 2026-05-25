// Force re-bundle trigger
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { roleService } from '../../../../services/api/roleService';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import { DelegationCard } from '../../../../components/roles/DelegationCard';

export default function DelegationListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Fetch Roles (Filtered server-side to 'employee', with client-side query matching, including roleTasks rel!)
  const {
    data: rolesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['roles', 'employee', search],
    queryFn: () =>
      roleService.getRolesCursor({
        type: 'employee',
        search,
        include: 'roleTasks',
        limit: 15,
      }),
  });

  const roles = rolesData?.data || [];

  return (
    <BaseListScreen
      title="Delegasi Tugas"
      searchPlaceholder="Cari nama role karyawan..."
      searchValue={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && roles.length === 0}
      data={roles}
      onRetry={refetch}
      renderItem={(role: any) => (
        <DelegationCard
          key={role.id}
          role={role}
          assignedTasks={role.roleTasks || []}
          onManage={(r) => router.push(`/manager/delegation/${r.id}`)}
        />
      )}
    />
  );
}
