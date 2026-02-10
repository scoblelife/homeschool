import { useEffect } from "react";
import { useAttendanceStore, getSchoolYearRange } from "./attendanceStore";
import type { Student } from "../../../../shared/types";

// Simple icons
function CalendarDaysIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function AcademicCapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
      />
    </svg>
  );
}

function ExclamationCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

interface Props {
  students: Student[];
}

export function AttendanceStats({ students }: Props) {
  const { stats, loadStats, selectedStudentId } = useAttendanceStore();

  // Load stats for selected student or all students
  useEffect(() => {
    const { startDate, endDate } = getSchoolYearRange(new Date());

    if (selectedStudentId) {
      loadStats(selectedStudentId, startDate, endDate);
    } else {
      students.forEach((student) => {
        loadStats(student.id, startDate, endDate);
      });
    }
  }, [students, selectedStudentId, loadStats]);

  const studentStats = selectedStudentId ? stats[selectedStudentId] : null;
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Calculate aggregate stats if no student selected
  const aggregateStats = !selectedStudentId
    ? Object.values(stats).reduce(
        (acc, s) => ({
          totalDays: acc.totalDays + (s?.totalDays || 0),
          schoolDays: acc.schoolDays + (s?.schoolDays || 0),
          absences: acc.absences + (s?.absences || 0),
          percentage: 0,
        }),
        { totalDays: 0, schoolDays: 0, absences: 0, percentage: 0 },
      )
    : null;

  if (aggregateStats) {
    aggregateStats.percentage =
      aggregateStats.totalDays > 0
        ? Math.round(
            (aggregateStats.schoolDays / aggregateStats.totalDays) * 100,
          )
        : 0;
  }

  const displayStats = studentStats || aggregateStats;

  if (!displayStats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No attendance data for this school year
        </p>
      </div>
    );
  }

  const { startDate, endDate } = getSchoolYearRange(new Date());
  const schoolYearLabel = `${new Date(startDate).getFullYear()}-${new Date(endDate).getFullYear()}`;

  // Determine attendance percentage color
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90)
      return "text-status-successDark dark:text-status-success";
    if (percentage >= 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-status-error dark:text-status-error";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Attendance Statistics
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          School Year {schoolYearLabel}
        </span>
      </div>

      {selectedStudent && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing stats for {selectedStudent.name}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Days */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDaysIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Days
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayStats.totalDays}
          </p>
        </div>

        {/* School Days */}
        <div
          className={`bg-status-successLight dark:bg-status-successDark/30 rounded-lg p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AcademicCapIcon className="w-5 h-5 text-status-successDark dark:text-status-success" />
            <span className="text-sm text-status-successDark dark:text-status-success">
              School Days
            </span>
          </div>
          <p className="text-2xl font-bold text-status-successDark dark:text-status-success">
            {displayStats.schoolDays}
          </p>
        </div>

        {/* Absences */}
        <div
          className={`bg-status-errorLight dark:bg-status-errorDark/30 rounded-lg p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ExclamationCircleIcon className="w-5 h-5 text-status-error dark:text-status-error" />
            <span className="text-sm text-status-error dark:text-status-error">
              Absences
            </span>
          </div>
          <p className="text-2xl font-bold text-status-errorDark dark:text-status-error">
            {displayStats.absences}
          </p>
        </div>

        {/* Attendance Percentage */}
        <div
          className={`bg-status-infoLight dark:bg-status-infoDark/30 rounded-lg p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-status-infoDark dark:text-status-info" />
            <span className="text-sm text-status-infoDark dark:text-status-info">
              Attendance Rate
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${getPercentageColor(displayStats.percentage)}`}
          >
            {displayStats.percentage}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            Attendance Progress
          </span>
          <span className={getPercentageColor(displayStats.percentage)}>
            {displayStats.percentage}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              displayStats.percentage >= 90
                ? "bg-status-success"
                : displayStats.percentage >= 80
                  ? "bg-yellow-500"
                  : "bg-status-error"
            }`}
            style={{ width: `${displayStats.percentage}%` }}
          />
        </div>
      </div>

      {/* State requirement notice */}
      <div
        className={`mt-6 p-4 bg-status-infoLight dark:bg-status-infoDark/20 rounded-lg`}
      >
        <p
          className={`text-sm text-status-infoDark dark:text-status-infoLight`}
        >
          <strong>Note:</strong> Many states require tracking of instructional
          days. Nevada requires notification of intent to homeschool but has no
          minimum day requirement. Check your state's specific requirements in
          Settings.
        </p>
      </div>
    </div>
  );
}
