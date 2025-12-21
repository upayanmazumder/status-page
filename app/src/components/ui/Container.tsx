'use client';

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centerContent?: boolean;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = 'lg', centerContent = false, className, ...props }, ref) => {
    const sizeStyles = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'mx-auto px-4 sm:px-6 lg:px-8 w-full',
          sizeStyles[size],
          centerContent && 'flex items-center justify-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export default Container;
