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
  | 'checkbox';

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
}

export interface FormSchema {
  fields: FormField[];
}
