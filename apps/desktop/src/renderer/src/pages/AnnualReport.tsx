/**
 * Annual Report Page
 *
 * Year-over-year comparison and annual progress tracking.
 */

import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfYear,
  endOfYear,
  parseISO,
  eachMonthOfInterval,
  subYears,
} from "date-fns";
import { useStore } from "../stores/useStore";
import { getStudentColor } from "../utils/studentColors";
import type { Activity, DailySummary, Subject } from "../../../shared/types";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

interface MonthlyData {
  month: string;
  activities: number;
  minutes: number;
}

interface YearlyStats {
  year: number;
  totalActivities: number;
  totalMinutes: number;
  totalDays: number;
  bySubject: Record<string, { activities: number; minutes: number }>;
  monthlyData: MonthlyData[];
}

export default function AnnualReport(): JSX.Element {
  const { students, subjects, selectedStudentId, getStudentById } = useStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentYearStats, setCurrentYearStats] = useState<YearlyStats | null>(
    null,
  );
  const [previousYearStats, setPreviousYearStats] =
    useState<YearlyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedStudent = selectedStudentId
    ? getStudentById(selectedStudentId)
    : null;

  useEffect(() => {
    if (selectedStudentId) {
      loadYearlyData();
    }
  }, [selectedStudentId, currentYear]);

  const loadYearlyData = async () => {
    if (!selectedStudentId) return;

    setIsLoading(true);

    const currentYearStart = startOfYear(new Date(currentYear, 0, 1));
    const currentYearEnd = endOfYear(new Date(currentYear, 0, 1));
    const previousYearStart = startOfYear(subYears(currentYearStart, 1));
    const previousYearEnd = endOfYear(subYears(currentYearStart, 1));

    const [
      currentActivities,
      previousActivities,
      currentDailies,
      previousDailies,
    ] = await Promise.all([
      window.api.getActivities({
        studentId: selectedStudentId,
        startDate: format(currentYearStart, "yyyy-MM-dd"),
        endDate: format(currentYearEnd, "yyyy-MM-dd"),
      }),
      window.api.getActivities({
        studentId: selectedStudentId,
        startDate: format(previousYearStart, "yyyy-MM-dd"),
        endDate: format(previousYearEnd, "yyyy-MM-dd"),
      }),
      window.api.getDailySummaries(
        selectedStudentId,
        format(currentYearStart, "yyyy-MM-dd"),
        format(currentYearEnd, "yyyy-MM-dd"),
      ),
      window.api.getDailySummaries(
        selectedStudentId,
        format(previousYearStart, "yyyy-MM-dd"),
        format(previousYearEnd, "yyyy-MM-dd"),
      ),
    ]);

    setCurrentYearStats(
      calculateYearlyStats(
        currentYear,
        currentActivities,
        currentDailies,
        subjects,
      ),
    );
    setPreviousYearStats(
      calculateYearlyStats(
        currentYear - 1,
        previousActivities,
        previousDailies,
        subjects,
      ),
    );
    setIsLoading(false);
  };

  const calculateYearlyStats = (
    year: number,
    activities: Activity[],
    dailies: DailySummary[],
    subjectList: Subject[],
  ): YearlyStats => {
    const totalActivities = activities.length;
    const totalMinutes = activities.reduce(
      (sum, a) => sum + (a.durationMinutes || 0),
      0,
    );
    const totalDays = dailies.filter((d) => d.activitiesCount > 0).length;

    // Group by subject
    const bySubject: Record<string, { activities: number; minutes: number }> =
      {};
    activities.forEach((activity) => {
      const subjectId = activity.subjectId;
      if (!bySubject[subjectId]) {
        bySubject[subjectId] = { activities: 0, minutes: 0 };
      }
      bySubject[subjectId].activities += 1;
      bySubject[subjectId].minutes += activity.durationMinutes || 0;
    });

    // Monthly breakdown
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    const monthlyData: MonthlyData[] = months.map((monthDate) => {
      const monthStr = format(monthDate, "yyyy-MM");
      const monthActivities = activities.filter((a) =>
        a.dateCompleted.startsWith(monthStr),
      );
      return {
        month: format(monthDate, "MMM"),
        activities: monthActivities.length,
        minutes: monthActivities.reduce(
          (sum, a) => sum + (a.durationMinutes || 0),
          0,
        ),
      };
    });

    return {
      year,
      totalActivities,
      totalMinutes,
      totalDays,
      bySubject,
      monthlyData,
    };
  };

  const formatHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const calculateChange = (
    current: number,
    previous: number,
  ): { value: number; isPositive: boolean } => {
    if (previous === 0)
      return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
  };

  const handleExportReport = () => {
    if (!selectedStudent || !currentYearStats) return;

    const reportData = {
      student: selectedStudent.name,
      year: currentYear,
      stats: currentYearStats,
      previousYear: previousYearStats,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedStudent.name}-annual-report-${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxMonthlyActivities = useMemo(() => {
    if (!currentYearStats) return 0;
    return Math.max(
      ...currentYearStats.monthlyData.map((m) => m.activities),
      1,
    );
  }, [currentYearStats]);

  if (!selectedStudent) {
    return (
      <PageContainer>
        <PageHeader
          title="Annual Report"
          subtitle="Please select a student to view their annual report."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Annual Report"
        subtitle={`${selectedStudent.name}'s learning progress`}
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentYear((y) => y - 1)}
                aria-label="Previous year"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <span className="text-lg font-semibold min-w-[60px] text-center">
                {currentYear}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentYear((y) => y + 1)}
                disabled={currentYear >= new Date().getFullYear()}
                aria-label="Next year"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>
            <Button variant="primary" onClick={handleExportReport}>
              Export Report
            </Button>
          </div>
        }
      />
      {isLoading ? (
        <div className="text-center py-12 text-neutral-textSecondary">
          Loading annual data...
        </div>
      ) : currentYearStats ? (
        <>
          {/* Year Overview Stats */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            aria-live="polite"
          >
            <StatCard
              title="Total Activities"
              value={currentYearStats.totalActivities}
              previousValue={previousYearStats?.totalActivities || 0}
              formatValue={(v) => v.toString()}
            />
            <StatCard
              title="Total Hours"
              value={currentYearStats.totalMinutes}
              previousValue={previousYearStats?.totalMinutes || 0}
              formatValue={(v) => formatHours(v)}
            />
            <StatCard
              title="Active Days"
              value={currentYearStats.totalDays}
              previousValue={previousYearStats?.totalDays || 0}
              formatValue={(v) => v.toString()}
            />
            <StatCard
              title="Avg Minutes/Day"
              value={
                currentYearStats.totalDays > 0
                  ? Math.round(
                      currentYearStats.totalMinutes /
                        currentYearStats.totalDays,
                    )
                  : 0
              }
              previousValue={
                previousYearStats && previousYearStats.totalDays > 0
                  ? Math.round(
                      previousYearStats.totalMinutes /
                        previousYearStats.totalDays,
                    )
                  : 0
              }
              formatValue={(v) => `${v}m`}
            />
          </div>

          {/* Monthly Activity Chart */}
          <Card className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-text mb-4">
              Monthly Activity
            </h2>
            <div
              className="flex items-end gap-2 h-48"
              role="img"
              aria-label="Monthly activity bar chart comparing current and previous year"
            >
              {currentYearStats.monthlyData.map((month, i) => {
                const height = (month.activities / maxMonthlyActivities) * 100;
                const previousMonth = previousYearStats?.monthlyData[i];
                const previousHeight = previousMonth
                  ? (previousMonth.activities / maxMonthlyActivities) * 100
                  : 0;

                return (
                  <div
                    key={month.month}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="relative w-full flex justify-center gap-1"
                      style={{ height: "160px" }}
                    >
                      {/* Previous year bar */}
                      <div
                        className="w-3 bg-neutral-border rounded-t self-end transition-all"
                        style={{ height: `${previousHeight}%` }}
                        title={`${currentYear - 1}: ${previousMonth?.activities || 0} activities`}
                      />
                      {/* Current year bar */}
                      <div
                        className={`w-3 rounded-t self-end transition-all ${getStudentColor(selectedStudent.color).bg}`}
                        style={{ height: `${height}%` }}
                        title={`${currentYear}: ${month.activities} activities`}
                      />
                    </div>
                    <span className="text-xs text-neutral-textSecondary">
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className={`flex items-center justify-center gap-6 mt-4 text-sm text-neutral-textSecondary`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded ${getStudentColor(selectedStudent.color).bg}`}
                />
                <span>{currentYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-neutral-border" />
                <span>{currentYear - 1}</span>
              </div>
            </div>
          </Card>

          {/* Subject Breakdown */}
          <Card className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-text mb-4">
              By Subject
            </h2>
            <div className="space-y-4">
              {subjects.map((subject) => {
                const current = currentYearStats.bySubject[subject.id] || {
                  activities: 0,
                  minutes: 0,
                };
                const previous = previousYearStats?.bySubject[subject.id] || {
                  activities: 0,
                  minutes: 0,
                };
                const change = calculateChange(
                  current.minutes,
                  previous.minutes,
                );

                return (
                  <div key={subject.id} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-neutral-text truncate">
                      {subject.name}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-4 bg-neutral-backgroundDeep rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={Math.round(
                            Math.min(
                              (current.minutes /
                                Math.max(currentYearStats.totalMinutes, 1)) *
                                100,
                              100,
                            ),
                          )}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${subject.name}: ${formatHours(current.minutes)}`}
                        >
                          <div
                            className={`h-full ${getStudentColor(selectedStudent.color).bg} transition-all`}
                            style={{
                              width: `${Math.min((current.minutes / Math.max(currentYearStats.totalMinutes, 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-neutral-textSecondary min-w-[60px] text-right">
                          {formatHours(current.minutes)}
                        </span>
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      {previous.minutes > 0 && (
                        <span
                          className={`text-sm ${
                            change.isPositive
                              ? "text-status-success"
                              : "text-status-error"
                          }`}
                        >
                          {change.isPositive ? "↑" : "↓"} {change.value}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Year-over-Year Comparison Table */}
          {previousYearStats && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-text mb-4">
                Year-over-Year Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Metric</th>
                      <th className="text-right py-2 px-4">
                        {currentYear - 1}
                      </th>
                      <th className="text-right py-2 px-4">{currentYear}</th>
                      <th className="text-right py-2 px-4">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      label="Total Activities"
                      current={currentYearStats.totalActivities}
                      previous={previousYearStats.totalActivities}
                      format={(v) => v.toString()}
                    />
                    <ComparisonRow
                      label="Total Hours"
                      current={currentYearStats.totalMinutes}
                      previous={previousYearStats.totalMinutes}
                      format={(v) => formatHours(v)}
                    />
                    <ComparisonRow
                      label="Active Days"
                      current={currentYearStats.totalDays}
                      previous={previousYearStats.totalDays}
                      format={(v) => v.toString()}
                    />
                    <ComparisonRow
                      label="Avg per Day"
                      current={
                        currentYearStats.totalDays > 0
                          ? Math.round(
                              currentYearStats.totalMinutes /
                                currentYearStats.totalDays,
                            )
                          : 0
                      }
                      previous={
                        previousYearStats.totalDays > 0
                          ? Math.round(
                              previousYearStats.totalMinutes /
                                previousYearStats.totalDays,
                            )
                          : 0
                      }
                      format={(v) => `${v} min`}
                    />
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-neutral-textSecondary">
          No data available for this year.
        </div>
      )}
    </PageContainer>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  previousValue: number;
  formatValue: (v: number) => string;
}

function StatCard({
  title,
  value,
  previousValue,
  formatValue,
}: StatCardProps): JSX.Element {
  const change =
    previousValue > 0
      ? Math.round(((value - previousValue) / previousValue) * 100)
      : value > 0
        ? 100
        : 0;
  const isPositive = change >= 0;

  return (
    <Card
      className="bg-gradient-to-br from-white to-neutral-backgroundDeep"
      aria-label={`${title}: ${formatValue(value)}`}
    >
      <div className="text-sm font-medium text-neutral-textSecondary">
        {title}
      </div>
      <div className="text-3xl font-bold text-neutral-text mt-1">
        {formatValue(value)}
      </div>
      {previousValue > 0 && (
        <div
          className={`text-sm mt-2 ${isPositive ? "text-status-success" : "text-status-error"}`}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(change)}% vs last year
        </div>
      )}
    </Card>
  );
}

interface ComparisonRowProps {
  label: string;
  current: number;
  previous: number;
  format: (v: number) => string;
}

function ComparisonRow({
  label,
  current,
  previous,
  format,
}: ComparisonRowProps): JSX.Element {
  const change =
    previous > 0
      ? Math.round(((current - previous) / previous) * 100)
      : current > 0
        ? 100
        : 0;
  const isPositive = change >= 0;

  return (
    <tr className="border-b last:border-b-0">
      <td className="py-3 px-4 text-neutral-text">{label}</td>
      <td className="py-3 px-4 text-right text-neutral-textSecondary">
        {format(previous)}
      </td>
      <td className="py-3 px-4 text-right font-medium text-neutral-text">
        {format(current)}
      </td>
      <td
        className={`py-3 px-4 text-right ${isPositive ? "text-status-success" : "text-status-error"}`}
      >
        {isPositive ? "+" : ""}
        {change}%
      </td>
    </tr>
  );
}
