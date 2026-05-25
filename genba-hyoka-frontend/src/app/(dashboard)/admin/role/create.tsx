import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, Text, Spinner } from 'tamagui';
import { DynamicFormRenderer, FormSchema } from '../../../../components/dynamicForm';
import { useCreateRole } from '../../../../hooks/roles/useCreateRole';
import { router } from 'expo-router';
import ListHeader from '../../../../components/layout/ListHeader';
import { COLORS } from '../../../../constants/theme';

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

export default function CreateRolePage() {
  const { mutate, isPending } = useCreateRole();

  const handleSubmit = (data: any) => {
    mutate(data);
  };

  return (
    <YStack flex={1} backgroundColor={COLORS.cardBackground}>
      <ListHeader title="Tambah Role" />
      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4">
          <Text color="$colorFocus" textAlign="center" fontSize={14}>
            Lengkapi data di bawah ini untuk membuat role baru.
          </Text>

          <DynamicFormRenderer
            schema={roleSchema}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={isPending}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
}
