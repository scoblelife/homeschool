/**
 * Subject Balance Store
 *
 * Tracks target hours per subject and compares against actual logged hours.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SubjectTarget {
  subjectId: string;
  targetMinutesPerWeek: number;
}

export interface BalanceData {
  subjectId: string;
  subjectName: string;
  targetMinutes: number;
  actualMinutes: number;
  percentageOfTarget: number;
  status: "on_track" | "under" | "over" | "no_target";
}

interface BalanceState {
  // Student targets: studentId -> SubjectTarget[]
  studentTargets: Record<string, SubjectTarget[]>;

  // Actions
  setSubjectTarget: (
    studentId: string,
    subjectId: string,
    targetMinutesPerWeek: number,
  ) => void;
  removeSubjectTarget: (studentId: string, subjectId: string) => void;
  getTargets: (studentId: string) => SubjectTarget[];
  getTarget: (studentId: string, subjectId: string) => number | null;
}

export const useBalanceStore = create<BalanceState>()(
  persist(
    (set, get) => ({
      studentTargets: {},

      setSubjectTarget: (
        studentId: string,
        subjectId: string,
        targetMinutesPerWeek: number,
      ) => {
        const targets = get().studentTargets;
        const studentData = targets[studentId] || [];
        const existingIndex = studentData.findIndex(
          (t) => t.subjectId === subjectId,
        );

        let updated: SubjectTarget[];
        if (existingIndex >= 0) {
          updated = [...studentData];
          updated[existingIndex] = { subjectId, targetMinutesPerWeek };
        } else {
          updated = [...studentData, { subjectId, targetMinutesPerWeek }];
        }

        set({
          studentTargets: {
            ...targets,
            [studentId]: updated,
          },
        });
      },

      removeSubjectTarget: (studentId: string, subjectId: string) => {
        const targets = get().studentTargets;
        const studentData = targets[studentId] || [];

        set({
          studentTargets: {
            ...targets,
            [studentId]: studentData.filter((t) => t.subjectId !== subjectId),
          },
        });
      },

      getTargets: (studentId: string): SubjectTarget[] => {
        return get().studentTargets[studentId] || [];
      },

      getTarget: (studentId: string, subjectId: string): number | null => {
        const targets = get().studentTargets[studentId] || [];
        const target = targets.find((t) => t.subjectId === subjectId);
        return target ? target.targetMinutesPerWeek : null;
      },
    }),
    {
      name: "homeschool-balance-targets",
    },
  ),
);

// Threshold for "significantly under" - 70% of target
export const UNDER_TARGET_THRESHOLD = 0.7;

// Helper to calculate balance status
export function calculateBalanceStatus(
  actualMinutes: number,
  targetMinutes: number,
): "on_track" | "under" | "over" {
  if (targetMinutes === 0) return "on_track";
  const percentage = actualMinutes / targetMinutes;
  if (percentage < UNDER_TARGET_THRESHOLD) return "under";
  if (percentage > 1.3) return "over";
  return "on_track";
}

// Helper to format minutes as hours/minutes
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Recommendations based on balance data
export function getBalanceRecommendation(data: BalanceData): string | null {
  if (data.status === "no_target") return null;
  if (data.status === "on_track") return null;

  if (data.status === "under") {
    const deficit = data.targetMinutes - data.actualMinutes;
    return `Consider adding ${formatMinutes(deficit)} more of ${data.subjectName} this week.`;
  }

  return null;
}
