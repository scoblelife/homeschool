/**
 * Smart Activity Categorization
 *
 * AI-powered subject suggestion based on activity descriptions.
 * Examples:
 * - "Building Legos" → Math (spatial reasoning)
 * - "Reading Harry Potter" → Language Arts
 * - "Baking cookies" → Math, Science
 */

import { useState, useCallback } from "react";
import { Button } from "../../components/ui";

interface SubjectSuggestion {
  subjectId: string;
  subjectName: string;
  confidence: number;
  reason: string;
}

interface SmartCategorizationResult {
  suggestions: SubjectSuggestion[];
  isLoading: boolean;
  error: string | null;
}

interface Subject {
  id: string;
  name: string;
}

/**
 * Hook for smart activity categorization
 */
export function useSmartCategorization(subjects: Subject[]): {
  getSuggestions: (description: string) => Promise<SubjectSuggestion[]>;
  isLoading: boolean;
  error: string | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = useCallback(
    async (description: string): Promise<SubjectSuggestion[]> => {
      if (!description || description.length < 3) {
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if AI is available
        const isAvailable = await window.api.aiIsAvailable();
        if (!isAvailable) {
          // Fallback to keyword matching
          return keywordMatch(description, subjects);
        }

        const subjectList = subjects.map((s) => s.name).join(", ");

        const prompt = `You are an educational activity categorizer. Based on the activity description, suggest which school subjects it relates to.

Activity Description: "${description}"

Available Subjects: ${subjectList}

Return JSON array of 1-3 subject suggestions:
[
  {
    "subjectName": "Subject Name",
    "confidence": 0.0-1.0,
    "reason": "Brief explanation (max 10 words)"
  }
]

Guidelines:
- "Building Legos" → Math (spatial reasoning, geometry)
- "Reading stories" → Language Arts
- "Watching nature documentary" → Science
- "Baking/cooking" → Math (measuring) + Science (chemistry)
- "Drawing/painting" → Art
- "Playing piano" → Music
- "Soccer practice" → Physical Education
- "Field trip to museum" → Social Studies or Science depending on museum

Only suggest subjects from the available list. Return only valid JSON.`;

        const result = await window.api.aiComplete(prompt, {
          maxTokens: 200,
          temperature: 0.3,
          useCache: true,
        });

        if (!result.success || !result.response) {
          return keywordMatch(description, subjects);
        }

        try {
          const parsed = JSON.parse(result.response) as Array<{
            subjectName: string;
            confidence: number;
            reason: string;
          }>;

          // Map to subject IDs
          const suggestions: SubjectSuggestion[] = parsed
            .map((p) => {
              const subject = subjects.find(
                (s) => s.name.toLowerCase() === p.subjectName.toLowerCase(),
              );
              if (!subject) return null;
              return {
                subjectId: subject.id,
                subjectName: subject.name,
                confidence: p.confidence,
                reason: p.reason,
              };
            })
            .filter((s): s is SubjectSuggestion => s !== null);

          return suggestions;
        } catch {
          return keywordMatch(description, subjects);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to categorize");
        return keywordMatch(description, subjects);
      } finally {
        setIsLoading(false);
      }
    },
    [subjects],
  );

  return { getSuggestions, isLoading, error };
}

/**
 * Fallback keyword-based matching when AI is unavailable
 */
function keywordMatch(
  description: string,
  subjects: Subject[],
): SubjectSuggestion[] {
  const lower = description.toLowerCase();
  const suggestions: SubjectSuggestion[] = [];

  const keywords: Record<string, string[]> = {
    math: [
      "math",
      "count",
      "number",
      "add",
      "subtract",
      "multiply",
      "divide",
      "lego",
      "blocks",
      "measure",
      "bake",
      "cook",
      "recipe",
      "fraction",
      "geometry",
      "shape",
    ],
    "language arts": [
      "read",
      "write",
      "book",
      "story",
      "spell",
      "word",
      "letter",
      "journal",
      "poem",
      "essay",
      "vocabulary",
      "grammar",
    ],
    science: [
      "science",
      "experiment",
      "nature",
      "animal",
      "plant",
      "weather",
      "space",
      "chemistry",
      "biology",
      "physics",
      "observe",
      "lab",
    ],
    "social studies": [
      "history",
      "geography",
      "map",
      "country",
      "culture",
      "community",
      "government",
      "president",
      "museum",
      "field trip",
    ],
    art: [
      "art",
      "draw",
      "paint",
      "color",
      "craft",
      "create",
      "design",
      "sculpture",
      "clay",
    ],
    music: [
      "music",
      "sing",
      "song",
      "instrument",
      "piano",
      "guitar",
      "drum",
      "dance",
      "rhythm",
    ],
    "physical education": [
      "exercise",
      "sport",
      "run",
      "swim",
      "bike",
      "soccer",
      "basketball",
      "gym",
      "outside",
      "play",
      "walk",
      "hike",
    ],
  };

  for (const [subjectKey, words] of Object.entries(keywords)) {
    const matchCount = words.filter((word) => lower.includes(word)).length;
    if (matchCount > 0) {
      const subject = subjects.find((s) => s.name.toLowerCase() === subjectKey);
      if (subject) {
        suggestions.push({
          subjectId: subject.id,
          subjectName: subject.name,
          confidence: Math.min(0.9, 0.5 + matchCount * 0.15),
          reason: `Matched keywords in description`,
        });
      }
    }
  }

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * Component for displaying subject suggestions
 */
interface SubjectSuggestionsProps {
  description: string;
  subjects: Subject[];
  onSelect: (subjectId: string) => void;
  selectedSubjectId?: string;
}

export function SubjectSuggestions({
  description,
  subjects,
  onSelect,
  selectedSubjectId,
}: SubjectSuggestionsProps): JSX.Element | null {
  const { getSuggestions, isLoading, error } = useSmartCategorization(subjects);
  const [suggestions, setSuggestions] = useState<SubjectSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-suggest when description changes (debounced)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const triggerSuggestion = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(async () => {
      if (description && description.length >= 5) {
        const results = await getSuggestions(description);
        setSuggestions(results);
        setHasSearched(true);
      }
    }, 500);

    setDebounceTimer(timer);
  }, [description, getSuggestions, debounceTimer]);

  // Trigger on description change
  useState(() => {
    if (description && description.length >= 5 && !hasSearched) {
      triggerSuggestion();
    }
  });

  if (
    !hasSearched &&
    description.length >= 5 &&
    suggestions.length === 0 &&
    !isLoading
  ) {
    // First time - trigger suggestion
    triggerSuggestion();
  }

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mt-2">
      {isLoading ? (
        <div
          className="flex items-center gap-2 text-sm text-gray-500"
          role="status"
          aria-busy="true"
        >
          <svg
            className="animate-spin h-4 w-4"
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
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Analyzing activity...
        </div>
      ) : suggestions.length > 0 ? (
        <div aria-live="polite">
          <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
            <span aria-hidden="true">✨</span> AI Suggestions:
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Subject suggestions"
          >
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.subjectId}
                onClick={() => onSelect(suggestion.subjectId)}
                variant="ghost"
                size="sm"
                aria-pressed={selectedSubjectId === suggestion.subjectId}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  selectedSubjectId === suggestion.subjectId
                    ? "bg-brand-primaryLight border-brand-primaryLight text-brand-primaryDark"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-brand-primaryLight hover:border-brand-primaryLight"
                }`}
                title={suggestion.reason}
              >
                {suggestion.subjectName}
                <span className="ml-1 text-xs opacity-60">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {error && (
        <div role="alert" className="text-xs text-status-error mt-1">
          {error}
        </div>
      )}
    </div>
  );
}
