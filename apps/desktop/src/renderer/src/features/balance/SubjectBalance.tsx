/**
 * Subject Balance Component
 *
 * Displays weekly subject balance with targets and alerts.
 */

import { useState, useEffect, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Button, Input } from "@/components/ui";
import {
  useBalanceStore,
  calculateBalanceStatus,
  formatMinutes,
  getBalanceRecommendation,
  type BalanceData,
} from "./balanceStore";
import type { Subject, ActivitySummary } from "../../../../shared/types";

interface SubjectBalanceProps {
  studentId: string;
  studentName: string;
  subjects: Subject[];
}

export function SubjectBalance({
  studentId,
  studentName,
  subjects,
}: SubjectBalanceProps): JSX.Element {
  const [showSettings, setShowSettings] = useState(false);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([]);
  const getTargets = useBalanceStore((state) => state.getTargets);
  const targets = getTargets(studentId);

  // Load this week's activity data
  useEffect(() => {
    loadWeeklyData();
  }, [studentId]);

  const loadWeeklyData = async () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const summary = await window.api.getActivitySummary(
      studentId,
      format(weekStart, "yyyy-MM-dd"),
      format(weekEnd, "yyyy-MM-dd"),
    );
    setActivitySummary(summary);
  };

  // Calculate balance data for each subject
  const balanceData: BalanceData[] = useMemo(() => {
    return subjects.map((subject) => {
      const target = targets.find((t) => t.subjectId === subject.id);
      const actual = activitySummary.find((a) => a.subjectId === subject.id);
      const targetMinutes = target?.targetMinutesPerWeek || 0;
      const actualMinutes = actual?.totalMinutes || 0;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        targetMinutes,
        actualMinutes,
        percentageOfTarget:
          targetMinutes > 0 ? (actualMinutes / targetMinutes) * 100 : 0,
        status:
          targetMinutes > 0
            ? calculateBalanceStatus(actualMinutes, targetMinutes)
            : "no_target",
      };
    });
  }, [subjects, targets, activitySummary]);

  // Get subjects that need attention
  const underTargetSubjects = balanceData.filter((d) => d.status === "under");

  // Only show if there are targets set
  const hasTargets = targets.length > 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Weekly Subject Balance
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="text-brand-primary hover:text-brand-primaryDark"
          >
            {hasTargets ? "Edit Targets" : "Set Targets"}
          </Button>
        </div>

        {!hasTargets ? (
          <p className="text-sm text-gray-500">
            Set weekly hour targets for each subject to track balance.
          </p>
        ) : (
          <>
            {/* Alerts for under-target subjects */}
            {underTargetSubjects.length > 0 && (
              <div className="mb-4 p-3 bg-status-warningLight border border-status-warning rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-status-warning text-lg">⚠️</span>
                  <div className="flex-1">
                    <div className="font-medium text-status-warningDark">
                      Subjects Need Attention
                    </div>
                    <ul className="mt-1 text-sm text-status-warningDark space-y-1">
                      {underTargetSubjects.map((subject) => (
                        <li key={subject.subjectId}>
                          {getBalanceRecommendation(subject)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Balance bars */}
            <div className="space-y-3">
              {balanceData
                .filter((d) => d.status !== "no_target")
                .map((data) => (
                  <BalanceBar key={data.subjectId} data={data} />
                ))}
            </div>
          </>
        )}
      </div>

      <TargetSettingsModal
        open={showSettings}
        onClose={() => {
          setShowSettings(false);
          loadWeeklyData(); // Refresh data after settings change
        }}
        studentId={studentId}
        studentName={studentName}
        subjects={subjects}
      />
    </>
  );
}

interface BalanceBarProps {
  data: BalanceData;
}

function BalanceBar({ data }: BalanceBarProps): JSX.Element {
  const percentage = Math.min(data.percentageOfTarget, 150); // Cap at 150% for display
  const barColor =
    data.status === "under"
      ? "bg-status-warning"
      : data.status === "over"
        ? "bg-status-info"
        : "bg-status-success";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{data.subjectName}</span>
        <span className="text-gray-500">
          {formatMinutes(data.actualMinutes)} /{" "}
          {formatMinutes(data.targetMinutes)}
        </span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {/* Target line */}
        <div className="absolute h-full w-0.5 bg-gray-400 left-[100%] transform -translate-x-1/2" />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{Math.round(data.percentageOfTarget)}% of target</span>
        {data.status === "under" && (
          <span className="text-status-warningDark">
            {formatMinutes(data.targetMinutes - data.actualMinutes)} remaining
          </span>
        )}
      </div>
    </div>
  );
}

interface TargetSettingsModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  subjects: Subject[];
}

function TargetSettingsModal({
  open,
  onClose,
  studentId,
  studentName,
  subjects,
}: TargetSettingsModalProps): JSX.Element {
  const setSubjectTarget = useBalanceStore((state) => state.setSubjectTarget);
  const removeSubjectTarget = useBalanceStore(
    (state) => state.removeSubjectTarget,
  );
  const getTargets = useBalanceStore((state) => state.getTargets);

  const [localTargets, setLocalTargets] = useState<Record<string, number>>({});

  // Initialize local targets from store
  useEffect(() => {
    if (open) {
      const targets = getTargets(studentId);
      const initial: Record<string, number> = {};
      targets.forEach((t) => {
        initial[t.subjectId] = t.targetMinutesPerWeek;
      });
      setLocalTargets(initial);
    }
  }, [open, studentId, getTargets]);

  const handleSave = () => {
    // Save all targets
    subjects.forEach((subject) => {
      const target = localTargets[subject.id];
      if (target && target > 0) {
        setSubjectTarget(studentId, subject.id, target);
      } else {
        removeSubjectTarget(studentId, subject.id);
      }
    });
    onClose();
  };

  const handleTargetChange = (subjectId: string, hours: number) => {
    setLocalTargets({
      ...localTargets,
      [subjectId]: hours * 60, // Convert hours to minutes
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
            Weekly Hour Targets
          </Dialog.Title>
          <p className="text-sm text-gray-600 mb-4">
            Set target hours per week for {studentName}'s subjects. You'll be
            alerted when subjects fall significantly below target.
          </p>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {subjects.map((subject) => {
              const currentMinutes = localTargets[subject.id] || 0;
              const currentHours = Math.round((currentMinutes / 60) * 10) / 10;

              return (
                <div key={subject.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      {subject.name}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={40}
                      step={0.5}
                      value={currentHours || ""}
                      onChange={(e) =>
                        handleTargetChange(
                          subject.id,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      size="sm"
                      className="w-20 text-center"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-500">hrs/week</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Targets
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Compact alert component for dashboard
export function SubjectBalanceAlert({
  studentId,
  subjects,
}: {
  studentId: string;
  subjects: Subject[];
}): JSX.Element | null {
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([]);
  const getTargets = useBalanceStore((state) => state.getTargets);
  const targets = getTargets(studentId);

  useEffect(() => {
    loadWeeklyData();
  }, [studentId]);

  const loadWeeklyData = async () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const summary = await window.api.getActivitySummary(
      studentId,
      format(weekStart, "yyyy-MM-dd"),
      format(weekEnd, "yyyy-MM-dd"),
    );
    setActivitySummary(summary);
  };

  // Calculate under-target subjects
  const underTargetSubjects = useMemo(() => {
    return subjects
      .map((subject) => {
        const target = targets.find((t) => t.subjectId === subject.id);
        const actual = activitySummary.find((a) => a.subjectId === subject.id);
        if (!target) return null;

        const targetMinutes = target.targetMinutesPerWeek;
        const actualMinutes = actual?.totalMinutes || 0;
        const status = calculateBalanceStatus(actualMinutes, targetMinutes);

        if (status === "under") {
          return {
            name: subject.name,
            deficit: targetMinutes - actualMinutes,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ name: string; deficit: number }>;
  }, [subjects, targets, activitySummary]);

  if (underTargetSubjects.length === 0) return null;

  return (
    <div className="p-3 bg-status-warningLight border border-status-warning rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-status-warning">⚠️</span>
        <div className="text-sm">
          <span className="font-medium text-status-warningDark">
            Behind on:{" "}
          </span>
          <span className="text-status-warningDark">
            {underTargetSubjects.map((s) => s.name).join(", ")}
          </span>
        </div>
      </div>
    </div>
  );
}
