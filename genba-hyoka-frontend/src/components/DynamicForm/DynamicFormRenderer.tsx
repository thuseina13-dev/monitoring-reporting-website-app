import React from 'react';
import { useForm, useWatch, Control, UseFormSetValue } from 'react-hook-form';
import { YStack, Button, Text, XStack, Spinner } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { FormSchema, FormField, FormSection } from './types';
import { FormComponentMap } from './FormComponentMap';
import { useAuthStore, AuthState } from '../../store/authStore';
import { COLORS } from '../../constants/theme';
import { storageService } from '../../services/api/storageService';
import { parseBackendError } from '../../utils/errorParser';
import { useToastController } from '@tamagui/toast';

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
  isLoading?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ schema, initialValues, onSubmit, onCancel, isLoading }) => {
  const user = useAuthStore((state: AuthState) => state.user);
  const toast = useToastController();

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
    const isArrayField = field.type === 'checkbox' || field.is_multiple;
    defaultValues[field.id] = val ?? (isArrayField ? [] : '');
  });

  const { control, handleSubmit, setValue } = useForm({
    values: defaultValues,
    mode: 'onBlur',
  });

  const submitLabel = schema.submit_label || 'Simpan Formulir';
  const hideCancel = schema.hide_cancel || false;
  const columns = schema.columns || 1;

  const [isUploading, setIsUploading] = React.useState(false);

  const handleFinalSubmit = async (data: any) => {
    setIsUploading(true);
    try {
      const finalData = { ...data };
      
      // Look for any fields that are file objects
      for (const key of Object.keys(finalData)) {
        const value = finalData[key];
        if (value && typeof value === 'object' && value.isFileObject) {
          const uploadResult = await storageService.upload(value.uri, value.modelName, value.isPublic);
          finalData[key] = uploadResult.data.file_url;
        }
      }
      
      if (onSubmit) {
        onSubmit(finalData);
      }
    } catch (error: any) {
      console.error('Upload failed during submit:', error);
      toast.show('Gagal', {
        message: 'Gagal mengunggah file: ' + parseBackendError(error),
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <YStack gap="$2" padding="$4" backgroundColor="transparent">
      {schema.title && (
        <YStack mb="$4" ai="center">
          <Text fontSize={22} fontWeight="700" color={COLORS.textMain}>{schema.title}</Text>
        </YStack>
      )}

      {schema.sections && schema.sections.length > 0 ? (
        <XStack fw="wrap" gap="$4">
          {schema.sections.map((section, sIdx) => {
            const sectionFields = section.field_ids
              .map(id => schema.fields.find(f => f.id === id))
              .filter(Boolean) as FormField[];
            
            const sectionColumns = schema.columns || 1;
            
            return (
              <YStack 
                key={sIdx} 
                flex={1} 
                minWidth={300} 
                gap="$3"
              >
                {section.title && (
                  <Text fontSize={16} fontWeight="700" color={COLORS.textSecondary} mb="$2" borderBottomWidth={1} borderBottomColor={COLORS.borderSeparator} pb="$2">
                    {section.title}
                  </Text>
                )}
                {sectionFields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    control={control}
                    setValue={setValue}
                  />
                ))}
              </YStack>
            );
          })}
        </XStack>
      ) : (
        <XStack fw="wrap" jc="flex-start" gap="$3">
          {schema.fields.map((field) => (
            <YStack 
              key={field.id} 
              width={columns > 1 ? `calc(${100 / columns}% - 12px)` : '100%'}
              minWidth={columns > 1 ? 300 : '100%'}
              flexGrow={1}
            >
              <FieldRenderer
                field={field}
                control={control}
                setValue={setValue}
              />
            </YStack>
          ))}
        </XStack>
      )}
      
      <XStack gap="$3" marginTop="$4">
        {onCancel && !hideCancel && (
          <Button theme="alt1" flex={1} variant="outlined" onPress={onCancel} height={50}>
            Batal
          </Button>
        )}
        <Button 
          backgroundColor={schema.use_gradient ? 'transparent' : COLORS.primary} 
          flex={1} 
          height={55}
          onPress={handleSubmit(handleFinalSubmit)}
          disabled={isLoading || isUploading}
          opacity={(isLoading || isUploading) ? 0.7 : 1}
          pressStyle={{ opacity: 0.8 }}
          overflow="hidden"
          position="relative"
        >
          {schema.use_gradient && (
            <LinearGradient
              colors={COLORS.gradients?.primary || ['#10b981', '#059669']}
              start={[0, 0]}
              end={[1, 1]}
              fullscreen
              borderRadius={12}
              zIndex={0}
            />
          )}
          <XStack ai="center" jc="center" gap="$2" f={1} w="100%" h="100%" zIndex={1}>
            {(isLoading || isUploading) ? (
              <Spinner color="white" />
            ) : (
              <Text color="white" fontSize={16} fontWeight="800">{submitLabel.toUpperCase()}</Text>
            )}
          </XStack>
        </Button>
      </XStack>
    </YStack>
  );
};
