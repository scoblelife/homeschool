/**
 * Alert Component
 *
 * Status messages with semantic color variants using design tokens.
 * Supports icons, dismissible option, and different styles.
 */

import { ReactNode } from "react";
import { clsx } from "clsx";

export type AlertVariant = "success" | "warning" | "error" | "info" | "default";
export type AlertStyle = "filled" | "outlined" | "subtle";

export interface AlertProps {
  /** Content of the alert */
  children: ReactNode;
  /** Semantic variant */
  variant?: AlertVariant;
  /** Visual style */
  style?: AlertStyle;
  /** Optional title */
  title?: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Whether alert can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const variantClasses: Record<AlertVariant, Record<AlertStyle, string>> = {
  success: {
    filled: "bg-green-500 text-white border-green-600",
    outlined: "bg-white text-green-800 border-green-500",
    subtle: "bg-green-50 text-green-800 border-green-200",
  },
  warning: {
    filled: "bg-amber-500 text-white border-amber-600",
    outlined: "bg-white text-amber-800 border-amber-500",
    subtle: "bg-amber-50 text-amber-800 border-amber-200",
  },
  error: {
    filled: "bg-red-500 text-white border-red-600",
    outlined: "bg-white text-red-800 border-red-500",
    subtle: "bg-red-50 text-red-800 border-red-200",
  },
  info: {
    filled: "bg-blue-500 text-white border-blue-600",
    outlined: "bg-white text-blue-800 border-blue-500",
    subtle: "bg-blue-50 text-blue-800 border-blue-200",
  },
  default: {
    filled: "bg-gray-500 text-white border-gray-600",
    outlined: "bg-white text-gray-800 border-gray-500",
    subtle: "bg-gray-50 text-gray-800 border-gray-200",
  },
};

const iconColorClasses: Record<AlertVariant, Record<AlertStyle, string>> = {
  success: {
    filled: "text-white",
    outlined: "text-green-600",
    subtle: "text-green-600",
  },
  warning: {
    filled: "text-white",
    outlined: "text-amber-600",
    subtle: "text-amber-600",
  },
  error: {
    filled: "text-white",
    outlined: "text-red-600",
    subtle: "text-red-600",
  },
  info: {
    filled: "text-white",
    outlined: "text-blue-600",
    subtle: "text-blue-600",
  },
  default: {
    filled: "text-white",
    outlined: "text-gray-600",
    subtle: "text-gray-600",
  },
};

export function Alert({
  children,
  variant = "default",
  style = "subtle",
  title,
  icon,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        "rounded-lg border p-4 flex gap-3",
        variantClasses[variant][style],
        className,
      )}
    >
      {/* Icon */}
      {icon && (
        <div
          className={clsx("flex-shrink-0", iconColorClasses[variant][style])}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className={clsx(title ? "text-sm" : "")}>{children}</div>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className={clsx(
            "flex-shrink-0 rounded p-1 hover:bg-black/10 transition-colors",
            style === "filled" ? "text-white" : "",
          )}
          aria-label="Dismiss"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
