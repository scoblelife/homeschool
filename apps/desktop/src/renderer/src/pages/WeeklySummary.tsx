/**
 * Weekly Summary Page
 *
 * Shows a comprehensive weekly summary with:
 * - Hours per subject breakdown
 * - Activities completed count
 * - Comparison to previous week
 * - Per-child summary
 */

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  parseISO,
  addDays,
} from "date-fns";
import { useStore } from "../stores/useStore";
import { getStudentColor } from "./Settings";
import { AIWeeklySummary } from "../features/aiInsights";
import type {
  ActivitySummary,
  DailySummary,
  Student,
} from "../../../shared/types";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

interface WeekData {
  activities: ActivitySummary[];
  daily: DailySummary[];
  totalActivities: number;
  totalMinutes: number;
  activeDays: number;
}

interface StudentWeekData {
  student: Student;
  current: WeekData;
  previous: WeekData;
  change: {
    activities: number;
    minutes: number;
    days: number;
  };
}

export default function WeeklySummary(): JSX.Element {
  const { students, subjects, getSubjectById } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [studentData, setStudentData] = useState<StudentWeekData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate week boundaries
  const now = new Date();
  const currentWeekStart = startOfWeek(subWeeks(now, weekOffset), {
    weekStartsOn: 0,
  });
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const previousWeekStart = subWeeks(currentWeekStart, 1);
  const previousWeekEnd = subWeeks(currentWeekEnd, 1);

  const loadWeekData = useCallback(async () => {
    if (students.length === 0) return;

    setIsLoading(true);
    try {
      const currentStart = format(currentWeekStart, "yyyy-MM-dd");
      const currentEnd = format(currentWeekEnd, "yyyy-MM-dd");
      const prevStart = format(previousWeekStart, "yyyy-MM-dd");
      const prevEnd = format(previousWeekEnd, "yyyy-MM-dd");

      const data: StudentWeekData[] = [];

      for (const student of students) {
        const [currentSummary, currentDaily, prevSummary, prevDaily] =
          await Promise.all([
            window.api.getActivitySummary(student.id, currentStart, currentEnd),
            window.api.getDailySummaries(student.id, currentStart, currentEnd),
            window.api.getActivitySummary(student.id, prevStart, prevEnd),
            window.api.getDailySummaries(student.id, prevStart, prevEnd),
          ]);

        const current: WeekData = {
          activities: currentSummary,
          daily: currentDaily,
          totalActivities: currentSummary.reduce(
            (sum, s) => sum + s.totalActivities,
            0,
          ),
          totalMinutes: currentSummary.reduce(
            (sum, s) => sum + s.totalMinutes,
            0,
          ),
          activeDays: currentDaily.length,
        };

        const previous: WeekData = {
          activities: prevSummary,
          daily: prevDaily,
          totalActivities: prevSummary.reduce(
            (sum, s) => sum + s.totalActivities,
            0,
          ),
          totalMinutes: prevSummary.reduce((sum, s) => sum + s.totalMinutes, 0),
          activeDays: prevDaily.length,
        };

        data.push({
          student,
          current,
          previous,
          change: {
            activities: current.totalActivities - previous.totalActivities,
            minutes: current.totalMinutes - previous.totalMinutes,
            days: current.activeDays - previous.activeDays,
          },
        });
      }

      setStudentData(data);
    } catch (err) {
      console.error("Failed to load week data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    students,
    currentWeekStart,
    currentWeekEnd,
    previousWeekStart,
    previousWeekEnd,
  ]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  // Calculate totals across all students
  const totals = {
    currentActivities: studentData.reduce(
      (sum, s) => sum + s.current.totalActivities,
      0,
    ),
    currentMinutes: studentData.reduce(
      (sum, s) => sum + s.current.totalMinutes,
      0,
    ),
    previousActivities: studentData.reduce(
      (sum, s) => sum + s.previous.totalActivities,
      0,
    ),
    previousMinutes: studentData.reduce(
      (sum, s) => sum + s.previous.totalMinutes,
      0,
    ),
  };

  const formatChange = (change: number, suffix = ""): string => {
    if (change === 0) return "No change";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}${suffix}`;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return "text-status-success";
    if (change < 0) return "text-status-error";
    return "text-neutral-textSecondary";
  };

  // Get days of the week for the heatmap
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Weekly Summary"
        subtitle={`${format(currentWeekStart, "MMMM d")} - ${format(currentWeekEnd, "MMMM d, yyyy")}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              Previous Week
            </Button>
            {weekOffset > 0 && (
              <Button
                variant="secondary"
                onClick={() => setWeekOffset(weekOffset - 1)}
              >
                Next Week
              </Button>
            )}
            {weekOffset > 0 && (
              <Button variant="primary" onClick={() => setWeekOffset(0)}>
                Current Week
              </Button>
            )}
          </div>
        }
      />
      {isLoading ? (
        <div
          className="text-center py-12 text-gray-500"
          aria-live="polite"
          aria-busy="true"
        >
          Loading weekly summary...
        </div>
      ) : students.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            No students added yet. Add students in Settings to see weekly
            summaries.
          </p>
        </Card>
      ) : (
        <>
          {/* Family Overview */}
          <Card className="mb-8 bg-gradient-to-r from-brand-primaryLight to-student-purple-50 border-brand-primaryLight">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Family Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/60 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-500">
                  Total Activities
                </div>
                <div className="text-3xl font-bold text-brand-primary mt-1">
                  {totals.currentActivities}
                </div>
                <div
                  className={`text-sm mt-1 ${getChangeColor(totals.currentActivities - totals.previousActivities)}`}
                >
                  {formatChange(
                    totals.currentActivities - totals.previousActivities,
                  )}{" "}
                  vs last week
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-500">
                  Total Hours
                </div>
                <div className="text-3xl font-bold text-brand-primary mt-1">
                  {Math.round((totals.currentMinutes / 60) * 10) / 10}
                </div>
                <div
                  className={`text-sm mt-1 ${getChangeColor(totals.currentMinutes - totals.previousMinutes)}`}
                >
                  {formatChange(
                    Math.round(
                      ((totals.currentMinutes - totals.previousMinutes) / 60) *
                        10,
                    ) / 10,
                    " hrs",
                  )}
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-500">
                  Students Active
                </div>
                <div className="text-3xl font-bold text-brand-primary mt-1">
                  {
                    studentData.filter((s) => s.current.totalActivities > 0)
                      .length
                  }{" "}
                  / {students.length}
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-500">
                  Avg Per Day
                </div>
                <div className="text-3xl font-bold text-brand-primary mt-1">
                  {Math.round(totals.currentActivities / 7)} activities
                </div>
              </div>
            </div>
          </Card>

          {/* Per-Student Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {studentData.map(({ student, current, previous, change }) => {
              const colors = getStudentColor(student.color);
              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-xl border border-neutral-border shadow-sm p-6 border-l-4 ${colors.border}`}
                  aria-label={`Weekly summary for ${student.name}`}
                >
                  {/* Student Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${colors.bg}`}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {student.gradeLevel}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {current.totalActivities}
                      </div>
                      <div className="text-xs text-gray-500">Activities</div>
                      <div
                        className={`text-xs mt-1 ${getChangeColor(change.activities)}`}
                      >
                        {formatChange(change.activities)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.round((current.totalMinutes / 60) * 10) / 10}
                      </div>
                      <div className="text-xs text-gray-500">Hours</div>
                      <div
                        className={`text-xs mt-1 ${getChangeColor(change.minutes)}`}
                      >
                        {formatChange(
                          Math.round((change.minutes / 60) * 10) / 10,
                          "h",
                        )}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {current.activeDays}
                      </div>
                      <div className="text-xs text-gray-500">Days Active</div>
                      <div
                        className={`text-xs mt-1 ${getChangeColor(change.days)}`}
                      >
                        {formatChange(change.days)}
                      </div>
                    </div>
                  </div>

                  {/* Week Activity Heatmap */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      Activity by Day
                    </div>
                    <div className="flex gap-1">
                      {weekDays.map((day) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const dayData = current.daily.find(
                          (d) => d.date === dayStr,
                        );
                        const count = dayData?.activitiesCount || 0;
                        const intensity =
                          count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3;
                        const intensityColors = [
                          "bg-gray-100",
                          "bg-status-successLight",
                          "bg-status-success",
                          "bg-status-successDark",
                        ];
                        return (
                          <div
                            key={dayStr}
                            className="flex-1 text-center"
                            title={`${format(day, "EEEE")}: ${count} activities`}
                            aria-label={`${format(day, "EEEE")}: ${count} activities`}
                          >
                            <div
                              className={`h-8 rounded ${intensityColors[intensity]}`}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {format(day, "EEE")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject Breakdown */}
                  {current.activities.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        By Subject
                      </div>
                      <div className="space-y-2">
                        {current.activities.slice(0, 5).map((activity) => {
                          const percentage =
                            current.totalMinutes > 0
                              ? (activity.totalMinutes / current.totalMinutes) *
                                100
                              : 0;
                          return (
                            <div key={activity.subjectId}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">
                                  {activity.subjectName}
                                </span>
                                <span className="text-gray-500">
                                  {activity.totalActivities} •{" "}
                                  {Math.round(activity.totalMinutes)} min
                                </span>
                              </div>
                              <div
                                className="h-1.5 bg-gray-200 rounded-full"
                                role="progressbar"
                                aria-valuenow={Math.round(percentage)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${activity.subjectName}: ${Math.round(percentage)}% of total time`}
                              >
                                <div
                                  className={`h-1.5 rounded-full ${colors.bg}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {current.totalActivities === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">
                      No activities this week
                    </p>
                  )}

                  {/* AI Weekly Summary */}
                  <AIWeeklySummary
                    studentId={student.id}
                    studentName={student.name}
                    gradeLevel={student.gradeLevel}
                    weekStart={format(currentWeekStart, "yyyy-MM-dd")}
                    weekData={{
                      totalActivities: current.totalActivities,
                      totalMinutes: current.totalMinutes,
                      activeDays: current.activeDays,
                      subjectBreakdown: current.activities.map((a) => ({
                        name: a.subjectName,
                        activities: a.totalActivities,
                        minutes: a.totalMinutes,
                      })),
                      previousWeekActivities: previous.totalActivities,
                      previousWeekMinutes: previous.totalMinutes,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Combined Subject Breakdown */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Subject Distribution (All Students)
            </h2>
            {(() => {
              // Aggregate all subjects across students
              const subjectTotals = new Map<
                string,
                { name: string; activities: number; minutes: number }
              >();

              studentData.forEach(({ current }) => {
                current.activities.forEach((activity) => {
                  const existing = subjectTotals.get(activity.subjectId);
                  if (existing) {
                    existing.activities += activity.totalActivities;
                    existing.minutes += activity.totalMinutes;
                  } else {
                    subjectTotals.set(activity.subjectId, {
                      name: activity.subjectName,
                      activities: activity.totalActivities,
                      minutes: activity.totalMinutes,
                    });
                  }
                });
              });

              const sortedSubjects = Array.from(subjectTotals.values()).sort(
                (a, b) => b.minutes - a.minutes,
              );
              const totalMinutes = sortedSubjects.reduce(
                (sum, s) => sum + s.minutes,
                0,
              );

              if (sortedSubjects.length === 0) {
                return (
                  <p className="text-gray-500 text-sm">
                    No activities recorded this week.
                  </p>
                );
              }

              return (
                <div className="space-y-4">
                  {sortedSubjects.map((subject) => {
                    const percentage =
                      totalMinutes > 0
                        ? (subject.minutes / totalMinutes) * 100
                        : 0;
                    return (
                      <div key={subject.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {subject.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {subject.activities} activities •{" "}
                            {Math.round((subject.minutes / 60) * 10) / 10} hrs (
                            {Math.round(percentage)}%)
                          </span>
                        </div>
                        <div
                          className="w-full bg-gray-200 rounded-full h-2"
                          role="progressbar"
                          aria-valuenow={Math.round(percentage)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${subject.name}: ${Math.round(percentage)}% of total time`}
                        >
                          <div
                            className="bg-brand-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        </>
      )}
    </PageContainer>
  );
}
