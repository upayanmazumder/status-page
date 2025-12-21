'use client';

import { forwardRef } from 'react';
import Input, { InputProps } from './Input';
import Label, { LabelProps } from './Label';

export interface FormFieldProps extends InputProps {
  label?: string;
  labelIcon?: React.ReactNode;
  required?: boolean;
  labelProps?: Omit<LabelProps, 'children' | 'required' | 'icon'>;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, labelIcon, required, labelProps, id, ...inputProps }, ref) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required} icon={labelIcon} {...labelProps}>
            {label}
          </Label>
        )}
        <Input ref={ref} id={inputId} {...inputProps} />
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
