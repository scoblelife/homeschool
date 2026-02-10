import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { format, parseISO, isWithinInterval, subDays, addDays } from "date-fns";
import type {
  Activity,
  FieldTripActivity,
  FieldTrip,
} from "../../../../shared/types";

interface LinkedActivitiesProps {
  fieldTrip: FieldTrip;
  onLink: (activityId: string) => Promise<void>;
  onUnlink: (activityId: string) => Promise<void>;
}

export function LinkedActivities({
  fieldTrip,
  onLink,
  onUnlink,
}: LinkedActivitiesProps) {
  const [linkedActivityIds, setLinkedActivityIds] = useState<string[]>([]);
  const [linkedActivities, setLinkedActivities] = useState<Activity[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>(
    [],
  );
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load linked activities
  const loadLinkedActivities = useCallback(async () => {
    try {
      const links = await window.api.getLinkedActivities(fieldTrip.id);
      const activityIds = links.map((l: FieldTripActivity) => l.activityId);
      setLinkedActivityIds(activityIds);

      if (activityIds.length > 0) {
        const allActivities = await window.api.getActivities({});
        const linked = allActivities.filter((a: Activity) =>
          activityIds.includes(a.id),
        );
        setLinkedActivities(linked);
      } else {
        setLinkedActivities([]);
      }
    } catch (error) {
      console.error("Failed to load linked activities:", error);
    }
  }, [fieldTrip.id]);

  // Load available activities for linking (activities around the field trip date)
  const loadAvailableActivities = useCallback(async () => {
    try {
      const tripDate = parseISO(fieldTrip.date);
      const startDate = subDays(tripDate, 7);
      const endDate = addDays(tripDate, 7);

      const allActivities = await window.api.getActivities({});
      const available = allActivities.filter((a: Activity) => {
        if (linkedActivityIds.includes(a.id)) return false;
        const actDate = parseISO(a.dateCompleted);
        return isWithinInterval(actDate, { start: startDate, end: endDate });
      });
      setAvailableActivities(available);
    } catch (error) {
      console.error("Failed to load available activities:", error);
    }
  }, [fieldTrip.date, linkedActivityIds]);

  useEffect(() => {
    loadLinkedActivities();
  }, [loadLinkedActivities]);

  useEffect(() => {
    if (isLinkModalOpen) {
      loadAvailableActivities();
    }
  }, [isLinkModalOpen, loadAvailableActivities]);

  const handleLink = async (activityId: string) => {
    setLoading(true);
    try {
      await onLink(activityId);
      await loadLinkedActivities();
      await loadAvailableActivities();
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (activityId: string) => {
    setLoading(true);
    try {
      await onUnlink(activityId);
      await loadLinkedActivities();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Linked Activities
        </h4>
        <button
          onClick={() => setIsLinkModalOpen(true)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <PlusIcon className="w-3 h-3" />
          Link Activity
        </button>
      </div>

      {linkedActivities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No activities linked yet. Link activities to track what was learned.
        </p>
      ) : (
        <ul className="space-y-2">
          {linkedActivities.map((activity) => (
            <li
              key={activity.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(parseISO(activity.dateCompleted), "MMM d, yyyy")}
                  {activity.durationMinutes &&
                    ` - ${activity.durationMinutes} min`}
                </p>
              </div>
              <button
                onClick={() => handleUnlink(activity.id)}
                disabled={loading}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Unlink activity"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Link Activity Modal */}
      <Dialog
        open={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl">
            <div className="p-6">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Link Activities
              </Dialog.Title>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Activities from{" "}
                {format(subDays(parseISO(fieldTrip.date), 7), "MMM d")} to{" "}
                {format(addDays(parseISO(fieldTrip.date), 7), "MMM d, yyyy")}
              </p>

              {availableActivities.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4 text-center">
                  No activities available to link. Log activities around the
                  field trip date first.
                </p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {availableActivities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(
                            parseISO(activity.dateCompleted),
                            "MMM d, yyyy",
                          )}
                          {activity.durationMinutes &&
                            ` - ${activity.durationMinutes} min`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLink(activity.id)}
                        disabled={loading}
                        className="ml-2 px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded transition-colors"
                      >
                        Link
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

// Icons
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// Compact linked count badge for card headers
interface LinkedCountBadgeProps {
  fieldTripId: string;
}

export function LinkedCountBadge({ fieldTripId }: LinkedCountBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    window.api
      .getLinkedActivities(fieldTripId)
      .then((links: FieldTripActivity[]) => {
        setCount(links.length);
      })
      .catch(console.error);
  }, [fieldTripId]);

  if (count === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
      title={`${count} linked ${count === 1 ? "activity" : "activities"}`}
    >
      <LinkIcon className="w-3 h-3" />
      {count}
    </span>
  );
}
