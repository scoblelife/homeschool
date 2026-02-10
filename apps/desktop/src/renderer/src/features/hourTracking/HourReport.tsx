import { useState, useEffect, useMemo } from "react";
import { useStore } from "../../stores/useStore";
import {
  useHourTrackingStore,
  type StateHourRequirements,
} from "./hourTrackingStore";
import stateRequirements from "../../../../data/stateRequirements.json";

interface Props {
  studentId?: string;
}

export function HourReport({ studentId }: Props) {
  const { students, getSelectedStudent } = useStore();
  const { summary, isLoading, loadSummary, getSchoolYearDateRange } =
    useHourTrackingStore();
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "");
  const [schoolYear, setSchoolYear] = useState("");
  const [selectedState, setSelectedState] = useState("NV");

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || getSelectedStudent();

  // Get current school year on mount
  useEffect(() => {
    window.api
      .getCurrentSchoolYear()
      .then(setSchoolYear)
      .catch((error) => {
        console.error("[HourReport] Failed to load school year:", error);
      });
  }, []);

  // Auto-select first student
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Load data when student, year, or state changes
  useEffect(() => {
    if (selectedStudentId && schoolYear) {
      const stateData = (
        stateRequirements.states as Record<
          string,
          { requiredHoursPerYear: number | null }
        >
      )[selectedState];
      const requirements: StateHourRequirements | undefined =
        stateData?.requiredHoursPerYear
          ? { totalHoursPerYear: stateData.requiredHoursPerYear }
          : undefined;

      loadSummary(selectedStudentId, schoolYear, requirements);
    }
  }, [selectedStudentId, schoolYear, selectedState, loadSummary]);

  // State options
  const stateOptions = useMemo(() => {
    return Object.entries(
      stateRequirements.states as Record<
        string,
        { name: string; requiredHoursPerYear: number | null }
      >,
    )
      .map(([code, data]) => ({
        code,
        name: data.name,
        hasHourRequirement: data.requiredHoursPerYear !== null,
        hours: data.requiredHoursPerYear,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // School year options
  const yearOptions = useMemo(() => {
    const years: string[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();

    for (let i = 0; i < 3; i++) {
      const startYear = month < 7 ? currentYear - 1 - i : currentYear - i;
      years.push(`${startYear}/${startYear + 1}`);
    }

    return years;
  }, []);

  // Get progress color
  const getProgressColor = (percent: number, isAlert: boolean = false) => {
    if (isAlert) {
      if (percent >= 100) return "bg-status-success";
      if (percent >= 75) return "bg-status-info";
      if (percent >= 50) return "bg-status-warning";
      return "bg-status-error";
    }
    return "bg-brand-primary";
  };

  const getProgressTextColor = (percent: number) => {
    if (percent >= 100) return "text-status-success";
    if (percent >= 75) return "text-status-info";
    if (percent >= 50) return "text-status-warning";
    return "text-status-error";
  };

  const dateRange = schoolYear ? getSchoolYearDateRange(schoolYear) : null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Student Selector */}
        {!studentId && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Student:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.gradeLevel})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* School Year */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            School Year:
          </label>
          <select
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            State Requirements:
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {stateOptions.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}{" "}
                {state.hasHourRequirement
                  ? `(${state.hours} hrs)`
                  : "(No hour req)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-8">
          Loading hour data...
        </div>
      ) : !summary ? (
        <div className="text-center text-gray-500 py-8">
          Select a student and school year to view hour tracking.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Hours
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {summary.totalHours}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(summary.totalMinutes)} minutes
              </p>
            </div>

            {/* Target Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Target Hours
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {summary.targetHours ?? "N/A"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedState} requirement
              </p>
            </div>

            {/* Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Progress
              </p>
              <p
                className={`text-3xl font-bold ${
                  summary.percentComplete !== null
                    ? getProgressTextColor(summary.percentComplete)
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {summary.percentComplete !== null
                  ? `${summary.percentComplete}%`
                  : "N/A"}
              </p>
              {summary.percentComplete !== null &&
                summary.percentComplete < 100 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(
                      (summary.targetMinutes! - summary.totalMinutes) / 60,
                    )}{" "}
                    hrs remaining
                  </p>
                )}
            </div>

            {/* Days Remaining */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Days Remaining
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {summary.daysRemaining}
              </p>
              {summary.minutesPerDayNeeded !== null &&
                summary.minutesPerDayNeeded > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round((summary.minutesPerDayNeeded / 60) * 10) / 10}{" "}
                    hrs/day needed
                  </p>
                )}
            </div>
          </div>

          {/* Progress Bar */}
          {summary.targetMinutes !== null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Progress
                </span>
                <span
                  className={`text-sm font-semibold ${getProgressTextColor(summary.percentComplete!)}`}
                >
                  {summary.totalHours} / {summary.targetHours} hours
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${getProgressColor(summary.percentComplete!, true)}`}
                  style={{
                    width: `${Math.min(100, summary.percentComplete!)}%`,
                  }}
                />
              </div>
              {summary.percentComplete !== null &&
                summary.percentComplete < 50 && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <AlertIcon /> You're behind schedule. Consider logging
                      more instructional hours to meet the {summary.targetHours}{" "}
                      hour requirement.
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Hours by Subject */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hours by Subject
            </h3>
            <div className="space-y-4">
              {summary.bySubject.map((subject) => (
                <div key={subject.subjectId}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {subject.subjectName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round((subject.actualMinutes / 60) * 10) / 10} hrs
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-brand-primary transition-all"
                      style={{
                        width: `${Math.min(100, (subject.actualMinutes / summary.totalMinutes) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Info */}
          {dateRange && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Showing data from{" "}
              {new Date(dateRange.startDate).toLocaleDateString()} to{" "}
              {new Date(dateRange.endDate).toLocaleDateString()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AlertIcon() {
  return (
    <svg
      className="w-4 h-4 inline mr-1"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
