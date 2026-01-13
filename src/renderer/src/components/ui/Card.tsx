/**
 * Card Component
 *
 * Container component for grouping related content.
 * Matches the mobile Card component design language.
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: CardPadding
  hover?: boolean
  interactive?: boolean
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, padding = 'md', hover = false, interactive = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          // Base styles
          'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
          // Padding
          paddingClasses[padding],
          // Hover effect
          hover && 'transition-shadow duration-200 hover:shadow-md',
          // Interactive (clickable)
          interactive && 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 active:scale-[0.99]',
          // Custom classes
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('mb-4', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx('text-base font-semibold text-gray-900 dark:text-white', className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

CardTitle.displayName = 'CardTitle'

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p ref={ref} className={clsx('text-sm text-gray-500 dark:text-gray-400 mt-1', className)} {...props}>
        {children}
      </p>
    )
  }
)

CardDescription.displayName = 'CardDescription'

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx(className)} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'
