import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Tab } from "@headlessui/react";
import { useStore } from "../stores/useStore";
import { useMilestones } from "../hooks/useDatabase";
import { MilestoneCertificate } from "../features/certificates";
import { universalStatusConfig as statusLabels } from "../config/statusLabels";
import type {
  Milestone,
  UpdateMilestone,
  MilestoneResource,
  CreateResource,
} from "../../../shared/types";

import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

type StatusFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "completed"
  | "cancelled";

function MilestoneCard({
  milestone,
  onStatusChange,
  onEdit,
  onPrintCertificate,
}: {
  milestone: Milestone;
  onStatusChange: (status: Milestone["status"]) => void;
  onEdit: () => void;
  onPrintCertificate: () => void;
}) {
  const [resources, setResources] = useState<MilestoneResource[]>([]);
  const [showResources, setShowResources] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [urlForm, setUrlForm] = useState({ title: "", url: "" });
  const [fileTitle, setFileTitle] = useState("");

  useEffect(() => {
    loadResources();
  }, [milestone.id]);

  const loadResources = async () => {
    try {
      const data = await window.api.getResources(milestone.id);
      setResources(data);
    } catch (error) {
      console.error(
        "[MilestoneCard] Failed to load resources for milestone:",
        milestone.id,
        error,
      );
    }
  };

  const handleAddUrl = async () => {
    if (!urlForm.title || !urlForm.url) return;
    const data: CreateResource = {
      milestoneId: milestone.id,
      type: "url",
      title: urlForm.title,
      url: urlForm.url,
    };
    try {
      await window.api.createResource(data);
      setUrlForm({ title: "", url: "" });
      setShowAddResource(false);
      loadResources();
    } catch (error) {
      console.error(
        "[MilestoneCard] Failed to create URL resource:",
        data.title,
        error,
      );
    }
  };

  const handleUploadFile = async () => {
    try {
      const resource = await window.api.uploadResourceFile(
        milestone.id,
        fileTitle,
      );
      if (resource) {
        setFileTitle("");
        setShowAddResource(false);
        loadResources();
      }
    } catch (error) {
      console.error(
        "[MilestoneCard] Failed to upload resource file for milestone:",
        milestone.id,
        error,
      );
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await window.api.deleteResource(id);
      loadResources();
    } catch (error) {
      console.error("[MilestoneCard] Failed to delete resource:", id, error);
    }
  };

  const handleOpenResource = async (resource: MilestoneResource) => {
    try {
      await window.api.openResource(resource);
    } catch (error) {
      console.error(
        "[MilestoneCard] Failed to open resource:",
        resource.id,
        error,
      );
    }
  };

  const statusInfo = statusLabels[milestone.status];

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        milestone.status === "completed"
          ? "bg-status-successLight border-l-status-success"
          : milestone.status === "in_progress"
            ? "bg-status-warningLight border-l-status-warning"
            : "bg-gray-50 border-l-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900">{milestone.title}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
            {milestone.category && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full bg-brand-primaryLight text-brand-primary`}
              >
                {milestone.category}
              </span>
            )}
            {resources.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full bg-student-blue-50 text-student-blue-600`}
              >
                {resources.length} resource{resources.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
          {milestone.targetDate && (
            <p className="text-xs text-gray-400 mt-2">
              Target: {format(parseISO(milestone.targetDate), "MMM d, yyyy")}
            </p>
          )}
          {milestone.evidenceNotes && (
            <p className="text-sm text-gray-500 mt-2 italic">
              Notes: {milestone.evidenceNotes}
            </p>
          )}

          {/* Resources Section */}
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResources(!showResources)}
              className="text-xs text-brand-primary hover:text-brand-primaryDark"
            >
              {showResources ? "Hide Resources" : "Show Resources"}
            </Button>

            {showResources && (
              <div className="mt-2 space-y-2">
                {resources.length === 0 ? (
                  <p className="text-xs text-gray-400">No resources yet</p>
                ) : (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className={`flex items-center gap-2 text-sm bg-white p-2 rounded border`}
                    >
                      <span className="text-lg">
                        {resource.type === "url" ? "🔗" : "📄"}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => handleOpenResource(resource)}
                        className="text-student-blue-600 hover:underline flex-1 text-left truncate"
                      >
                        {resource.title}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-status-error hover:text-status-errorDark text-xs"
                        aria-label={`Delete resource: ${resource.title}`}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddResource(true)}
                  className="text-xs bg-brand-primaryLight text-brand-primaryDark px-2 py-1 rounded hover:bg-brand-primaryLight"
                >
                  + Add Resource
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={milestone.status}
            onChange={(e) =>
              onStatusChange(e.target.value as Milestone["status"])
            }
            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-brand-primary hover:text-brand-primaryDark"
          >
            Edit
          </Button>
          {milestone.status === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrintCertificate}
              className="text-status-success hover:text-status-successDark flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Certificate
            </Button>
          )}
        </div>
      </div>
      {/* Add Resource Modal */}
      <Modal
        open={showAddResource}
        onClose={() => setShowAddResource(false)}
        title="Add Resource"
        size="md"
      >
        <Tab.Group>
          <Tab.List className="flex gap-2 mb-4">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 rounded-lg text-sm font-medium ${
                  selected
                    ? "bg-brand-primaryLight text-brand-primaryDark"
                    : "bg-gray-100 text-gray-600"
                }`
              }
            >
              URL / Link
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 rounded-lg text-sm font-medium ${
                  selected
                    ? "bg-brand-primaryLight text-brand-primaryDark"
                    : "bg-gray-100 text-gray-600"
                }`
              }
            >
              Upload File
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  type="text"
                  value={urlForm.title}
                  onChange={(e) =>
                    setUrlForm({ ...urlForm, title: e.target.value })
                  }
                  placeholder="e.g., Khan Academy - Counting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <Input
                  type="url"
                  value={urlForm.url}
                  onChange={(e) =>
                    setUrlForm({ ...urlForm, url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowAddResource(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddUrl}>
                  Add URL
                </Button>
              </div>
            </Tab.Panel>
            <Tab.Panel className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <Input
                  type="text"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="Leave blank to use filename"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowAddResource(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleUploadFile}>
                  Choose File...
                </Button>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Modal>
    </div>
  );
}

export default function Milestones(): JSX.Element {
  const { subjects, selectedStudentId, getSelectedStudent, getSubjectById } =
    useStore();
  const selectedStudent = getSelectedStudent();
  const { milestones, updateMilestone, initializeMilestones } = useMilestones(
    selectedStudentId || undefined,
  );

  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );
  const [editForm, setEditForm] = useState<UpdateMilestone>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const [certificateMilestone, setCertificateMilestone] =
    useState<Milestone | null>(null);

  const groupedMilestones = useMemo(() => {
    let filtered = milestones;

    if (filterSubject) {
      filtered = filtered.filter((m) => m.subjectId === filterSubject);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    const grouped: Record<string, Milestone[]> = {};
    for (const milestone of filtered) {
      if (!grouped[milestone.subjectId]) {
        grouped[milestone.subjectId] = [];
      }
      grouped[milestone.subjectId].push(milestone);
    }

    return grouped;
  }, [milestones, filterSubject, filterStatus]);

  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === "completed").length;
    const inProgress = milestones.filter(
      (m) => m.status === "in_progress",
    ).length;
    const notStarted = milestones.filter(
      (m) => m.status === "not_started",
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, notStarted, percentage };
  }, [milestones]);

  const handleStatusChange = async (
    milestone: Milestone,
    newStatus: Milestone["status"],
  ) => {
    try {
      await updateMilestone(milestone.id, { status: newStatus });
    } catch (error) {
      console.error(
        "[Milestones] Failed to update milestone status:",
        milestone.id,
        "to",
        newStatus,
        error,
      );
    }
  };

  const handleInitialize = async () => {
    if (!selectedStudent) return;
    setIsInitializing(true);
    try {
      await initializeMilestones(
        selectedStudent.id,
        selectedStudent.gradeLevel,
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const openEditModal = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setEditForm({
      targetDate: milestone.targetDate || "",
      evidenceNotes: milestone.evidenceNotes,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    try {
      await updateMilestone(editingMilestone.id, {
        targetDate: editForm.targetDate || null,
        evidenceNotes: editForm.evidenceNotes || "",
      });
      setEditingMilestone(null);
    } catch (error) {
      console.error(
        "[Milestones] Failed to save milestone edits:",
        editingMilestone.id,
        error,
      );
    }
  };

  if (!selectedStudent) {
    return (
      <PageContainer>
        <PageHeader title="Milestones" />
        <Card className="text-center py-12">
          <p className="text-gray-500">
            Please select a student or add one in Settings.
          </p>
        </Card>
      </PageContainer>
    );
  }

  if (milestones.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Milestones" />
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No milestones set up for {selectedStudent.name} yet.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Initialize milestones for {selectedStudent.gradeLevel.toUpperCase()}{" "}
            grade level?
          </p>
          <Button
            variant="primary"
            onClick={handleInitialize}
            disabled={isInitializing}
          >
            {isInitializing ? "Initializing..." : "Initialize Milestones"}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Milestones"
        subtitle={`${selectedStudent.name} - ${selectedStudent.gradeLevel.toUpperCase()} Grade`}
      />
      {/* Progress Overview */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-brand-primary">
            {stats.percentage}%
          </span>
        </div>
        <div
          className="w-full bg-gray-200 rounded-full h-3 mb-4"
          role="progressbar"
          aria-valuenow={stats.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Overall progress: ${stats.percentage}%`}
        >
          <div
            className={`bg-gradient-to-r from-brand-primary to-student-purple-500 h-3 rounded-full transition-all duration-500`}
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div aria-label={`${stats.completed} milestones completed`}>
            <div className="text-2xl font-bold text-status-success">
              {stats.completed}
            </div>
            <div className="text-gray-500">Completed</div>
          </div>
          <div aria-label={`${stats.inProgress} milestones in progress`}>
            <div className="text-2xl font-bold text-status-warning">
              {stats.inProgress}
            </div>
            <div className="text-gray-500">In Progress</div>
          </div>
          <div aria-label={`${stats.notStarted} milestones not started`}>
            <div className="text-2xl font-bold text-gray-400">
              {stats.notStarted}
            </div>
            <div className="text-gray-500">Not Started</div>
          </div>
        </div>
      </Card>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm hover:border-gray-400"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <div
            className="flex gap-1"
            role="radiogroup"
            aria-label="Filter by status"
          >
            {(
              [
                "all",
                "not_started",
                "in_progress",
                "completed",
              ] as StatusFilter[]
            ).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "primary" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                role="radio"
                aria-checked={filterStatus === status}
              >
                {status === "all"
                  ? "All"
                  : status === "not_started"
                    ? "Not Started"
                    : status === "in_progress"
                      ? "In Progress"
                      : "Completed"}
              </Button>
            ))}
          </div>
        </div>
      </div>
      {/* Milestones by Subject */}
      <div className="space-y-6" aria-live="polite">
        {Object.entries(groupedMilestones).map(
          ([subjectId, subjectMilestones]) => {
            const subject = getSubjectById(subjectId);
            const subjectCompleted = subjectMilestones.filter(
              (m) => m.status === "completed",
            ).length;
            const subjectTotal = subjectMilestones.length;

            return (
              <Card key={subjectId}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {subject?.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {subjectCompleted}/{subjectTotal} completed
                  </span>
                </div>
                <div className="space-y-3">
                  {subjectMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onStatusChange={(status) =>
                        handleStatusChange(milestone, status)
                      }
                      onEdit={() => openEditModal(milestone)}
                      onPrintCertificate={() =>
                        setCertificateMilestone(milestone)
                      }
                    />
                  ))}
                </div>
              </Card>
            );
          },
        )}
      </div>
      {Object.keys(groupedMilestones).length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-500">No milestones match your filters.</p>
        </Card>
      )}
      {/* Edit Milestone Modal */}
      <Modal
        open={!!editingMilestone}
        onClose={() => setEditingMilestone(null)}
        title="Edit Milestone"
        size="md"
      >
        {editingMilestone && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Milestone
              </label>
              <p className="text-gray-700 font-medium">
                {editingMilestone.title}
              </p>
              <p className="text-sm text-gray-500">
                {editingMilestone.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <Input
                type="date"
                value={editForm.targetDate || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, targetDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evidence / Notes
              </label>
              <Textarea
                value={editForm.evidenceNotes || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, evidenceNotes: e.target.value })
                }
                rows={3}
                placeholder="Document evidence of mastery, resources used, etc."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEditingMilestone(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
      {/* Milestone Certificate Modal */}
      {certificateMilestone && (
        <MilestoneCertificate
          milestone={certificateMilestone}
          isOpen={!!certificateMilestone}
          onClose={() => setCertificateMilestone(null)}
        />
      )}
    </PageContainer>
  );
}
