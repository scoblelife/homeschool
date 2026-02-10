/**
 * Streak Display Component
 *
 * Shows the current streak with a flame icon and badge display.
 */

import { useState, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { format, parseISO } from "date-fns";
import {
  useStreakStore,
  isStreakAtRisk,
  isStreakActive,
  type StreakData,
  type Badge,
} from "./streakStore";

// Default streak data for students without any streak history
const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLoggedDate: null,
  streakStartDate: null,
  badges: [],
};

interface StreakDisplayProps {
  studentId: string;
  studentName: string;
  studentColor?: string;
  compact?: boolean;
}

export function StreakDisplay({
  studentId,
  studentName,
  studentColor = "fuchsia",
  compact = false,
}: StreakDisplayProps): JSX.Element {
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  // Use a selector that returns a stable reference from the store
  const streakData = useStreakStore(
    (state) => state.streaks[studentId] ?? DEFAULT_STREAK,
  );
  const active = isStreakActive(streakData);
  const atRisk = isStreakAtRisk(streakData);

  const flameColor = active
    ? "text-orange-500"
    : atRisk
      ? "text-amber-400 animate-pulse"
      : "text-gray-300";

  if (compact) {
    return (
      <button
        onClick={() => setShowBadgesModal(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        title={`${studentName}'s streak`}
      >
        <FlameIcon className={`w-5 h-5 ${flameColor}`} />
        <span
          className={`text-sm font-semibold ${streakData.currentStreak > 0 ? "text-gray-900" : "text-gray-400"}`}
        >
          {streakData.currentStreak}
        </span>
        {streakData.badges.length > 0 && (
          <span className="text-xs">
            {streakData.badges[streakData.badges.length - 1].icon}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            {studentName}'s Streak
          </h3>
          {streakData.badges.length > 0 && (
            <button
              onClick={() => setShowBadgesModal(true)}
              className="text-sm text-fuchsia-600 hover:text-fuchsia-800"
            >
              View Badges ({streakData.badges.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FlameIcon className={`w-10 h-10 ${flameColor}`} />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {streakData.currentStreak}
              </div>
              <div className="text-xs text-gray-500">
                {streakData.currentStreak === 1 ? "day" : "days"}
              </div>
            </div>
          </div>

          <div className="border-l border-gray-200 pl-4">
            <div className="text-sm text-gray-500">Best Streak</div>
            <div className="text-lg font-semibold text-gray-700">
              {streakData.longestStreak} days
            </div>
          </div>
        </div>

        {atRisk && (
          <div className="mt-3 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            Log an activity today to keep your streak!
          </div>
        )}

        {!active && !atRisk && streakData.currentStreak === 0 && (
          <div className="mt-3 text-sm text-gray-500">
            Log your first activity to start a streak!
          </div>
        )}

        {streakData.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {streakData.badges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 rounded-full text-xs"
                title={badge.description}
              >
                {badge.icon} {badge.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <BadgesModal
        open={showBadgesModal}
        onClose={() => setShowBadgesModal(false)}
        studentName={studentName}
        streakData={streakData}
      />
    </>
  );
}

interface BadgesModalProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  streakData: StreakData;
}

function BadgesModal({
  open,
  onClose,
  studentName,
  streakData,
}: BadgesModalProps): JSX.Element {
  const allBadges = [
    {
      id: "7-day",
      name: "Week Warrior",
      description: "7-day streak",
      icon: "🏅",
      threshold: 7,
    },
    {
      id: "14-day",
      name: "Consistent Learner",
      description: "14-day streak",
      icon: "🎖️",
      threshold: 14,
    },
    {
      id: "30-day",
      name: "Month Master",
      description: "30-day streak",
      icon: "🏆",
      threshold: 30,
    },
    {
      id: "60-day",
      name: "Two-Month Champion",
      description: "60-day streak",
      icon: "🌟",
      threshold: 60,
    },
    {
      id: "100-day",
      name: "Century Scholar",
      description: "100-day streak",
      icon: "👑",
      threshold: 100,
    },
    {
      id: "365-day",
      name: "Year-Long Legend",
      description: "365-day streak",
      icon: "💎",
      threshold: 365,
    },
  ];

  const earnedBadgeIds = new Set(streakData.badges.map((b) => b.id));
  const earnedBadgesMap = new Map(streakData.badges.map((b) => [b.id, b]));

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
            {studentName}'s Badges
          </Dialog.Title>
          <p className="text-sm text-gray-600 mb-4">
            Current streak: {streakData.currentStreak} days | Best:{" "}
            {streakData.longestStreak} days
          </p>

          <div className="space-y-3">
            {allBadges.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              const earnedBadge = earnedBadgesMap.get(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    earned
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <span
                    className={`text-2xl ${earned ? "" : "grayscale opacity-50"}`}
                  >
                    {badge.icon}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${earned ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {badge.name}
                    </div>
                    <div
                      className={`text-xs ${earned ? "text-gray-600" : "text-gray-400"}`}
                    >
                      {badge.description}
                    </div>
                    {earned && earnedBadge && (
                      <div className="text-xs text-amber-600 mt-0.5">
                        Earned{" "}
                        {format(
                          parseISO(earnedBadge.earnedDate),
                          "MMM d, yyyy",
                        )}
                      </div>
                    )}
                  </div>
                  {!earned && (
                    <div className="text-xs text-gray-400">
                      {badge.threshold - streakData.longestStreak > 0
                        ? `${badge.threshold - streakData.longestStreak} more days`
                        : "Keep going!"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function FlameIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.57 1.88-6.75 4.75-8.5.45-.28 1.03-.11 1.29.37.2.36.13.8-.16 1.08C7.1 8.67 6 10.98 6 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.11-.66-4.08-1.87-5.71l-.14-.19c-.24-.33-.19-.78.11-1.05.3-.27.75-.26 1.03.03C19.07 9.09 21 11.88 21 14c0 4.97-4.03 9-9 9zM12 4c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55.45-1 1-1zm0 6c-2.21 0-4 1.79-4 4 0 2.21 1.79 4 4 4s4-1.79 4-4c0-2.21-1.79-4-4-4z" />
    </svg>
  );
}

// Export a compact version for the header
export function CompactStreakBadge({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}): JSX.Element {
  return (
    <StreakDisplay studentId={studentId} studentName={studentName} compact />
  );
}
