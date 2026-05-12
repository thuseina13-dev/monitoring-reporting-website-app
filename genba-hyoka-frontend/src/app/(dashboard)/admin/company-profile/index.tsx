import React, { useState } from 'react';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import CompanyCard from '../../../../components/companies/CompanyCard';
import { useGetCompanies } from '../../../../hooks/companies/useGetCompanies';
import { useDeleteCompany } from '../../../../hooks/companies/useDeleteCompany';
import { router } from 'expo-router';

const CompanyListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { mutate: deleteCompany, isPending: isDeleting } = useDeleteCompany();

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
            onDelete={(id) => deleteCompany(id)}
            isDeleting={isDeleting}
          />
        )}
      />
    </>
  );
};

export default CompanyListPage;
