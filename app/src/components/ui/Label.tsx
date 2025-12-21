'use client';

import { LabelHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  icon?: React.ReactNode;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, icon, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx(
          'text-sm font-medium text-gray-300 mb-3 flex items-center gap-2',
          className
        )}
        {...props}
      >
        {icon && <span className="text-blue-400">{icon}</span>}
        <span>
          {children}
          {required && <span className="text-red-400 ml-1">*</span>}
        </span>
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label;
