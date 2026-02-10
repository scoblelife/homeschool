import { useState, useEffect } from "react";
import { useStore } from "../../stores/useStore";
import { useCurriculumStore } from "./curriculumStore";
import type { GradeLevel } from "../../../../shared/types";

interface Props {
  studentId?: string;
  gradeLevel?: GradeLevel;
}

export function CoverageReport({ studentId, gradeLevel }: Props) {
  const { students, getSelectedStudent } = useStore();
  const { report, isLoading, loadReport } = useCurriculumStore();
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "");

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || getSelectedStudent();
  const effectiveGradeLevel = gradeLevel || selectedStudent?.gradeLevel;

  useEffect(() => {
    if (selectedStudentId && effectiveGradeLevel) {
      loadReport(selectedStudentId, effectiveGradeLevel);
    }
  }, [selectedStudentId, effectiveGradeLevel, loadReport]);

  // Auto-select first student
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  if (!selectedStudentId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Select a student to view curriculum coverage.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading coverage report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center text-gray-500 py-8">
        No coverage data available.
      </div>
    );
  }

  // Calculate color based on coverage percentage
  const getCoverageColor = (percent: number) => {
    if (percent >= 75) return "bg-status-success";
    if (percent >= 50) return "bg-status-warning";
    if (percent >= 25) return "bg-student-orange-500";
    return "bg-status-error";
  };

  const getCoverageTextColor = (percent: number) => {
    if (percent >= 75) return "text-status-successDark";
    if (percent >= 50) return "text-status-warningDark";
    if (percent >= 25) return "text-student-orange-700";
    return "text-status-errorDark";
  };

  return (
    <div className="space-y-6">
      {/* Student Selector (if not passed as prop) */}
      {!studentId && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-neutral-text">
            Student:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 border border-neutral-border rounded-lg
              bg-neutral-surface text-neutral-text"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.gradeLevel})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Overall Coverage */}
      <div className="bg-neutral-surface rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-neutral-text mb-4">
          Overall Coverage
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-neutral-textSecondary">
                {report.coveredStandards} of {report.totalStandards} standards
                covered
              </span>
              <span
                className={`text-sm font-semibold ${getCoverageTextColor(report.coveragePercent)}`}
              >
                {report.coveragePercent}%
              </span>
            </div>
            <div className="w-full bg-neutral-backgroundDeep rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${getCoverageColor(report.coveragePercent)}`}
                style={{ width: `${report.coveragePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coverage by Subject */}
      <div className="bg-neutral-surface rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-neutral-text mb-4">
          Coverage by Subject
        </h3>
        <div className="space-y-4">
          {report.bySubject.map((subject) => (
            <div key={subject.subjectId}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-neutral-text">
                  {subject.subjectName}
                </span>
                <span className="text-xs text-neutral-textSecondary">
                  {subject.covered}/{subject.total} ({subject.coveragePercent}%)
                </span>
              </div>
              <div className="w-full bg-neutral-backgroundDeep rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getCoverageColor(subject.coveragePercent)}`}
                  style={{ width: `${subject.coveragePercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage by Domain */}
      <div className="bg-neutral-surface rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-neutral-text mb-4">
          Coverage by Domain
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.byDomain.map((domain) => (
            <div
              key={domain.domain}
              className="p-4 bg-neutral-background rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-neutral-text pr-2">
                  {domain.domain}
                </span>
                <span
                  className={`text-sm font-semibold ${getCoverageTextColor(domain.coveragePercent)}`}
                >
                  {domain.coveragePercent}%
                </span>
              </div>
              <div className="w-full bg-neutral-backgroundDeep rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all ${getCoverageColor(domain.coveragePercent)}`}
                  style={{ width: `${domain.coveragePercent}%` }}
                />
              </div>
              <span className="text-xs text-neutral-textSecondary">
                {domain.covered} of {domain.total} standards
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Uncovered Standards */}
      {report.uncoveredStandards.length > 0 && (
        <div className="bg-neutral-surface rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-neutral-text mb-4">
            Uncovered Standards ({report.uncoveredStandards.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {report.uncoveredStandards.map((standard) => (
              <div
                key={standard.id}
                className="p-3 bg-status-errorLight border border-status-error/30 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="px-2 py-0.5 text-xs font-mono bg-status-error/20 text-status-errorDark rounded">
                    {standard.code}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-text">
                      {standard.title}
                    </p>
                    <p className="text-xs text-neutral-textSecondary mt-1">
                      {standard.description}
                    </p>
                    <p className="text-xs text-neutral-textTertiary mt-1">
                      {standard.domain}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
