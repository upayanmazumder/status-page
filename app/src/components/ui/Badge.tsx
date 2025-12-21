'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface BadgeProps
  extends Omit<
    HTMLAttributes<HTMLSpanElement>,
    'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot = false, className, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap';

    const variantStyles = {
      default: 'bg-gray-700 text-gray-200',
      primary: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
      success: 'bg-green-600/20 text-green-400 border border-green-500/30',
      warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
      danger: 'bg-red-600/20 text-red-400 border border-red-500/30',
      info: 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    const dotColors = {
      default: 'bg-gray-400',
      primary: 'bg-blue-400',
      success: 'bg-green-400',
      warning: 'bg-yellow-400',
      danger: 'bg-red-400',
      info: 'bg-cyan-400',
    };

    return (
      <motion.span
        ref={ref}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {dot && <span className={clsx('w-2 h-2 rounded-full', dotColors[variant])} />}
        {children}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
