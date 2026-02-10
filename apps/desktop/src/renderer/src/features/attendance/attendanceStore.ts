import { create } from "zustand";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Student,
} from "../../../../shared/types";

interface AttendanceState {
  // State
  records: Record<string, AttendanceRecord[]>; // keyed by studentId
  stats: Record<
    string,
    {
      totalDays: number;
      schoolDays: number;
      absences: number;
      percentage: number;
    }
  >;
  isLoading: boolean;
  currentMonth: Date;
  selectedStudentId: string | null;

  // Actions
  setCurrentMonth: (date: Date) => void;
  setSelectedStudentId: (id: string | null) => void;
  loadAttendance: (
    studentId: string,
    startDate: string,
    endDate: string,
  ) => Promise<void>;
  loadStats: (
    studentId: string,
    startDate: string,
    endDate: string,
  ) => Promise<void>;
  setAttendance: (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string,
  ) => Promise<void>;
  deleteAttendance: (studentId: string, date: string) => Promise<void>;
  getRecord: (studentId: string, date: string) => AttendanceRecord | undefined;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: {},
  stats: {},
  isLoading: false,
  currentMonth: new Date(),
  selectedStudentId: null,

  setCurrentMonth: (date) => set({ currentMonth: date }),

  setSelectedStudentId: (id) => set({ selectedStudentId: id }),

  loadAttendance: async (studentId, startDate, endDate) => {
    set({ isLoading: true });
    try {
      const records = await window.api.getAttendanceRecords(
        studentId,
        startDate,
        endDate,
      );
      set((state) => ({
        records: {
          ...state.records,
          [studentId]: records,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to load attendance:", error);
      set({ isLoading: false });
    }
  },

  loadStats: async (studentId, startDate, endDate) => {
    try {
      const stats = await window.api.getAttendanceStats(
        studentId,
        startDate,
        endDate,
      );
      set((state) => ({
        stats: {
          ...state.stats,
          [studentId]: stats,
        },
      }));
    } catch (error) {
      console.error("Failed to load attendance stats:", error);
    }
  },

  setAttendance: async (studentId, date, status, notes) => {
    try {
      const record = await window.api.setAttendanceRecord({
        studentId,
        date,
        status,
        notes,
      });

      set((state) => {
        const existingRecords = state.records[studentId] || [];
        const filtered = existingRecords.filter((r) => r.date !== date);
        return {
          records: {
            ...state.records,
            [studentId]: [...filtered, record],
          },
        };
      });
    } catch (error) {
      console.error("Failed to set attendance:", error);
      throw error;
    }
  },

  deleteAttendance: async (studentId, date) => {
    try {
      await window.api.deleteAttendanceRecord(studentId, date);

      set((state) => {
        const existingRecords = state.records[studentId] || [];
        return {
          records: {
            ...state.records,
            [studentId]: existingRecords.filter((r) => r.date !== date),
          },
        };
      });
    } catch (error) {
      console.error("Failed to delete attendance:", error);
      throw error;
    }
  },

  getRecord: (studentId, date) => {
    const records = get().records[studentId] || [];
    return records.find((r) => r.date === date);
  },
}));

// Helper to get month date range
export function getMonthRange(date: Date): {
  startDate: string;
  endDate: string;
} {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startDate = new Date(year, month, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
  return { startDate, endDate };
}

// Helper to get school year date range (Aug 1 - Jul 31)
export function getSchoolYearRange(date: Date): {
  startDate: string;
  endDate: string;
} {
  const year = date.getFullYear();
  const month = date.getMonth();

  // If we're in Jan-Jul, school year started previous August
  // If we're in Aug-Dec, school year started this August
  const startYear = month < 7 ? year - 1 : year;
  const endYear = startYear + 1;

  return {
    startDate: `${startYear}-08-01`,
    endDate: `${endYear}-07-31`,
  };
}
