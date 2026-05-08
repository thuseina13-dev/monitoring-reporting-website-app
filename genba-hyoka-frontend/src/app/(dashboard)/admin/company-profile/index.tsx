import React, { useState } from 'react';
import { AlertDialog, Button, YStack, XStack, Text } from 'tamagui';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import CompanyCard from '../../../../components/companies/CompanyCard';
import { useGetCompanies } from '../../../../hooks/companies/useGetCompanies';
import { useDeleteCompany } from '../../../../hooks/companies/useDeleteCompany';
import { router } from 'expo-router';
import { COLORS } from '../../../../constants/theme';

const CompanyListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  
  const { mutate: deleteCompany } = useDeleteCompany();

  // Mengambil data dari API dengan Infinite Query (Cursor-based)
  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useGetCompanies({
    search: searchQuery || undefined,
    limit: 10,
  });

  // Menggabungkan data dari semua halaman yang sudah diambil
  const companies = data?.pages.flatMap(page => page.data) || [];

  const handleAddCompany = () => {
    router.push('/(dashboard)/admin/company-profile/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/(dashboard)/admin/company-profile/edit/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteDialog.id) {
      deleteCompany(deleteDialog.id);
    }
    setDeleteDialog({ isOpen: false, id: null });
  };

  return (
    <>
      <BaseListScreen
        title="Daftar Perusahaan"
        searchPlaceholder="Cari nama perusahaan..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && companies.length === 0}
        data={companies}
        onRetry={refetch}
        onAdd={handleAddCompany}
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        renderItem={(company: any) => (
          <CompanyCard
            key={company.id}
            id={company.id}
            name={company.name}
            address={company.address}
            logo={company.logo}
            email={company.email}
            phone={company.phoneNo}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}
      />

      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            opacity={0.5}
          />
          <AlertDialog.Content
            bordered
            elevate
            key="content"
            x={0}
            scale={1}
            opacity={1}
            y={0}
            maxWidth={400}
            width="90%"
            backgroundColor="white"
            borderRadius={12}
            padding="$5"
          >
            <YStack gap="$4">
              <AlertDialog.Title fontSize={18} fontWeight="bold" color={COLORS.textMain}>
                Konfirmasi Hapus
              </AlertDialog.Title>
              <AlertDialog.Description fontSize={14} color={COLORS.textSecondary} lineHeight={20}>
                Apakah Anda yakin ingin menghapus profil perusahaan ini? Seluruh data terkait akan terpengaruh dan tindakan ini tidak dapat dibatalkan.
              </AlertDialog.Description>

              <XStack justifyContent="flex-end" marginTop="$2" gap="$2">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined" borderColor={COLORS.borderLight} backgroundColor="white">
                    Batal
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild onPress={confirmDelete}>
                  <Button backgroundColor="#E74C3C">
                    <Text color="white" fontWeight="bold">Hapus</Text>
                  </Button>
                </AlertDialog.Action>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  );
};

export default CompanyListPage;
