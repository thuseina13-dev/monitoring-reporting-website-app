import React, { useEffect, memo, useState } from 'react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { YStack, XStack, Input, Text, Button, Select, Label, Card, Switch } from 'tamagui';
import { ArrowUp, ArrowDown, Trash2, Lock, ChevronDown, ChevronUp } from '@tamagui/lucide-icons';
import { slugify } from '../../utils/slugify';
import { TaskTemplateForm } from './types';
import { FormComponentMap } from '../dynamicForm/FormComponentMap';

interface Props {
  index: number;
  totalFields: number;
  move: (from: number, to: number) => void;
  remove: (index: number) => void;
}

const FieldRulesPanel = ({ index, type, dateType }: { index: number, type: string, dateType: string }) => {
  const { control, setValue, getValues } = useFormContext<TaskTemplateForm>();

  const InputText = FormComponentMap['text'];
  const InputDropdown = FormComponentMap['dropdown'];
  const InputNumber = FormComponentMap['number'];
  const InputSwitch = FormComponentMap['switch'];
  const InputDateTime = FormComponentMap['datetime'];

  const fields = useWatch({
    control,
    name: 'formSchema.fields',
  }) || [];

  const availableFieldsForRule = fields.slice(0, index);

  const dsType = useWatch({
    control,
    name: `formSchema.fields.${index}.data_source.type`,
  }) || 'static';

  return (
    <YStack gap="$2" padding="$3" backgroundColor="$backgroundHover" borderRadius="$2" marginTop={-4}>
      {/* Data Source Pilihan (Khusus Dropdown, dsb) */}
      {availableFieldsForRule.length > 0 && (
        <InputDropdown
          fieldConfig={{
            id: `formSchema.fields.${index}.show_if.field`,
            label: 'Tampil Jika (Kondisi Acuan)',
            type: 'dropdown',
            data_source: {
              type: 'static',
              options: availableFieldsForRule.filter((f: any) => f.id).map((f: any) => ({ label: f.label || f.id, value: f.id }))
            }
          }}
          control={control as any}
          setValue={setValue as any}
        />
      )}

      <InputSwitch
        fieldConfig={{ id: `formSchema.fields.${index}.rules.required`, label: 'Wajib Diisi (Required)', type: 'switch' }}
        control={control as any}
        setValue={setValue as any}
      />

      {(type === 'text' || type === 'textarea') && (
        <XStack gap="$3">
          <YStack flex={1}>
            <InputNumber
              fieldConfig={{ id: `formSchema.fields.${index}.rules.min_length`, label: 'Min Length', type: 'number' }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
          <YStack flex={1}>
            <InputNumber
              fieldConfig={{ id: `formSchema.fields.${index}.rules.max_length`, label: 'Max Length', type: 'number' }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
        </XStack>
      )}

      {type === 'text' && (
        <InputText
          fieldConfig={{ id: `formSchema.fields.${index}.rules.pattern`, label: 'Regex Pattern (Misal: ^[A-Z]+$)', type: 'text' }}
          control={control as any}
          setValue={setValue as any}
        />
      )}

      {type === 'number' && (
        <>
          <XStack gap="$3">
            <YStack flex={1}>
              <InputNumber
                fieldConfig={{ id: `formSchema.fields.${index}.rules.min`, label: 'Min Value', type: 'number' }}
                control={control as any}
                setValue={setValue as any}
              />
            </YStack>
            <YStack flex={1}>
              <InputNumber
                fieldConfig={{ id: `formSchema.fields.${index}.rules.max`, label: 'Max Value', type: 'number' }}
                control={control as any}
                setValue={setValue as any}
              />
            </YStack>
          </XStack>
          <InputSwitch
            fieldConfig={{ id: `formSchema.fields.${index}.rules.allow_decimal`, label: 'Izinkan Desimal', type: 'switch' }}
            control={control as any}
            setValue={setValue as any}
          />
        </>
      )}

      {type === 'datetime' && (
        <>
          <InputDropdown
            fieldConfig={{
              id: `formSchema.fields.${index}.rules.date_type`,
              label: 'Tipe Input',
              type: 'dropdown',
              default_value: 'datetime-local',
              data_source: {
                type: 'static',
                options: [
                  { label: 'Tanggal dan Jam', value: 'datetime-local' },
                  { label: 'Tanggal', value: 'date' },
                  { label: 'Waktu', value: 'time' },
                ]
              }
            }}
            control={control as any}
            setValue={setValue as any}
          />

          <InputSwitch
            fieldConfig={{ id: `formSchema.fields.${index}.rules.disable_future_dates`, label: 'Nonaktifkan Tanggal Mendatang', type: 'switch' }}
            control={control as any}
            setValue={setValue as any}
          />
          <XStack gap="$3">
            <YStack flex={1}>
              <InputDateTime
                fieldConfig={{
                  id: `formSchema.fields.${index}.rules.min_date`,
                  label: 'Nilai Minimal',
                  type: 'datetime',
                  rules: {
                    date_type: dateType as any,
                    validate: (val: any) => {
                      const maxDate = getValues(`formSchema.fields.${index}.rules.max_date`);
                      if (val && maxDate && new Date(val) > new Date(maxDate)) {
                        return 'Tanggal minimal tidak boleh lebih besar dari tanggal maksimal';
                      }
                      return true;
                    }
                  }
                }}
                control={control as any}
                setValue={setValue as any}
              />
            </YStack>
            <YStack flex={1}>
              <InputDateTime
                fieldConfig={{
                  id: `formSchema.fields.${index}.rules.max_date`,
                  label: 'Nilai Maksimal',
                  type: 'datetime',
                  rules: {
                    date_type: dateType as any,
                    validate: (val: any) => {
                      const minDate = getValues(`formSchema.fields.${index}.rules.min_date`);
                      if (val && minDate && new Date(val) < new Date(minDate)) {
                        return 'Tanggal maksimal tidak boleh lebih kecil dari tanggal minimal';
                      }
                      return true;
                    }
                  }
                }}
                control={control as any}
                setValue={setValue as any}
              />
            </YStack>
          </XStack>
        </>
      )}

      {type === 'geolocation' && (
        <InputDropdown
          fieldConfig={{
            id: `formSchema.fields.${index}.rules.fetch_method`,
            label: 'Metode Ambil Lokasi',
            type: 'dropdown',
            data_source: {
              type: 'static',
              options: [
                { label: 'Manual (Tombol)', value: 'manual' },
                { label: 'Otomatis (Auto)', value: 'auto' }
              ]
            }
          }}
          control={control as any}
          setValue={setValue as any}
        />
      )}

      {type === 'camera' && (
        <>
          <InputSwitch
            fieldConfig={{ id: `formSchema.fields.${index}.rules.allow_gallery`, label: 'Izinkan Buka Galeri', type: 'switch' }}
            control={control as any}
            setValue={setValue as any}
          />
          <InputNumber
            fieldConfig={{ id: `formSchema.fields.${index}.rules.max_size_mb`, label: 'Max Size (MB)', type: 'number' }}
            control={control as any}
            setValue={setValue as any}
          />
        </>
      )}

      {type === 'file' && (
        <>
          <InputNumber
            fieldConfig={{ id: `formSchema.fields.${index}.rules.max_size_mb`, label: 'Max Size (MB)', type: 'number' }}
            control={control as any}
            setValue={setValue as any}
          />
          <Controller
            name={`formSchema.fields.${index}.rules.allowed_extensions`}
            control={control}
            render={({ field: { onChange, value } }) => (
              <YStack gap="$1" mb="$2">
                <Label fontWeight="600">Ekstensi (Pisahkan dengan koma)</Label>
                <Input bg="$inputBackground" bc="$borderLight" bw={1} h={50} px="$3" value={Array.isArray(value) ? value.join(',') : (value || '')} onChangeText={(v) => onChange(v.split(',').map((s: string) => s.trim()))} placeholder="Misal: .pdf,.doc,.docx" />
              </YStack>
            )}
          />
        </>
      )}

      {type === 'checkbox' && (
        <XStack gap="$3">
          <YStack flex={1}>
            <InputNumber
              fieldConfig={{ id: `formSchema.fields.${index}.rules.min_selections`, label: 'Min Pilihan', type: 'number' }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
          <YStack flex={1}>
            <InputNumber
              fieldConfig={{ id: `formSchema.fields.${index}.rules.max_selections`, label: 'Max Pilihan', type: 'number' }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
        </XStack>
      )}

      {(type === 'checkbox' || type === 'radio') && (
        <InputDropdown
          fieldConfig={{
            id: `formSchema.fields.${index}.rules.options_layout`,
            label: 'Arah Tata Letak Pilihan (Layout)',
            type: 'dropdown',
            default_value: 'vertical',
            data_source: {
              type: 'static',
              options: [
                { label: 'Vertikal (Satu-satu ke bawah)', value: 'vertical' },
                { label: 'Horizontal (Berjejer ke samping)', value: 'horizontal' }
              ]
            }
          }}
          control={control as any}
          setValue={setValue as any}
        />
      )}

      {(type === 'dropdown' || type === 'checkbox' || type === 'radio') && (
        <YStack marginTop="$3" paddingTop="$3" borderTopWidth={1} borderColor="$borderColor">
          <Text fontWeight="600" fontSize={13} marginBottom="$2">Data Source (Pilihan)</Text>

          <InputDropdown
            fieldConfig={{
              id: `formSchema.fields.${index}.data_source.type`,
              label: 'Tipe Data',
              type: 'dropdown',
              default_value: 'static',
              data_source: {
                type: 'static',
                options: [
                  { label: 'Statis (Manual)', value: 'static' }
                ]
              }
            }}
            control={control as any}
            setValue={setValue as any}
          />

          {dsType === 'dynamic' ? (
            <YStack gap="$2">
              <InputText
                fieldConfig={{ id: `formSchema.fields.${index}.data_source.endpoint`, label: 'Endpoint API (Misal: /api/v1/...)', type: 'text' }}
                control={control as any}
                setValue={setValue as any}
              />
              <XStack gap="$3">
                <YStack flex={1}>
                  <InputText
                    fieldConfig={{ id: `formSchema.fields.${index}.data_source.label_key`, label: 'Label Key (Misal: name)', type: 'text' }}
                    control={control as any}
                    setValue={setValue as any}
                  />
                </YStack>
                <YStack flex={1}>
                  <InputText
                    fieldConfig={{ id: `formSchema.fields.${index}.data_source.value_key`, label: 'Value Key (Misal: id)', type: 'text' }}
                    control={control as any}
                    setValue={setValue as any}
                  />
                </YStack>
              </XStack>
            </YStack>
          ) : (
            <Controller
              name={`formSchema.fields.${index}.data_source.options`}
              control={control}
              render={({ field: { onChange: onOptsChange, value: optsValue } }) => {
                const opts = Array.isArray(optsValue) ? optsValue : [];
                return (
                  <YStack gap="$2.5" marginTop="$2">
                    <Label fontWeight="600" color="$textMain" fontSize={13}>Pilihan Statis ({type === 'radio' ? 'Radio Button' : type === 'checkbox' ? 'Checkbox' : 'Dropdown'})</Label>
                    <Button
                      size="$2.5"
                      theme="alt1"
                      onPress={() => onOptsChange([...opts, { label: '', value: '' }])}
                    >
                      Tambah Opsi
                    </Button>

                    <XStack fw="wrap" gap="$2.5" width="100%">
                      {opts.map((opt: any, optIdx: number) => (
                        <XStack
                          key={optIdx}
                          gap="$2"
                          alignItems="center"
                          width="49%"
                          $sm={{ width: '100%' }}
                        >
                          <Input
                            bg="$inputBackground"
                            bc="$borderLight"
                            bw={1}
                            h={42}
                            px="$3"
                            flex={1}
                            value={opt.label || ''}
                            onChangeText={(v) => {
                              const newOpts = [...opts];
                              newOpts[optIdx] = { ...newOpts[optIdx], label: v, value: v };
                              onOptsChange(newOpts);
                            }}
                            placeholder={`Opsi ${optIdx + 1}`}
                          />
                          <Button
                            h={42}
                            w={42}
                            circular
                            icon={Trash2}
                            backgroundColor="$red8"
                            onPress={() => {
                              const newOpts = [...opts];
                              newOpts.splice(optIdx, 1);
                              onOptsChange(newOpts);
                            }}
                          />
                        </XStack>
                      ))}
                    </XStack>
                  </YStack>
                );
              }}
            />
          )}
        </YStack>
      )}
    </YStack>
  );
};

export const FieldCard = memo(({ index, totalFields, move, remove }: Props) => {
  const { control, setValue } = useFormContext<TaskTemplateForm>();

  const InputText = FormComponentMap['text'];
  const InputDropdown = FormComponentMap['dropdown'];
  const InputNumber = FormComponentMap['number'];
  const InputSwitch = FormComponentMap['switch'];
  const InputDateTime = FormComponentMap['datetime'];


  // Watch current label to generate ID
  const label = useWatch({
    control,
    name: `formSchema.fields.${index}.label`,
  });

  useEffect(() => {
    if (label) {
      setValue(`formSchema.fields.${index}.id`, slugify(label), { shouldValidate: true });
    }
  }, [label, index, setValue]);

  const type = useWatch({
    control,
    name: `formSchema.fields.${index}.type`,
  }) || 'text';

  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const dateType = useWatch({
    control,
    name: `formSchema.fields.${index}.rules.date_type`,
  }) || 'datetime-local';

  return (
    <Card size="$4" borderWidth={1} borderColor="$borderColor" padding="$4" marginVertical="$2" backgroundColor="$background">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
        <Text fontWeight="bold">Field #{index + 1}</Text>
        <XStack gap="$2">
          <Button size="$2" circular icon={ArrowUp} onPress={() => move(index, index - 1)} disabled={index === 0} />
          <Button size="$2" circular icon={ArrowDown} onPress={() => move(index, index + 1)} disabled={index === totalFields - 1} />
          <Button size="$2" circular icon={Trash2} backgroundColor="$red8" onPress={() => remove(index)} />
        </XStack>
      </XStack>

      <YStack gap="$3">
        <XStack gap="$3">
          <YStack flex={1}>
            <InputText
              fieldConfig={{ id: `formSchema.fields.${index}.label`, label: 'Label Field', type: 'text', rules: { required: true } as any }}
              control={control as any}
              setValue={setValue as any}
            />
            <Controller
              name={`formSchema.fields.${index}.id`}
              control={control}
              render={({ field: { value } }) => (
                <XStack alignItems="center" gap="$1.5" marginTop={-4}>
                  <Lock size={12} color="$textMuted" />
                  <Text fontSize={12} color="$textMuted">id: {value || '-'}</Text>
                </XStack>
              )}
            />
          </YStack>

          <YStack flex={1}>
            <InputDropdown
              fieldConfig={{
                id: `formSchema.fields.${index}.type`,
                label: 'Tipe Input',
                type: 'dropdown',
                data_source: {
                  type: 'static',
                  options: [
                    { label: 'Text', value: 'text' },
                    { label: 'Text Area', value: 'textarea' },
                    { label: 'Number', value: 'number' },
                    { label: 'Date/Time', value: 'datetime' },
                    { label: 'Geolocation (GPS)', value: 'geolocation' },
                    { label: 'Camera', value: 'camera' },
                    { label: 'File Upload', value: 'file' },
                    { label: 'Digital Signature', value: 'signature' },
                    { label: 'Dropdown', value: 'dropdown' },
                    { label: 'Checkbox', value: 'checkbox' },
                    { label: 'Radio Button', value: 'radio' },
                  ]
                }
              }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
        </XStack>

        {/* Layout Kolom */}
        <XStack gap="$3" marginTop={-4}>
          <YStack flex={1}>
            <InputDropdown
              fieldConfig={{
                id: `formSchema.fields.${index}.columns`,
                label: 'Lebar Kolom (Grid Max 3)',
                type: 'dropdown',
                default_value: 3,
                columns: 1,
                data_source: {
                  type: 'static',
                  options: [
                    { label: 'Kecil (30% baris)', value: 1 },
                    { label: 'Sedang (60% baris)', value: 2 },
                    { label: 'Penuh (90% baris)', value: 3 }
                  ]
                }
              }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
        </XStack>

        {/* Aturan Validasi Khusus (Rules) */}
        <YStack marginTop="$1" marginBottom={0} padding={0}>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$3"
            paddingVertical="$2.5"
            backgroundColor={isRulesOpen ? "$background" : "$backgroundHover"}
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$3"
            onPress={() => setIsRulesOpen(!isRulesOpen)}
            cursor="pointer"
            hoverStyle={{ backgroundColor: "$backgroundPress" }}
            pressStyle={{ opacity: 0.8 }}
            marginBottom={isRulesOpen ? "$2.5" : 0}
          >
            <Text fontWeight="600" color={isRulesOpen ? "$primary" : "$textMain"} fontSize={13}>
              Penyetelan Input ({type.toUpperCase()})
            </Text>
            {isRulesOpen ? <ChevronUp size={18} color="$primary" /> : <ChevronDown size={18} color="$textMuted" />}
          </XStack>

          {isRulesOpen && (
            <FieldRulesPanel index={index} type={type} dateType={dateType} />
          )}
        </YStack>
      </YStack>
    </Card>
  );
});

FieldCard.displayName = 'FieldCard';

