/**
 * Portfolio Narrative Generator
 *
 * Generates AI-powered prose summaries suitable for portfolio evaluators.
 */

import { useState, useEffect } from "react";
import { Button } from "../../components/ui";
import { useAIInsightsStore } from "./aiInsightsStore";

interface SubjectData {
  name: string;
  activities: number;
  minutes: number;
  types: string[];
}

interface PortfolioNarrativeProps {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  schoolYear: string;
  dateRange: { startDate: string; endDate: string };
  onNarrativeGenerated?: (narrative: string) => void;
}

export function PortfolioNarrative({
  studentId,
  studentName,
  gradeLevel,
  schoolYear,
  dateRange,
  onNarrativeGenerated,
}: PortfolioNarrativeProps): JSX.Element {
  const { isInitialized, isAvailable, isGenerating, error, initialize } =
    useAIInsightsStore();

  const [narrative, setNarrative] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);

  // Initialize AI
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Load activity data for the date range
  useEffect(() => {
    loadActivityData();
  }, [studentId, dateRange]);

  const loadActivityData = async () => {
    try {
      const summary = await window.api.getActivitySummary(
        studentId,
        dateRange.startDate,
        dateRange.endDate,
      );

      // Get activity details for type breakdown
      const activities = await window.api.getActivities({
        studentId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      // Build subject data with activity types
      const subjectMap = new Map<string, SubjectData>();

      summary.forEach((s) => {
        subjectMap.set(s.subjectId, {
          name: s.subjectName,
          activities: s.totalActivities,
          minutes: s.totalMinutes,
          types: [],
        });
      });

      // Add activity types
      activities.forEach((a) => {
        const subject = subjectMap.get(a.subjectId);
        if (subject && !subject.types.includes(a.activityType)) {
          subject.types.push(a.activityType);
        }
      });

      const data = Array.from(subjectMap.values()).sort(
        (a, b) => b.minutes - a.minutes,
      );
      setSubjectData(data);
      setTotalActivities(data.reduce((sum, s) => sum + s.activities, 0));
      setTotalHours(
        Math.round(data.reduce((sum, s) => sum + s.minutes, 0) / 60),
      );
    } catch (err) {
      console.error("Failed to load activity data:", err);
    }
  };

  const generateNarrative = async () => {
    if (!isAvailable || subjectData.length === 0) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      const subjectList = subjectData
        .map((s) => {
          const types = s.types.length > 0 ? ` (${s.types.join(", ")})` : "";
          return `- ${s.name}: ${s.activities} activities, ${Math.round(s.minutes / 60)} hours${types}`;
        })
        .join("\n");

      const prompt = `You are a professional homeschool education consultant. Write a comprehensive narrative summary for a homeschool portfolio that would be appropriate for state evaluators or assessment officials.

Student: ${studentName}
Grade Level: ${gradeLevel}
School Year: ${schoolYear}
Date Range: ${dateRange.startDate} to ${dateRange.endDate}

Learning Summary:
- Total Learning Hours: ${totalHours} hours
- Total Activities Completed: ${totalActivities}

Subject Breakdown:
${subjectList}

Instructions:
Write a 3-4 paragraph professional narrative that:

1. Opens with an introduction of the student and their educational journey this year
2. Describes the breadth and depth of subjects covered, highlighting specific areas of focus
3. Notes the variety of learning activities and approaches used
4. Discusses growth areas and achievements observed
5. Concludes with a summary of the overall educational progress

Style Guidelines:
- Use professional, formal language appropriate for official documentation
- Be specific about subjects and activities, referencing the data provided
- Maintain an objective but positive tone
- Avoid overly casual language or personal commentary
- Format as continuous prose paragraphs (no bullet points or headers)

The narrative should read as a cohesive educational summary suitable for inclusion in an official portfolio.`;

      const result = await window.api.aiComplete(prompt, {
        maxTokens: 800,
        temperature: 0.6,
        systemPrompt:
          "You are an experienced homeschool education evaluator writing professional portfolio narratives.",
        useCache: true,
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || "Failed to generate narrative");
      }

      setNarrative(result.response);
      onNarrativeGenerated?.(result.response);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to generate narrative",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if AI not available
  if (isInitialized && !isAvailable) {
    return (
      <div
        className="p-4 bg-neutral-background rounded-lg border border-neutral-border"
        role="status"
      >
        <p className="text-sm text-neutral-textSecondary">
          AI narrative generation requires an API key. Configure in Settings to
          enable this feature.
        </p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div
        className="p-4 bg-neutral-background rounded-lg border border-neutral-border"
        role="status"
        aria-busy="true"
      >
        <p className="text-sm text-neutral-textSecondary">Initializing AI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-neutral-text">
            AI Narrative Summary
          </h3>
          <p className="text-sm text-neutral-textSecondary">
            Generate a professional prose summary for your portfolio
          </p>
        </div>
        {!narrative && (
          <Button
            variant="primary"
            onClick={generateNarrative}
            disabled={isLoading || isGenerating || subjectData.length === 0}
            loading={isLoading || isGenerating}
          >
            {isLoading || isGenerating ? "Generating..." : "Generate Narrative"}
          </Button>
        )}
      </div>

      {/* Data Summary */}
      {subjectData.length > 0 && !narrative && (
        <div className="p-4 bg-brand-primaryLight rounded-lg">
          <p className="text-sm text-brand-primaryDark mb-2">
            Data available for narrative generation:
          </p>
          <ul className="text-sm text-brand-primary space-y-1">
            <li>
              • {totalActivities} activities across {subjectData.length}{" "}
              subjects
            </li>
            <li>• {totalHours} total learning hours</li>
            <li>
              • Top subjects:{" "}
              {subjectData
                .slice(0, 3)
                .map((s) => s.name)
                .join(", ")}
            </li>
          </ul>
        </div>
      )}

      {/* Generated Narrative */}
      {narrative && (
        <div
          className="border border-neutral-border rounded-lg overflow-hidden"
          aria-live="polite"
        >
          <div className="bg-neutral-background px-4 py-2 border-b border-neutral-border flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-text">
              Generated Narrative
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(narrative);
                }}
                aria-label="Copy narrative to clipboard"
                className="text-xs text-brand-primary hover:text-brand-primaryDark p-0 h-auto"
              >
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateNarrative}
                disabled={isLoading || isGenerating}
                className="text-xs text-brand-primary hover:text-brand-primaryDark p-0 h-auto"
              >
                Regenerate
              </Button>
            </div>
          </div>
          <div className="p-4 bg-white prose prose-sm max-w-none">
            {narrative.split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-neutral-text mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="bg-neutral-background px-4 py-2 border-t border-neutral-border">
            <p className="text-xs text-neutral-textSecondary">
              Generated by AI. Review and edit as needed before including in
              your portfolio.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {(error || localError) && (
        <div
          role="alert"
          className="p-3 bg-status-errorLight border border-status-error rounded-lg"
        >
          <p className="text-sm text-status-error">{localError || error}</p>
        </div>
      )}
    </div>
  );
}
