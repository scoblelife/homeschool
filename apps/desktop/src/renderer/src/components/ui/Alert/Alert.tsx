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
    filled: "bg-status-success text-white border-status-successDark",
    outlined: "bg-white text-status-successDark border-status-success",
    subtle:
      "bg-status-successLight text-status-successDark border-status-success/30",
  },
  warning: {
    filled: "bg-status-warning text-white border-status-warningDark",
    outlined: "bg-white text-status-warningDark border-status-warning",
    subtle:
      "bg-status-warningLight text-status-warningDark border-status-warning/30",
  },
  error: {
    filled: "bg-status-error text-white border-status-errorDark",
    outlined: "bg-white text-status-errorDark border-status-error",
    subtle: "bg-status-errorLight text-status-errorDark border-status-error/30",
  },
  info: {
    filled: "bg-status-info text-white border-status-infoDark",
    outlined: "bg-white text-status-infoDark border-status-info",
    subtle: "bg-status-infoLight text-status-infoDark border-status-info/30",
  },
  default: {
    filled: "bg-neutral-text text-white border-neutral-textLight",
    outlined: "bg-white text-neutral-text border-neutral-border",
    subtle: "bg-neutral-background text-neutral-text border-neutral-border",
  },
};

const iconColorClasses: Record<AlertVariant, Record<AlertStyle, string>> = {
  success: {
    filled: "text-white",
    outlined: "text-status-success",
    subtle: "text-status-success",
  },
  warning: {
    filled: "text-white",
    outlined: "text-status-warning",
    subtle: "text-status-warning",
  },
  error: {
    filled: "text-white",
    outlined: "text-status-error",
    subtle: "text-status-error",
  },
  info: {
    filled: "text-white",
    outlined: "text-status-info",
    subtle: "text-status-info",
  },
  default: {
    filled: "text-white",
    outlined: "text-neutral-textLight",
    subtle: "text-neutral-textLight",
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
