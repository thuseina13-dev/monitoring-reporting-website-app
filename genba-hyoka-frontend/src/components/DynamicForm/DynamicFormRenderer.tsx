import React from 'react';
import { useForm, useWatch, Control, UseFormSetValue } from 'react-hook-form';
import { YStack, Button, Text, XStack } from 'tamagui';
import { FormSchema, FormField } from './types';
import { FormComponentMap } from './FormComponentMap';
import { useAuthStore, AuthState } from '../../store/authStore';

import { COLORS } from '../../constants/theme';

interface FieldRendererProps {
  field: FormField;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ field, control, setValue }) => {
  const showIf = field.show_if;

  const watchValue = useWatch({
    control,
    name: showIf?.field || '____unused____',
  });

  if (showIf) {
    let isVisible = false;
    switch (showIf.operator) {
      case '==':
        isVisible = watchValue === showIf.value;
        break;
      case '!=':
        isVisible = watchValue !== showIf.value;
        break;
      case '>':
        isVisible = watchValue > showIf.value;
        break;
      case '<':
        isVisible = watchValue < showIf.value;
        break;
      case '>=':
        isVisible = watchValue >= showIf.value;
        break;
      case '<=':
        isVisible = watchValue <= showIf.value;
        break;
      default:
        isVisible = false;
    }

    if (!isVisible) {
      return null;
    }
  }

  const Component = FormComponentMap[field.type];

  if (!Component) {
    return <Text color={COLORS.danger}>Unknown field type: {field.type}</Text>;
  }

  return <Component fieldConfig={field} control={control} setValue={setValue} />;
};

export interface DynamicFormRendererProps {
  schema: FormSchema;
  initialValues?: Record<string, any>;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ schema, initialValues, onSubmit, onCancel }) => {
  const user = useAuthStore((state: AuthState) => state.user);

  // Pre-process default values
  const defaultValues: Record<string, any> = {};

  schema.fields.forEach((field) => {
    // Priority: initialValues > schema.default_value > interpolated value
    let val = initialValues?.[field.id] ?? field.default_value;
    
    if (typeof val === 'string') {
      if (val === '{{USER_NAME}}') {
        val = user?.fullName || 'Guest';
      } else if (val === '{{SYSTEM_DATE}}') {
        const today = new Date();
        val = today.toISOString().split('T')[0];
      }
    }
    defaultValues[field.id] = val ?? '';
  });

  const { control, handleSubmit, setValue } = useForm({
    values: defaultValues,
  });

  return (
    <YStack gap="$4" padding="$4" backgroundColor="$background">
      {schema.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          control={control}
          setValue={setValue}
        />
      ))}
      
      <XStack gap="$3" marginTop="$2">
        {onCancel && (
          <Button theme="alt1" flex={1} variant="outlined" onPress={onCancel}>
            Batal
          </Button>
        )}
        <Button 
          backgroundColor={COLORS.primary} 
          flex={1} 
          onPress={handleSubmit(onSubmit || console.log)}
        >
          <Text color="white" fontWeight="700">Simpan Formulir</Text>
        </Button>
      </XStack>
    </YStack>
  );
};
