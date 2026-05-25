import React, { useState } from 'react';
import { YStack, Button, XStack, ScrollView, Spinner, Text } from 'tamagui';
import { useRouter } from 'expo-router';
import { useFormContext } from 'react-hook-form';
import { useToastController } from '@tamagui/toast';
import ListHeader from '../../../../components/layout/ListHeader';
import { FormBuilderProvider } from '../../../../components/formBuilder/FormBuilderProvider';
import { Step1BasicInfo } from '../../../../components/formBuilder/Step1BasicInfo';
import { Step2Fields } from '../../../../components/formBuilder/Step2Fields';
import { Step3Procedures } from '../../../../components/formBuilder/Step3Procedures';
import { taskDefinitionService } from '../../../../services/api/taskDefinitionService';
import { TaskTemplateForm } from '../../../../components/formBuilder/types';
import { storageService } from '../../../../services/api/storageService';

const StepperForm = () => {
  const router = useRouter();
  const toast = useToastController();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleSubmit, trigger, control } = useFormContext<TaskTemplateForm>();

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['name', 'description', 'isActive', 'isMandatory']);
    } else if (step === 2) {
      isValid = await trigger(['formSchema']);
      if (isValid) {
        const fields = control._formValues.formSchema?.fields || [];
        const ids = fields.map((f: any) => f?.id).filter(Boolean);
        const hasDuplicates = ids.some((id: string, index: number) => ids.indexOf(id) !== index);
        if (hasDuplicates) {
          toast.show('Validasi', { message: 'ID Field harus unik! Pastikan Label setiap field berbeda agar tidak menghasilkan ID yang sama.', type: 'error' });
          isValid = false;
        }
      }
    } else {
      isValid = true;
    }

    if (isValid) {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: TaskTemplateForm) => {
    try {
      setIsSubmitting(true);
      const finalData = { ...data };

      // Handle file upload for procedures.submission_rules.support_file if it is a new file object
      const supportFile = finalData.procedures?.submission_rules?.support_file;
      if (supportFile && typeof supportFile === 'object' && (supportFile as any).isFileObject) {
        const uploadResult = await storageService.upload(
          (supportFile as any).uri,
          (supportFile as any).modelName || 'general',
          (supportFile as any).isPublic
        );
        finalData.procedures.submission_rules.support_file = uploadResult.data.file_url;
      }

      // Convert duration_hours to number or delete/nullify it if blank
      const durationHours = finalData.procedures?.submission_rules?.duration_hours;
      if (durationHours === '' || durationHours === null || durationHours === undefined) {
        if (finalData.procedures?.submission_rules) {
          delete (finalData.procedures.submission_rules as any).duration_hours;
        }
      } else {
        if (finalData.procedures?.submission_rules) {
          finalData.procedures.submission_rules.duration_hours = Number(durationHours);
        }
      }

      if (finalData.procedures?.workflow?.approval_role && !Array.isArray(finalData.procedures.workflow.approval_role)) {
        finalData.procedures.workflow.approval_role = [finalData.procedures.workflow.approval_role as unknown as string];
      }
      console.log('Submitting Payload:', JSON.stringify(finalData, null, 2));
      await taskDefinitionService.createTaskDefinition(finalData);
      toast.show('Berhasil', { message: 'Template Berhasil Disimpan!', type: 'success' });
      router.push('/manager/task-templates');
    } catch (error: any) {
      console.error(error);
      const serverError = error?.response?.data;
      let errMsg = 'Gagal menyimpan template';
      if (serverError) {
        if (Array.isArray(serverError.errors) && serverError.errors.length > 0) {
          const details = serverError.errors.map((e: any) => e.summary || e.message).join(', ');
          errMsg = `${serverError.message || 'Gagal'}: ${details}`;
        } else if (serverError.message) {
          errMsg = serverError.message;
        }
      }
      toast.show('Gagal', { message: errMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <ListHeader title="Tambah Template Tugas" />
      <YStack padding="$4" paddingBottom="$0">
        <Text color="$colorFocus" textAlign="center" fontSize={14}>
          Lengkapi data di bawah ini untuk membuat template tugas baru.
        </Text>
      </YStack>

      {/* Step 1 & 3: scroll seluruh halaman. Step 2: scroll internal di dalam komponen */}
      {step === 1 ? (
        <ScrollView flex={1}>
          <Step1BasicInfo />
        </ScrollView>
      ) : step === 2 ? (
        <Step2Fields />
      ) : (
        <ScrollView flex={1}>
          <Step3Procedures />
        </ScrollView>
      )}

      <XStack padding="$4" justifyContent={step > 1 ? "space-between" : "flex-end"} borderTopWidth={1} borderColor="$borderColor">
        {step > 1 && (
          <Button onPress={handlePrev}>Kembali</Button>
        )}
        {step < 3 ? (
          <Button theme="active" onPress={handleNext}>Selanjutnya</Button>
        ) : (
          <Button theme="active" onPress={handleSubmit(onSubmit)} icon={isSubmitting ? () => <Spinner color="white" /> : undefined}>
            Simpan Template
          </Button>
        )}
      </XStack>
    </YStack>
  );
};

export default function CreateTaskTemplateScreen() {
  return (
    <FormBuilderProvider>
      <StepperForm />
    </FormBuilderProvider>
  );
}
