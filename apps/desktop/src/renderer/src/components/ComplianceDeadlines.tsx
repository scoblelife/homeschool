/**
 * Compliance Deadlines Component
 *
 * Displays upcoming filing deadlines based on user's state.
 * Shows countdown and allows marking deadlines as completed.
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface Deadline {
  name: string;
  date: Date;
  description: string;
  daysUntil: number;
  completed?: boolean;
}

interface ComplianceDeadlinesProps {
  className?: string;
  compact?: boolean;
}

export function ComplianceDeadlines({
  className = "",
  compact = false,
}: ComplianceDeadlinesProps) {
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [completedDeadlines, setCompletedDeadlines] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeadlines();
    loadCompletedDeadlines();
  }, []);

  const loadDeadlines = async () => {
    setIsLoading(true);
    try {
      // Get user's selected state
      const savedState = await window.api.getSetting("homeschool_state");
      if (!savedState) {
        setIsLoading(false);
        return;
      }

      setStateCode(savedState);

      // Get state requirements and deadlines
      const requirements =
        await window.api.complianceGetStateRequirements(savedState);
      if (requirements) {
        setStateName(requirements.state);
      }

      const upcomingDeadlines =
        await window.api.complianceGetUpcomingDeadlines(savedState);

      // Convert to our Deadline format
      const formattedDeadlines = upcomingDeadlines.map((d) => ({
        name: d.name,
        date: new Date(d.date),
        description: d.description,
        daysUntil: d.daysUntil,
      }));

      setDeadlines(formattedDeadlines);
    } catch (err) {
      console.error("[ComplianceDeadlines] Failed to load:", err);
    }
    setIsLoading(false);
  };

  const loadCompletedDeadlines = async () => {
    try {
      const saved = await window.api.getSetting("completed_deadlines");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out deadlines from previous years
        const currentYear = new Date().getFullYear();
        const valid = parsed.filter((d: string) => {
          const [, year] = d.split("_");
          return parseInt(year) >= currentYear;
        });
        setCompletedDeadlines(new Set(valid));
      }
    } catch (err) {
      console.error("[ComplianceDeadlines] Failed to load completed:", err);
    }
  };

  const toggleDeadlineComplete = async (deadline: Deadline) => {
    const key = `${deadline.name}_${deadline.date.getFullYear()}`;
    const newCompleted = new Set(completedDeadlines);

    if (newCompleted.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }

    setCompletedDeadlines(newCompleted);
    await window.api.setSetting(
      "completed_deadlines",
      JSON.stringify(Array.from(newCompleted)),
    );
  };

  const getUrgencyColor = (daysUntil: number): string => {
    if (daysUntil < 0)
      return "text-status-errorDark bg-status-errorLight border-status-errorLight";
    if (daysUntil <= 7)
      return "text-status-errorDark bg-status-errorLight border-status-errorLight";
    if (daysUntil <= 30)
      return "text-status-warningDark bg-status-warningLight border-status-warningLight";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getUrgencyVariant = (
    daysUntil: number,
  ): "danger" | "warning" | "default" => {
    if (daysUntil <= 7) return "danger";
    if (daysUntil <= 30) return "warning";
    return "default";
  };

  const getUrgencyLabel = (daysUntil: number): string => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    if (daysUntil <= 7) return `${daysUntil} days`;
    if (daysUntil <= 30) return `${daysUntil} days`;
    return `${daysUntil} days`;
  };

  // Filter out completed deadlines for display
  const pendingDeadlines = deadlines.filter((d) => {
    const key = `${d.name}_${d.date.getFullYear()}`;
    return !completedDeadlines.has(key);
  });

  const completedCount = deadlines.length - pendingDeadlines.length;

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!stateCode) {
    return (
      <Card className={className} padding="sm">
        <p className="text-sm text-gray-600">
          Set your state in Settings to see compliance deadlines.
        </p>
      </Card>
    );
  }

  if (deadlines.length === 0) {
    return (
      <Card
        className={`${className} bg-status-successLight border-status-successLight`}
        padding="sm"
      >
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>
            All Clear
          </Badge>
          <p className="text-sm text-status-successDark">
            {stateName} has no specific filing deadlines. You're all set!
          </p>
        </div>
      </Card>
    );
  }

  if (compact) {
    // Compact view for dashboard widget
    const urgentDeadlines = pendingDeadlines.filter((d) => d.daysUntil <= 30);

    if (urgentDeadlines.length === 0 && pendingDeadlines.length === 0) {
      return (
        <Card
          className={`${className} bg-status-successLight border-status-successLight`}
          padding="sm"
        >
          <div className="flex items-center gap-2">
            <Badge variant="success" dot>
              Complete
            </Badge>
            <p className="text-sm text-status-successDark">
              All deadlines met!
            </p>
          </div>
        </Card>
      );
    }

    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            Compliance Deadlines
          </h3>
          <Badge variant="default" size="sm">
            {stateName}
          </Badge>
        </div>
        <div className="space-y-2">
          {urgentDeadlines.slice(0, 3).map((deadline, idx) => (
            <div
              key={idx}
              className={`p-2 rounded border ${getUrgencyColor(deadline.daysUntil)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{deadline.name}</span>
                <span className="text-xs font-semibold">
                  {getUrgencyLabel(deadline.daysUntil)}
                </span>
              </div>
            </div>
          ))}
          {pendingDeadlines.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{pendingDeadlines.length - 3} more
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Filing Deadlines
          </h2>
          <p className="text-sm text-gray-500">{stateName} Requirements</p>
        </div>
        {completedCount > 0 && (
          <span className="text-sm text-status-successDark">
            {completedCount} of {deadlines.length} completed
          </span>
        )}
      </div>

      <div className="space-y-3">
        {deadlines.map((deadline, idx) => {
          const key = `${deadline.name}_${deadline.date.getFullYear()}`;
          const isCompleted = completedDeadlines.has(key);

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-all ${
                isCompleted
                  ? "bg-gray-50 border-gray-200 opacity-60"
                  : getUrgencyColor(deadline.daysUntil)
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleDeadlineComplete(deadline)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isCompleted
                      ? "bg-status-success border-status-success text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {isCompleted && (
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium ${isCompleted ? "line-through text-gray-500" : ""}`}
                    >
                      {deadline.name}
                    </h3>
                    {!isCompleted && (
                      <Badge variant={getUrgencyVariant(deadline.daysUntil)}>
                        {getUrgencyLabel(deadline.daysUntil)}
                      </Badge>
                    )}
                  </div>

                  <p
                    className={`text-sm mt-1 ${isCompleted ? "text-gray-400" : "opacity-80"}`}
                  >
                    {deadline.description}
                  </p>

                  <p
                    className={`text-xs mt-2 ${isCompleted ? "text-gray-400" : "opacity-70"}`}
                  >
                    Due: {format(deadline.date, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
