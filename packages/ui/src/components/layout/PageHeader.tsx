/**
 * PageHeader Component
 *
 * Standard page header with title, subtitle, and optional action button.
 * Provides consistent layout across all pages.
 */

import { ReactNode } from "react";
import { clsx } from "clsx";

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle or description */
  subtitle?: ReactNode;
  /** Optional action button or component */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={clsx("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-text">{title}</h1>
          {subtitle && <p className="text-neutral-textSecondary mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    </div>
  );
}
