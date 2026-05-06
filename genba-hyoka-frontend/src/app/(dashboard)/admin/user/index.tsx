import React, { useState } from 'react';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import UserCard from '../../../../components/users/UserCard';
import { useGetUsers } from '../../../../hooks/users/useGetUsers';

const UserListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mengambil data dari API dengan Infinite Query (Cursor-based)
  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useGetUsers({
    search: searchQuery || undefined,
    include: 'roles,company_partner',
    limit: 10,
  });

  // Menggabungkan data dari semua halaman yang sudah diambil
  const users = data?.pages.flatMap(page => page.data) || [];

  const handleAddUser = () => {
    console.log('Navigasi ke halaman tambah user...');
  };

  return (
    <BaseListScreen
      title="Daftar User"
      searchPlaceholder="Cari nama atau perusahaan..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && users.length === 0}
      data={users}
      onRetry={refetch}
      onAdd={handleAddUser}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      renderItem={(user: any) => (
        <UserCard
          key={user.id}
          name={user.fullName}
          role={user.roles?.[0]?.name || 'N/A'}
          company={user.companyPartner?.name || 'N/A'}
          isActive={user.isActive}
          email={user.email}
          phone={user.phoneNo}
          address={user.address}
          onToggleStatus={() => console.log('Toggle status for', user.id)}
          onDelete={() => console.log('Delete user', user.id)}
        />
      )}
    />
  );
};

export default UserListPage;
