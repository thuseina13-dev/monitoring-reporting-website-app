import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, Text, Spinner } from 'tamagui';
import { DynamicFormRenderer, FormSchema } from '../../../../../components/DynamicForm';
import { useGetCompanyById } from '../../../../../hooks/companies/useGetCompanyById';
import { useUpdateCompany } from '../../../../../hooks/companies/useUpdateCompany';
import { useLocalSearchParams, router } from 'expo-router';
import ListHeader from '../../../../../components/layout/ListHeader';
import { COLORS } from '../../../../../constants/theme';
import { useToastController } from '@tamagui/toast';

const companyProfileSchema: FormSchema = {
  fields: [
    {
      id: "name",
      label: "Nama Perusahaan",
      type: "text",
      rules: {
        required: true,
        max_length: 255
      }
    },
    {
      id: "desc",
      label: "Deskripsi",
      type: "textarea",
      rules: {
        max_length: 255
      }
    },
    {
      id: "address",
      label: "Alamat",
      type: "textarea",
      rules: {
        max_length: 255
      }
    },
    {
      id: "logo",
      label: "Logo Perusahaan",
      type: "file",
      rules: {
        max_size_mb: 1,
        allowed_extensions: [".jpg", ".jpeg", ".png"]
      }
    },
    {
      id: "phoneNo",
      label: "No Telepon",
      type: "text",
      rules: {
        max_length: 25
      }
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      rules: {
        max_length: 255
      }
    }
  ]
};



export default function EditCompanyProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: company, isLoading: isLoadingData } = useGetCompanyById(id);
  const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();
  const toast = useToastController();

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      logo: typeof data.logo === 'string' ? data.logo : '', 
    };

    updateCompany({ id, data: payload }, {
      onSuccess: () => {
        // useUpdateCompany already handles toast on success
      },
      onError: (err: any) => {
        toast.show('Gagal', {
          message: err?.response?.data?.message || err.message,
          type: 'error',
          native: false,
        });
      }
    });
  };

  if (isLoadingData) {
    return (
      <YStack flex={1} ai="center" jc="center" backgroundColor="#fff">
        <Spinner size="large" color="$orange10" />
        <Text mt="$2">Memuat data perusahaan...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="#fff">
      <ListHeader title="Edit Profil Perusahaan" />
      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4">
          <Text color="$colorFocus" textAlign="center" fontSize={14}>
            Perbarui informasi profil perusahaan di bawah ini.
          </Text>
          
          {isUpdating && (
            <YStack ai="center" jc="center" padding="$4">
              <Spinner size="large" color="$orange10" />
              <Text mt="$2">Sedang memperbarui...</Text>
            </YStack>
          )}

          <DynamicFormRenderer 
            schema={companyProfileSchema} 
            initialValues={company?.data} 
            onSubmit={handleSubmit} 
            onCancel={() => router.back()}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
}
