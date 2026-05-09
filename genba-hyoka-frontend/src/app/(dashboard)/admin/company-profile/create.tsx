import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, Text, Spinner } from 'tamagui';
import { DynamicFormRenderer, FormSchema } from '../../../../components/DynamicForm';
import { useCreateCompany } from '../../../../hooks/companies/useCreateCompany';
import { router } from 'expo-router';
import ListHeader from '../../../../components/layout/ListHeader';
import { COLORS } from '../../../../constants/theme';
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
        allowed_extensions: [".jpg", ".jpeg", ".png"],
        model_name: "companies",
        is_public: true
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



export default function CreateCompanyProfilePage() {
  const { mutate, isPending } = useCreateCompany();
  const toast = useToastController();

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      logo: data.logo || '',
    };

    mutate(payload, {
      onSuccess: () => {
        // useCreateCompany already handles toast on success
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

  return (
    <YStack flex={1} backgroundColor="#fff">
      <ListHeader title="Tambah Profil Perusahaan" />
      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4">
          <Text color="$colorFocus" textAlign="center" fontSize={14}>
            Lengkapi data di bawah ini untuk mendaftarkan perusahaan baru.
          </Text>
          
          {isPending && (
            <YStack ai="center" jc="center" padding="$4">
              <Spinner size="large" color="$orange10" />
              <Text mt="$2">Sedang menyimpan...</Text>
            </YStack>
          )}

          <DynamicFormRenderer 
            schema={companyProfileSchema} 
            onSubmit={handleSubmit} 
            onCancel={() => router.back()}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
}
