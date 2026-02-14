/**
 * Badge Component
 *
 * Small label for status indicators and categorization.
 * Matches the mobile Badge component design language.
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-neutral-backgroundDeep text-neutral-textSecondary',
  primary: 'bg-fuchsia-100 text-fuchsia-700',
  secondary: 'bg-sky-100 text-sky-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-textSecondary',
  primary: 'bg-fuchsia-500',
  secondary: 'bg-sky-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot = false, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          // Base styles
          'inline-flex items-center font-medium rounded',
          // Variant styles
          variantClasses[variant],
          // Size styles
          sizeClasses[size],
          // Gap for dot
          dot && 'gap-1.5',
          // Custom classes
          className
        )}
        {...props}
      >
        {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Student-specific badges with their assigned colors
export type StudentColor = 'fuchsia' | 'teal' | 'blue' | 'orange' | 'purple' | 'green'

const studentColorClasses: Record<StudentColor, string> = {
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
  teal: 'bg-teal-100 text-teal-700',
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
}

export interface StudentBadgeProps extends Omit<BadgeProps, 'variant'> {
  color: StudentColor
}

export const StudentBadge = forwardRef<HTMLSpanElement, StudentBadgeProps>(
  ({ children, color, size = 'md', className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          // Base styles
          'inline-flex items-center font-medium rounded',
          // Student color styles
          studentColorClasses[color],
          // Size styles
          sizeClasses[size],
          // Custom classes
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

StudentBadge.displayName = 'StudentBadge'
