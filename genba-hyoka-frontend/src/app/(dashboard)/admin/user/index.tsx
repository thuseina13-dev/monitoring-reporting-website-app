import React, { useState } from 'react';
import { router } from 'expo-router';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import UserCard from '../../../../components/users/UserCard';
import { useGetUsers } from '../../../../hooks/users/useGetUsers';
import { ChangePasswordModal } from '../../../../components/auth/ChangePasswordModal';
import { useDeleteUser } from '../../../../hooks/users/useDeleteUser';
import { useUpdateUser } from '../../../../hooks/users/useUpdateUser';

const UserListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<{ id: string; name: string } | null>(null);

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

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
    router.push('/admin/user/create');
  };
  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    updateUser({ id, data: { isActive: !currentStatus } });
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
  };

  return (
    <>
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
        renderItem={(userItem: any) => (
          <UserCard
            key={userItem.id}
            id={userItem.id}
            name={userItem.fullName}
            role={userItem.roles?.[0]?.name || 'N/A'}
            company={userItem.companyPartner?.name || 'N/A'}
            isActive={userItem.isActive}
            email={userItem.email}
            phone={userItem.phoneNo}
            address={userItem.address}
            onToggleStatus={() => handleToggleStatus(userItem.id, userItem.isActive)}
            onDelete={() => handleDeleteUser(userItem.id)}
            isDeleting={isDeleting}
            isUpdating={isUpdating}
            onResetPassword={(id) => {
              setTargetUser({ id, name: userItem.fullName });
              setIsChangePasswordOpen(true);
            }}
          />
        )}
      />


      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => {
          setIsChangePasswordOpen(false);
          setTargetUser(null);
        }}
        targetUserId={targetUser?.id}
        targetUserName={targetUser?.name}
      />
    </>
  );
};

export default UserListPage;
