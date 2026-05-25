import React, { useEffect, useState } from 'react';
import { ScrollView, YStack, Text, Spinner, View } from 'tamagui';
import { useLocalSearchParams, router } from 'expo-router';
import { DynamicFormRenderer } from '../../../../../components/dynamicForm/DynamicFormRenderer';
import { FormSchema } from '../../../../../components/dynamicForm/types';
import ListHeader from '../../../../../components/layout/ListHeader';
import { COLORS } from '../../../../../constants/theme';
import { useGetUser } from '../../../../../hooks/users/useGetUser';
import { useUpdateUser } from '../../../../../hooks/users/useUpdateUser';

const editSchema: FormSchema = {
  columns: 2,
  submit_label: "Simpan Perubahan",
  fields: [
    { id: "fullName", label: "Nama Lengkap", type: "text", rules: { required: true, max_length: 255 } },
    { id: "email", label: "Email", type: "text", rules: { required: true, is_email: true } },
    {
      id: "roleIds",
      label: "Pilih Role",
      type: "checkbox",
      columns: 3,
      data_source: {
        type: "dynamic",
        endpoint: "/roles?type_ne=super_admin",
        label_key: "name",
        value_key: "id"
      },
      rules: { required: true, min_selections: 1, options_layout: 'horizontal' }
    },
    {
      id: "gender",
      label: "Jenis Kelamin",
      columns: 2,
      type: "radio",
      data_source: {
        type: "static",
        options: [
          { label: "Laki-laki", value: "male" },
          { label: "Perempuan", value: "female" }
        ]
      }
    },
    {
      id: "photoProfile", label: "Foto Profil", type: "camera",
      show_preview: true,
      rules: {
        max_size_mb: 1,
        allowed_extensions: [".jpg", ".jpeg", ".png"],
        model_name: "users",
        is_public: true
      }
    },
    { id: "phoneNo", label: "Nomor Telepon", type: "number" },
    { id: "address", label: "Alamat", type: "textarea" },
    { id: "isActive", label: "Status Aktif", type: "switch" }
  ],
  sections: [
    {
      title: "Informasi Registrasi",
      field_ids: ["fullName", "email", "roleIds"]
    },
    {
      title: "Detail & Status",
      field_ids: ["gender", "photoProfile", "phoneNo", "address", "isActive"]
    }
  ]
};

const EditUserPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: userResponse, isLoading: isFetching } = useGetUser(id!);
  const { mutate, isPending: isUpdating } = useUpdateUser();

  const [initialValues, setInitialValues] = useState<any>(null);

  useEffect(() => {
    if (userResponse?.data) {
      const u = userResponse.data;
      setInitialValues({
        fullName: u.fullName,
        email: u.email,
        gender: u.gender,
        roleIds: u.roles?.map((r: any) => r?.id).filter(Boolean) || [],
        photoProfile: u.photoProfile,
        phoneNo: u.phoneNo,
        address: u.address,
        isActive: u.isActive,
      });
    }
  }, [userResponse]);

  const handleSubmit = (data: any) => {
    mutate({ id: id!, data }, {
      onSuccess: () => {
        // Redirect tegas ke halaman list setelah sukses
        router.replace('/(dashboard)/admin/user');
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (isFetching) {
    return (
      <YStack flex={1} ai="center" jc="center" backgroundColor={COLORS.pageBackground}>
        <Spinner size="large" color={COLORS.primary} />
        <Text mt="$2" color={COLORS.textSecondary}>Memuat data user...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={COLORS.pageBackground}>
      <ListHeader title="Edit User" />

      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4">
          <Text color="$colorFocus" textAlign="center" fontSize={14}>
            Perbarui informasi akun dan penugasan peran untuk user ini.
          </Text>

          {initialValues && (
            <DynamicFormRenderer
              schema={editSchema}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isUpdating}
            />
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
};

export default EditUserPage;
