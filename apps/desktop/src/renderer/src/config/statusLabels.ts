/**
 * Unified Status Configuration
 *
 * Provides consistent styling and labels for UniversalStatus across all components.
 * Used by: Milestones, Field Trips, Library, Assessments
 */

import type { UniversalStatus } from "../../../shared/types";

export const universalStatusConfig: Record<
  UniversalStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: string;
  }
> = {
  not_started: {
    label: "Not Started",
    color: "text-neutral-textSecondary",
    bg: "bg-neutral-backgroundDeep",
    icon: "○",
  },
  in_progress: {
    label: "In Progress",
    color: "text-status-warning",
    bg: "bg-status-warningLight",
    icon: "◐",
  },
  completed: {
    label: "Completed",
    color: "text-status-success",
    bg: "bg-status-successLight",
    icon: "●",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-status-error",
    bg: "bg-status-errorLight",
    icon: "×",
  },
};

/**
 * Helper function to get status badge classes
 */
export function getStatusBadgeClasses(status: UniversalStatus): string {
  const config = universalStatusConfig[status];
  return `${config.bg} ${config.color}`;
}

/**
 * Helper function to render status badge
 */
export function getStatusLabel(status: UniversalStatus): string {
  return universalStatusConfig[status].label;
}

/**
 * Helper function to get status icon
 */
export function getStatusIcon(status: UniversalStatus): string {
  return universalStatusConfig[status].icon;
}
