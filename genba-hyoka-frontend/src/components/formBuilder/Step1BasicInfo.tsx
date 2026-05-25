import React from 'react';
import { useFormContext } from 'react-hook-form';
import { YStack } from 'tamagui';
import { TaskTemplateForm } from './types';
import { FormComponentMap } from '../dynamicForm/FormComponentMap';

export const Step1BasicInfo = () => {
  const { control, setValue } = useFormContext<TaskTemplateForm>();

  const InputText = FormComponentMap['text'];
  const InputTextArea = FormComponentMap['textarea'];
  const InputSwitch = FormComponentMap['switch'];

  return (
    <YStack padding="$4">
      <InputText
        fieldConfig={{ id: 'name', label: 'Nama Template', type: 'text', rules: { required: true } as any }}
        control={control as any}
        setValue={setValue as any}
      />
      <InputTextArea
        fieldConfig={{ id: 'description', label: 'Deskripsi', type: 'textarea' as any }}
        control={control as any}
        setValue={setValue as any}
      />
      <InputSwitch
        fieldConfig={{ id: 'isActive', label: 'Status Aktif', type: 'switch' as any }}
        control={control as any}
        setValue={setValue as any}
      />
      <InputSwitch
        fieldConfig={{ id: 'isMandatory', label: 'Wajib Diisi (Mandatory)', type: 'switch' as any }}
        control={control as any}
        setValue={setValue as any}
      />
    </YStack>
  );
};
