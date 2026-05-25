import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { TaskTemplateForm } from './types';

interface Props {
  children: React.ReactNode;
  defaultValues?: Partial<TaskTemplateForm>;
}

const baseDefaultValues: TaskTemplateForm = {
  name: '',
  description: '',
  isActive: true,
  isMandatory: false,
  formSchema: {
    fields: [],
  },
  procedures: {
    generation: {
      strategy: 'jit_backend',
      active_days: [1, 2, 3, 4, 5],
    },
    submission_rules: {
      multi_entry: false,
      start_at: null,
      duration_hours: null,
      start_time_ref: 'none',
      instructions: '',
      support_file: '',
    },
    workflow: {
      requires_review: false,
      approval_role: [],
    },
  },
};

export const FormBuilderProvider: React.FC<Props> = ({ children, defaultValues }) => {
  const methods = useForm<TaskTemplateForm>({
    defaultValues: defaultValues
      ? {
        ...baseDefaultValues,
        ...defaultValues,
        formSchema: {
          ...baseDefaultValues.formSchema,
          ...defaultValues.formSchema,
        },
        procedures: {
          ...baseDefaultValues.procedures,
          ...defaultValues.procedures,
          generation: {
            ...baseDefaultValues.procedures?.generation,
            ...defaultValues.procedures?.generation,
          },
          submission_rules: {
            ...baseDefaultValues.procedures?.submission_rules,
            ...defaultValues.procedures?.submission_rules,
          },
          workflow: {
            ...baseDefaultValues.procedures?.workflow,
            ...defaultValues.procedures?.workflow,
          },
        },
      }
      : baseDefaultValues,
  });

  return (
    <FormProvider {...methods}>
      {children}
    </FormProvider>
  );
};

