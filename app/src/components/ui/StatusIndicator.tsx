'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

export interface StatusIndicatorProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  status: 'online' | 'offline' | 'unknown' | 'warning';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, showLabel = true, size = 'md', pulse = false, className, ...props }, ref) => {
    const config = {
      online: {
        icon: CheckCircle,
        color: 'text-green-400',
        bg: 'bg-green-600/20',
        border: 'border-green-500/30',
        label: 'Online',
      },
      offline: {
        icon: XCircle,
        color: 'text-red-400',
        bg: 'bg-red-600/20',
        border: 'border-red-500/30',
        label: 'Offline',
      },
      warning: {
        icon: AlertCircle,
        color: 'text-yellow-400',
        bg: 'bg-yellow-600/20',
        border: 'border-yellow-500/30',
        label: 'Warning',
      },
      unknown: {
        icon: HelpCircle,
        color: 'text-gray-400',
        bg: 'bg-gray-600/20',
        border: 'border-gray-500/30',
        label: 'Unknown',
      },
    };

    const sizeStyles = {
      sm: 'text-sm gap-1.5',
      md: 'text-base gap-2',
      lg: 'text-lg gap-2.5',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const statusConfig = config[status];
    const Icon = statusConfig.icon;

    return (
      <motion.div
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full px-3 py-1.5 border',
          statusConfig.bg,
          statusConfig.border,
          sizeStyles[size],
          className
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        <motion.div
          animate={pulse ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: pulse ? Infinity : 0, duration: 2 }}
        >
          <Icon className={clsx(iconSizes[size], statusConfig.color)} />
        </motion.div>
        {showLabel && (
          <span className={clsx('font-semibold', statusConfig.color)}>{statusConfig.label}</span>
        )}
      </motion.div>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export default StatusIndicator;
