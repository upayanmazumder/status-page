'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { error, helperText, leftIcon, rightIcon, fullWidth = true, disabled, className, ...props },
    ref
  ) => {
    const hasError = !!error;

    const baseStyles =
      'px-4 py-3 rounded-lg bg-gray-900/80 text-white border transition-all duration-200 focus:outline-none focus:ring-2 backdrop-blur-sm';

    const stateStyles = hasError
      ? 'border-red-500 focus:ring-red-500 bg-red-900/10'
      : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/50 hover:border-gray-500';

    const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>
          )}

          <motion.input
            ref={ref}
            className={clsx(
              baseStyles,
              stateStyles,
              iconPadding,
              widthStyles,
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            disabled={disabled}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 text-sm text-red-400"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.div>
        )}

        {helperText && !error && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
