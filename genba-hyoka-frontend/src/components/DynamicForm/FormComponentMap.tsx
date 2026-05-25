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
import SignaturePad from './SignaturePad';
import { Platform, ActivityIndicator, Image, Linking } from 'react-native';
import { storageService } from '../../services/api/storageService';
import { useToastController } from '@tamagui/toast';

import { COLORS } from '../../constants/theme';
import { getImageUrl } from '@/utils/getImageUrl';
import { WebDatePicker } from './WebDatePicker';
import { WebCamera } from './WebCamera';

export interface FieldProps {
  fieldConfig: FormField;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  disableColumnWidth?: boolean;
}

const getFieldWidth = (cols: any) => {
  if (cols === undefined) return '90%';
  const numCols = Number(cols);
  if (numCols === 1) return '30%';
  if (numCols === 2) return '60%';
  return '90%';
};

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

  if (rules.min_selections || rules.max_selections) {
    transformed.validate = (value: any) => {
      const len = Array.isArray(value) ? value.length : 0;
      const minVal = rules.min_selections ? Number(rules.min_selections) : undefined;
      const maxVal = rules.max_selections ? Number(rules.max_selections) : undefined;

      if (minVal !== undefined && !isNaN(minVal) && len < minVal) {
        return `Minimal pilih ${minVal} opsi`;
      }
      if (maxVal !== undefined && !isNaN(maxVal) && len > maxVal) {
        return `Maksimal pilih ${maxVal} opsi`;
      }
      return true;
    };
  } else if (rules.validate) {
    transformed.validate = rules.validate;
  }

  return transformed;
};

const ErrorMessage = ({ error }: { error?: any }) => {
  if (!error) return null;
  return <Text color={COLORS.danger} fontSize={12} mt="$1">{error.message}</Text>;
};

const validateFile = (asset: any, rules: any, label: string, toast: any, onInvalid?: () => void) => {
  if (rules?.max_size_mb) {
    const maxSizeInBytes = rules.max_size_mb * 1024 * 1024;
    const fileSize = asset.size || asset.fileSize;
    if (fileSize && fileSize > maxSizeInBytes) {
      toast.show('File Terlalu Besar', {
        message: `${label}: Maksimal ${rules.max_size_mb}MB (Sekarang ${(fileSize / (1024 * 1024)).toFixed(2)}MB)`,
        type: 'error',
      });
      onInvalid?.();
      return false;
    }
  }

  if (rules?.allowed_extensions && rules.allowed_extensions.length > 0) {
    const fileName = (asset.name || asset.fileName || asset.uri.split('/').pop() || '').toLowerCase();
    const normalizedAllowed = rules.allowed_extensions.map((ext: string) =>
      ext.replace(/^\./, '').toLowerCase()
    );
    const fileExt = fileName.split('.').pop() || '';
    const isAllowed = normalizedAllowed.includes(fileExt);
    if (!isAllowed) {
      const displayExtensions = normalizedAllowed.map((ext: string) => ext.toUpperCase()).join(', ');
      toast.show('Format Tidak Didukung', {
        message: `${label}: Harus ${displayExtensions}`,
        type: 'error',
      });
      onInvalid?.();
      return false;
    }
  }

  return true;
};

const ICON_MAP: Record<string, any> = {
  mail: Mail,
  lock: Lock,
  user: User,
  phone: Smartphone,
};

const InputText: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = fieldConfig.type === 'password';

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <XStack ai="center" bg={COLORS.inputBackground || '$background'} br="$3" px="$1" h={50} bw={1} bc={fieldState.error ? COLORS.danger : COLORS.borderLight} position="relative">
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
          px="$2"
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

const InputTextArea: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
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
        bg={COLORS.inputBackground}
        borderColor={fieldState.error ? COLORS.danger : COLORS.borderLight}
        borderWidth={1}
        px="$3"
        autoComplete="none"
      />
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputNumber: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Input
        id={fieldConfig.id}
        value={field.value ? String(field.value) : ''}
        onChangeText={(val) => {
          const regex = fieldConfig.rules?.allow_decimal ? /[^0-9.]/g : /[^0-9]/g;
          field.onChange(val.replace(regex, ''));
        }}
        onBlur={field.onBlur}
        keyboardType="numeric"
        disabled={fieldConfig.is_locked}
        placeholder={fieldConfig.label}
        bg={COLORS.inputBackground}
        borderColor={fieldState.error ? COLORS.danger : COLORS.borderLight}
        borderWidth={1}
        h={50}
        px="$3"
        autoComplete="none"
      />
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputDateTime: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
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

  const dateType = fieldConfig.rules?.date_type || 'datetime-local';

  const handleWebChange = (e: any) => {
    const value = e.target.value;
    if (!value) {
      field.onChange('');
      return;
    }

    try {
      if (dateType === 'time') {
        const [hours, minutes] = value.split(':');
        const d = new Date();
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        field.onChange(d.toISOString());
      } else if (dateType === 'date') {
        const d = new Date(`${value}T00:00:00`);
        field.onChange(d.toISOString());
      } else {
        field.onChange(new Date(value).toISOString());
      }
    } catch (err) {
      console.error('Invalid date', err);
    }
  };

  const getMinDate = () => {
    if (fieldConfig.rules?.min_date) return new Date(fieldConfig.rules.min_date);
    return undefined;
  };

  const getMaxDate = () => {
    const disableFuture = fieldConfig.rules?.disable_future_dates as any;
    if (disableFuture === true || disableFuture === 'true') return new Date();
    if (fieldConfig.rules?.max_date) return new Date(fieldConfig.rules.max_date);
    return undefined;
  };

  const formatForWeb = (isoString?: string | Date) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localIso = new Date(date.getTime() - tzoffset).toISOString();

    if (dateType === 'date') return localIso.slice(0, 10);
    if (dateType === 'time') return localIso.slice(11, 16);
    return localIso.slice(0, 16);
  };

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>

      {Platform.OS === 'web' ? (
        <WebDatePicker
          type={dateType}
          value={formatForWeb(field.value)}
          onChange={handleWebChange}
          disabled={fieldConfig.is_locked}
          min={formatForWeb(getMinDate())}
          max={formatForWeb(getMaxDate())}
          hasError={!!fieldState.error}
        />
      ) : (
        <>
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
              mode={dateType === 'datetime-local' ? 'datetime' : dateType}
              is24Hour={true}
              onChange={onChange}
              minimumDate={getMinDate()}
              maximumDate={getMaxDate()}
            />
          )}
        </>
      )}

      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputMap: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const toast = useToastController();
  const [loading, setLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (fieldConfig.rules?.fetch_method === 'auto' && !field.value) {
      getLocation(false); // Do not auto popup on initial background load
    }
  }, []);

  const getLocation = async (shouldPopup = true) => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Izin Ditolak', {
          message: 'Akses lokasi diperlukan untuk fitur ini',
          type: 'error',
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.High,
      });
      const coordsStr = `${location.coords.latitude}, ${location.coords.longitude}`;
      field.onChange(coordsStr);
      
      // Open map modal ONLY if explicitly requested/triggered
      if (shouldPopup) {
        setMapOpen(true);
      }
    } catch (error) {
      console.error(error);
      toast.show('Gagal', {
        message: 'Gagal mengambil lokasi perangkat',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const isAuto = fieldConfig.rules?.fetch_method === 'auto';

  const [lat, lon] = field.value && typeof field.value === 'string'
    ? field.value.split(',').map((s: string) => parseFloat(s.trim()))
    : [null, null];

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      
      {isAuto ? (
        // Auto-fetch Layout
        field.value ? (
          <Button
            icon={Eye}
            onPress={() => setMapOpen(true)}
            theme="active"
            bg="$blue8"
            hoverStyle={{ backgroundColor: "$blue10" }}
            width="100%"
          >
            Lihat Peta Lokasi
          </Button>
        ) : loading ? (
          <XStack gap="$2.5" alignItems="center" bg="$backgroundHover" p="$2.5" br="$3" bw={1} bc={COLORS.borderLight || "$borderColor"} jc="center" h={50}>
            <ActivityIndicator size="small" color={COLORS.primary || "#0088ff"} />
            <Text fontSize={13} color="$textMuted" fontWeight="600">Mendeteksi Lokasi Otomatis...</Text>
          </XStack>
        ) : (
          <XStack gap="$2" alignItems="center" bg="$backgroundHover" p="$2.5" br="$3" bw={1} bc="$red5" jc="space-between" h={50}>
            <Text fontSize={13} color={COLORS.danger || "$red10"} fontWeight="600">Gagal mendeteksi lokasi otomatis</Text>
            <Button size="$2" theme="alt1" icon={MapPin} onPress={() => getLocation(true)}>Coba Lagi</Button>
          </XStack>
        )
      ) : (
        // Manual-fetch Layout
        <XStack gap="$2" alignItems="center">
          <Button
            icon={MapPin}
            onPress={() => getLocation(true)}
            disabled={fieldConfig.is_locked || loading}
            borderColor={fieldState.error ? COLORS.danger : undefined}
            borderWidth={fieldState.error ? 1 : 0}
            flex={1}
          >
            {loading ? 'Mengambil Lokasi...' : 'Dapatkan Lokasi'}
          </Button>
          {field.value && (
            <Button
              icon={Eye}
              onPress={() => setMapOpen(true)}
              theme="active"
              bg="$blue8"
              hoverStyle={{ backgroundColor: "$blue10" }}
            >
              Lihat Peta
            </Button>
          )}
        </XStack>
      )}
      
      {field.value ? <Text color={COLORS.success} fontSize={12} mt="$1">Koordinat: {field.value}</Text> : null}
      <ErrorMessage error={fieldState.error} />

      {mapOpen && lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon) && (
        <Dialog modal open={mapOpen} onOpenChange={setMapOpen}>
          <Portal>
            <Dialog.Overlay key="overlay" opacity={0.5} />
            <Dialog.Content 
              bordered 
              elevate 
              key="content" 
              gap="$1.5" 
              width="90%" 
              maxWidth={600}
              height="60%"
              maxHeight={500}
              padding="$0"
              overflow="hidden"
              alignSelf="center"
              top={0}
              bottom={0}
              left={0}
              right={0}
              margin="auto"
              x={0}
              y={0}
            >
              <XStack 
                padding="$3" 
                borderBottomWidth={1} 
                borderColor={COLORS.borderLight || "$borderColor"} 
                jc="space-between" 
                ai="center" 
                backgroundColor={COLORS.bgSoft || "$backgroundHover"}
              >
                <Dialog.Title margin={0} fontSize={16} fontWeight="bold" color={COLORS.textMain || "$color"}>Peta Lokasi Anda</Dialog.Title>
                <Button size="$3" circular chromeless icon={<X color={COLORS.textMuted || "$color"} />} onPress={() => setMapOpen(false)} />
              </XStack>

              <YStack flex={1} padding="$3" backgroundColor="$background">
                <Dialog.Description mb="$3" fontSize={13} color="$textMuted">Koordinat: {lat}, {lon}</Dialog.Description>
                
                <YStack flex={1} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$3" overflow="hidden">
                  {Platform.OS === 'web' ? (
                    <iframe
                      title="Peta Lokasi Geolocation"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.003}%2C${lat - 0.003}%2C${lon + 0.003}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lon}`}
                      className="map-iframe"
                    />
                  ) : (
                    <YStack flex={1} ai="center" jc="center" gap="$3" padding="$4">
                      <MapPin size={48} color={COLORS.primary} />
                      <Text textAlign="center">Aplikasi mendeteksi koordinat Anda di {lat}, {lon}.</Text>
                      <Button onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`)}>
                        Buka di Google Maps
                      </Button>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </Dialog.Content>
          </Portal>
        </Dialog>
      )}
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

const InputFile: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
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

  const toast = useToastController();
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        if (!validateFile(asset, fieldConfig.rules, fieldConfig.label, toast, () => field.onChange(''))) {
          return;
        }

        const modelName = fieldConfig.rules?.model_name || 'general';
        const isPublic = fieldConfig.rules?.is_public === true;

        // Defer upload: store file info for later submission
        field.onChange({
          uri: asset.uri,
          name: asset.name || (asset as any).fileName || asset.uri.split('/').pop(),
          type: asset.mimeType || (asset as any).type || 'application/octet-stream',
          isFileObject: true,
          modelName,
          isPublic,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Button
        icon={uploading ? () => <ActivityIndicator size="small" color={COLORS.textLight} /> : FileUp}
        onPress={pickDocument}
        disabled={fieldConfig.is_locked || uploading}
        bg={COLORS.inputBackground}
        borderColor={fieldState.error ? COLORS.danger : COLORS.borderLight}
        borderWidth={1}
        height={50}
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

const InputSignature: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const [open, setOpen] = useState(false);
  const ref = useRef<any>(null);

  const handleOK = (signature: string) => {
    field.onChange(signature);
    setOpen(false);
  };

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      <Button
        icon={PenTool}
        onPress={() => setOpen(true)}
        disabled={fieldConfig.is_locked}
        bg={COLORS.inputBackground}
        borderColor={fieldState.error ? COLORS.danger : COLORS.borderLight}
        borderWidth={1}
        height={50}
      >
        Buka Pad Tanda Tangan
      </Button>

      {field.value ? (
        <YStack mt="$2.5" p="$3" br="$3" bg="$backgroundHover" ai="center" gap="$2.5" bw={1} bc={COLORS.borderLight || "$borderColor"} position="relative">
          <Button 
            size="$2" 
            circular 
            backgroundColor="$red8" 
            icon={<X color="#ffffff" size={14} />} 
            position="absolute" 
            top={8} 
            right={8} 
            zIndex={10} 
            onPress={() => field.onChange('')}
            accessibilityLabel="Hapus Tanda Tangan"
            hoverStyle={{ backgroundColor: "$red10" }}
          />
          <Text color={COLORS.success} fontSize={12} fontWeight="600">Tanda Tangan Tersimpan:</Text>
          <Image 
            source={{ uri: field.value }} 
            style={{ 
              width: 240, 
              height: 100, 
              resizeMode: 'contain', 
              backgroundColor: '#ffffff', 
              borderRadius: 6, 
              borderWidth: 1, 
              borderColor: COLORS.borderLight || '#dddddd' 
            }} 
          />
        </YStack>
      ) : null}

      {open && (
        <Dialog modal open={open} onOpenChange={setOpen}>
          <Portal>
            <Dialog.Overlay key="overlay" opacity={0.5} />
            <Dialog.Content 
              bordered 
              elevate 
              key="content" 
              gap="$1.5" 
              width="90%" 
              height="60%"
              padding="$0"
              overflow="hidden"
              alignSelf="center"
              top={0}
              bottom={0}
              left={0}
              right={0}
              margin="auto"
              x={0}
              y={0}
            >
              <XStack 
                padding="$3" 
                borderBottomWidth={1} 
                borderColor={COLORS.borderLight || "$borderColor"} 
                jc="space-between" 
                ai="center" 
                backgroundColor={COLORS.bgSoft || "$backgroundHover"}
              >
                <Dialog.Title margin={0} fontSize={16} fontWeight="bold" color={COLORS.textMain || "$color"}>Pad Tanda Tangan</Dialog.Title>
                <Button size="$3" circular chromeless icon={<X color={COLORS.textMuted || "$color"} />} onPress={() => setOpen(false)} />
              </XStack>

              <YStack flex={1} padding="$3" backgroundColor="$background">
                <Dialog.Description mb="$3" fontSize={13} color="$textMuted">Silakan goreskan tanda tangan Anda di bawah ini:</Dialog.Description>
                
                <YStack flex={1} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$3" overflow="hidden">
                  <SignaturePad
                    ref={ref}
                    onOK={handleOK}
                    defaultValue={field.value}
                  />
                </YStack>

                <XStack gap="$2" justifyContent="flex-end" marginTop="$3">
                  <Button size="$3.5" onPress={() => ref.current?.clearSignature()} theme="alt1">Hapus Coretan</Button>
                  <Button size="$3.5" onPress={() => ref.current?.readSignature()} theme="active">Simpan Tanda Tangan</Button>
                </XStack>
              </YStack>
            </Dialog.Content>
          </Portal>
        </Dialog>
      )}
      <ErrorMessage error={fieldState.error} />
    </YStack>
  );
};

const InputCheckbox: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const dataSource = fieldConfig.data_source;
  const isDynamic = dataSource?.type === 'dynamic';
  const hasDataSource = !!dataSource;
  const isHorizontal = fieldConfig.rules?.options_layout === 'horizontal';
  const columns = isHorizontal ? 3 : 1;

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
      <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
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
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>

      <XStack fw="wrap" bg={COLORS.inputBackground} bw={1} bc={COLORS.borderLight} p="$2" br="$3">
        {isFetching && (
          <YStack width="100%" ai="center" padding="$2">
            <ActivityIndicator size="small" color={COLORS.primary} />
          </YStack>
        )}
        {options.map((opt: any) => (
          <XStack
            key={opt.value}
            ai="center"
            gap="$2"
            paddingVertical="$1.5"
            paddingHorizontal="$2"
            width={columns > 1 ? 'auto' : '100%'}
            marginRight={columns > 1 ? "$3" : "0"}
            onPress={() => handleToggle(opt.value)}
            pressStyle={{ opacity: 0.7 }}
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
            <Text fontSize={15} color={COLORS.textMain} userSelect="none">
              {opt.label}
            </Text>
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

const InputRadio: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const dataSource = fieldConfig.data_source;
  const isDynamic = dataSource?.type === 'dynamic';
  const isHorizontal = fieldConfig.rules?.options_layout === 'horizontal';
  const columns = isHorizontal ? 3 : 1;

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
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>

      <RadioGroup
        value={field.value ? String(field.value) : ''}
        onValueChange={field.onChange}
      >
        <XStack fw="wrap" bg={COLORS.inputBackground} bw={1} bc={COLORS.borderLight} p="$2" br="$3">
          {isFetching && (
            <YStack width="100%" ai="center" padding="$2">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </YStack>
          )}
          {options.map((opt: any) => (
            <XStack
              key={opt.value}
              ai="center"
              gap="$2"
              paddingVertical="$1.5"
              paddingHorizontal="$2"
              width={columns > 1 ? 'auto' : '100%'}
              marginRight={columns > 1 ? "$3" : "0"}
              onPress={() => field.onChange(opt.value)}
              pressStyle={{ opacity: 0.7 }}
            >
              <RadioGroup.Item
                value={String(opt.value)}
                id={`${fieldConfig.id}-${opt.value}`}
                size="$5"
              >
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Text fontSize={15} color={COLORS.textMain} userSelect="none">
                {opt.label}
              </Text>
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

const InputDropdown: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  useEffect(() => {
    if (fieldConfig.default_value !== undefined && (field.value === undefined || field.value === '')) {
      field.onChange(fieldConfig.default_value);
    }
  }, [fieldConfig.default_value]);

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
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
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
          <Select.Trigger flex={1} iconAfter={ChevronDown} bg={COLORS.inputBackground} bw={1} bc={fieldState.error ? COLORS.danger : COLORS.borderLight} h={50}>
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

const InputCamera: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field, fieldState } = useController({
    name: fieldConfig.id,
    control,
    rules: transformRules(fieldConfig.rules, fieldConfig.label),
  });

  const toast = useToastController();
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showWebCamera, setShowWebCamera] = useState(false);

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

  const allowGallery = fieldConfig.rules?.allow_gallery ?? false;

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      setShowWebCamera(true);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Izin Ditolak', {
          message: 'Akses kamera diperlukan untuk mengambil foto',
          type: 'error',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const cameraRules = {
          ...fieldConfig.rules,
          allowed_extensions: ['jpg', 'jpeg', 'png', 'jgp']
        };
        if (!validateFile(asset, cameraRules, fieldConfig.label, toast, () => field.onChange(''))) {
          return;
        }
        const modelName = fieldConfig.rules?.model_name || 'general';
        const isPublic = fieldConfig.rules?.is_public === true;
        // Defer upload: store file info for later submission
        field.onChange({
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop(),
          type: asset.type || 'image/jpeg',
          isFileObject: true,
          modelName,
          isPublic,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const pickFromGallery = async () => {
    if (!allowGallery) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Izin Ditolak', {
          message: 'Akses galeri diperlukan untuk memilih foto',
          type: 'error',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const cameraRules = {
          ...fieldConfig.rules,
          allowed_extensions: ['jpg', 'jpeg', 'png', 'jgp']
        };
        if (!validateFile(asset, cameraRules, fieldConfig.label, toast, () => field.onChange(''))) {
          return;
        }
        const modelName = fieldConfig.rules?.model_name || 'general';
        const isPublic = fieldConfig.rules?.is_public === true;
        field.onChange({
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop(),
          type: asset.type || 'image/jpeg',
          isFileObject: true,
          modelName,
          isPublic,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleWebCapture = async (dataUri: string) => {
    const modelName = fieldConfig.rules?.model_name || 'general';
    const isPublic = fieldConfig.rules?.is_public === true;
    field.onChange({
      uri: dataUri,
      name: `webcam-${Date.now()}.jpg`,
      type: 'image/jpeg',
      isFileObject: true,
      modelName,
      isPublic,
    });
    setShowWebCamera(false);
  };

  return (
    <YStack gap="$1" mb="$2" width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
      <Label htmlFor={fieldConfig.id} fontWeight="600" color={COLORS.textMain}>
        {fieldConfig.label}
        {fieldConfig.rules?.required && <Text color={COLORS.danger}> *</Text>}
      </Label>
      {allowGallery ? (
        <XStack gap="$2" alignItems="center">
          <Button
            icon={ImageIcon}
            onPress={pickFromGallery}
            disabled={fieldConfig.is_locked}
            borderColor={fieldState.error ? COLORS.danger : undefined}
            borderWidth={fieldState.error ? 1 : 0}
          >
            Pilih Gambar
          </Button>
          <Button
            icon={uploading ? () => <ActivityIndicator size="small" color={COLORS.textLight} /> : Camera}
            onPress={takePhoto}
            disabled={fieldConfig.is_locked || uploading}
            borderColor={fieldState.error ? COLORS.danger : undefined}
            borderWidth={fieldState.error ? 1 : 0}
          >
            {uploading ? 'Mengunggah...' : 'Ambil Foto'}
          </Button>
        </XStack>
      ) : (
        <XStack gap="$2" alignItems="center">
          <Button
            icon={uploading ? () => <ActivityIndicator size="small" color={COLORS.textLight} /> : Camera}
            onPress={takePhoto}
            disabled={fieldConfig.is_locked || uploading}
            borderColor={fieldState.error ? COLORS.danger : undefined}
            borderWidth={fieldState.error ? 1 : 0}
          >
            {uploading ? 'Mengunggah...' : 'Ambil Foto'}
          </Button>
        </XStack>
      )}
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
      {showWebCamera && (
        <WebCamera
          onCapture={handleWebCapture}
          onCancel={() => setShowWebCamera(false)}
        />
      )}
    </YStack>
  );
};

const InputSwitch: React.FC<FieldProps> = ({ fieldConfig, control, disableColumnWidth }) => {
  const { field } = useController({
    name: fieldConfig.id,
    control,
  });

  return (
    <YStack gap="$1" mb={0} width={!disableColumnWidth && fieldConfig.columns ? getFieldWidth(fieldConfig.columns) : '100%'}>
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
