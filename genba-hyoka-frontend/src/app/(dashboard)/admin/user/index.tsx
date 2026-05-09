import React, { useState } from 'react';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import UserCard from '../../../../components/users/UserCard';
import { useGetUsers } from '../../../../hooks/users/useGetUsers';
import { ChangePasswordModal } from '../../../../components/auth/ChangePasswordModal';
import { useAuthStore } from '../../../../store/authStore';
import { Button, XStack, Text } from 'tamagui';
import { Key } from '@tamagui/lucide-icons';
import { COLORS } from '../../../../constants/theme';

const UserListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<{ id: string; name: string } | null>(null);
  const { user, activeRole } = useAuthStore() as any;

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

  // Check if current user is Super Admin or Admin (based on ROLE_BIT or role type)
  // According to Issue #66: "Tombol/Pemicu pop-up hanya terlihat dan bisa diklik oleh role Super User"
  const isSuperUser = activeRole === 'sup' || activeRole === 'adm';

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
            onToggleStatus={() => console.log('Toggle status for', userItem.id)}
            onDelete={() => console.log('Delete user', userItem.id)}
            onResetPassword={(id) => {
              setTargetUser({ id, name: userItem.fullName });
              setIsChangePasswordOpen(true);
            }}
          />
        )}
      />

      {/* Floating Action Button for Change Password (specific for Super User as per requirement) */}
      {isSuperUser && (
        <XStack 
          position="absolute" 
          bottom={100} 
          right={20} 
          gap="$2"
        >
          <Button
            size="$4"
            circular
            backgroundColor={COLORS.primary}
            elevation={5}
            onPress={() => {
              setTargetUser(null);
              setIsChangePasswordOpen(true);
            }}
            icon={<Key color="white" size={20} />}
          />
        </XStack>
      )}

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
