import { create } from "zustand";
import type { ActivitySummary, GradeLevel } from "../../../../shared/types";

export interface HourTarget {
  subjectId: string;
  subjectName: string;
  targetMinutes: number;
  actualMinutes: number;
  percentComplete: number;
}

export interface HourTrackingSummary {
  totalMinutes: number;
  totalHours: number;
  targetMinutes: number | null;
  targetHours: number | null;
  percentComplete: number | null;
  bySubject: HourTarget[];
  daysRemaining: number;
  minutesPerDayNeeded: number | null;
}

interface HourTrackingState {
  summary: HourTrackingSummary | null;
  activitySummary: ActivitySummary[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSummary: (
    studentId: string,
    schoolYear: string,
    stateRequirements?: StateHourRequirements,
  ) => Promise<void>;
  getSchoolYearDateRange: (schoolYear: string) => {
    startDate: string;
    endDate: string;
  };
  calculateDaysRemaining: (endDate: string) => number;
}

export interface StateHourRequirements {
  totalHoursPerYear: number | null;
  bySubject?: Record<string, number>;
}

export const useHourTrackingStore = create<HourTrackingState>((set, get) => ({
  summary: null,
  activitySummary: [],
  isLoading: false,
  error: null,

  getSchoolYearDateRange: (schoolYear: string) => {
    const [startYear] = schoolYear.split("/");
    return {
      startDate: `${startYear}-08-01`,
      endDate: `${parseInt(startYear) + 1}-07-31`,
    };
  },

  calculateDaysRemaining: (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diff = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  loadSummary: async (
    studentId: string,
    schoolYear: string,
    stateRequirements?: StateHourRequirements,
  ) => {
    set({ isLoading: true, error: null });

    try {
      const { startDate, endDate } = get().getSchoolYearDateRange(schoolYear);
      const activitySummary = await window.api.getActivitySummary(
        studentId,
        startDate,
        endDate,
      );

      // Calculate totals
      const totalMinutes = activitySummary.reduce(
        (sum, s) => sum + s.totalMinutes,
        0,
      );
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

      // Calculate target
      const targetMinutes = stateRequirements?.totalHoursPerYear
        ? stateRequirements.totalHoursPerYear * 60
        : null;
      const targetHours = stateRequirements?.totalHoursPerYear ?? null;

      // Calculate percent complete
      const percentComplete = targetMinutes
        ? Math.round((totalMinutes / targetMinutes) * 100)
        : null;

      // Calculate by subject
      const bySubject: HourTarget[] = activitySummary.map((s) => {
        const subjectTarget = stateRequirements?.bySubject?.[s.subjectId];
        const targetMin = subjectTarget
          ? subjectTarget * 60
          : totalMinutes / activitySummary.length;

        return {
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          targetMinutes: targetMin,
          actualMinutes: s.totalMinutes,
          percentComplete: Math.round((s.totalMinutes / targetMin) * 100),
        };
      });

      // Calculate days remaining and minutes per day needed
      const daysRemaining = get().calculateDaysRemaining(endDate);
      const minutesPerDayNeeded =
        targetMinutes && daysRemaining > 0
          ? Math.max(
              0,
              Math.ceil((targetMinutes - totalMinutes) / daysRemaining),
            )
          : null;

      set({
        activitySummary,
        summary: {
          totalMinutes,
          totalHours,
          targetMinutes,
          targetHours,
          percentComplete,
          bySubject,
          daysRemaining,
          minutesPerDayNeeded,
        },
        isLoading: false,
      });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to load hour summary",
        isLoading: false,
      });
    }
  },
}));
