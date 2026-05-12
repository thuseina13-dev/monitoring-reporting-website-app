export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'datetime'
  | 'geolocation'
  | 'camera'
  | 'file'
  | 'signature'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'password';

export interface ShowIfCondition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: any;
}

export interface DataSourceDependsOn {
  field: string;
  param_name: string;
}

export type DataSource =
  | {
      type: 'static';
      options: { label: string; value: any }[];
      depends_on?: DataSourceDependsOn;
    }
  | {
      type: 'dynamic';
      endpoint: string;
      label_key: string;
      value_key: string;
      depends_on?: DataSourceDependsOn;
      pagination?: 'cursor' | 'offset';
    };

export interface FormFieldRules {
  required?: boolean;
  allow_gallery?: boolean;
  max_size_mb?: number;
  [key: string]: any;
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  is_locked?: boolean;
  default_value?: string | any;
  rules?: FormFieldRules;
  show_if?: ShowIfCondition;
  data_source?: DataSource;
  is_multiple?: boolean;
  columns?: number;
  icon_left?: string;
  show_preview?: boolean;
}

export interface FormSection {
  title?: string;
  field_ids: string[];
}

export interface FormSchema {
  title?: string;
  fields: FormField[];
  sections?: FormSection[];
  submit_label?: string;
  hide_cancel?: boolean;
  use_gradient?: boolean;
  columns?: number;
}
