import { useState, useEffect } from "react";
import { format, parseISO, subDays, startOfMonth } from "date-fns";
import { useStore } from "../stores/useStore";
import { PortfolioExport } from "../features/portfolio";
import { AssessmentList } from "../features/assessments";
import type { ActivitySummary, DailySummary } from "../../../shared/types";

import { validateApiArray } from "../services/validateApiResponse";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

export default function Reports(): JSX.Element {
  const { students, selectedStudentId, getSelectedStudent } = useStore();
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedStudent = getSelectedStudent();

  useEffect(() => {
    async function loadReports(): Promise<void> {
      if (!selectedStudentId) {
        setActivitySummary([]);
        setDailySummaries([]);
        return;
      }

      setIsLoading(true);
      try {
        const [summaryRaw, dailyRaw] = await Promise.all([
          window.api.getActivitySummary(
            selectedStudentId,
            dateRange.startDate,
            dateRange.endDate,
          ),
          window.api.getDailySummaries(
            selectedStudentId,
            dateRange.startDate,
            dateRange.endDate,
          ),
        ]);
        const summary = validateApiArray<ActivitySummary>(
          summaryRaw,
          "Reports",
        );
        const daily = validateApiArray<DailySummary>(dailyRaw, "Reports");
        setActivitySummary(summary);
        setDailySummaries(daily);
      } catch (error) {
        console.error(
          `[Reports] Failed to load reports for student ${selectedStudentId}:`,
          error,
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [selectedStudentId, dateRange]);

  const totalActivities = activitySummary.reduce(
    (sum, s) => sum + s.totalActivities,
    0,
  );
  const totalMinutes = activitySummary.reduce(
    (sum, s) => sum + s.totalMinutes,
    0,
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const quickRanges = [
    { label: "This Week", days: 7 },
    { label: "This Month", days: 30 },
    { label: "This Quarter", days: 90 },
    { label: "This Year", days: 365 },
  ];

  return (
    <PageContainer>
      <PageHeader title="Reports" />
      {!selectedStudentId ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            Select a student from the sidebar to view reports.
          </p>
        </Card>
      ) : (
        <>
          {/* Date Range Selector */}
          <Card className="mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  From:
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="w-auto"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                {quickRanges.map((range) => (
                  <Button
                    variant="secondary"
                    key={range.label}
                    onClick={() =>
                      setDateRange({
                        startDate: format(
                          subDays(new Date(), range.days),
                          "yyyy-MM-dd",
                        ),
                        endDate: format(new Date(), "yyyy-MM-dd"),
                      })
                    }
                    className="text-xs"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading reports...
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <div className="text-sm font-medium text-gray-500">
                    Student
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-2">
                    {selectedStudent?.name}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {selectedStudent?.gradeLevel}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-gray-500">
                    Total Activities
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {totalActivities}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-gray-500">
                    Total Hours
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {totalHours}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-medium text-gray-500">
                    Active Days
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {dailySummaries.length}
                  </div>
                </Card>
              </div>

              {/* Subject Breakdown */}
              <Card className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  By Subject
                </h2>
                {activitySummary.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No activities in this date range.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activitySummary.map((summary) => {
                      const percentage =
                        totalMinutes > 0
                          ? (summary.totalMinutes / totalMinutes) * 100
                          : 0;
                      return (
                        <div key={summary.subjectId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {summary.subjectName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {summary.totalActivities} activities •{" "}
                              {Math.round((summary.totalMinutes / 60) * 10) /
                                10}{" "}
                              hrs
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-brand-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {/* Activity type breakdown */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(summary.byType).map(
                              ([type, count]) => {
                                if (count === 0) return null;
                                return (
                                  <Badge key={type} size="sm">
                                    {type.replace("_", " ")}: {count}
                                  </Badge>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Recent Daily Activity */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Daily Activity
                </h2>
                {dailySummaries.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No activity in this date range.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dailySummaries.slice(0, 14).map((day) => (
                      /* eslint-disable-next-line design-system/pages-use-components-only -- simple data row layout */
                      <div
                        key={day.date}
                        className="flex items-center justify-between p-3 bg-neutral-backgroundSecondary rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {format(parseISO(day.date), "EEEE, MMMM d")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {day.activitiesCount} activities •{" "}
                            {day.totalMinutes} min
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({
                            length: Math.min(day.activitiesCount, 10),
                          }).map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-brand-primary"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Assessments */}
              {selectedStudent && (
                <Card className="mt-8">
                  <AssessmentList student={selectedStudent} />
                </Card>
              )}

              {/* Portfolio Export */}
              <div className="mt-8">
                <PortfolioExport students={students} />
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
