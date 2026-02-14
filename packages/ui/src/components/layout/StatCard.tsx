/**
 * StatCard Component
 *
 * Dashboard metric display card. Shows a value with label and
 * optional trend indicator.
 */

import { ReactNode } from "react";
import { clsx } from "clsx";
import { Card } from "../ui/Card";

export interface StatCardProps {
  /** The stat value */
  value: string | number;
  /** Label for the stat */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional trend indicator */
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  /** Optional color for the value */
  color?: "default" | "primary" | "success" | "warning" | "error";
  /** Additional CSS classes */
  className?: string;
}

const colorClasses = {
  default: "text-neutral-text",
  primary: "text-fuchsia-600",
  success: "text-green-600",
  warning: "text-amber-600",
  error: "text-red-600",
};

export function StatCard({
  value,
  label,
  icon,
  trend,
  color = "default",
  className,
}: StatCardProps) {
  return (
    <Card padding="lg" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={clsx("text-3xl font-bold", colorClasses[color])}>
            {value}
          </div>
          <div className="text-sm text-neutral-textSecondary mt-1">{label}</div>
          {trend && (
            <div
              className={clsx(
                "inline-flex items-center gap-1 text-xs font-medium mt-2",
                trend.direction === "up" ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.direction === "up" ? (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && <div className="text-neutral-textTertiary">{icon}</div>}
      </div>
    </Card>
  );
}
