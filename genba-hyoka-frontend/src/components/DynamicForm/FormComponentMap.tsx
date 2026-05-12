import React, { useEffect, useState, useRef } from 'react';
import { useController, useWatch, Control, UseFormSetValue } from 'react-hook-form';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FormField } from './types';
import { Input, YStack, Text, Label, Select, Adapt, Sheet, Button, TextArea, Checkbox, XStack, Dialog, Portal, RadioGroup, Switch } from 'tamagui';
import { ChevronDown, Check, Camera, MapPin, FileUp, PenTool, X, Eye, EyeOff, Mail, Lock, User, Smartphone, Download, Image as ImageIcon } from '@tamagui/lucide-icons';
import axiosClient from '../../services/api/axiosClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Platform, ActivityIndicator, Image, Linking } from 'react-native';
import { storageService } from '../../services/api/storageService';

import { COLORS } from '../../constants/theme';
import { getImageUrl } from '@/utils/getImageUrl';

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

  if (rules.is_email) {
    transformed.pattern = {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: `Format email tidak valid`
    };
  }

  if (rules.min_selections) {
    transformed.validate = (value: any) => {
      if (Array.isArray(value) && value.length < rules.min_selections) {
        return `Minimal pilih ${rules.min_selections} opsi`;
      }
      return true;
    };
  }

  return transformed;
};

const ErrorMessage = ({ error }: { error?: any }) => {
  if (!error) return null;
  return <Text color={COLORS.danger} fontSize={12} mt="$1">{error.message}</Text>;
};

const ICON_MAP: Record<string, any> = {
  mail: Mail,
  lock: Lock,
  user: User,
  phone: Smartphone,
};

const InputText: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = fieldConfig.type === 'password';

  return (
    <YStack gap="$1" mb="$2">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <XStack ai="center" bg={COLORS.inputBackground || '$background'} br="$3" px="$3" h={50} bw={1} bc={fieldState.error ? COLORS.danger : COLORS.borderLight} position="relative">
        {fieldConfig.icon_left && ICON_MAP[fieldConfig.icon_left] && (
          React.createElement(ICON_MAP[fieldConfig.icon_left], {
            size: 18,
            color: COLORS.textMuted,
            opacity: 0.5,
            marginRight: 12
          })
        )}
        <Input
          flex={1}
          id={fieldConfig.id}
          value={field.value || ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          disabled={fieldConfig.is_locked}
          placeholder={fieldConfig.label}
          secureTextEntry={isPassword && !showPassword}
          type={isPassword ? (showPassword ? 'text' : 'password') : 'text'}
          autoCapitalize="none"
          autoComplete={isPassword ? "new-password" : "none"}
          bw={0}
          bg="transparent"
          h="100%"
          paddingRight={isPassword ? 40 : 0}
        />
        {isPassword && (
          <Button
            size="$3"
            chromeless
            icon={showPassword ? <EyeOff size={18} color={COLORS.textMuted} /> : <Eye size={18} color={COLORS.textMuted} />}
            onPress={() => setShowPassword(!showPassword)}
            position="absolute"
            right={5}
            zIndex={10}
            padding={0}
            width={35}
          />
        )}
      </XStack>
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
    <YStack gap="$1" mb="$2">
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
        autoComplete="none"
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
    <YStack gap="$1" mb="$2">
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
        autoComplete="none"
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
    <YStack gap="$1" mb="$2">
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
    <YStack gap="$1" mb="$2">
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

const PreviewDialog = ({ open, setOpen, uri }: { open: boolean, setOpen: (val: boolean) => void, uri: string }) => {
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <Portal>
        <Dialog.Overlay key="overlay" opacity={0.6} backgroundColor="#000" />
        <Dialog.Content
          bordered
          elevate
          key="content"
          width="auto"
          maxWidth="95%"
          height="auto"
          maxHeight="95%"
          padding="$0"
          overflow="hidden"
          backgroundColor="$background"
          borderRadius="$4"
          // Centering Logic
          alignSelf="center"
          top={0}
          bottom={0}
          left={0}
          right={0}
          margin="auto"
          x={0}
          y={0}
          opacity={1}
          scale={1}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
        >
          <XStack padding="$3" borderBottomWidth={1} borderColor={COLORS.borderLight || "$borderColor"} jc="space-between" ai="center" backgroundColor={COLORS.bgSoft || "$backgroundHover"}>
            <Dialog.Title margin={0} fontSize={16} fontWeight="bold" color={COLORS.textMain || "$color"}>Pratinjau Gambar</Dialog.Title>
            <Button size="$3" circular chromeless icon={<X color={COLORS.textMuted || "$color"} />} onPress={() => setOpen(false)} />
          </XStack>

          <YStack ai="center" jc="center" padding="$2" backgroundColor={COLORS.bgSoft || "$backgroundHover"}>
            {!!uri && (
              <Image
                source={{ uri }}
                style={{
                  width: 500,
                  height: 500,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  resizeMode: 'contain'
                }}
              />
            )}
          </YStack>
        </Dialog.Content>
      </Portal>
    </Dialog>
  );
};

const InputFile: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreviewAction = () => {
    if (!field.value) return;
    const isObj = field.value && typeof field.value === 'object' && field.value.isFileObject;
    const uri = isObj ? field.value.uri : field.value;
    const type = isObj ? field.value.type : (uri.match(/\.(jpeg|jpg|gif|png)$/i) ? 'image/jpeg' : 'application/octet-stream');

    if (type && type.startsWith('image')) {
      setPreviewOpen(true);
    } else {
      const fullUrl = uri.startsWith('http') || uri.startsWith('data:') || uri.startsWith('file:')
        ? uri
        : getImageUrl(uri);
        console.log('full url', fullUrl)
      Linking.openURL(fullUrl);
    }
  };

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

        field.onChange({
          uri: asset.uri,
          name: asset.name || 'upload.pdf',
          type: asset.mimeType || 'application/octet-stream',
          modelName,
          isPublic,
          isFileObject: true
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <YStack gap="$1" mb="$2">
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
        <XStack mt="$2" p="$2" br="$2" bc="$backgroundHover" ai="center" jc="space-between">
          <Text color={COLORS.success} fontSize={12} numberOfLines={1} flex={1}>
            {field.value.isFileObject ? `Terpilih: ${field.value.name}` : (typeof field.value === 'string' ? `Terunggah: ${field.value.split('/').pop()}` : 'File terpilih')}
          </Text>
          {fieldConfig.show_preview && (
            <Button
              size="$2"
              chromeless
              icon={
                (field.value.isFileObject && field.value.type?.startsWith('image')) ||
                  (typeof field.value === 'string' && field.value.match(/\.(jpeg|jpg|gif|png)$/i))
                  ? ImageIcon
                  : Download
              }
              onPress={handlePreviewAction}
              padding="$1"
            />
          )}
        </XStack>
      ) : null}
      <ErrorMessage error={fieldState.error} />
      {previewOpen && (
        <PreviewDialog
          open={previewOpen}
          setOpen={setPreviewOpen}
          uri={field.value?.isFileObject ? field.value.uri : (typeof field.value === 'string' ? getImageUrl(field.value) : '')}
        />
      )}
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
    <YStack gap="$1" mb="$2">
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
          <Dialog.Content bordered elevate key="content" gap="$1" width="90%" height="60%">
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

            <XStack gap="$1" justifyContent="flex-end">
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

  const dataSource = fieldConfig.data_source;
  const isDynamic = dataSource?.type === 'dynamic';
  const hasDataSource = !!dataSource;
  const columns = fieldConfig.columns || 1;

  const { data, isFetching } = useInfiniteQuery({
    queryKey: ['checkbox-group', isDynamic ? dataSource.endpoint : 'static'],
    queryFn: async () => {
      if (!isDynamic) return { pages: [{ data: dataSource?.options || [] }] };
      const response = await axiosClient.get(dataSource.endpoint);
      return response.data;
    },
    enabled: isDynamic,
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
  });

  const options = React.useMemo(() => {
    if (!hasDataSource) return [];
    if (!isDynamic) return dataSource?.options || [];
    if (!data) return [];
    const page = data.pages[0];
    const arr = Array.isArray(page) ? page : (page.data || []);
    return arr.map((item: any) => ({
      label: String(item[dataSource.label_key]),
      value: String(item[dataSource.value_key]),
    }));
  }, [hasDataSource, isDynamic, data, dataSource]);

  if (!hasDataSource) {
    return (
      <YStack gap="$1" mb="$2">
        <XStack gap="$1" ai="center">
          <Checkbox
            id={fieldConfig.id}
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={fieldConfig.is_locked}
            size="$5"
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
  }

  const value = Array.isArray(field.value) ? field.value : [];
  const handleToggle = (val: string) => {
    const current = [...value];
    const idx = current.indexOf(val);
    if (idx > -1) current.splice(idx, 1);
    else current.push(val);
    field.onChange(current);
  };

  return (
    <YStack gap="$1" mb="$2">
      <Label fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>

      <XStack fw="wrap" bc="$backgroundHover" p="$2" br="$3">
        {isFetching && (
          <YStack width="100%" ai="center" padding="$2">
            <ActivityIndicator size="small" color={COLORS.primary} />
          </YStack>
        )}
        {options.map((opt: any) => (
          <XStack
            key={opt.value}
            ai="center"
            gap="$1"
            paddingVertical="$0.5"
            width={columns > 1 ? `${100 / columns}%` : '100%'}
            minWidth={columns > 1 ? 120 : '100%'}
          >
            <Checkbox
              id={`${fieldConfig.id}-${opt.value}`}
              checked={value.includes(opt.value)}
              onCheckedChange={() => handleToggle(opt.value)}
              size="$5"
            >
              <Checkbox.Indicator>
                <Check size={18} />
              </Checkbox.Indicator>
            </Checkbox>
            <Label htmlFor={`${fieldConfig.id}-${opt.value}`} fontSize={15} color={COLORS.textMain}>
              {opt.label}
            </Label>
          </XStack>
        ))}
        {options.length === 0 && !isFetching && (
          <Text color={COLORS.textMuted} textAlign="center" width="100%">Tidak ada data.</Text>
        )}
      </XStack>

      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputRadio: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const dataSource = fieldConfig.data_source;
  const isDynamic = dataSource?.type === 'dynamic';
  const columns = fieldConfig.columns || 1;

  const { data, isFetching } = useInfiniteQuery({
    queryKey: ['radio-group', isDynamic ? dataSource.endpoint : 'static'],
    queryFn: async () => {
      if (!isDynamic) return { pages: [{ data: dataSource?.options || [] }] };
      const response = await axiosClient.get(dataSource.endpoint);
      return response.data;
    },
    enabled: isDynamic,
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
  });

  const options = React.useMemo(() => {
    if (!isDynamic) return dataSource?.options || [];
    if (!data) return [];
    const page = data.pages[0];
    const arr = Array.isArray(page) ? page : (page.data || []);
    return arr.map((item: any) => ({
      label: String(item[dataSource.label_key]),
      value: String(item[dataSource.value_key]),
    }));
  }, [isDynamic, data, dataSource]);

  return (
    <YStack gap="$1" mb="$2">
      <Label fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>

      <RadioGroup
        value={field.value ? String(field.value) : ''}
        onValueChange={field.onChange}
      >
        <XStack fw="wrap" bc="$backgroundHover" p="$2" br="$3">
          {isFetching && (
            <YStack width="100%" ai="center" padding="$2">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </YStack>
          )}
          {options.map((opt: any) => (
            <XStack
              key={opt.value}
              ai="center"
              gap="$1"
              paddingVertical="$0.5"
              width={columns > 1 ? `${100 / columns}%` : '100%'}
              minWidth={columns > 1 ? 120 : '100%'}
            >
              <RadioGroup.Item
                value={String(opt.value)}
                id={`${fieldConfig.id}-${opt.value}`}
                size="$5"
              >
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Label htmlFor={`${fieldConfig.id}-${opt.value}`} fontSize={15} color={COLORS.textMain}>
                {opt.label}
              </Label>
            </XStack>
          ))}
          {options.length === 0 && !isFetching && (
            <Text color={COLORS.textMuted} textAlign="center" width="100%">Tidak ada data.</Text>
          )}
        </XStack>
      </RadioGroup>

      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputDropdown: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const dataSource = fieldConfig.data_source;
  const isDynamic = dataSource?.type === 'dynamic';

  const { data } = useInfiniteQuery({
    queryKey: ['dropdown-options', isDynamic ? dataSource.endpoint : 'static'],
    queryFn: async () => {
      if (!isDynamic) return { pages: [{ data: dataSource?.options || [] }] };
      const response = await axiosClient.get(dataSource.endpoint);
      return response.data;
    },
    enabled: isDynamic,
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
  });

  const options = React.useMemo(() => {
    if (!isDynamic) return dataSource?.options || [];
    if (!data) return [];
    const page = data.pages[0];
    const arr = Array.isArray(page) ? page : (page.data || []);
    return arr.map((item: any) => ({
      label: String(item[dataSource.label_key]),
      value: String(item[dataSource.value_key]),
    }));
  }, [isDynamic, data, dataSource]);

  return (
    <YStack gap="$1" mb="$2">
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>

      <XStack gap="$2" ai="center">
        <Select
          id={fieldConfig.id}
          value={field.value}
          onValueChange={field.onChange}
          disablePreventBodyScroll
        >
          <Select.Trigger flex={1} iconAfter={ChevronDown}>
            <Select.Value placeholder="Pilih..." />
          </Select.Trigger>

          <Adapt when="sm">
            <Sheet modal dismissOnSnapToBottom snapPoints={[50]}>
              <Sheet.Overlay />
              <Sheet.Handle />
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
            </Sheet>
          </Adapt>

          <Select.Content>
            <Select.ScrollUpButton ai="center" jc="center" h="$3" w="100%">
              <ChevronDown rotate="180deg" size={16} />
            </Select.ScrollUpButton>

            <Select.Viewport minWidth={200}>
              <Select.Group>
                {!fieldConfig.rules?.required && (
                  <Select.Item index={0} key="clear" value="" bc="$backgroundHover">
                    <Select.ItemText color={COLORS.danger}>-- Hapus Pilihan --</Select.ItemText>
                  </Select.Item>
                )}
                {options.map((item: any, i: number) => (
                  <Select.Item index={i + 1} key={item.value} value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator ml="auto">
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>

            <Select.ScrollDownButton ai="center" jc="center" h="$3" w="100%">
              <ChevronDown size={16} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select>

        {field.value && (
          <Button
            size="$3.5"
            circular
            chromeless
            icon={<X size={16} color={COLORS.danger} />}
            onPress={() => field.onChange('')}
            pressStyle={{ backgroundColor: COLORS.bgSoft }}
            accessibilityLabel="Hapus Pilihan"
          />
        )}
      </XStack>

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
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreviewAction = () => {
    if (!field.value) return;
    const isObj = field.value && typeof field.value === 'object' && field.value.isFileObject;
    const uri = isObj ? field.value.uri : field.value;
    const type = isObj ? field.value.type : (uri.match(/\.(jpeg|jpg|gif|png)$/i) ? 'image/jpeg' : 'application/octet-stream');

    if (type && type.startsWith('image')) {
      setPreviewOpen(true);
    } else {
      const fullUrl = uri.startsWith('http') || uri.startsWith('data:') || uri.startsWith('file:')
        ? uri
        : getImageUrl(uri);
      console.log('full url', fullUrl)
      Linking.openURL(fullUrl);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Izin akses galeri ditolak');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const modelName = fieldConfig.rules?.model_name || 'general';
        const isPublic = fieldConfig.rules?.is_public === true;

        field.onChange({
          uri: asset.uri,
          name: asset.fileName || 'photo.jpg',
          type: asset.mimeType || 'image/jpeg',
          modelName,
          isPublic,
          isFileObject: true
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <YStack gap="$1" mb="$2">
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
        {uploading ? 'Mengunggah...' : 'Pilih Foto'}
      </Button>
      {field.value ? (
        <XStack mt="$2" p="$2" br="$2" bc="$backgroundHover" ai="center" jc="space-between">
          <Text color={COLORS.success} fontSize={12} numberOfLines={1} flex={1}>
            {field.value.isFileObject ? `Terpilih: ${field.value.name}` : (typeof field.value === 'string' ? `Foto tersimpan: ${field.value.split('/').pop()}` : 'Foto terpilih')}
          </Text>
          {fieldConfig.show_preview && (
            <Button
              size="$2"
              chromeless
              icon={
                (field.value.isFileObject && field.value.type?.startsWith('image')) ||
                  (typeof field.value === 'string' && field.value.match(/\.(jpeg|jpg|gif|png)$/i))
                  ? ImageIcon
                  : Download
              }
              onPress={handlePreviewAction}
              padding="$1"
            />
          )}
        </XStack>
      ) : null}
      <ErrorMessage error={fieldState.error} />
      {previewOpen && (
        <PreviewDialog
          open={previewOpen}
          setOpen={setPreviewOpen}
          uri={field.value?.isFileObject ? field.value.uri : (typeof field.value === 'string' ? getImageUrl(field.value) : '')}
        />
      )}
    </YStack>
  );
};

const InputSwitch: React.FC<FieldProps> = ({ fieldConfig, control }) => {
  const { field } = useController({
    name: fieldConfig.id,
    control,
  });

  return (
    <YStack gap="$1" mb="$2">
      <XStack gap="$3" ai="center" jc="space-between" bc="$backgroundHover" p="$3" br="$3">
        <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain} flex={1}>
          {fieldConfig.label}
          {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
        </Label>
        <Switch
          id={fieldConfig.id}
          checked={!!field.value}
          onCheckedChange={field.onChange}
          disabled={fieldConfig.is_locked}
          backgroundColor={field.value ? COLORS.primaryLight : COLORS.warningLight}
          width={44}
          height={24}
          borderRadius={20}
          padding={2}
        >
          <Switch.Thumb
            backgroundColor={field.value ? COLORS.primary : COLORS.warning}
            width={20}
            height={20}
            borderRadius={10}
          />
        </Switch>
      </XStack>
    </YStack>
  );
};

export const FormComponentMap: Record<string, React.FC<FieldProps>> = {
  text: InputText,
  password: InputText,
  textarea: InputTextArea,
  number: InputNumber,
  datetime: InputDateTime,
  geolocation: InputMap,
  camera: InputCamera,
  file: InputFile,
  signature: InputSignature,
  dropdown: InputDropdown,
  checkbox: InputCheckbox,
  radio: InputRadio,
  switch: InputSwitch,
};
