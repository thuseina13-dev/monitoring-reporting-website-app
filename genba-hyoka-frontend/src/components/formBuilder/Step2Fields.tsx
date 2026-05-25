import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { YStack, Button, Text, XStack, ScrollView } from 'tamagui';
import { Plus, LayoutList, Eye } from '@tamagui/lucide-icons';
import { DynamicFormRenderer } from '../dynamicForm/DynamicFormRenderer';
import { COLORS } from '../../constants/theme';
import { FieldCard } from './FieldCard';
import { TaskTemplateForm } from './types';

// Komponen khusus untuk Preview agar useWatch tidak memicu re-render form builder
const PreviewTab = () => {
  const { control } = useFormContext<TaskTemplateForm>();
  const formSchemaFields = useWatch({
    control,
    name: 'formSchema.fields',
    defaultValue: []
  });

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack
        margin="$4"
        borderWidth={1}
        borderColor={COLORS.borderLight}
        borderRadius="$4"
        backgroundColor="white"
        padding="$2"
      >
        {formSchemaFields && formSchemaFields.length > 0 ? (
          <YStack padding="$2">
            <DynamicFormRenderer
              schema={{
                fields: formSchemaFields as any,
                hide_cancel: true,
                submit_label: 'Contoh Submit',
              }}
              onSubmit={(data) => console.log('Preview Submit:', data)}
            />
          </YStack>
        ) : (
          <YStack padding="$8" alignItems="center" justifyContent="center">
            <Text color={COLORS.textMuted}>Belum ada field untuk ditampilkan</Text>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
};

// Validator terpisah untuk mengecek duplikat ID secara debounce
const UniqueIdValidator = () => {
  const { control, setError, clearErrors } = useFormContext<TaskTemplateForm>();
  const formSchemaFields = useWatch({
    control,
    name: 'formSchema.fields',
    defaultValue: []
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!formSchemaFields) return;
      const ids = formSchemaFields.map((f: any) => f?.id).filter(Boolean);
      const hasDuplicates = ids.some((id, index) => ids.indexOf(id) !== index);
      
      if (hasDuplicates) {
        setError('formSchema', {
          type: 'validate',
          message: 'ID Field harus unik! Pastikan Label setiap field berbeda agar tidak menghasilkan ID yang sama.'
        });
      } else {
        clearErrors('formSchema');
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [formSchemaFields, setError, clearErrors]);

  return null;
};

export const Step2Fields = () => {
  const { control, setError, clearErrors, formState: { errors } } = useFormContext<TaskTemplateForm>();
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');

  const { fields, append, move, remove } = useFieldArray({
    control,
    name: 'formSchema.fields',
  });

  const handleAddField = () => {
    append({
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      rules: { required: false },
    });
    setActiveTab('builder');
  };

  return (
    <YStack flex={1}>
      {/* Header fixed - tidak ikut scroll */}
      <XStack justifyContent="space-between" alignItems="center" padding="$4" paddingBottom="$2">
        <Text fontSize="$6" fontWeight="bold">Daftar Field Formulir</Text>
        <XStack gap="$2" backgroundColor="$backgroundHover" padding="$1" borderRadius="$3">
          <Button
            size="$3"
            chromeless={activeTab !== 'builder'}
            backgroundColor={activeTab === 'builder' ? 'white' : 'transparent'}
            borderWidth={1}
            borderColor={activeTab === 'builder' ? COLORS.borderLight : 'transparent'}
            onPress={() => setActiveTab('builder')}
            icon={LayoutList}
          >
            Builder
          </Button>
          <Button
            size="$3"
            chromeless={activeTab !== 'preview'}
            backgroundColor={activeTab === 'preview' ? 'white' : 'transparent'}
            borderWidth={1}
            borderColor={activeTab === 'preview' ? COLORS.borderLight : 'transparent'}
            onPress={() => setActiveTab('preview')}
            icon={Eye}
          >
            Preview
          </Button>
        </XStack>
      </XStack>

      {activeTab === 'builder' ? (
        <YStack flex={1}>
          {errors.formSchema?.message && (
            <XStack 
              backgroundColor="$red2" 
              borderColor="$red7" 
              borderWidth={1} 
              padding="$3" 
              marginHorizontal="$4" 
              marginBottom="$3" 
              borderRadius="$3" 
              alignItems="center"
            >
              <Text fontSize={13} color="$red10" fontWeight="600" flex={1}>
                {(errors.formSchema as any).message}
              </Text>
            </XStack>
          )}

          {/* Tombol Tambah Field fixed di atas daftar */}
          <XStack paddingHorizontal="$4" paddingBottom="$2">
            <Button icon={Plus} onPress={handleAddField} size="$4" theme="active" flex={1}>
              Tambah Field
            </Button>
          </XStack>

          {/* Hanya daftar field yang scroll */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12 }}>
            {fields.length === 0 ? (
              <YStack padding="$8" alignItems="center" justifyContent="center" opacity={0.5}>
                <Text color={COLORS.textMuted} textAlign="center">
                  {`Belum ada field.\nKlik "Tambah Field" untuk mulai.`}
                </Text>
              </YStack>
            ) : (
              fields.map((field, index) => (
                <FieldCard
                  key={field.id}
                  index={index}
                  totalFields={fields.length}
                  move={move}
                  remove={remove}
                />
              ))
            )}
          </ScrollView>
        </YStack>
      ) : (
        <PreviewTab />
      )}
      <UniqueIdValidator />
    </YStack>
  );
};
