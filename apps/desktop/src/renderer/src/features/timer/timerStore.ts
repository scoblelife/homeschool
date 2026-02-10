/**
 * Timer Store
 *
 * Manages session timer state with persistence across app restarts.
 * Uses localStorage to persist running timer state.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerSession {
  studentId: string;
  subjectId: string;
  startedAt: number; // Unix timestamp
  title?: string;
}

interface TimerState {
  // Current timer state
  activeSession: TimerSession | null;
  isPaused: boolean;
  pausedDuration: number; // Total paused time in ms
  pausedAt: number | null; // When the timer was paused

  // Actions
  startTimer: (studentId: string, subjectId: string, title?: string) => void;
  stopTimer: () => TimerSession | null;
  pauseTimer: () => void;
  resumeTimer: () => void;
  clearTimer: () => void;

  // Computed helpers
  getElapsedTime: () => number; // Returns elapsed time in ms
  getElapsedMinutes: () => number; // Returns elapsed time in minutes
}

const STORAGE_KEY = "homeschool-timer";

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isPaused: false,
      pausedDuration: 0,
      pausedAt: null,

      startTimer: (studentId, subjectId, title) => {
        set({
          activeSession: {
            studentId,
            subjectId,
            startedAt: Date.now(),
            title,
          },
          isPaused: false,
          pausedDuration: 0,
          pausedAt: null,
        });
      },

      stopTimer: () => {
        const { activeSession, isPaused, pausedAt, pausedDuration } = get();
        if (!activeSession) return null;

        // If paused, add current pause duration
        let totalPaused = pausedDuration;
        if (isPaused && pausedAt) {
          totalPaused += Date.now() - pausedAt;
        }

        const session = {
          ...activeSession,
          duration: Date.now() - activeSession.startedAt - totalPaused,
        };

        set({
          activeSession: null,
          isPaused: false,
          pausedDuration: 0,
          pausedAt: null,
        });

        return activeSession;
      },

      pauseTimer: () => {
        const { activeSession, isPaused } = get();
        if (!activeSession || isPaused) return;

        set({
          isPaused: true,
          pausedAt: Date.now(),
        });
      },

      resumeTimer: () => {
        const { activeSession, isPaused, pausedAt, pausedDuration } = get();
        if (!activeSession || !isPaused || !pausedAt) return;

        // Add the pause duration to total
        const additionalPause = Date.now() - pausedAt;
        set({
          isPaused: false,
          pausedAt: null,
          pausedDuration: pausedDuration + additionalPause,
        });
      },

      clearTimer: () => {
        set({
          activeSession: null,
          isPaused: false,
          pausedDuration: 0,
          pausedAt: null,
        });
      },

      getElapsedTime: () => {
        const { activeSession, isPaused, pausedAt, pausedDuration } = get();
        if (!activeSession) return 0;

        const now = Date.now();
        let elapsed = now - activeSession.startedAt - pausedDuration;

        // If currently paused, subtract current pause time
        if (isPaused && pausedAt) {
          elapsed -= now - pausedAt;
        }

        return Math.max(0, elapsed);
      },

      getElapsedMinutes: () => {
        return Math.floor(get().getElapsedTime() / 60000);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        activeSession: state.activeSession,
        isPaused: state.isPaused,
        pausedDuration: state.pausedDuration,
        pausedAt: state.pausedAt,
      }),
    },
  ),
);
