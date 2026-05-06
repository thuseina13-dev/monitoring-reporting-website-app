import React, { useState } from 'react';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import UserCard from '../../../../components/users/UserCard';
import { useGetUsers } from '../../../../hooks/users/useGetUsers';

const UserListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data dari API dengan include company_partner
  const { data, isLoading, isError, refetch } = useGetUsers({
    include: 'roles,company_partner',
    search: searchQuery, // Menggunakan pencarian server-side
  });

  const handleAddUser = () => {
    console.log('Add user pressed');
  };

  const users = data?.data || [];

  return (
    <BaseListScreen
      title="Daftar User"
      searchPlaceholder="Cari nama atau perusahaan..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoading}
      isError={isError}
      isEmpty={users.length === 0}
      data={users}
      onRetry={refetch}
      onAdd={handleAddUser}
      renderItem={(user: any) => (
        <UserCard
          key={user.id}
          name={user.fullName}
          role={user.roles?.[0]?.name || 'No Role'}
          company={user.companyPartner?.name || 'No Company'}
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
