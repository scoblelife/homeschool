/**
 * Timer Indicator
 *
 * Compact timer display for the header.
 * Shows running time and allows quick pause/resume.
 */

import { useState, useEffect } from "react";
import { useTimerStore } from "./timerStore";
import { useStore } from "../../stores/useStore";
import { Button } from "../../components/ui";

interface TimerIndicatorProps {
  onClick?: () => void;
}

export function TimerIndicator({ onClick }: TimerIndicatorProps) {
  const { activeSession, isPaused, pauseTimer, resumeTimer, getElapsedTime } =
    useTimerStore();
  const { students, subjects } = useStore();
  const [displayTime, setDisplayTime] = useState("00:00");

  // Update display time every second
  useEffect(() => {
    if (!activeSession) return;

    const updateDisplay = () => {
      const elapsed = getElapsedTime();
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      if (hours > 0) {
        setDisplayTime(
          `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      } else {
        setDisplayTime(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      }
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isPaused, getElapsedTime]);

  if (!activeSession) return null;

  const student = students.find((s) => s.id === activeSession.studentId);
  const subject = subjects.find((s) => s.id === activeSession.subjectId);

  const handlePauseResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        isPaused
          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          : "bg-status-successLight text-status-successDark hover:bg-status-successLight"
      }`}
    >
      {/* Timer icon */}
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Time display */}
      <span className="font-mono tabular-nums">{displayTime}</span>

      {/* Subject badge */}
      <span className="text-xs opacity-75 hidden sm:inline">
        {subject?.name}
      </span>

      {/* Pause/Resume button */}
      <Button
        onClick={handlePauseResume}
        variant="ghost"
        size="sm"
        className={`p-1 rounded-full ${
          isPaused ? "hover:bg-yellow-300" : "hover:bg-status-success"
        }`}
        title={isPaused ? "Resume" : "Pause"}
      >
        {isPaused ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </Button>

      {/* Pulsing dot when running */}
      {!isPaused && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-warning opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
        </span>
      )}
    </Button>
  );
}

export default TimerIndicator;
