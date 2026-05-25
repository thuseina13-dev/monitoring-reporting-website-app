import { FormField } from "../dynamicForm";


export interface ProceduresConfig {
  generation: {
    strategy: string;
    active_days: number[];
  };
  submission_rules: {
    multi_entry: boolean;
    start_at: string | null;
    duration_hours?: number | null | string;
    start_time_ref: 'on_generated' | 'on_started' | 'none';
    instructions: string;
    support_file: any;
  };
  workflow: {
    requires_review: boolean;
    approval_role: string[];
  };
}

export interface TaskTemplateForm {
  name: string;
  description: string;
  isActive: boolean;
  isMandatory: boolean;
  formSchema: {
    fields: FormField[];
  };
  procedures: ProceduresConfig;
}
