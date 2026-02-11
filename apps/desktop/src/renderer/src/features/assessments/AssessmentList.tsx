/**
 * Assessment List Component
 *
 * Displays and manages assessments (standardized tests, evaluations, portfolio reviews)
 * for a student. Allows adding, editing, and tracking assessment results.
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import type {
  Assessment,
  CreateAssessment,
  UpdateAssessment,
  AssessmentType,
  UniversalStatus,
  Student,
} from "../../../../shared/types";

interface AssessmentListProps {
  student: Student;
  onAssessmentChange?: () => void;
}

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: "standardized_test", label: "Standardized Test" },
  { value: "evaluation", label: "Professional Evaluation" },
  { value: "portfolio_review", label: "Portfolio Review" },
  { value: "progress_assessment", label: "Progress Assessment" },
  { value: "other", label: "Other" },
];

const ASSESSMENT_STATUSES: {
  value: UniversalStatus;
  label: string;
  color: string;
}[] = [
  {
    value: "not_started",
    label: "Scheduled",
    color: "bg-status-infoLight text-status-infoDark",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-status-warningLight text-status-warningDark",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-status-successLight text-status-successDark",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-neutral-backgroundSecondary text-neutral-textSecondary",
  },
];

export function AssessmentList({
  student,
  onAssessmentChange,
}: AssessmentListProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<CreateAssessment>>({
    studentId: student.id,
    type: "standardized_test",
    name: "",
    provider: "",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "not_started",
  });

  useEffect(() => {
    loadAssessments();
  }, [student.id]);

  async function loadAssessments() {
    setIsLoading(true);
    try {
      const data = await window.api.getAssessments(student.id);
      setAssessments(data);
    } catch (error) {
      console.error("Failed to load assessments:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      studentId: student.id,
      type: "standardized_test",
      name: "",
      provider: "",
      date: format(new Date(), "yyyy-MM-dd"),
      status: "not_started",
    });
    setEditingAssessment(null);
    setShowForm(false);
  }

  function handleEdit(assessment: Assessment) {
    setEditingAssessment(assessment);
    setFormData({
      studentId: assessment.studentId,
      type: assessment.type,
      name: assessment.name,
      provider: assessment.provider || "",
      date: assessment.date,
      scheduledTime: assessment.scheduledTime || "",
      location: assessment.location || "",
      status: assessment.status,
      score: assessment.score || "",
      percentile: assessment.percentile || undefined,
      gradeEquivalent: assessment.gradeEquivalent || "",
      resultsUrl: assessment.resultsUrl || "",
      notes: assessment.notes || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.date) return;

    try {
      if (editingAssessment) {
        const updates: UpdateAssessment = {
          type: formData.type,
          name: formData.name,
          provider: formData.provider || null,
          date: formData.date,
          scheduledTime: formData.scheduledTime || null,
          location: formData.location || null,
          status: formData.status,
          score: formData.score || null,
          percentile: formData.percentile || null,
          gradeEquivalent: formData.gradeEquivalent || null,
          resultsUrl: formData.resultsUrl || null,
          notes: formData.notes || null,
        };
        await window.api.updateAssessment(editingAssessment.id, updates);
      } else {
        const newAssessment: CreateAssessment = {
          studentId: student.id,
          type: formData.type as AssessmentType,
          name: formData.name!,
          provider: formData.provider || null,
          date: formData.date!,
          scheduledTime: formData.scheduledTime || null,
          location: formData.location || null,
          status: formData.status as UniversalStatus,
          score: formData.score || null,
          percentile: formData.percentile || null,
          gradeEquivalent: formData.gradeEquivalent || null,
          resultsUrl: formData.resultsUrl || null,
          notes: formData.notes || null,
        };
        await window.api.createAssessment(newAssessment);
      }
      await loadAssessments();
      resetForm();
      onAssessmentChange?.();
    } catch (error) {
      console.error("Failed to save assessment:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this assessment?")) return;
    try {
      await window.api.deleteAssessment(id);
      await loadAssessments();
      onAssessmentChange?.();
    } catch (error) {
      console.error("Failed to delete assessment:", error);
    }
  }

  function getStatusBadge(status: UniversalStatus) {
    const statusInfo = ASSESSMENT_STATUSES.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo?.color}`}
      >
        {statusInfo?.label}
      </span>
    );
  }

  function getTypeLabel(type: AssessmentType) {
    return ASSESSMENT_TYPES.find((t) => t.value === type)?.label || type;
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center p-8"
        role="status"
        aria-busy="true"
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"
          aria-hidden="true"
        />
        <span className="sr-only">Loading assessments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Assessments</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          + Add Assessment
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto m-4">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAssessment ? "Edit Assessment" : "Add Assessment"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Iowa Test of Basic Skills"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as AssessmentType,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    {ASSESSMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as UniversalStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    {ASSESSMENT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={formData.scheduledTime || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledTime: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <Input
                    type="text"
                    value={formData.provider || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                    placeholder="e.g., Riverside Publishing"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Input
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., Community Center, Room 101"
                  />
                </div>

                {/* Results section - only show if status is completed */}
                {formData.status === "completed" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Score
                      </label>
                      <Input
                        type="text"
                        value={formData.score || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, score: e.target.value })
                        }
                        placeholder="e.g., 85/100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentile
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.percentile || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            percentile: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="e.g., 75"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Equivalent
                      </label>
                      <Input
                        type="text"
                        value={formData.gradeEquivalent || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gradeEquivalent: e.target.value,
                          })
                        }
                        placeholder="e.g., 3.2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Results URL
                      </label>
                      <Input
                        type="url"
                        value={formData.resultsUrl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            resultsUrl: e.target.value,
                          })
                        }
                        placeholder="Link to results"
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <Textarea
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingAssessment ? "Save Changes" : "Add Assessment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assessment List */}
      {assessments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No assessments scheduled yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Track standardized tests, evaluations, and portfolio reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {assessment.name}
                    </h4>
                    {getStatusBadge(assessment.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {getTypeLabel(assessment.type)}
                    {assessment.provider && ` • ${assessment.provider}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(parseISO(assessment.date), "MMMM d, yyyy")}
                    {assessment.scheduledTime &&
                      ` at ${assessment.scheduledTime}`}
                    {assessment.location && ` • ${assessment.location}`}
                  </p>
                  {assessment.status === "completed" && assessment.score && (
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-status-success font-medium">
                        Score: {assessment.score}
                      </span>
                      {assessment.percentile && (
                        <span className="text-gray-600">
                          {assessment.percentile}th percentile
                        </span>
                      )}
                      {assessment.gradeEquivalent && (
                        <span className="text-gray-600">
                          GE: {assessment.gradeEquivalent}
                        </span>
                      )}
                    </div>
                  )}
                  {assessment.notes && (
                    <p className="mt-2 text-sm text-gray-600 italic">
                      {assessment.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(assessment)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Edit"
                    aria-label={`Edit ${assessment.name}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(assessment.id)}
                    className="p-2 text-gray-400 hover:text-status-error"
                    title="Delete"
                    aria-label={`Delete ${assessment.name}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
