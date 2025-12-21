'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface CardProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  children?: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = 'default', padding = 'md', hoverable = false, className, ...props },
    ref
  ) => {
    const baseStyles = 'rounded-xl overflow-hidden transition-all duration-200';

    const variantStyles = {
      default: 'bg-gray-800/50 backdrop-blur-sm',
      bordered: 'bg-gray-800/50 backdrop-blur-sm border border-gray-700',
      elevated: 'bg-gray-800 shadow-xl',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hoverable
      ? 'cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1'
      : '';

    return (
      <motion.div
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          hoverStyles,
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
