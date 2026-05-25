import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { YStack, XStack, Text, Card } from 'tamagui';
import { TaskTemplateForm } from './types';
import { FormComponentMap } from '../dynamicForm/FormComponentMap';
import { COLORS } from '../../constants/theme';
import { Info } from '@tamagui/lucide-icons';

export const Step3Procedures = () => {
  const { control, setValue } = useFormContext<TaskTemplateForm>();

  const requiresReview = useWatch({
    control,
    name: 'procedures.workflow.requires_review',
    defaultValue: false
  });

  const InputDropdown = FormComponentMap['dropdown'];
  const InputCheckbox = FormComponentMap['checkbox'];
  const InputSwitch = FormComponentMap['switch'];
  const InputDateTime = FormComponentMap['datetime'];
  const InputNumber = FormComponentMap['number'];
  const InputTextArea = FormComponentMap['textarea'];
  const InputFile = FormComponentMap['file'];

  return (
    <YStack padding="$4" gap="$4">
      <Text fontSize="$6" fontWeight="bold">Prosedur & Alur Kerja</Text>

      {/* Pengaturan Jadwal */}
      <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$4" backgroundColor="$background" gap="$3">
        <Text fontSize="$5" fontWeight="600" color={COLORS.textMain}>Pengaturan Jadwal</Text>

        <XStack gap="$4" flexWrap="wrap">
          <YStack flex={1} minWidth={200}>
            <InputDropdown
              fieldConfig={{
                id: 'procedures.generation.strategy',
                label: 'Strategi Generasi',
                type: 'dropdown' as any,
                data_source: {
                  type: 'static',
                  options: [
                    { label: 'JIT Backend', value: 'jit_backend' }
                  ]
                },
                rules: { required: true }
              }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>

          <YStack flex={2} minWidth={250}>
            <InputCheckbox
              fieldConfig={{
                id: 'procedures.generation.active_days',
                label: 'Hari Aktif Tugas',
                type: 'checkbox' as any,
                columns: 4,

                data_source: {
                  type: 'static',
                  options: [
                    { label: 'Senin', value: 1 },
                    { label: 'Selasa', value: 2 },
                    { label: 'Rabu', value: 3 },
                    { label: 'Kamis', value: 4 },
                    { label: 'Jumat', value: 5 },
                    { label: 'Sabtu', value: 6 },
                    { label: 'Minggu', value: 7 },
                  ]
                },
                rules: { required: true, min_selections: 1, options_layout: "horizontal" }
              }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
        </XStack>

        <XStack backgroundColor={COLORS.primaryLight} padding="$3" borderRadius="$2" gap="$2" alignItems="center">
          <Info size={16} color={COLORS.primary} />
          <Text fontSize={12} color={COLORS.primary} flex={1}>
            JIT: Sistem membuat tugas secara otomatis tepat setalah pengguna masuk ke aplikasi.
          </Text>
        </XStack>

        <YStack borderTopWidth={1} borderColor={COLORS.borderLight} paddingTop="$3" marginTop="$2">
          <InputSwitch
            fieldConfig={{
              id: 'procedures.submission_rules.multi_entry',
              label: 'Dapat Diisi Berulang',
              type: 'switch' as any
            }}
            control={control as any}
            setValue={setValue as any}
          />
          <Text fontSize={12} color={COLORS.textMuted} marginTop="$-2">
            Pekerja dapat mengirim form ini berkali-kali
          </Text>
        </YStack>
      </Card>

      {/* Batasan Waktu & Instruksi */}
      <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$4" backgroundColor="$background" gap="$3">
        <Text fontSize="$5" fontWeight="600" color={COLORS.textMain}>Batasan Waktu & Instruksi</Text>

        <XStack gap="$4" flexWrap="wrap">
          <YStack flex={1} minWidth={150}>
            <InputDateTime
              fieldConfig={{
                id: 'procedures.submission_rules.start_at',
                label: 'Waktu Mulai',
                type: 'datetime' as any,
                rules: { date_type: 'time' }
              }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>

          <YStack flex={2} minWidth={200}>
            <InputDropdown
              fieldConfig={{
                id: 'procedures.submission_rules.start_time_ref',
                label: 'Referensi Mulai',
                type: 'dropdown' as any,
                default_value: 'none',
                data_source: {
                  type: 'static',
                  options: [
                    { label: 'Saat Tugas Dibuat Waktu Dimulai', value: 'on_generated' },
                    { label: 'Saat Tugas Pertama kali Dibuka', value: 'on_started' },
                    { label: 'Tidak Ada Batas Waktu (None)', value: 'none' }
                  ]
                },
                rules: { required: true }
              }}
              control={control as any}
              setValue={setValue as any}
            />
          </YStack>
        </XStack>

        <YStack width="50%" minWidth={150}>
          <InputNumber
            fieldConfig={{
              id: 'procedures.submission_rules.duration_hours',
              label: 'Durasi Pengerjaan (SLA) dalam jam (Opsional)',
              type: 'number' as any,
              rules: { min: 1 }
            }}
            control={control as any}
            setValue={setValue as any}
          />
        </YStack>

        <InputTextArea
          fieldConfig={{
            id: 'procedures.submission_rules.instructions',
            label: 'Instruksi Tambahan (Opsional)',
            type: 'textarea' as any,
            columns: 2
          }}
          control={control as any}
          setValue={setValue as any}
        />

        <InputFile
          fieldConfig={{
            id: 'procedures.submission_rules.support_file',
            label: 'Dokumen Pendukung (PDF atau Gambar) (Opsional)',
            type: 'file' as any,
            show_preview: true,
            columns: 1,
            rules: {
              allowed_extensions: ['pdf', 'jpg', 'jpeg', 'png'],
              max_size_mb: 10
            } as any
          }}
          control={control as any}
          setValue={setValue as any}
        />
      </Card>

      {/* Alur Persetujuan & SOP */}
      <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$4" backgroundColor="$background" gap="$3">
        <Text fontSize="$5" fontWeight="600" color={COLORS.textMain}>Alur Persetujuan & SOP</Text>

        <InputSwitch
          fieldConfig={{
            id: 'procedures.workflow.requires_review',
            label: 'Wajib Melalui Proses Reviuw',
            type: 'switch' as any,
            default_value: false,
          }}
          control={control as any}
          setValue={setValue as any}
        />

        {requiresReview && (
          <InputDropdown
            fieldConfig={{
              id: 'procedures.workflow.approval_role',
              label: 'Role Penyetuju',
              type: 'dropdown' as any,
              data_source: {
                type: 'dynamic',
                endpoint: '/roles',
                label_key: 'name',
                value_key: 'id'
              },
              rules: { required: true }
            }}
            control={control as any}
            setValue={setValue as any}
          />
        )}
      </Card>

    </YStack>
  );
};
