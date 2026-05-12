import React from 'react';
import { ScrollView, YStack, Text, Spinner } from 'tamagui';
import { router } from 'expo-router';
import { DynamicFormRenderer } from '../../../../components/DynamicForm/DynamicFormRenderer';
import { FormSchema } from '../../../../components/DynamicForm/types';
import ListHeader from '../../../../components/layout/ListHeader';
import { COLORS } from '../../../../constants/theme';
import { useRegisterUser } from '../../../../hooks/users/useRegisterUser';

const registerSchema: FormSchema = {
  fields: [
    {
      id: "fullName",
      label: "Nama Lengkap",
      type: "text",
      rules: {
        required: true,
        max_length: 255
      }
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      rules: {
        required: true,
        is_email: true
      }
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      rules: {
        required: true,
        min_length: 8
      }
    },
    {
      id: "roleIds",
      label: "Pilih Role",
      type: "checkbox",
      columns: 2,
      data_source: {
        type: "dynamic",
        endpoint: "/roles?type_ne=super_admin",
        label_key: "name",
        value_key: "id"
      },
      rules: {
        required: true,
        min_selections: 1
      }
    },
    {
      id: "companyProfileId",
      label: "Profil Perusahaan",
      type: "dropdown",
      data_source: {
        type: "dynamic",
        endpoint: "/company-profiles",
        label_key: "name",
        value_key: "id"
      },
      rules: {
        required: true
      }
    }
  ]
};



const CreateUserPage = () => {
  const { mutate, isPending } = useRegisterUser();

  const handleSubmit = (data: any) => {
    mutate(data);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <YStack flex={1} backgroundColor={COLORS.pageBackground}>
      <ListHeader title="Registrasi User Baru" />

      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4">
          <Text color="$colorFocus" textAlign="center" fontSize={14}>
            Lengkapi data di bawah ini untuk membuat User baru.
          </Text>

          <DynamicFormRenderer
            schema={registerSchema}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isPending}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
};

export default CreateUserPage;
