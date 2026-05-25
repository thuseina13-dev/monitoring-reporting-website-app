import React from 'react';
import './WebDatePicker.css';

interface WebDatePickerProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  hasError?: boolean;
  type?: 'date' | 'datetime-local' | 'time';
  title?: string;
  placeholder?: string;
}

export const WebDatePicker: React.FC<WebDatePickerProps> = ({
  value,
  onChange,
  disabled,
  min,
  max,
  hasError,
  type = 'datetime-local',
  title = type === 'date' ? 'Pilih tanggal' : type === 'time' ? 'Pilih waktu' : 'Pilih tanggal dan waktu',
  placeholder = type === 'date' ? 'YYYY-MM-DD' : type === 'time' ? 'HH:MM' : 'YYYY-MM-DD HH:MM'
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      min={min}
      max={max}
      className={`web-date-picker${hasError ? ' has-error' : ''}`}
      title={title}
      placeholder={placeholder}
    />
  );
};
