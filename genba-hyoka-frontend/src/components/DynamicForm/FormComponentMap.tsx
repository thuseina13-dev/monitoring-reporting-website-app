import React, { useEffect, useState, useRef } from 'react';
import { useController, useWatch, Control, UseFormSetValue } from 'react-hook-form';
import { FormField } from './types';
import { Input, YStack, Text, Label, Select, Adapt, Sheet, Button, TextArea, Checkbox, XStack, Dialog, Portal } from 'tamagui';
import { ChevronDown, Check, Camera, MapPin, FileUp, PenTool, X } from '@tamagui/lucide-icons';
import axiosClient from '../../services/api/axiosClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Platform, ActivityIndicator } from 'react-native';
import { storageService } from '../../services/api/storageService';

import { COLORS } from '../../constants/theme';

export interface FieldProps {
  fieldConfig: FormField;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
}

const transformRules = (rules: any, label: string) => {
  if (!rules) return {};
  const transformed: any = {};
  
  if (rules.required) {
    transformed.required = `${label} wajib diisi`;
  }
  
  if (rules.max_length) {
    transformed.maxLength = {
      value: rules.max_length,
      message: `${label} maksimal ${rules.max_length} karakter`
    };
  }
  
  if (rules.min_length) {
    transformed.minLength = {
      value: rules.min_length,
      message: `${label} minimal ${rules.min_length} karakter`
    };
  }
  
  if (rules.min !== undefined) {
    transformed.min = {
      value: rules.min,
      message: `${label} minimal ${rules.min}`
    };
  }
  
  if (rules.max !== undefined) {
    transformed.max = {
      value: rules.max,
      message: `${label} maksimal ${rules.max}`
    };
  }

  if (rules.pattern) {
    transformed.pattern = {
      value: new RegExp(rules.pattern),
      message: `Format ${label} tidak valid`
    };
  }

  return transformed;
};

const ErrorMessage = ({ error }: { error?: any }) => {
  if (!error) return null;
  return <Text color={COLORS.danger} fontSize={12} mt="$1">{error.message}</Text>;
};

const InputText: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Input
        id={fieldConfig.id}
        value={field.value || ''}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        disabled={fieldConfig.is_locked}
        placeholder={fieldConfig.label}
        borderColor={fieldState.error ? COLORS.danger : undefined}
      />
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputTextArea: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <TextArea
        id={fieldConfig.id}
        value={field.value || ''}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        disabled={fieldConfig.is_locked}
        placeholder={fieldConfig.label}
        borderColor={fieldState.error ? COLORS.danger : undefined}
      />
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputNumber: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Input
        id={fieldConfig.id}
        value={field.value ? String(field.value) : ''}
        onChangeText={(val) => field.onChange(val.replace(/[^0-9]/g, ''))}
        onBlur={field.onBlur}
        keyboardType="numeric"
        disabled={fieldConfig.is_locked}
        placeholder={fieldConfig.label}
        borderColor={fieldState.error ? COLORS.danger : undefined}
      />
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputDateTime: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [show, setShow] = useState(false);
  const dateValue = field.value ? new Date(field.value) : new Date();

  const onChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      field.onChange(selectedDate.toISOString());
    }
  };

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Button 
        onPress={() => setShow(true)} 
        disabled={fieldConfig.is_locked}
        borderColor={fieldState.error ? COLORS.danger : undefined}
        borderWidth={fieldState.error ? 1 : 0}
      >
        {field.value ? new Date(field.value).toLocaleString() : 'Pilih Tanggal & Waktu'}
      </Button>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="datetime"
          is24Hour={true}
          onChange={onChange}
        />
      )}
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputMap: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Izin akses lokasi ditolak');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      field.onChange(`${location.coords.latitude}, ${location.coords.longitude}`);
    } catch (error) {
      console.error(error);
      alert('Gagal mengambil lokasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Button
        icon={MapPin}
        onPress={getLocation}
        disabled={fieldConfig.is_locked || loading}
        borderColor={fieldState.error ? COLORS.danger : undefined}
        borderWidth={fieldState.error ? 1 : 0}
      >
        {loading ? 'Mengambil Lokasi...' : 'Dapatkan Lokasi'}
      </Button>
      {field.value ? <Text color={COLORS.success} fontSize={12}>Koordinat: {field.value}</Text> : null}
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputFile: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const modelName = fieldConfig.rules?.model_name || 'general';
        const isPublic = fieldConfig.rules?.is_public === true;

        setUploading(true);
        try {
          const uploadResult = await storageService.upload(asset.uri, modelName, isPublic);
          field.onChange(uploadResult.data.file_url);
        } catch (error: any) {
          console.error('Upload failed:', error);
          alert('Gagal mengunggah file: ' + (error.response?.data?.message || error.message));
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Button
        icon={uploading ? () => <ActivityIndicator size="small" color={COLORS.textLight} /> : FileUp}
        onPress={pickDocument}
        disabled={fieldConfig.is_locked || uploading}
        borderColor={fieldState.error ? COLORS.danger : undefined}
        borderWidth={fieldState.error ? 1 : 0}
      >
        {uploading ? 'Mengunggah...' : 'Unggah File'}
      </Button>
      {field.value ? (
        <YStack mt="$2" p="$2" br="$2" bc="$backgroundHover">
          <Text color={COLORS.success} fontSize={12} numberOfLines={1}>
            Terunggah: {field.value.split('/').pop()}
          </Text>
        </YStack>
      ) : null}
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputSignature: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [open, setOpen] = useState(false);
  const ref = useRef<SignatureViewRef>(null);

  const handleOK = (signature: string) => {
    field.onChange(signature);
    setOpen(false);
  };

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Button
        icon={PenTool}
        onPress={() => setOpen(true)}
        disabled={fieldConfig.is_locked}
        borderColor={fieldState.error ? COLORS.danger : undefined}
        borderWidth={fieldState.error ? 1 : 0}
      >
        Buka Pad Tanda Tangan
      </Button>
      
      {field.value ? <Text color={COLORS.success} fontSize={12}>Tanda tangan tersimpan</Text> : null}

      <Dialog modal open={open} onOpenChange={setOpen}>
        <Portal>
          <Dialog.Overlay key="overlay" opacity={0.5} />
          <Dialog.Content bordered elevate key="content" gap="$4" width="90%" height="60%">
            <Dialog.Title>Tanda Tangan</Dialog.Title>
            <Dialog.Description>Silakan tanda tangan di bawah ini</Dialog.Description>
            
            <YStack flex={1} backgroundColor="$background" borderWidth={1} borderColor="$borderColor">
              <SignatureScreen
                ref={ref}
                onOK={handleOK}
                descriptionText="Tanda Tangan"
                clearText="Hapus"
                confirmText="Simpan"
                webStyle={`.m-signature-pad--footer {display: none; margin: 0;}`}
              />
            </YStack>

            <XStack gap="$3" justifyContent="flex-end">
              <Button onPress={() => ref.current?.clearSignature()} theme="alt1">Hapus</Button>
              <Button onPress={() => ref.current?.readSignature()} theme="active">Simpan</Button>
              <Dialog.Close asChild>
                <Button icon={X} chromeless circular position="absolute" top="$-3" right="$-3" />
              </Dialog.Close>
            </XStack>
          </Dialog.Content>
        </Portal>
      </Dialog>
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputCheckbox: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  return (
    <YStack gap="$1" mb="$4">
      <XStack gap="$3" ai="center">
        <Checkbox
          id={fieldConfig.id}
          checked={field.value}
          onCheckedChange={field.onChange}
          disabled={fieldConfig.is_locked}
          size="$5"
          borderColor={fieldState.error ? COLORS.danger : undefined}
        >
          <Checkbox.Indicator>
            <Check />
          </Checkbox.Indicator>
        </Checkbox>
        <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
          {fieldConfig.label}
          {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
        </Label>
      </XStack>
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputDropdown: React.FC<FieldProps> = ({ fieldConfig, control, setValue }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const dataSource = fieldConfig.data_source;
  const dependsOnField = dataSource?.depends_on?.field;
  
  const [options, setOptions] = useState<{ label: string; value: string }[]>(() => {
    if (dataSource?.type === 'static') {
      return dataSource.options || [];
    }
    return [];
  });

  const parentValue = useWatch({
    control,
    name: dependsOnField || '____unused____',
  });

  const prevParentValue = useRef(parentValue);

  useEffect(() => {
    if (dataSource?.type === 'dynamic') {
      if (dependsOnField && !parentValue) {
        setOptions([]);
        return;
      }

      const fetchOptions = async () => {
        try {
          const params: Record<string, any> = {};
          if (dependsOnField && parentValue && dataSource.depends_on?.param_name) {
            params[dataSource.depends_on.param_name] = parentValue;
          }

          const response = await axiosClient.get(dataSource.endpoint, { params });
          const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);

          const formattedOptions = data.map((item: any) => ({
            label: String(item[dataSource.label_key]),
            value: String(item[dataSource.value_key]),
          }));
          setOptions(formattedOptions);
        } catch (error) {
          console.error(`Failed to fetch options for ${fieldConfig.id}:`, error);
          setOptions([]);
        }
      };

      fetchOptions();
    }

    if (dependsOnField && prevParentValue.current !== parentValue) {
      setValue(fieldConfig.id, '');
    }
    prevParentValue.current = parentValue;
  }, [parentValue, dependsOnField, fieldConfig.id, setValue]); 

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Select 
        id={fieldConfig.id}
        value={field.value || ''} 
        onValueChange={field.onChange}
      >
        <Select.Trigger 
          iconAfter={ChevronDown} 
          disabled={fieldConfig.is_locked}
          borderColor={fieldState.error ? COLORS.danger : undefined}
        >
          <Select.Value placeholder="Pilih..." />
        </Select.Trigger>

        <Adapt when="sm">
          <Sheet modal dismissOnSnapToBottom>
            <Sheet.Frame>
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay />
          </Sheet>
        </Adapt>

        <Select.Content>
          <Select.Viewport>
            {options.map((opt, i) => (
              <Select.Item index={i} key={`${opt.value}-${i}`} value={opt.value}>
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check size={16} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select>
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputCamera: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Izin kamera ditolak');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const modelName = fieldConfig.rules?.model_name || 'general';
        const isPublic = fieldConfig.rules?.is_public === true;

        setUploading(true);
        try {
          const uploadResult = await storageService.upload(asset.uri, modelName, isPublic);
          field.onChange(uploadResult.data.file_url);
        } catch (error: any) {
          console.error('Upload failed:', error);
          alert('Gagal mengunggah foto: ' + (error.response?.data?.message || error.message));
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <YStack gap="$1" mb="$4">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Button
        icon={uploading ? () => <ActivityIndicator size="small" color={COLORS.textLight} /> : Camera}
        onPress={takePhoto}
        disabled={fieldConfig.is_locked || uploading}
        borderColor={fieldState.error ? COLORS.danger : undefined}
        borderWidth={fieldState.error ? 1 : 0}
      >
        {uploading ? 'Mengunggah...' : 'Ambil Foto'}
      </Button>
      {field.value ? (
        <YStack mt="$2" p="$2" br="$2" bc="$backgroundHover">
          <Text color={COLORS.success} fontSize={12} numberOfLines={1}>
            Foto tersimpan: {field.value.split('/').pop()}
          </Text>
        </YStack>
      ) : null}
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

export const FormComponentMap: Record<string, React.FC<FieldProps>> = {
  text: InputText,
  textarea: InputTextArea,
  number: InputNumber,
  datetime: InputDateTime,
  geolocation: InputMap,
  camera: InputCamera,
  file: InputFile,
  signature: InputSignature,
  dropdown: InputDropdown,
  checkbox: InputCheckbox,
};
