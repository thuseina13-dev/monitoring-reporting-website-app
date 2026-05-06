import React, { useState } from 'react';
import BaseListScreen from '../../../../components/layout/BaseListScreen';
import CompanyCard from '../../../../components/companies/CompanyCard';
import { useGetCompanies } from '../../../../hooks/companies/useGetCompanies';

const CompanyListPage = () => {
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
  } = useGetCompanies({
    search: searchQuery || undefined,
    limit: 10,
  });

  // Menggabungkan data dari semua halaman yang sudah diambil
  const companies = data?.pages.flatMap(page => page.data) || [];

  const handleAddCompany = () => {
    console.log('Navigasi ke halaman tambah perusahaan...');
  };

  return (
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
          name={company.name}
          address={company.address}
          status={company.status || 'Basic'} // Default ke Basic jika status kosong
          logo={company.logo}
          email={company.email}
          phone={company.phoneNo}
        />
      )}
    />
  );
};

export default CompanyListPage;
