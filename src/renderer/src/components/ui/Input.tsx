/**
 * Input Component
 *
 * Form input elements with consistent styling.
 * Matches the mobile Input component design language.
 */

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize
  error?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
}

const baseClasses =
  'block w-full border rounded-lg shadow-sm transition-all duration-200 ' +
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-gray-900 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900 ' +
  'placeholder:text-gray-400 dark:placeholder:text-gray-500'

const stateClasses = {
  default: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-fuchsia-500 focus:border-fuchsia-500',
  error: 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'md', error = false, leftIcon, rightIcon, className, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              baseClasses,
              error ? stateClasses.error : stateClasses.default,
              sizeClasses[size],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        className={clsx(
          baseClasses,
          error ? stateClasses.error : stateClasses.default,
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: InputSize
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = 'md', error = false, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx(
          baseClasses,
          error ? stateClasses.error : stateClasses.default,
          sizeClasses[size],
          'resize-none',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required = false, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx('block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1', className)}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )
  }
)

Label.displayName = 'Label'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

/**
 * Render a labeled form field containing content and contextual feedback.
 *
 * @param label - Content for the field label (text or React node)
 * @param htmlFor - The id of the associated form control to forward to the label
 * @param required - If true, shows a required indicator on the label
 * @param error - Error message to display below the children; when present it is shown in red and the hint is suppressed
 * @param hint - Supplemental hint text shown below the children when no error is present
 * @param children - Field input or other controls to render beneath the label
 * @returns A JSX element combining the label, children, and either an error message or hint
 */
export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
}