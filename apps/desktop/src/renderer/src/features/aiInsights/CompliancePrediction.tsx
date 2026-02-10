/**
 * Compliance Prediction Component
 *
 * Predicts year-end hours based on current pace and warns
 * if the student is falling behind requirements.
 */

import { useState, useEffect, useCallback } from "react";
import {
  format,
  differenceInDays,
  addDays,
  parseISO,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Button } from "@/components/ui";
import { useAIInsightsStore } from "./aiInsightsStore";

interface PredictionData {
  currentHours: number;
  projectedHours: number;
  requiredHours: number;
  daysRemaining: number;
  daysElapsed: number;
  dailyAverage: number;
  requiredDaily: number;
  status: "on_track" | "at_risk" | "behind";
  suggestions: string[];
}

interface CompliancePredictionProps {
  studentId: string;
  studentName: string;
  requiredHours?: number; // Allow override from state requirements
}

export function CompliancePrediction({
  studentId,
  studentName,
  requiredHours = 180, // Default Nevada requirement (180 days * varies by state)
}: CompliancePredictionProps): JSX.Element | null {
  const { isInitialized, isAvailable, isGenerating, initialize } =
    useAIInsightsStore();

  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize AI
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Calculate school year dates (Aug 1 - Jul 31)
  const getSchoolYearDates = useCallback(() => {
    const now = new Date();
    const year =
      now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      start: new Date(year, 7, 1), // August 1
      end: new Date(year + 1, 6, 31), // July 31
    };
  }, []);

  const analyzeCompliance = useCallback(async () => {
    setIsLoading(true);
    setLocalError(null);

    try {
      const { start, end } = getSchoolYearDates();
      const now = new Date();

      // Get activity summary for school year
      const summary = await window.api.getActivitySummary(
        studentId,
        format(start, "yyyy-MM-dd"),
        format(now, "yyyy-MM-dd"),
      );

      const totalMinutes = summary.reduce((sum, s) => sum + s.totalMinutes, 0);
      const currentHours = Math.round((totalMinutes / 60) * 10) / 10;

      // Calculate time metrics
      const daysElapsed = differenceInDays(now, start);
      const daysRemaining = differenceInDays(end, now);
      const totalDays = daysElapsed + daysRemaining;

      // Calculate daily averages and projections
      const dailyAverage = daysElapsed > 0 ? currentHours / daysElapsed : 0;
      const projectedHours =
        Math.round((currentHours + dailyAverage * daysRemaining) * 10) / 10;
      const requiredDaily =
        daysRemaining > 0 ? (requiredHours - currentHours) / daysRemaining : 0;

      // Determine status
      let status: "on_track" | "at_risk" | "behind";
      if (projectedHours >= requiredHours) {
        status = "on_track";
      } else if (projectedHours >= requiredHours * 0.85) {
        status = "at_risk";
      } else {
        status = "behind";
      }

      // Generate suggestions based on status
      const suggestions: string[] = [];

      if (status === "behind") {
        suggestions.push(
          `Increase daily learning to ${Math.round(requiredDaily * 10) / 10} hours/day`,
          "Consider longer weekend sessions",
          "Add educational activities during daily routines",
        );
      } else if (status === "at_risk") {
        suggestions.push(
          "Maintain current pace with slight increase",
          `Aim for ${Math.round((dailyAverage + 0.5) * 10) / 10} hours/day`,
        );
      } else {
        suggestions.push(
          "Current pace is excellent!",
          "Consider exploring new subjects",
        );
      }

      // Use AI for more personalized suggestions if available
      if (isAvailable && status !== "on_track") {
        try {
          const prompt = `Given a homeschool student who is ${status === "behind" ? "significantly behind" : "slightly behind"} on required hours:
- Current: ${currentHours} hours
- Required: ${requiredHours} hours
- Days remaining: ${daysRemaining}
- Daily average: ${Math.round(dailyAverage * 10) / 10} hours

Provide 2-3 brief, practical suggestions (max 15 words each) to help catch up. Format as JSON array of strings.`;

          const result = await window.api.aiComplete(prompt, {
            maxTokens: 150,
            temperature: 0.6,
            useCache: true,
          });

          if (result.success && result.response) {
            try {
              const aiSuggestions = JSON.parse(result.response) as string[];
              suggestions.length = 0;
              suggestions.push(...aiSuggestions);
            } catch {
              // Keep original suggestions
            }
          }
        } catch {
          // Keep original suggestions
        }
      }

      setPrediction({
        currentHours,
        projectedHours,
        requiredHours,
        daysRemaining,
        daysElapsed,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        requiredDaily: Math.round(requiredDaily * 10) / 10,
        status,
        suggestions,
      });
      setIsExpanded(true);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to analyze compliance",
      );
    } finally {
      setIsLoading(false);
    }
  }, [studentId, requiredHours, isAvailable, getSchoolYearDates]);

  // Auto-load on mount
  useEffect(() => {
    analyzeCompliance();
  }, [analyzeCompliance]);

  if (!isInitialized) {
    return null;
  }

  const statusColors = {
    on_track: {
      bg: "bg-status-successLight",
      text: "text-status-successDark",
      icon: "✓",
      label: "On Track",
    },
    at_risk: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: "⚠",
      label: "At Risk",
    },
    behind: {
      bg: "bg-status-errorLight",
      text: "text-status-errorDark",
      icon: "!",
      label: "Behind",
    },
  };

  return (
    <div
      className={`bg-gradient-to-r from-status-warningLight to-student-orange-50 border border-status-warningLight rounded-lg p-4`}
    >
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isLoading || isGenerating}
        className="w-full text-left h-auto p-0"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-status-warningLight flex items-center justify-center text-xl">
              📈
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Compliance Tracking
              </h3>
              <p className="text-sm text-gray-500">
                {prediction
                  ? `${prediction.currentHours}/${prediction.requiredHours} hours this year`
                  : "Loading predictions..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading || isGenerating ? (
              <svg
                className="animate-spin h-5 w-5 text-status-warningDark"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : prediction ? (
              <>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[prediction.status].bg} ${statusColors[prediction.status].text}`}
                >
                  {statusColors[prediction.status].icon}{" "}
                  {statusColors[prediction.status].label}
                </span>
                <svg
                  className={`w-5 h-5 text-status-warningDark transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            ) : null}
          </div>
        </div>
      </Button>

      {isExpanded && prediction && (
        <div className="mt-4 space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                Progress: {prediction.currentHours} hrs
              </span>
              <span className="text-gray-600">
                Goal: {prediction.requiredHours} hrs
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  prediction.status === "on_track"
                    ? "bg-status-success"
                    : prediction.status === "at_risk"
                      ? "bg-yellow-500"
                      : "bg-status-error"
                }`}
                style={{
                  width: `${Math.min(100, (prediction.currentHours / prediction.requiredHours) * 100)}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(
                (prediction.currentHours / prediction.requiredHours) * 100,
              )}
              % complete
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">
                {prediction.projectedHours}
              </div>
              <div className="text-xs text-gray-500">Projected Hrs</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">
                {prediction.dailyAverage}
              </div>
              <div className="text-xs text-gray-500">Hrs/Day Avg</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">
                {prediction.daysRemaining}
              </div>
              <div className="text-xs text-gray-500">Days Left</div>
            </div>
          </div>

          {/* Prediction Message */}
          <div
            className={`p-3 rounded-lg ${statusColors[prediction.status].bg}`}
          >
            <p
              className={`text-sm font-medium ${statusColors[prediction.status].text}`}
            >
              {prediction.status === "on_track"
                ? `Great job! At current pace, ${studentName} will reach ${prediction.projectedHours} hours by year end.`
                : prediction.status === "at_risk"
                  ? `${studentName} is slightly behind. Projected ${prediction.projectedHours} hours vs ${prediction.requiredHours} required.`
                  : `${studentName} needs to increase learning time. Currently on track for only ${prediction.projectedHours} hours.`}
            </p>
          </div>

          {/* Suggestions */}
          {prediction.suggestions.length > 0 &&
            prediction.status !== "on_track" && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Suggestions:
                </h4>
                <ul className="space-y-1">
                  {prediction.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-status-warning mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Refresh */}
          <div className="text-xs text-status-warningDark text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                analyzeCompliance();
              }}
              disabled={isLoading || isGenerating}
              className="hover:text-status-warningDark underline text-xs p-0 h-auto"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {localError && (
        <div className="mt-3 p-2 bg-status-errorLight border border-status-errorLight rounded text-sm text-status-error">
          {localError}
        </div>
      )}
    </div>
  );
}
