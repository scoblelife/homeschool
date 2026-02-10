/**
 * AI Insights Store
 *
 * Manages AI-generated insights state.
 */

import { create } from "zustand";

interface WeeklySummaryCache {
  studentId: string;
  weekStart: string;
  summary: string;
  generatedAt: number;
}

interface AIInsightsState {
  isInitialized: boolean;
  isAvailable: boolean;
  isGenerating: boolean;
  weeklySummaryCache: Map<string, WeeklySummaryCache>;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  checkAvailability: () => Promise<boolean>;
  generateWeeklySummary: (
    studentId: string,
    studentName: string,
    gradeLevel: string,
    weekStart: string,
    weekData: {
      totalActivities: number;
      totalMinutes: number;
      activeDays: number;
      subjectBreakdown: Array<{
        name: string;
        activities: number;
        minutes: number;
      }>;
      previousWeekActivities: number;
      previousWeekMinutes: number;
    },
  ) => Promise<string>;
  getCachedSummary: (studentId: string, weekStart: string) => string | null;
  clearCache: () => void;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const useAIInsightsStore = create<AIInsightsState>((set, get) => ({
  isInitialized: false,
  isAvailable: false,
  isGenerating: false,
  weeklySummaryCache: new Map(),
  error: null,

  initialize: async () => {
    try {
      await window.api.aiInitialize();
      const available = await window.api.aiIsAvailable();
      set({ isInitialized: true, isAvailable: available, error: null });
    } catch (err) {
      console.error("Failed to initialize AI:", err);
      set({
        isInitialized: true,
        isAvailable: false,
        error: "Failed to initialize AI",
      });
    }
  },

  checkAvailability: async () => {
    try {
      const available = await window.api.aiIsAvailable();
      set({ isAvailable: available });
      return available;
    } catch {
      set({ isAvailable: false });
      return false;
    }
  },

  generateWeeklySummary: async (
    studentId,
    studentName,
    gradeLevel,
    weekStart,
    weekData,
  ) => {
    // Check cache first
    const cacheKey = `${studentId}-${weekStart}`;
    const cached = get().weeklySummaryCache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt < CACHE_TTL) {
      return cached.summary;
    }

    set({ isGenerating: true, error: null });

    try {
      // Build the prompt with context about the student's week
      const subjectList = weekData.subjectBreakdown
        .map(
          (s) =>
            `  - ${s.name}: ${s.activities} activities, ${Math.round(s.minutes)} minutes`,
        )
        .join("\n");

      const activityChange =
        weekData.totalActivities - weekData.previousWeekActivities;
      const minutesChange =
        weekData.totalMinutes - weekData.previousWeekMinutes;

      const prompt = `You are a friendly and encouraging homeschool assistant. Generate a 2-3 paragraph weekly summary for a homeschool parent about their child's learning progress.

Student: ${studentName}
Grade Level: ${gradeLevel}
Week Starting: ${weekStart}

This Week's Stats:
- Total activities: ${weekData.totalActivities}
- Total learning time: ${Math.round(weekData.totalMinutes)} minutes (${Math.round((weekData.totalMinutes / 60) * 10) / 10} hours)
- Days active: ${weekData.activeDays} out of 7

Subject Breakdown:
${subjectList || "  No activities recorded"}

Compared to Last Week:
- Activities: ${activityChange >= 0 ? "+" : ""}${activityChange}
- Learning time: ${minutesChange >= 0 ? "+" : ""}${Math.round(minutesChange)} minutes

Instructions:
1. Start with a warm, personalized greeting mentioning the student by name
2. Highlight what went well this week - be specific about subjects and achievements
3. Note any patterns (subject focus, consistency, etc.)
4. Offer 1-2 gentle, actionable suggestions for next week
5. End with encouragement

Keep the tone warm, specific, and parent-friendly. Avoid generic phrases. Focus on the data provided.`;

      const result = await window.api.aiComplete(prompt, {
        maxTokens: 500,
        temperature: 0.7,
        systemPrompt:
          "You are a supportive homeschool education assistant helping parents track and celebrate their children's learning progress.",
        useCache: true,
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || "Failed to generate summary");
      }

      // Cache the result
      const newCache = new Map(get().weeklySummaryCache);
      newCache.set(cacheKey, {
        studentId,
        weekStart,
        summary: result.response,
        generatedAt: Date.now(),
      });

      set({ isGenerating: false, weeklySummaryCache: newCache });
      return result.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ isGenerating: false, error: errorMessage });
      throw err;
    }
  },

  getCachedSummary: (studentId, weekStart) => {
    const cacheKey = `${studentId}-${weekStart}`;
    const cached = get().weeklySummaryCache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt < CACHE_TTL) {
      return cached.summary;
    }
    return null;
  },

  clearCache: () => {
    set({ weeklySummaryCache: new Map() });
  },
}));
