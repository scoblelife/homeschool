/**
 * Learning Pattern Detection Component
 *
 * Analyzes activity data to detect patterns like:
 * - Time-of-day effectiveness
 * - Subject affinities and challenges
 * - Optimal session lengths
 */

import { useState, useEffect, useCallback } from "react";
import { format, subDays, parseISO } from "date-fns";
import { useAIInsightsStore } from "./aiInsightsStore";

interface PatternInsight {
  category: string;
  insight: string;
  detail: string;
}

interface LearningPatternsProps {
  studentId: string;
  studentName: string;
  gradeLevel: string;
}

interface SessionData {
  hour: number;
  duration: number;
  subject: string;
}

export function LearningPatterns({
  studentId,
  studentName,
  gradeLevel,
}: LearningPatternsProps): JSX.Element | null {
  const { isInitialized, isAvailable, isGenerating, error, initialize } =
    useAIInsightsStore();

  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  // Initialize AI
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const analyzePatterns = useCallback(async () => {
    if (!isAvailable) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      // Get 60 days of session data for pattern analysis
      const sixtyDaysAgo = format(subDays(new Date(), 60), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");

      const [sessions, activities, summary] = await Promise.all([
        window.api.getSessions({
          studentId,
          startDate: sixtyDaysAgo,
          endDate: today,
        }),
        window.api.getActivities({
          studentId,
          startDate: sixtyDaysAgo,
          endDate: today,
        }),
        window.api.getActivitySummary(studentId, sixtyDaysAgo, today),
      ]);

      // Analyze time patterns from sessions
      const sessionData: SessionData[] = sessions
        .filter((s) => s.startTime && s.endTime)
        .map((s) => {
          const subject =
            summary.find((sum) => sum.subjectId === s.subjectId)?.subjectName ||
            "Unknown";
          const hour = parseInt(s.startTime!.split(":")[0]);
          // Calculate duration from start and end time
          const [startH, startM] = s.startTime!.split(":").map(Number);
          const [endH, endM] = s.endTime!.split(":").map(Number);
          const duration =
            Math.max(0, endH * 60 + endM - (startH * 60 + startM)) || 30;
          return { hour, duration, subject };
        });

      // Calculate time-of-day distribution
      const hourCounts = new Map<number, number[]>();
      sessionData.forEach(({ hour, duration }) => {
        if (!hourCounts.has(hour)) hourCounts.set(hour, []);
        hourCounts.get(hour)!.push(duration);
      });

      // Calculate average durations by time
      const timeAnalysis: Array<{
        period: string;
        avgDuration: number;
        count: number;
      }> = [];

      const morningHours = [6, 7, 8, 9, 10, 11];
      const afternoonHours = [12, 13, 14, 15, 16, 17];
      const eveningHours = [18, 19, 20, 21];

      const analyzePeriod = (hours: number[], name: string) => {
        const durations: number[] = [];
        let count = 0;
        hours.forEach((h) => {
          const hourData = hourCounts.get(h);
          if (hourData) {
            durations.push(...hourData);
            count += hourData.length;
          }
        });
        if (durations.length > 0) {
          const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
          return { period: name, avgDuration: Math.round(avg), count };
        }
        return null;
      };

      const morning = analyzePeriod(morningHours, "Morning (6am-12pm)");
      const afternoon = analyzePeriod(afternoonHours, "Afternoon (12pm-6pm)");
      const evening = analyzePeriod(eveningHours, "Evening (6pm-10pm)");

      if (morning) timeAnalysis.push(morning);
      if (afternoon) timeAnalysis.push(afternoon);
      if (evening) timeAnalysis.push(evening);

      // Build prompt for AI analysis
      const subjectBreakdown = summary
        .map(
          (s) =>
            `- ${s.subjectName}: ${s.totalActivities} activities, ${Math.round(s.totalMinutes / 60)} hours`,
        )
        .join("\n");

      const timeBreakdown = timeAnalysis
        .map(
          (t) => `- ${t.period}: ${t.count} sessions, avg ${t.avgDuration} min`,
        )
        .join("\n");

      const activityTypes = new Map<string, number>();
      activities.forEach((a) => {
        activityTypes.set(
          a.activityType,
          (activityTypes.get(a.activityType) || 0) + 1,
        );
      });
      const typeBreakdown = Array.from(activityTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => `- ${type.replace("_", " ")}: ${count}`)
        .join("\n");

      const prompt = `You are a learning analytics expert. Analyze this student's learning patterns and provide 3-4 specific insights.

Student: ${studentName}
Grade Level: ${gradeLevel}
Analysis Period: Past 60 days

Subject Distribution:
${subjectBreakdown}

Time-of-Day Patterns:
${timeBreakdown}

Activity Types:
${typeBreakdown}

Total Activities: ${activities.length}
Total Sessions: ${sessions.length}

Provide exactly 3-4 insights in JSON format:
[
  {
    "category": "Time Focus" | "Subject Strength" | "Learning Style" | "Engagement Pattern",
    "insight": "Brief headline (max 10 words)",
    "detail": "2-3 sentence explanation with specific data points"
  }
]

Focus on:
1. When the student learns best (time of day, session length)
2. Subject affinities or areas needing attention
3. Preferred learning styles based on activity types
4. Consistency and engagement patterns

Be specific with numbers. Make insights actionable. Return only valid JSON.`;

      const result = await window.api.aiComplete(prompt, {
        maxTokens: 600,
        temperature: 0.5,
        systemPrompt:
          "You are a learning analytics expert providing data-driven insights about student learning patterns.",
        useCache: true,
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || "Failed to analyze patterns");
      }

      try {
        const parsed = JSON.parse(result.response) as PatternInsight[];
        setPatterns(parsed);
        setIsExpanded(true);
        setLastAnalyzed(new Date());
      } catch {
        // Fallback patterns if AI response isn't valid JSON
        const fallbackPatterns: PatternInsight[] = [];

        if (timeAnalysis.length > 0) {
          const bestTime = timeAnalysis.reduce((a, b) =>
            a.avgDuration > b.avgDuration ? a : b,
          );
          fallbackPatterns.push({
            category: "Time Focus",
            insight: `Best learning time: ${bestTime.period.split(" ")[0]}`,
            detail: `${studentName} has ${bestTime.count} sessions in the ${bestTime.period.toLowerCase()}, with an average duration of ${bestTime.avgDuration} minutes.`,
          });
        }

        if (summary.length > 0) {
          const topSubject = summary[0];
          fallbackPatterns.push({
            category: "Subject Strength",
            insight: `Strong focus on ${topSubject.subjectName}`,
            detail: `${topSubject.subjectName} leads with ${topSubject.totalActivities} activities and ${Math.round(topSubject.totalMinutes / 60)} hours of learning time.`,
          });
        }

        setPatterns(fallbackPatterns);
        setIsExpanded(true);
        setLastAnalyzed(new Date());
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to analyze patterns",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, studentId, studentName, gradeLevel]);

  // Don't render if AI not available
  if (isInitialized && !isAvailable) {
    return null;
  }

  if (!isInitialized) {
    return null;
  }

  const categoryIcons: Record<string, string> = {
    "Time Focus": "⏰",
    "Subject Strength": "📚",
    "Learning Style": "🎨",
    "Engagement Pattern": "📊",
  };

  return (
    <div className="card bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
      <button
        onClick={() =>
          patterns.length > 0 ? setIsExpanded(!isExpanded) : analyzePatterns()
        }
        disabled={isLoading || isGenerating}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Learning Patterns</h3>
              <p className="text-sm text-gray-500">
                {patterns.length > 0
                  ? `${patterns.length} insights discovered`
                  : "Analyze learning habits and preferences"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading || isGenerating ? (
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
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
            ) : patterns.length > 0 ? (
              <svg
                className={`w-5 h-5 text-blue-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
            ) : (
              <span className="text-sm text-blue-600 font-medium">Analyze</span>
            )}
          </div>
        </div>
      </button>

      {isExpanded && patterns.length > 0 && (
        <div className="mt-4 space-y-3">
          {patterns.map((pattern, index) => (
            <div key={index} className="bg-white/60 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {categoryIcons[pattern.category] || "💡"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      {pattern.category}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {pattern.insight}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{pattern.detail}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between text-xs text-blue-600 pt-2">
            <span>
              Analyzed by AI
              {lastAnalyzed ? ` • ${format(lastAnalyzed, "h:mm a")}` : ""}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                analyzePatterns();
              }}
              disabled={isLoading || isGenerating}
              className="hover:text-blue-800 underline"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {(error || localError) && (
        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
          {localError || error}
        </div>
      )}
    </div>
  );
}
