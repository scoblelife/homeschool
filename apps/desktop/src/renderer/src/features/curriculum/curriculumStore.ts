import { create } from "zustand";
import type {
  LearningStandard,
  CurriculumReport,
  GradeLevel,
} from "../../../../shared/types";

interface CurriculumState {
  standards: LearningStandard[];
  report: CurriculumReport | null;
  selectedSubject: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStandards: (gradeLevel?: GradeLevel) => Promise<void>;
  loadReport: (
    studentId: string,
    gradeLevel: GradeLevel,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  setSelectedSubject: (subjectId: string | null) => void;
  getStandardsBySubject: (subjectId: string) => LearningStandard[];
  getStandardsByDomain: (domain: string) => LearningStandard[];
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  standards: [],
  report: null,
  selectedSubject: null,
  isLoading: false,
  error: null,

  loadStandards: async (gradeLevel?: GradeLevel) => {
    set({ isLoading: true, error: null });
    try {
      const standards = await window.api.getAllStandards(gradeLevel);
      set({ standards, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load standards",
        isLoading: false,
      });
    }
  },

  loadReport: async (
    studentId: string,
    gradeLevel: GradeLevel,
    startDate?: string,
    endDate?: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const report = await window.api.getCurriculumReport(
        studentId,
        gradeLevel,
        startDate,
        endDate,
      );
      set({ report, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load report",
        isLoading: false,
      });
    }
  },

  setSelectedSubject: (subjectId: string | null) => {
    set({ selectedSubject: subjectId });
  },

  getStandardsBySubject: (subjectId: string) => {
    return get().standards.filter((s) => s.subjectId === subjectId);
  },

  getStandardsByDomain: (domain: string) => {
    return get().standards.filter((s) => s.domain === domain);
  },
}));
