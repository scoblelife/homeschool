/**
 * AI Activity Suggestions Component
 *
 * Analyzes recent activity history and suggests activities
 * for underrepresented subjects.
 */

import { useState, useEffect, useCallback, type MouseEvent } from "react";
import { format, subDays } from "date-fns";
import { Button } from "../../components/ui";
import { useAIInsightsStore } from "./aiInsightsStore";

interface SubjectActivity {
  subjectId: string;
  subjectName: string;
  totalActivities: number;
  totalMinutes: number;
  lastActivityDate: string | null;
}

interface Suggestion {
  subject: string;
  reason: string;
  ideas: string[];
}

interface ActivitySuggestionsProps {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  subjects: Array<{ id: string; name: string }>;
}

export function ActivitySuggestions({
  studentId,
  studentName,
  gradeLevel,
  subjects,
}: ActivitySuggestionsProps): JSX.Element | null {
  const { isInitialized, isAvailable, isGenerating, error, initialize } =
    useAIInsightsStore();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [subjectData, setSubjectData] = useState<SubjectActivity[]>([]);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Initialize AI on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Load subject activity data
  const loadSubjectData = useCallback(async () => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    try {
      const summary = await window.api.getActivitySummary(
        studentId,
        thirtyDaysAgo,
        today,
      );

      // Map all subjects, including ones with no activities
      const subjectActivities: SubjectActivity[] = subjects.map((subject) => {
        const found = summary.find((s) => s.subjectId === subject.id);
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          totalActivities: found?.totalActivities || 0,
          totalMinutes: found?.totalMinutes || 0,
          lastActivityDate: null, // We'll track this separately if needed
        };
      });

      // Sort by least activities
      subjectActivities.sort((a, b) => a.totalActivities - b.totalActivities);
      setSubjectData(subjectActivities);
    } catch (err) {
      console.error("Failed to load subject data:", err);
    }
  }, [studentId, subjects]);

  useEffect(() => {
    loadSubjectData();
  }, [loadSubjectData]);

  const generateSuggestions = async () => {
    if (!isAvailable || subjectData.length === 0) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      // Find underrepresented subjects (bottom third or zero activities)
      const avgActivities =
        subjectData.reduce((sum, s) => sum + s.totalActivities, 0) /
        subjectData.length;
      const underrepresented = subjectData
        .filter(
          (s) =>
            s.totalActivities === 0 || s.totalActivities < avgActivities * 0.5,
        )
        .slice(0, 3);

      if (underrepresented.length === 0) {
        setSuggestions([
          {
            subject: "All Subjects",
            reason: "Great balance! All subjects are well-represented.",
            ideas: [
              "Keep up the variety!",
              "Try a new activity type in your favorite subject",
            ],
          },
        ]);
        setIsExpanded(true);
        setLastGenerated(new Date());
        setIsLoading(false);
        return;
      }

      // Build the prompt
      const subjectList = underrepresented
        .map(
          (s) =>
            `- ${s.subjectName}: ${s.totalActivities} activities in past 30 days`,
        )
        .join("\n");

      const allSubjectsList = subjectData
        .map((s) => `- ${s.subjectName}: ${s.totalActivities} activities`)
        .join("\n");

      const prompt = `You are a helpful homeschool assistant. Suggest activities for underrepresented subjects.

Student: ${studentName}
Grade Level: ${gradeLevel}

Activity Summary (past 30 days):
${allSubjectsList}

These subjects need more attention:
${subjectList}

For each underrepresented subject, provide:
1. A brief, encouraging reason why it matters
2. 2-3 specific, age-appropriate activity ideas

Format your response as JSON array:
[
  {
    "subject": "Subject Name",
    "reason": "Brief encouraging reason",
    "ideas": ["Specific idea 1", "Specific idea 2", "Specific idea 3"]
  }
]

Keep ideas practical, fun, and appropriate for ${gradeLevel}. Focus on hands-on activities when possible.
Only return the JSON array, no other text.`;

      const result = await window.api.aiComplete(prompt, {
        maxTokens: 500,
        temperature: 0.7,
        systemPrompt:
          "You are a creative homeschool curriculum assistant. Return only valid JSON.",
        useCache: true,
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || "Failed to generate suggestions");
      }

      // Parse the JSON response
      try {
        const parsed = JSON.parse(result.response) as Suggestion[];
        setSuggestions(parsed);
        setIsExpanded(true);
        setLastGenerated(new Date());
      } catch {
        // If JSON parsing fails, create a fallback
        setSuggestions(
          underrepresented.map((s) => ({
            subject: s.subjectName,
            reason: `Only ${s.totalActivities} activities in 30 days`,
            ideas: ["Try adding 2-3 activities this week"],
          })),
        );
        setIsExpanded(true);
        setLastGenerated(new Date());
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to generate suggestions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if AI not available
  if (isInitialized && !isAvailable) {
    return null;
  }

  if (!isInitialized) {
    return null;
  }

  // Find subjects needing attention (for quick indicator)
  const needsAttention = subjectData.filter(
    (s) => s.totalActivities === 0,
  ).length;

  return (
    <div
      className={`bg-gradient-to-r from-emerald-50 to-student-teal-50 border border-emerald-100 rounded-lg p-4`}
    >
      <Button
        variant="ghost"
        onClick={() =>
          suggestions.length > 0
            ? setIsExpanded(!isExpanded)
            : generateSuggestions()
        }
        disabled={isLoading || isGenerating}
        aria-expanded={suggestions.length > 0 ? isExpanded : undefined}
        aria-label="AI Activity Suggestions"
        className="w-full text-left h-auto p-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">
              💡
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                AI Activity Suggestions
              </h3>
              <p className="text-sm text-gray-500">
                {suggestions.length > 0
                  ? `${suggestions.length} suggestion${suggestions.length !== 1 ? "s" : ""} available`
                  : needsAttention > 0
                    ? `${needsAttention} subject${needsAttention !== 1 ? "s" : ""} need${needsAttention === 1 ? "s" : ""} attention`
                    : "Get personalized activity ideas"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading || isGenerating ? (
              <svg
                className="animate-spin h-5 w-5 text-emerald-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
            ) : suggestions.length > 0 ? (
              <svg
                className={`w-5 h-5 text-emerald-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <span className="text-sm text-emerald-600 font-medium">
                Generate
              </span>
            )}
          </div>
        </div>
      </Button>

      {isExpanded && suggestions.length > 0 && (
        <div className="mt-4 space-y-4" aria-live="polite">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white/60 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">📚</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {suggestion.subject}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {suggestion.reason}
                  </p>
                  <div className="mt-3 space-y-2">
                    {suggestion.ideas.map((idea, ideaIndex) => (
                      <div
                        key={ideaIndex}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span className="text-gray-700">{idea}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between text-xs text-emerald-600 pt-2">
            <span>
              Generated by AI
              {lastGenerated ? ` • ${format(lastGenerated, "h:mm a")}` : ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                generateSuggestions();
              }}
              disabled={isLoading || isGenerating}
              className="hover:text-emerald-800 underline text-xs p-0 h-auto"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {(error || localError) && (
        <div
          role="alert"
          className="mt-3 p-2 bg-status-errorLight border border-status-errorLight rounded text-sm text-status-error"
        >
          {localError || error}
        </div>
      )}
    </div>
  );
}
