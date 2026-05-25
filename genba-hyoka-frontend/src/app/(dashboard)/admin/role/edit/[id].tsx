import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, Text, Spinner } from 'tamagui';
import { DynamicFormRenderer, FormSchema } from '../../../../../components/dynamicForm';
import { useGetRoleById } from '../../../../../hooks/roles/useGetRoleById';
import { useUpdateRole } from '../../../../../hooks/roles/useUpdateRole';
import { useLocalSearchParams, router } from 'expo-router';
import ListHeader from '../../../../../components/layout/ListHeader';
import { COLORS } from '../../../../../constants/theme';

const roleSchema: FormSchema = {
  fields: [
    {
      id: "code",
      label: "Kode Role",
      type: "text",
      rules: {
        required: true,
        max_length: 5
      }
    },
    {
      id: "name",
      label: "Nama Role",
      type: "text",
      rules: {
        required: true,
        max_length: 50
      }
    },
    {
      id: "type",
      label: "Tipe Role",
      type: "dropdown",
      data_source: {
        type: "static",
        options: [
          { label: "Administrator", value: "admin" },
          { label: "Manager", value: "manager" },
          { label: "Pekerja", value: "employee" }
        ]
      },
      rules: {
        required: true
      }
    },
    {
      id: "description",
      label: "Deskripsi",
      type: "textarea",
      rules: {
        max_length: 255
      }
    }
  ]
};

export default function EditRolePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: role, isLoading: isLoadingData } = useGetRoleById(id);
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();

  const handleSubmit = (data: any) => {
    updateRole({ id, data });
  };

  if (isLoadingData) {
    return (
      <YStack flex={1} ai="center" jc="center" backgroundColor={COLORS.cardBackground}>
        <Spinner size="large" color="$orange10" />
        <Text mt="$2">Memuat data role...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={COLORS.cardBackground}>
      <ListHeader title="Edit Role" />
      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4">
          <Text color={COLORS.textSecondary} textAlign="center" fontSize={14}>
            Perbarui informasi role di bawah ini.
          </Text>

          {isUpdating && (
            <YStack ai="center" jc="center" padding="$4">
              <Spinner size="large" color="$orange10" />
              <Text mt="$2">Sedang memperbarui...</Text>
            </YStack>
          )}

          <DynamicFormRenderer
            schema={roleSchema}
            initialValues={role?.data}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
}
