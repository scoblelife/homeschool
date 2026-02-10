import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO, isPast, isFuture, isToday, addDays } from "date-fns";

import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

// Helper to handle dates that might be Date objects or strings from DuckDB
const toDate = (date: string | Date): Date => {
  if (date instanceof Date) return date;
  return parseISO(date);
};
import { useStore } from "../stores/useStore";
import { MapLink, ShareButton, LinkedActivities } from "../features/fieldTrips";
import type {
  FieldTrip,
  CreateFieldTrip,
  UniversalStatus,
  EventCategory,
  ActivityTask,
  TaskPhase,
  ActivityContact,
  CreateActivityContact,
  ContactRole,
  ActivityRSVP,
  CreateActivityRSVP,
  RSVPStatus,
  ActivityExpense,
  CreateActivityExpense,
  ExpenseCategory,
} from "../../../shared/types";

type StatusFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "completed"
  | "cancelled";

const statusLabels: Record<
  UniversalStatus,
  { label: string; color: string; bg: string }
> = {
  not_started: {
    label: "Not Started",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  in_progress: {
    label: "In Progress",
    color: "text-status-warning",
    bg: "bg-status-warningLight",
  },
  completed: {
    label: "Completed",
    color: "text-status-success",
    bg: "bg-status-successLight",
  },
  cancelled: { label: "Cancelled", color: "text-gray-600", bg: "bg-gray-100" },
};

const eventCategoryConfig: Record<
  EventCategory,
  {
    icon: string;
    label: string;
    color: string;
    bg: string;
    description: string;
  }
> = {
  educational: {
    icon: "📚",
    label: "Educational",
    color: "text-student-blue-700",
    bg: "bg-student-blue-100",
    description: "Field trips, museum visits, science centers, co-op classes",
  },
  social: {
    icon: "🌳",
    label: "Social",
    color: "text-status-successDark",
    bg: "bg-status-successLight",
    description: "Park days, playdates, game nights",
  },
  coop: {
    icon: "👥",
    label: "Co-op",
    color: "text-student-purple-700",
    bg: "bg-student-purple-100",
    description: "Co-op classes, group activities",
  },
};

const phaseLabels: Record<TaskPhase, { label: string; icon: string }> = {
  before: { label: "Before", icon: "📋" },
  during: { label: "During", icon: "📍" },
  after: { label: "After", icon: "✨" },
};

const contactRoleLabels: Record<ContactRole, string> = {
  venue: "Venue",
  coordinator: "Coordinator",
  emergency: "Emergency",
};

const rsvpStatusLabels: Record<
  RSVPStatus,
  { label: string; color: string; bg: string }
> = {
  yes: {
    label: "Yes",
    color: "text-status-success",
    bg: "bg-status-successLight",
  },
  no: {
    label: "No",
    color: "text-status-error",
    bg: "bg-status-errorLight",
  },
  maybe: {
    label: "Maybe",
    color: "text-status-warning",
    bg: "bg-status-warningLight",
  },
};

// Event categories that show RSVP section (group events)
const groupEventCategories: EventCategory[] = ["social", "coop"];

const expenseCategoryLabels: Record<
  ExpenseCategory,
  { label: string; icon: string }
> = {
  admission: { label: "Admission", icon: "🎟️" },
  food: { label: "Food", icon: "🍕" },
  materials: { label: "Materials", icon: "📦" },
  travel: { label: "Travel", icon: "🚗" },
};

const TASK_PHASES = ["before", "during", "after"] as const;

/* ─── Props interfaces ──────────────────────────────────────────────── */

interface FieldTripCardHeaderProps {
  trip: FieldTrip;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  statusInfo: { label: string; color: string; bg: string };
  categoryConfig: { icon: string; label: string; color: string; bg: string };
  tripDate: Date;
  isUpcoming: boolean;
  isPastTrip: boolean;
  tasks: ActivityTask[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

interface FieldTripCardActionsProps {
  trip: FieldTrip;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onStatusChange: (status: UniversalStatus) => void;
}

interface FieldTripTaskPhaseGroupProps {
  phase: TaskPhase;
  tasks: ActivityTask[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

interface FieldTripTaskListProps {
  tasks: ActivityTask[];
  newTaskTitle: string;
  newTaskPhase: TaskPhase;
  onNewTaskTitleChange: (title: string) => void;
  onNewTaskPhaseChange: (phase: TaskPhase) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

interface FieldTripContactFormProps {
  onAddContact: (contact: Omit<CreateActivityContact, "activityId">) => void;
  onCancel: () => void;
}

interface FieldTripContactItemProps {
  contact: ActivityContact;
  onUpdateContact: (
    id: string,
    data: Partial<Omit<CreateActivityContact, "activityId">>,
  ) => void;
  onDeleteContact: (id: string) => void;
}

interface FieldTripContactListProps {
  contacts: ActivityContact[];
  onAddContact: (contact: Omit<CreateActivityContact, "activityId">) => void;
  onUpdateContact: (
    id: string,
    data: Partial<Omit<CreateActivityContact, "activityId">>,
  ) => void;
  onDeleteContact: (id: string) => void;
}

interface FieldTripRSVPFormProps {
  onAddRSVP: (rsvp: Omit<CreateActivityRSVP, "activityId">) => void;
  onCancel: () => void;
}

interface FieldTripRSVPItemProps {
  rsvp: ActivityRSVP;
  onUpdateRSVP: (id: string, status: RSVPStatus) => void;
  onDeleteRSVP: (id: string) => void;
}

interface FieldTripRSVPListProps {
  rsvps: ActivityRSVP[];
  onAddRSVP: (rsvp: Omit<CreateActivityRSVP, "activityId">) => void;
  onUpdateRSVP: (id: string, status: RSVPStatus) => void;
  onDeleteRSVP: (id: string) => void;
}

interface FieldTripExpenseFormProps {
  onAddExpense: (expense: Omit<CreateActivityExpense, "activityId">) => void;
  onCancel: () => void;
}

interface FieldTripExpenseItemProps {
  expense: ActivityExpense;
  onUpdateExpense: (
    id: string,
    data: Partial<Omit<CreateActivityExpense, "activityId">>,
  ) => void;
  onDeleteExpense: (id: string) => void;
}

interface FieldTripExpenseListProps {
  expenses: ActivityExpense[];
  onAddExpense: (expense: Omit<CreateActivityExpense, "activityId">) => void;
  onUpdateExpense: (
    id: string,
    data: Partial<Omit<CreateActivityExpense, "activityId">>,
  ) => void;
  onDeleteExpense: (id: string) => void;
}

interface FieldTripStatsProps {
  stats: {
    total: number;
    not_started: number;
    completed: number;
    upcoming: number;
  };
}

interface FieldTripFiltersProps {
  filterStatus: StatusFilter;
  onFilterChange: (status: StatusFilter) => void;
}

interface FieldTripFormCategoryPickerProps {
  eventCategory: EventCategory;
  onCategoryChange: (category: EventCategory) => void;
}

interface FieldTripFormFieldsProps {
  formData: CreateFieldTrip;
  setFormData: React.Dispatch<React.SetStateAction<CreateFieldTrip>>;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  isEditing: boolean;
  toggleStudentSelection: (studentId: string) => void;
  toggleSubjectSelection: (subjectId: string) => void;
}

interface FieldTripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: CreateFieldTrip;
  setFormData: React.Dispatch<React.SetStateAction<CreateFieldTrip>>;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  toggleStudentSelection: (studentId: string) => void;
  toggleSubjectSelection: (subjectId: string) => void;
}

interface FieldTripDuplicateModalProps {
  duplicatingTrip: FieldTrip | null;
  onClose: () => void;
  duplicateDate: string;
  onDateChange: (date: string) => void;
  duplicateCopyTasks: boolean;
  onCopyTasksChange: (value: boolean) => void;
  duplicateCopyContacts: boolean;
  onCopyContactsChange: (value: boolean) => void;
  onDuplicate: () => void;
}

interface FieldTripCardProps {
  trip: FieldTrip;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onStatusChange: (status: UniversalStatus) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  tasks: ActivityTask[];
  newTaskTitle: string;
  newTaskPhase: TaskPhase;
  onNewTaskTitleChange: (title: string) => void;
  onNewTaskPhaseChange: (phase: TaskPhase) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  contacts: ActivityContact[];
  onAddContact: (contact: Omit<CreateActivityContact, "activityId">) => void;
  onUpdateContact: (
    id: string,
    data: Partial<Omit<CreateActivityContact, "activityId">>,
  ) => void;
  onDeleteContact: (id: string) => void;
  rsvps: ActivityRSVP[];
  onAddRSVP: (rsvp: Omit<CreateActivityRSVP, "activityId">) => void;
  onUpdateRSVP: (id: string, status: RSVPStatus) => void;
  onDeleteRSVP: (id: string) => void;
  expenses: ActivityExpense[];
  onAddExpense: (expense: Omit<CreateActivityExpense, "activityId">) => void;
  onUpdateExpense: (
    id: string,
    data: Partial<Omit<CreateActivityExpense, "activityId">>,
  ) => void;
  onDeleteExpense: (id: string) => void;
  onLinkActivity: (activityId: string) => Promise<void>;
  onUnlinkActivity: (activityId: string) => Promise<void>;
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function FieldTripCardHeader({
  trip,
  students,
  subjects,
  statusInfo,
  categoryConfig,
  tripDate,
  isUpcoming,
  isPastTrip,
  tasks,
  isExpanded,
  onToggleExpand,
}: FieldTripCardHeaderProps) {
  const tripStudents = students.filter((s) => trip.studentIds.includes(s.id));
  const tripSubjects = subjects.filter((s) => trip.subjectIds.includes(s.id));

  return (
    <div className="flex-1">
      <FieldTripCardTitleRow
        trip={trip}
        statusInfo={statusInfo}
        categoryConfig={categoryConfig}
      />
      <FieldTripCardMetadata trip={trip} tripDate={tripDate} />

      {trip.description && (
        <p className="text-sm text-gray-600 mt-2">{trip.description}</p>
      )}

      <FieldTripCardBadges
        tripStudents={tripStudents}
        tripSubjects={tripSubjects}
      />

      {trip.websiteUrl && (
        <a
          href={trip.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-sm text-student-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 Visit Website
        </a>
      )}

      {trip.learningOutcomes && (
        <div className="mt-3 p-2 bg-white/50 rounded text-sm">
          <strong className="text-gray-700">Learning Outcomes:</strong>
          <p className="text-gray-600 mt-1">{trip.learningOutcomes}</p>
        </div>
      )}

      {trip.notes && (
        <p className="text-sm text-gray-500 mt-2 italic">Notes: {trip.notes}</p>
      )}

      {isPastTrip && trip.status === "not_started" && (
        <p className="text-sm text-status-warning mt-2">
          ⚠️ This activity date has passed. Update the status to completed or
          cancelled.
        </p>
      )}

      <FieldTripTaskProgressButton
        tasks={tasks}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />
    </div>
  );
}

interface FieldTripCardTitleRowProps {
  trip: FieldTrip;
  statusInfo: { label: string; color: string; bg: string };
  categoryConfig: { icon: string; label: string; color: string; bg: string };
}

function FieldTripCardTitleRow({
  trip,
  statusInfo,
  categoryConfig,
}: FieldTripCardTitleRowProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`text-sm px-2 py-0.5 rounded-full ${categoryConfig.bg} ${categoryConfig.color}`}
      >
        {categoryConfig.icon} {categoryConfig.label}
      </span>
      <h3 className="font-medium text-gray-900">{trip.title}</h3>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    </div>
  );
}

interface FieldTripCardMetadataProps {
  trip: FieldTrip;
  tripDate: Date;
}

function FieldTripCardMetadata({ trip, tripDate }: FieldTripCardMetadataProps) {
  return (
    // eslint-disable-next-line design-system/pages-use-components-only -- metadata row with map link, date, time, and cost
    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 flex-wrap">
      <MapLink location={trip.location} />
      <span>•</span>
      <span>📅 {format(tripDate, "EEEE, MMMM d, yyyy")}</span>
      {(trip.startTime || trip.endTime) && (
        <>
          <span>•</span>
          <span>
            🕐 {trip.startTime || "?"}
            {trip.endTime ? ` - ${trip.endTime}` : ""}
          </span>
        </>
      )}
      {trip.cost && (
        <>
          <span>•</span>
          <span>💰 ${trip.cost.toFixed(2)}</span>
        </>
      )}
    </div>
  );
}

interface FieldTripCardBadgesProps {
  tripStudents: { id: string; name: string }[];
  tripSubjects: { id: string; name: string }[];
}

function FieldTripCardBadges({
  tripStudents,
  tripSubjects,
}: FieldTripCardBadgesProps) {
  return (
    <>
      {/* Students */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tripStudents.map((student) => (
          // eslint-disable-next-line design-system/pages-use-components-only -- styled badge for student name
          <span
            key={student.id}
            className="text-xs px-2 py-0.5 rounded-full bg-student-purple-100 text-student-purple-700"
          >
            {student.name}
          </span>
        ))}
      </div>

      {/* Subjects */}
      <div className="mt-2 flex flex-wrap gap-2">
        {tripSubjects.map((subject) => (
          // eslint-disable-next-line design-system/pages-use-components-only -- styled badge for subject name
          <span
            key={subject.id}
            className="text-xs px-2 py-0.5 rounded-full bg-brand-primaryLight text-brand-primaryDark"
          >
            {subject.name}
          </span>
        ))}
      </div>
    </>
  );
}

interface FieldTripTaskProgressButtonProps {
  tasks: ActivityTask[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function FieldTripTaskProgressButton({
  tasks,
  isExpanded,
  onToggleExpand,
}: FieldTripTaskProgressButtonProps) {
  const completedCount = tasks.filter((t) => t.completedAt).length;
  const progressPercent =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <Button
      variant="ghost"
      onClick={onToggleExpand}
      className="mt-3 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
    >
      <span>{isExpanded ? "▼" : "▶"}</span>
      <span>
        Tasks: {completedCount}/{tasks.length}
      </span>
      {tasks.length > 0 && (
        // eslint-disable-next-line design-system/pages-use-components-only -- progress bar visualization
        <div className="flex-1 max-w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-status-success transition-all"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      )}
    </Button>
  );
}

function FieldTripCardActions({
  trip,
  students,
  subjects,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: FieldTripCardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={trip.status}
        onChange={(e) => onStatusChange(e.target.value as UniversalStatus)}
        className="text-sm border border-gray-300 rounded-lg px-2 py-1"
      >
        <option value="not_started">Planned</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="text-brand-primary hover:text-brand-primaryDark text-sm"
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDuplicate}
        className="text-gray-600 hover:text-gray-800 text-sm"
      >
        Duplicate
      </Button>
      <ShareButton trip={trip} students={students} subjects={subjects} />
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-status-error hover:text-status-errorDark text-sm"
      >
        Delete
      </Button>
    </div>
  );
}

function FieldTripTaskPhaseGroup({
  phase,
  tasks,
  onToggleTask,
  onDeleteTask,
}: FieldTripTaskPhaseGroupProps) {
  const phaseTasks = tasks.filter((t) => t.phase === phase);
  if (phaseTasks.length === 0) return null;

  const phaseConfig = phaseLabels[phase];
  return (
    <div className="mb-3">
      <div className="text-xs font-medium text-gray-500 mb-1">
        {phaseConfig.icon} {phaseConfig.label}
      </div>
      <div className="space-y-1">
        {phaseTasks.map((task) => (
          // eslint-disable-next-line design-system/pages-use-components-only -- task row with checkbox and inline delete
          <div
            key={task.id}
            className="flex items-center gap-2 p-2 bg-white/50 rounded"
          >
            {/* eslint-disable-next-line design-system/require-design-system-components -- native checkbox for boolean toggle */}
            <input
              type="checkbox"
              checked={!!task.completedAt}
              onChange={() => onToggleTask(task.id)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span
              className={`flex-1 text-sm ${task.completedAt ? "line-through text-gray-400" : "text-gray-700"}`}
            >
              {task.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              className="text-gray-400 hover:text-status-error text-xs"
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldTripTaskList({
  tasks,
  newTaskTitle,
  newTaskPhase,
  onNewTaskTitleChange,
  onNewTaskPhaseChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: FieldTripTaskListProps) {
  return (
    <>
      {/* Add Task Form */}
      <div className="flex gap-2 mb-4">
        <select
          value={newTaskPhase}
          onChange={(e) => onNewTaskPhaseChange(e.target.value as TaskPhase)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
        >
          {(
            Object.entries(phaseLabels) as [
              TaskPhase,
              typeof phaseLabels.before,
            ][]
          ).map(([phase, config]) => (
            <option key={phase} value={phase}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>
        <Input
          type="text"
          size="sm"
          value={newTaskTitle}
          onChange={(e) => onNewTaskTitleChange(e.target.value)}
          placeholder="Add a task..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && onAddTask()}
        />
        <Button
          variant="primary"
          onClick={onAddTask}
          disabled={!newTaskTitle.trim()}
          className="text-sm py-1.5 disabled:opacity-50"
        >
          Add
        </Button>
      </div>

      {/* Tasks by Phase */}
      {TASK_PHASES.map((phase) => (
        <FieldTripTaskPhaseGroup
          key={phase}
          phase={phase}
          tasks={tasks}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
        />
      ))}

      {tasks.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">
          No tasks yet. Add tasks to track preparation steps.
        </p>
      )}
    </>
  );
}

function FieldTripContactForm({
  onAddContact,
  onCancel,
}: FieldTripContactFormProps) {
  const [newContactName, setNewContactName] = useState("");
  const [newContactRole, setNewContactRole] = useState<ContactRole>("venue");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactNotes, setNewContactNotes] = useState("");

  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    onAddContact({
      name: newContactName.trim(),
      role: newContactRole,
      phone: newContactPhone.trim() || undefined,
      email: newContactEmail.trim() || undefined,
      notes: newContactNotes.trim() || undefined,
    });
    setNewContactName("");
    setNewContactPhone("");
    setNewContactEmail("");
    setNewContactNotes("");
    onCancel();
  };

  return (
    // eslint-disable-next-line design-system/pages-use-components-only -- contact form container
    <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
      <Input
        type="text"
        size="sm"
        value={newContactName}
        onChange={(e) => setNewContactName(e.target.value)}
        placeholder="Contact name"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={newContactRole}
          onChange={(e) => setNewContactRole(e.target.value as ContactRole)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          {(Object.entries(contactRoleLabels) as [ContactRole, string][]).map(
            ([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ),
          )}
        </select>
        <Input
          type="tel"
          size="sm"
          value={newContactPhone}
          onChange={(e) => setNewContactPhone(e.target.value)}
          placeholder="Phone"
        />
      </div>
      <Input
        type="email"
        size="sm"
        value={newContactEmail}
        onChange={(e) => setNewContactEmail(e.target.value)}
        placeholder="Email"
      />
      <Input
        type="text"
        size="sm"
        value={newContactNotes}
        onChange={(e) => setNewContactNotes(e.target.value)}
        placeholder="Website URL or notes"
      />
      <Button
        variant="primary"
        onClick={handleAddContact}
        disabled={!newContactName.trim()}
        className="w-full text-sm py-1.5 disabled:opacity-50"
      >
        Add Contact
      </Button>
    </div>
  );
}

function FieldTripContactItem({
  contact,
  onUpdateContact,
  onDeleteContact,
}: FieldTripContactItemProps) {
  return (
    <div className="p-2 bg-white/50 rounded">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">{contact.name}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteContact(contact.id)}
          className="text-gray-400 hover:text-status-error text-xs"
        >
          ✕
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <select
          value={contact.role || "other"}
          onChange={(e) =>
            onUpdateContact(contact.id, {
              role: e.target.value as ContactRole,
            })
          }
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
        >
          {(Object.entries(contactRoleLabels) as [ContactRole, string][]).map(
            ([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>
      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
        {contact.phone && (
          <div>
            📞{" "}
            <a
              href={`tel:${contact.phone}`}
              className="hover:text-brand-primary"
            >
              {contact.phone}
            </a>
          </div>
        )}
        {contact.email && (
          <div>
            ✉️{" "}
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-brand-primary"
            >
              {contact.email}
            </a>
          </div>
        )}
        {contact.notes && (
          <div>
            {contact.notes.startsWith("http") ? (
              <>
                🔗{" "}
                <a
                  href={contact.notes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-primary"
                >
                  {contact.notes}
                </a>
              </>
            ) : (
              <>📝 {contact.notes}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldTripContactList({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}: FieldTripContactListProps) {
  const [showContactForm, setShowContactForm] = useState(false);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">📞 Contacts</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowContactForm(!showContactForm)}
          className="text-xs text-brand-primary hover:text-brand-primaryDark"
        >
          {showContactForm ? "Cancel" : "+ Add"}
        </Button>
      </div>

      {showContactForm && (
        <FieldTripContactForm
          onAddContact={onAddContact}
          onCancel={() => setShowContactForm(false)}
        />
      )}

      {contacts.length > 0 ? (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <FieldTripContactItem
              key={contact.id}
              contact={contact}
              onUpdateContact={onUpdateContact}
              onDeleteContact={onDeleteContact}
            />
          ))}
        </div>
      ) : (
        !showContactForm && (
          <p className="text-xs text-gray-400 text-center py-1">
            No contacts added
          </p>
        )
      )}
    </div>
  );
}

function FieldTripRSVPForm({ onAddRSVP, onCancel }: FieldTripRSVPFormProps) {
  const [newRSVPName, setNewRSVPName] = useState("");
  const [newRSVPCount, setNewRSVPCount] = useState(1);

  const handleAddRSVP = () => {
    if (!newRSVPName.trim()) return;
    onAddRSVP({
      familyName: newRSVPName.trim(),
      attendingCount: newRSVPCount,
      status: "maybe",
    });
    setNewRSVPName("");
    setNewRSVPCount(1);
    onCancel();
  };

  return (
    // eslint-disable-next-line design-system/pages-use-components-only -- RSVP form container
    <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
      <Input
        type="text"
        size="sm"
        value={newRSVPName}
        onChange={(e) => setNewRSVPName(e.target.value)}
        placeholder="Family name"
      />
      <div className="flex gap-2 items-center">
        <label className="text-xs text-gray-600">Attending:</label>
        <Input
          type="number"
          size="sm"
          value={newRSVPCount}
          onChange={(e) => setNewRSVPCount(parseInt(e.target.value) || 1)}
          min="1"
          className="w-16"
        />
      </div>
      <Button
        variant="primary"
        onClick={handleAddRSVP}
        disabled={!newRSVPName.trim()}
        className="w-full text-sm py-1.5 disabled:opacity-50"
      >
        Add RSVP
      </Button>
    </div>
  );
}

function FieldTripRSVPItem({
  rsvp,
  onUpdateRSVP,
  onDeleteRSVP,
}: FieldTripRSVPItemProps) {
  const rsvpStatusInfo = rsvpStatusLabels[rsvp.status];
  return (
    // eslint-disable-next-line design-system/pages-use-components-only -- RSVP row with status select and delete
    <div className="flex items-center justify-between p-2 bg-white/50 rounded">
      <div className="flex items-center gap-2">
        <div>
          <div className="text-sm font-medium text-gray-700">
            {rsvp.familyName}
          </div>
          <div className="text-xs text-gray-500">
            {rsvp.attendingCount}{" "}
            {rsvp.attendingCount === 1 ? "person" : "people"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={rsvp.status}
          onChange={(e) => onUpdateRSVP(rsvp.id, e.target.value as RSVPStatus)}
          className={`text-xs rounded px-2 py-1 border-0 ${rsvpStatusInfo.bg} ${rsvpStatusInfo.color}`}
        >
          {(
            Object.entries(rsvpStatusLabels) as [
              RSVPStatus,
              typeof rsvpStatusInfo,
            ][]
          ).map(([status, info]) => (
            <option key={status} value={status}>
              {info.label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteRSVP(rsvp.id)}
          className="text-gray-400 hover:text-status-error text-xs"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}

function FieldTripRSVPList({
  rsvps,
  onAddRSVP,
  onUpdateRSVP,
  onDeleteRSVP,
}: FieldTripRSVPListProps) {
  const [showRSVPForm, setShowRSVPForm] = useState(false);

  const rsvpSummary = useMemo(() => {
    const attending = rsvps.filter((r) => r.status === "yes");
    const totalAttending = attending.reduce(
      (sum, r) => sum + r.attendingCount,
      0,
    );
    return { confirmed: attending.length, totalAttending };
  }, [rsvps]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">
          📝 RSVPs
          {rsvps.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({rsvpSummary.confirmed} confirmed, {rsvpSummary.totalAttending}{" "}
              attending)
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRSVPForm(!showRSVPForm)}
          className="text-xs text-brand-primary hover:text-brand-primaryDark"
        >
          {showRSVPForm ? "Cancel" : "+ Add"}
        </Button>
      </div>

      {showRSVPForm && (
        <FieldTripRSVPForm
          onAddRSVP={onAddRSVP}
          onCancel={() => setShowRSVPForm(false)}
        />
      )}

      {rsvps.length > 0 ? (
        <div className="space-y-2">
          {rsvps.map((rsvp) => (
            <FieldTripRSVPItem
              key={rsvp.id}
              rsvp={rsvp}
              onUpdateRSVP={onUpdateRSVP}
              onDeleteRSVP={onDeleteRSVP}
            />
          ))}
        </div>
      ) : (
        !showRSVPForm && (
          <p className="text-xs text-gray-400 text-center py-1">
            No RSVPs yet. Add families to track attendance.
          </p>
        )
      )}
    </div>
  );
}

function FieldTripExpenseForm({
  onAddExpense,
  onCancel,
}: FieldTripExpenseFormProps) {
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] =
    useState<ExpenseCategory>("admission");

  const handleAddExpense = () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount) return;
    onAddExpense({
      description: newExpenseDesc.trim(),
      amount: parseFloat(newExpenseAmount),
      category: newExpenseCategory,
    });
    setNewExpenseDesc("");
    setNewExpenseAmount("");
    onCancel();
  };

  return (
    // eslint-disable-next-line design-system/pages-use-components-only -- expense form container
    <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
      <Input
        type="text"
        size="sm"
        value={newExpenseDesc}
        onChange={(e) => setNewExpenseDesc(e.target.value)}
        placeholder="Description"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          size="sm"
          value={newExpenseAmount}
          onChange={(e) => setNewExpenseAmount(e.target.value)}
          placeholder="Amount"
          min="0"
          step="0.01"
        />
        <select
          value={newExpenseCategory}
          onChange={(e) =>
            setNewExpenseCategory(e.target.value as ExpenseCategory)
          }
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          {(
            Object.entries(expenseCategoryLabels) as [
              ExpenseCategory,
              { label: string; icon: string },
            ][]
          ).map(([cat, config]) => (
            <option key={cat} value={cat}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        variant="primary"
        onClick={handleAddExpense}
        disabled={!newExpenseDesc.trim() || !newExpenseAmount}
        className="w-full text-sm py-1.5 disabled:opacity-50"
      >
        Add Expense
      </Button>
    </div>
  );
}

function FieldTripExpenseItem({
  expense,
  onUpdateExpense,
  onDeleteExpense,
}: FieldTripExpenseItemProps) {
  const catConfig = expense.category
    ? expenseCategoryLabels[expense.category]
    : { label: "Other", icon: "📦" };
  return (
    <div className="p-2 bg-white/50 rounded">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          {expense.description}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            ${expense.amount.toFixed(2)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteExpense(expense.id)}
            className="text-gray-400 hover:text-status-error text-xs"
          >
            ✕
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <select
          value={expense.category || "other"}
          onChange={(e) =>
            onUpdateExpense(expense.id, {
              category: e.target.value as ExpenseCategory,
            })
          }
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
        >
          {(
            Object.entries(expenseCategoryLabels) as [
              ExpenseCategory,
              { label: string; icon: string },
            ][]
          ).map(([cat, config]) => (
            <option key={cat} value={cat}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FieldTripExpenseList({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: FieldTripExpenseListProps) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const expenseTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">
          💰 Expenses
          {expenses.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              (Total: ${expenseTotal.toFixed(2)})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExpenseForm(!showExpenseForm)}
          className="text-xs text-brand-primary hover:text-brand-primaryDark"
        >
          {showExpenseForm ? "Cancel" : "+ Add"}
        </Button>
      </div>

      {showExpenseForm && (
        <FieldTripExpenseForm
          onAddExpense={onAddExpense}
          onCancel={() => setShowExpenseForm(false)}
        />
      )}

      {expenses.length > 0 ? (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <FieldTripExpenseItem
              key={expense.id}
              expense={expense}
              onUpdateExpense={onUpdateExpense}
              onDeleteExpense={onDeleteExpense}
            />
          ))}
        </div>
      ) : (
        !showExpenseForm && (
          <p className="text-xs text-gray-400 text-center py-1">
            No expenses recorded yet.
          </p>
        )
      )}
    </div>
  );
}

/* ─── FieldTripCard ─────────────────────────────────────────────────── */

function FieldTripCard({
  trip,
  students,
  subjects,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  isExpanded,
  onToggleExpand,
  tasks,
  newTaskTitle,
  newTaskPhase,
  onNewTaskTitleChange,
  onNewTaskPhaseChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  rsvps,
  onAddRSVP,
  onUpdateRSVP,
  onDeleteRSVP,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onLinkActivity,
  onUnlinkActivity,
}: FieldTripCardProps) {
  const statusInfo = statusLabels[trip.status];
  const categoryConfig =
    eventCategoryConfig[trip.eventCategory] || eventCategoryConfig.educational;
  const tripDate = toDate(trip.date);
  const isUpcoming = isFuture(tripDate) || isToday(tripDate);
  const isPastTrip = isPast(tripDate) && !isToday(tripDate);
  const showRSVP = groupEventCategories.includes(trip.eventCategory);

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        trip.status === "completed"
          ? "bg-status-successLight border-l-status-success"
          : trip.status === "cancelled"
            ? "bg-gray-50 border-l-gray-300"
            : isUpcoming
              ? "bg-student-blue-50 border-l-student-blue-500"
              : "bg-status-warningLight border-l-status-warning"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <FieldTripCardHeader
          trip={trip}
          students={students}
          subjects={subjects}
          statusInfo={statusInfo}
          categoryConfig={categoryConfig}
          tripDate={tripDate}
          isUpcoming={isUpcoming}
          isPastTrip={isPastTrip}
          tasks={tasks}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
        <FieldTripCardActions
          trip={trip}
          students={students}
          subjects={subjects}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onStatusChange={onStatusChange}
        />
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <FieldTripTaskList
            tasks={tasks}
            newTaskTitle={newTaskTitle}
            newTaskPhase={newTaskPhase}
            onNewTaskTitleChange={onNewTaskTitleChange}
            onNewTaskPhaseChange={onNewTaskPhaseChange}
            onAddTask={onAddTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
          />
          <FieldTripContactList
            contacts={contacts}
            onAddContact={onAddContact}
            onUpdateContact={onUpdateContact}
            onDeleteContact={onDeleteContact}
          />
          {showRSVP && (
            <FieldTripRSVPList
              rsvps={rsvps}
              onAddRSVP={onAddRSVP}
              onUpdateRSVP={onUpdateRSVP}
              onDeleteRSVP={onDeleteRSVP}
            />
          )}
          <FieldTripExpenseList
            expenses={expenses}
            onAddExpense={onAddExpense}
            onUpdateExpense={onUpdateExpense}
            onDeleteExpense={onDeleteExpense}
          />
          <LinkedActivities
            fieldTrip={trip}
            onLink={onLinkActivity}
            onUnlink={onUnlinkActivity}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Page-level sub-components ─────────────────────────────────────── */

function FieldTripStats({ stats }: FieldTripStatsProps) {
  return (
    <Card className="mb-6">
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Activities</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-student-blue-600">
            {stats.upcoming}
          </div>
          <div className="text-sm text-gray-500">Upcoming</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-status-success">
            {stats.completed}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-status-warning">
            {stats.not_started}
          </div>
          <div className="text-sm text-gray-500">Planned</div>
        </div>
      </div>
    </Card>
  );
}

function FieldTripFilters({
  filterStatus,
  onFilterChange,
}: FieldTripFiltersProps) {
  return (
    <div className="flex gap-1 mb-6">
      {(["all", "not_started", "completed", "cancelled"] as StatusFilter[]).map(
        (status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? "bg-brand-primaryLight text-brand-primaryDark"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "all"
              ? "All"
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ),
      )}
    </div>
  );
}

function FieldTripFormCategoryPicker({
  eventCategory,
  onCategoryChange,
}: FieldTripFormCategoryPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Activity Type
      </label>
      <div className="grid grid-cols-3 gap-2">
        {(
          Object.entries(eventCategoryConfig) as [
            EventCategory,
            typeof eventCategoryConfig.educational,
          ][]
        ).map(([category, config]) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={`p-2 rounded-lg text-center transition-all ${
              eventCategory === category
                ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current`
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <div className="text-xl">{config.icon}</div>
            <div className="text-xs mt-1">{config.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldTripFormFields({
  formData,
  setFormData,
  students,
  subjects,
  isEditing,
  toggleStudentSelection,
  toggleSubjectSelection,
}: FieldTripFormFieldsProps) {
  return (
    <>
      <FieldTripFormCategoryPicker
        eventCategory={formData.eventCategory}
        onCategoryChange={(category) =>
          setFormData((prev) => ({ ...prev, eventCategory: category }))
        }
      />

      <FieldTripFormBasicFields formData={formData} setFormData={setFormData} />

      <FieldTripFormDateCostFields
        formData={formData}
        setFormData={setFormData}
      />

      <FieldTripFormTimeFields formData={formData} setFormData={setFormData} />

      <FieldTripFormStudentPicker
        students={students}
        selectedStudentIds={formData.studentIds}
        toggleStudentSelection={toggleStudentSelection}
      />

      <FieldTripFormSubjectPicker
        subjects={subjects}
        selectedSubjectIds={formData.subjectIds}
        toggleSubjectSelection={toggleSubjectSelection}
      />

      <FieldTripFormUrlAndText
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
      />
    </>
  );
}

interface FieldTripFormBasicFieldsProps {
  formData: CreateFieldTrip;
  setFormData: React.Dispatch<React.SetStateAction<CreateFieldTrip>>;
}

function FieldTripFormBasicFields({
  formData,
  setFormData,
}: FieldTripFormBasicFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="e.g., Science Museum Visit"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location *
        </label>
        <Input
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, location: e.target.value }))
          }
          placeholder="e.g., Natural History Museum, 123 Main St"
          required
        />
      </div>
    </>
  );
}

interface FieldTripFormDateCostFieldsProps {
  formData: CreateFieldTrip;
  setFormData: React.Dispatch<React.SetStateAction<CreateFieldTrip>>;
}

function FieldTripFormDateCostFields({
  formData,
  setFormData,
}: FieldTripFormDateCostFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, date: e.target.value }))
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Cost
        </label>
        <Input
          type="number"
          value={formData.cost || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              cost: e.target.value ? parseFloat(e.target.value) : undefined,
            }))
          }
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

interface FieldTripFormTimeFieldsProps {
  formData: CreateFieldTrip;
  setFormData: React.Dispatch<React.SetStateAction<CreateFieldTrip>>;
}

function FieldTripFormTimeFields({
  formData,
  setFormData,
}: FieldTripFormTimeFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Time
        </label>
        <Input
          type="time"
          value={formData.startTime || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, startTime: e.target.value }))
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Time
        </label>
        <Input
          type="time"
          value={formData.endTime || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, endTime: e.target.value }))
          }
        />
      </div>
    </div>
  );
}

interface FieldTripFormStudentPickerProps {
  students: { id: string; name: string }[];
  selectedStudentIds: string[];
  toggleStudentSelection: (studentId: string) => void;
}

function FieldTripFormStudentPicker({
  students,
  selectedStudentIds,
  toggleStudentSelection,
}: FieldTripFormStudentPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Students *
      </label>
      <div className="flex flex-wrap gap-2">
        {students.map((student) => (
          <button
            key={student.id}
            type="button"
            onClick={() => toggleStudentSelection(student.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedStudentIds.includes(student.id)
                ? "bg-student-purple-100 text-student-purple-700 ring-2 ring-student-purple-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {student.name}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FieldTripFormSubjectPickerProps {
  subjects: { id: string; name: string }[];
  selectedSubjectIds: string[];
  toggleSubjectSelection: (subjectId: string) => void;
}

function FieldTripFormSubjectPicker({
  subjects,
  selectedSubjectIds,
  toggleSubjectSelection,
}: FieldTripFormSubjectPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Related Subjects
      </label>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => toggleSubjectSelection(subject.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedSubjectIds.includes(subject.id)
                ? "bg-brand-primaryLight text-brand-primaryDark ring-2 ring-brand-primary"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {subject.name}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FieldTripFormUrlAndTextProps {
  formData: CreateFieldTrip;
  setFormData: React.Dispatch<React.SetStateAction<CreateFieldTrip>>;
  isEditing: boolean;
}

function FieldTripFormUrlAndText({
  formData,
  setFormData,
  isEditing,
}: FieldTripFormUrlAndTextProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Website URL
        </label>
        <Input
          type="url"
          value={formData.websiteUrl}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))
          }
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={2}
          placeholder="What will you see/do?"
        />
      </div>

      {isEditing && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Learning Outcomes
          </label>
          <Textarea
            value={formData.learningOutcomes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                learningOutcomes: e.target.value,
              }))
            }
            rows={2}
            placeholder="What did the students learn?"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <Textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={2}
          placeholder="Parking info, what to bring, etc."
        />
      </div>
    </>
  );
}

function FieldTripFormModal({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  students,
  subjects,
  isEditing,
  onSubmit,
  toggleStudentSelection,
  toggleSubjectSelection,
}: FieldTripFormModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <FieldTripFormFields
          formData={formData}
          setFormData={setFormData}
          students={students}
          subjects={subjects}
          isEditing={isEditing}
          toggleStudentSelection={toggleStudentSelection}
          toggleSubjectSelection={toggleSubjectSelection}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? "Save Changes" : "Create Activity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FieldTripDuplicateModal({
  duplicatingTrip,
  onClose,
  duplicateDate,
  onDateChange,
  duplicateCopyTasks,
  onCopyTasksChange,
  duplicateCopyContacts,
  onCopyContactsChange,
  onDuplicate,
}: FieldTripDuplicateModalProps) {
  return (
    <Modal
      open={!!duplicatingTrip}
      onClose={onClose}
      title="Duplicate Activity"
      size="md"
    >
      {duplicatingTrip && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Create a copy of{" "}
            <span className="font-medium">{duplicatingTrip.title}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Date *
            </label>
            <Input
              type="date"
              value={duplicateDate}
              onChange={(e) => onDateChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Copy Options
            </label>
            <label className="flex items-center gap-2 text-sm">
              {/* eslint-disable-next-line design-system/require-design-system-components -- native checkbox for boolean toggle */}
              <input
                type="checkbox"
                checked={duplicateCopyTasks}
                onChange={(e) => onCopyTasksChange(e.target.checked)}
                className="rounded border-gray-300 text-student-blue-600 focus:ring-student-blue-500"
              />
              <span>Copy tasks (will be reset to incomplete)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              {/* eslint-disable-next-line design-system/require-design-system-components -- native checkbox for boolean toggle */}
              <input
                type="checkbox"
                checked={duplicateCopyContacts}
                onChange={(e) => onCopyContactsChange(e.target.checked)}
                className="rounded border-gray-300 text-student-blue-600 focus:ring-student-blue-500"
              />
              <span>Copy contacts</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              RSVPs, expenses, and payments are not copied.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={onDuplicate}
              disabled={!duplicateDate}
            >
              Duplicate
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Custom hooks ──────────────────────────────────────────────────── */

function useFieldTripsData(selectedStudentId: string | null) {
  const [trips, setTrips] = useState<FieldTrip[]>([]);
  const [tasks, setTasks] = useState<Record<string, ActivityTask[]>>({});
  const [contacts, setContacts] = useState<Record<string, ActivityContact[]>>(
    {},
  );
  const [rsvps, setRSVPs] = useState<Record<string, ActivityRSVP[]>>({});
  const [expenses, setExpenses] = useState<Record<string, ActivityExpense[]>>(
    {},
  );

  const loadTrips = useCallback(async () => {
    const data = await window.api.getFieldTrips(
      selectedStudentId ? { studentId: selectedStudentId } : undefined,
    );
    setTrips(data);
    const taskPromises = data.map(async (trip) => {
      const activityTasks = await window.api.getActivityTasks(trip.id);
      return { id: trip.id, tasks: activityTasks };
    });
    const allTasks = await Promise.all(taskPromises);
    const tasksMap: Record<string, ActivityTask[]> = {};
    allTasks.forEach(({ id, tasks: t }) => {
      tasksMap[id] = t;
    });
    setTasks(tasksMap);
  }, [selectedStudentId]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const loadTasks = async (activityId: string) => {
    const activityTasks = await window.api.getActivityTasks(activityId);
    setTasks((prev) => ({ ...prev, [activityId]: activityTasks }));
  };

  const loadContacts = async (activityId: string) => {
    const activityContacts = await window.api.getActivityContacts(activityId);
    setContacts((prev) => ({ ...prev, [activityId]: activityContacts }));
  };

  const loadRSVPs = async (activityId: string) => {
    const activityRSVPs = await window.api.getActivityRSVPs(activityId);
    setRSVPs((prev) => ({ ...prev, [activityId]: activityRSVPs }));
  };

  const loadExpenses = async (activityId: string) => {
    const activityExpenses = await window.api.getActivityExpenses(activityId);
    setExpenses((prev) => ({ ...prev, [activityId]: activityExpenses }));
  };

  return {
    trips,
    tasks,
    contacts,
    rsvps,
    expenses,
    loadTrips,
    loadTasks,
    loadContacts,
    loadRSVPs,
    loadExpenses,
  };
}

function useFieldTripHandlers(
  data: ReturnType<typeof useFieldTripsData>,
  newTaskTitle: string,
  newTaskPhase: TaskPhase,
  setNewTaskTitle: (title: string) => void,
) {
  const {
    loadTrips,
    loadTasks,
    loadContacts,
    loadRSVPs,
    loadExpenses,
    tasks,
    contacts,
    rsvps,
    expenses,
  } = data;

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      await window.api.deleteFieldTrip(id);
      loadTrips();
    }
  };

  const handleStatusChange = async (id: string, status: UniversalStatus) => {
    await window.api.updateFieldTrip(id, { status });
    loadTrips();
  };

  const toggleExpanded = async (
    tripId: string,
    expandedTripId: string | null,
    setExpandedTripId: (id: string | null) => void,
  ) => {
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      return;
    }
    setExpandedTripId(tripId);
    if (!tasks[tripId]) {
      await loadTasks(tripId);
    }
    if (!contacts[tripId]) {
      await loadContacts(tripId);
    }
    if (!rsvps[tripId]) {
      await loadRSVPs(tripId);
    }
    if (!expenses[tripId]) {
      await loadExpenses(tripId);
    }
  };

  const handleAddTask = async (activityId: string) => {
    if (!newTaskTitle.trim()) return;
    await window.api.createActivityTask({
      activityId,
      title: newTaskTitle.trim(),
      phase: newTaskPhase,
      sortOrder: 0,
    });
    setNewTaskTitle("");
    await loadTasks(activityId);
  };

  const handleToggleTask = async (taskId: string, activityId: string) => {
    await window.api.toggleActivityTask(taskId);
    await loadTasks(activityId);
  };

  const handleDeleteTask = async (taskId: string, activityId: string) => {
    await window.api.deleteActivityTask(taskId);
    await loadTasks(activityId);
  };

  return {
    handleDelete,
    handleStatusChange,
    toggleExpanded,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
  };
}

function useFieldTripContactHandlers(
  loadContacts: (activityId: string) => Promise<void>,
) {
  const handleAddContact = async (
    activityId: string,
    contactData: Omit<CreateActivityContact, "activityId">,
  ) => {
    await window.api.createActivityContact({ ...contactData, activityId });
    await loadContacts(activityId);
  };

  const handleDeleteContact = async (contactId: string, activityId: string) => {
    await window.api.deleteActivityContact(contactId);
    await loadContacts(activityId);
  };

  const handleUpdateContact = async (
    contactId: string,
    contactData: Partial<Omit<CreateActivityContact, "activityId">>,
    activityId: string,
  ) => {
    await window.api.updateActivityContact(contactId, contactData);
    await loadContacts(activityId);
  };

  return { handleAddContact, handleDeleteContact, handleUpdateContact };
}

function useFieldTripRSVPHandlers(
  loadRSVPs: (activityId: string) => Promise<void>,
) {
  const handleAddRSVP = async (
    activityId: string,
    rsvpData: Omit<CreateActivityRSVP, "activityId">,
  ) => {
    await window.api.createActivityRSVP({ ...rsvpData, activityId });
    await loadRSVPs(activityId);
  };

  const handleUpdateRSVP = async (
    rsvpId: string,
    status: RSVPStatus,
    activityId: string,
  ) => {
    await window.api.updateActivityRSVP(rsvpId, { status });
    await loadRSVPs(activityId);
  };

  const handleDeleteRSVP = async (rsvpId: string, activityId: string) => {
    await window.api.deleteActivityRSVP(rsvpId);
    await loadRSVPs(activityId);
  };

  return { handleAddRSVP, handleUpdateRSVP, handleDeleteRSVP };
}

function useFieldTripExpenseHandlers(
  loadExpenses: (activityId: string) => Promise<void>,
) {
  const handleAddExpense = async (
    activityId: string,
    expenseData: Omit<CreateActivityExpense, "activityId">,
  ) => {
    await window.api.createActivityExpense({ ...expenseData, activityId });
    await loadExpenses(activityId);
  };

  const handleDeleteExpense = async (expenseId: string, activityId: string) => {
    await window.api.deleteActivityExpense(expenseId);
    await loadExpenses(activityId);
  };

  const handleUpdateExpense = async (
    expenseId: string,
    expenseData: Partial<Omit<CreateActivityExpense, "activityId">>,
    activityId: string,
  ) => {
    await window.api.updateActivityExpense(expenseId, expenseData);
    await loadExpenses(activityId);
  };

  return { handleAddExpense, handleDeleteExpense, handleUpdateExpense };
}

function createDefaultFormData(studentIds: string[] = []): CreateFieldTrip {
  return {
    title: "",
    activityType: "interactive",
    eventCategory: "educational",
    location: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    status: "not_started",
    studentIds,
    subjectIds: [],
    cost: undefined,
    websiteUrl: "",
    notes: "",
    learningOutcomes: "",
  };
}

function formDataFromTrip(trip: FieldTrip): CreateFieldTrip {
  return {
    title: trip.title,
    activityType: trip.activityType,
    eventCategory: trip.eventCategory,
    location: trip.location,
    description: trip.description || "",
    date: trip.date,
    startTime: trip.startTime || "",
    endTime: trip.endTime || "",
    status: trip.status,
    studentIds: trip.studentIds,
    subjectIds: trip.subjectIds,
    cost: trip.cost,
    websiteUrl: trip.websiteUrl || "",
    notes: trip.notes || "",
    learningOutcomes: trip.learningOutcomes || "",
  };
}

function useFieldTripForm(
  selectedStudentId: string | null,
  loadTrips: () => Promise<void>,
) {
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState<FieldTrip | null>(null);
  const [formData, setFormData] = useState<CreateFieldTrip>(
    createDefaultFormData(),
  );

  const openAddModal = () => {
    const studentIds = selectedStudentId ? [selectedStudentId] : [];
    setFormData(createDefaultFormData(studentIds));
    setShowAddTrip(true);
  };

  const openEditModal = (trip: FieldTrip) => {
    setEditingTrip(trip);
    setFormData(formDataFromTrip(trip));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.date) return;
    if (formData.studentIds.length === 0) {
      alert("Please select at least one student");
      return;
    }
    const tripData: CreateFieldTrip = {
      ...formData,
      cost: formData.cost || undefined,
    };
    if (editingTrip) {
      await window.api.updateFieldTrip(editingTrip.id, tripData);
      setEditingTrip(null);
    } else {
      await window.api.createFieldTrip(tripData);
      setShowAddTrip(false);
    }
    loadTrips();
  };

  const closeModal = () => {
    setShowAddTrip(false);
    setEditingTrip(null);
  };

  const toggleStudentSelection = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const toggleSubjectSelection = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));
  };

  return {
    showAddTrip,
    editingTrip,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    handleSubmit,
    closeModal,
    toggleStudentSelection,
    toggleSubjectSelection,
  };
}

function useFieldTripDuplicate(loadTrips: () => Promise<void>) {
  const [duplicatingTrip, setDuplicatingTrip] = useState<FieldTrip | null>(
    null,
  );
  const [duplicateDate, setDuplicateDate] = useState("");
  const [duplicateCopyTasks, setDuplicateCopyTasks] = useState(true);
  const [duplicateCopyContacts, setDuplicateCopyContacts] = useState(true);

  const openDuplicateModal = (trip: FieldTrip) => {
    setDuplicatingTrip(trip);
    setDuplicateDate(format(addDays(toDate(trip.date), 7), "yyyy-MM-dd")); // Default to 1 week later
    setDuplicateCopyTasks(true);
    setDuplicateCopyContacts(true);
  };

  const handleDuplicate = async () => {
    if (!duplicatingTrip || !duplicateDate) return;
    await window.api.duplicateActivity(duplicatingTrip.id, {
      newDate: duplicateDate,
      copyTasks: duplicateCopyTasks,
      copyContacts: duplicateCopyContacts,
    });
    setDuplicatingTrip(null);
    loadTrips();
  };

  return {
    duplicatingTrip,
    duplicateDate,
    duplicateCopyTasks,
    duplicateCopyContacts,
    setDuplicateDate,
    setDuplicateCopyTasks,
    setDuplicateCopyContacts,
    openDuplicateModal,
    handleDuplicate,
    closeDuplicateModal: () => setDuplicatingTrip(null),
  };
}

/* ─── FieldTripCardList ─────────────────────────────────────────────── */

interface FieldTripCardListHandlers {
  onEdit: (trip: FieldTrip) => void;
  onDelete: (id: string) => void;
  onDuplicate: (trip: FieldTrip) => void;
  onStatusChange: (id: string, status: UniversalStatus) => void;
  onToggleExpand: (tripId: string) => void;
  onAddTask: (activityId: string) => void;
  onToggleTask: (taskId: string, activityId: string) => void;
  onDeleteTask: (taskId: string, activityId: string) => void;
  onNewTaskTitleChange: (title: string) => void;
  onNewTaskPhaseChange: (phase: TaskPhase) => void;
  onAddContact: (
    activityId: string,
    data: Omit<CreateActivityContact, "activityId">,
  ) => void;
  onUpdateContact: (
    contactId: string,
    data: Partial<Omit<CreateActivityContact, "activityId">>,
    activityId: string,
  ) => void;
  onDeleteContact: (contactId: string, activityId: string) => void;
  onAddRSVP: (
    activityId: string,
    data: Omit<CreateActivityRSVP, "activityId">,
  ) => void;
  onUpdateRSVP: (
    rsvpId: string,
    status: RSVPStatus,
    activityId: string,
  ) => void;
  onDeleteRSVP: (rsvpId: string, activityId: string) => void;
  onAddExpense: (
    activityId: string,
    data: Omit<CreateActivityExpense, "activityId">,
  ) => void;
  onUpdateExpense: (
    expenseId: string,
    data: Partial<Omit<CreateActivityExpense, "activityId">>,
    activityId: string,
  ) => void;
  onDeleteExpense: (expenseId: string, activityId: string) => void;
  onLinkActivity: (fieldTripId: string, activityId: string) => Promise<void>;
  onUnlinkActivity: (fieldTripId: string, activityId: string) => Promise<void>;
}

interface FieldTripCardListData {
  tasks: Record<string, ActivityTask[]>;
  contacts: Record<string, ActivityContact[]>;
  rsvps: Record<string, ActivityRSVP[]>;
  expenses: Record<string, ActivityExpense[]>;
}

interface FieldTripCardListProps {
  trips: FieldTrip[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  expandedTripId: string | null;
  newTaskTitle: string;
  newTaskPhase: TaskPhase;
  data: FieldTripCardListData;
  handlers: FieldTripCardListHandlers;
}

function FieldTripCardListItem({
  trip,
  students,
  subjects,
  isExpanded,
  newTaskTitle,
  newTaskPhase,
  data,
  handlers,
}: {
  trip: FieldTrip;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  isExpanded: boolean;
  newTaskTitle: string;
  newTaskPhase: TaskPhase;
  data: FieldTripCardListData;
  handlers: FieldTripCardListHandlers;
}) {
  return (
    <FieldTripCard
      trip={trip}
      students={students}
      subjects={subjects}
      onEdit={() => handlers.onEdit(trip)}
      onDelete={() => handlers.onDelete(trip.id)}
      onDuplicate={() => handlers.onDuplicate(trip)}
      onStatusChange={(status) => handlers.onStatusChange(trip.id, status)}
      isExpanded={isExpanded}
      onToggleExpand={() => handlers.onToggleExpand(trip.id)}
      tasks={data.tasks[trip.id] || []}
      newTaskTitle={isExpanded ? newTaskTitle : ""}
      newTaskPhase={newTaskPhase}
      onNewTaskTitleChange={handlers.onNewTaskTitleChange}
      onNewTaskPhaseChange={handlers.onNewTaskPhaseChange}
      onAddTask={() => handlers.onAddTask(trip.id)}
      onToggleTask={(taskId) => handlers.onToggleTask(taskId, trip.id)}
      onDeleteTask={(taskId) => handlers.onDeleteTask(taskId, trip.id)}
      contacts={data.contacts[trip.id] || []}
      onAddContact={(d) => handlers.onAddContact(trip.id, d)}
      onUpdateContact={(cId, d) => handlers.onUpdateContact(cId, d, trip.id)}
      onDeleteContact={(cId) => handlers.onDeleteContact(cId, trip.id)}
      rsvps={data.rsvps[trip.id] || []}
      onAddRSVP={(d) => handlers.onAddRSVP(trip.id, d)}
      onUpdateRSVP={(rId, s) => handlers.onUpdateRSVP(rId, s, trip.id)}
      onDeleteRSVP={(rId) => handlers.onDeleteRSVP(rId, trip.id)}
      expenses={data.expenses[trip.id] || []}
      onAddExpense={(d) => handlers.onAddExpense(trip.id, d)}
      onUpdateExpense={(eId, d) => handlers.onUpdateExpense(eId, d, trip.id)}
      onDeleteExpense={(eId) => handlers.onDeleteExpense(eId, trip.id)}
      onLinkActivity={(aId) => handlers.onLinkActivity(trip.id, aId)}
      onUnlinkActivity={(aId) => handlers.onUnlinkActivity(trip.id, aId)}
    />
  );
}

function FieldTripCardList({
  trips,
  students,
  subjects,
  expandedTripId,
  newTaskTitle,
  newTaskPhase,
  data,
  handlers,
}: FieldTripCardListProps) {
  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <FieldTripCardListItem
          key={trip.id}
          trip={trip}
          students={students}
          subjects={subjects}
          isExpanded={expandedTripId === trip.id}
          newTaskTitle={newTaskTitle}
          newTaskPhase={newTaskPhase}
          data={data}
          handlers={handlers}
        />
      ))}
    </div>
  );
}

/* ─── Filtering and stats helpers ───────────────────────────────────── */

function useFilteredTrips(trips: FieldTrip[], filterStatus: StatusFilter) {
  return useMemo(() => {
    let filtered = trips;
    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }
    return filtered.sort((a, b) => {
      const dateA = toDate(a.date);
      const dateB = toDate(b.date);
      const nowDate = new Date();
      const aIsUpcoming = dateA >= nowDate;
      const bIsUpcoming = dateB >= nowDate;
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      if (aIsUpcoming && bIsUpcoming) {
        return dateA.getTime() - dateB.getTime();
      }
      return dateB.getTime() - dateA.getTime();
    });
  }, [trips, filterStatus]);
}

function useTripStats(trips: FieldTrip[]) {
  return useMemo(() => {
    const total = trips.length;
    const not_started = trips.filter((t) => t.status === "not_started").length;
    const completed = trips.filter((t) => t.status === "completed").length;
    const upcoming = trips.filter(
      (t) =>
        t.status === "not_started" &&
        (isFuture(toDate(t.date)) || isToday(toDate(t.date))),
    ).length;
    return { total, not_started, completed, upcoming };
  }, [trips]);
}

/* ─── FieldTripsEmptyState ──────────────────────────────────────────── */

interface FieldTripsEmptyStateProps {
  hasTrips: boolean;
}

function FieldTripsEmptyState({ hasTrips }: FieldTripsEmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <p className="text-gray-500">
        {!hasTrips
          ? "No activities not_started yet. Start by planning your first activity!"
          : "No activities match your filter."}
      </p>
    </Card>
  );
}

/* ─── FieldTripsPageModals ──────────────────────────────────────────── */

interface FieldTripsPageModalsProps {
  form: ReturnType<typeof useFieldTripForm>;
  duplicate: ReturnType<typeof useFieldTripDuplicate>;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

function FieldTripsPageModals({
  form,
  duplicate,
  students,
  subjects,
}: FieldTripsPageModalsProps) {
  return (
    <>
      <FieldTripFormModal
        isOpen={form.showAddTrip || !!form.editingTrip}
        onClose={form.closeModal}
        title={form.editingTrip ? "Edit Activity" : "Plan Activity"}
        formData={form.formData}
        setFormData={form.setFormData}
        students={students}
        subjects={subjects}
        isEditing={!!form.editingTrip}
        onSubmit={form.handleSubmit}
        toggleStudentSelection={form.toggleStudentSelection}
        toggleSubjectSelection={form.toggleSubjectSelection}
      />
      <FieldTripDuplicateModal
        duplicatingTrip={duplicate.duplicatingTrip}
        onClose={duplicate.closeDuplicateModal}
        duplicateDate={duplicate.duplicateDate}
        onDateChange={duplicate.setDuplicateDate}
        duplicateCopyTasks={duplicate.duplicateCopyTasks}
        onCopyTasksChange={duplicate.setDuplicateCopyTasks}
        duplicateCopyContacts={duplicate.duplicateCopyContacts}
        onCopyContactsChange={duplicate.setDuplicateCopyContacts}
        onDuplicate={duplicate.handleDuplicate}
      />
    </>
  );
}

/* ─── Main page component ───────────────────────────────────────────── */

function useCardListHandlers(
  form: ReturnType<typeof useFieldTripForm>,
  taskHandlers: ReturnType<typeof useFieldTripHandlers>,
  duplicate: ReturnType<typeof useFieldTripDuplicate>,
  contactHandlers: ReturnType<typeof useFieldTripContactHandlers>,
  rsvpHandlers: ReturnType<typeof useFieldTripRSVPHandlers>,
  expenseHandlers: ReturnType<typeof useFieldTripExpenseHandlers>,
  expandedTripId: string | null,
  setExpandedTripId: (id: string | null) => void,
  setNewTaskTitle: (title: string) => void,
  setNewTaskPhase: (phase: TaskPhase) => void,
): FieldTripCardListHandlers {
  return useMemo(
    () => ({
      onEdit: form.openEditModal,
      onDelete: taskHandlers.handleDelete,
      onDuplicate: duplicate.openDuplicateModal,
      onStatusChange: taskHandlers.handleStatusChange,
      onToggleExpand: (tripId: string) =>
        taskHandlers.toggleExpanded(tripId, expandedTripId, setExpandedTripId),
      onAddTask: taskHandlers.handleAddTask,
      onToggleTask: taskHandlers.handleToggleTask,
      onDeleteTask: taskHandlers.handleDeleteTask,
      onNewTaskTitleChange: setNewTaskTitle,
      onNewTaskPhaseChange: setNewTaskPhase,
      onAddContact: contactHandlers.handleAddContact,
      onUpdateContact: contactHandlers.handleUpdateContact,
      onDeleteContact: contactHandlers.handleDeleteContact,
      onAddRSVP: rsvpHandlers.handleAddRSVP,
      onUpdateRSVP: rsvpHandlers.handleUpdateRSVP,
      onDeleteRSVP: rsvpHandlers.handleDeleteRSVP,
      onAddExpense: expenseHandlers.handleAddExpense,
      onUpdateExpense: expenseHandlers.handleUpdateExpense,
      onDeleteExpense: expenseHandlers.handleDeleteExpense,
      onLinkActivity: async (fieldTripId: string, activityId: string) => {
        await window.api.linkActivityToFieldTrip({ fieldTripId, activityId });
      },
      onUnlinkActivity: async (fieldTripId: string, activityId: string) => {
        await window.api.unlinkActivityFromFieldTrip(fieldTripId, activityId);
      },
    }),
    [
      form,
      taskHandlers,
      duplicate,
      contactHandlers,
      rsvpHandlers,
      expenseHandlers,
      expandedTripId,
      setExpandedTripId,
      setNewTaskTitle,
      setNewTaskPhase,
    ],
  );
}

export default function FieldTrips(): JSX.Element {
  const { students, subjects, selectedStudentId } = useStore();
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhase, setNewTaskPhase] = useState<TaskPhase>("before");

  const tripsData = useFieldTripsData(selectedStudentId);
  const form = useFieldTripForm(selectedStudentId, tripsData.loadTrips);
  const duplicate = useFieldTripDuplicate(tripsData.loadTrips);
  const taskHandlers = useFieldTripHandlers(
    tripsData,
    newTaskTitle,
    newTaskPhase,
    setNewTaskTitle,
  );
  const contactHandlers = useFieldTripContactHandlers(tripsData.loadContacts);
  const rsvpHandlers = useFieldTripRSVPHandlers(tripsData.loadRSVPs);
  const expenseHandlers = useFieldTripExpenseHandlers(tripsData.loadExpenses);

  const filteredTrips = useFilteredTrips(tripsData.trips, filterStatus);
  const stats = useTripStats(tripsData.trips);

  const cardListHandlers = useCardListHandlers(
    form,
    taskHandlers,
    duplicate,
    contactHandlers,
    rsvpHandlers,
    expenseHandlers,
    expandedTripId,
    setExpandedTripId,
    setNewTaskTitle,
    setNewTaskPhase,
  );

  const cardListData: FieldTripCardListData = useMemo(
    () => ({
      tasks: tripsData.tasks,
      contacts: tripsData.contacts,
      rsvps: tripsData.rsvps,
      expenses: tripsData.expenses,
    }),
    [tripsData.tasks, tripsData.contacts, tripsData.rsvps, tripsData.expenses],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Activities"
        subtitle="Plan field trips, park days, playdates, and social events"
        action={
          <Button variant="primary" onClick={form.openAddModal}>
            + Plan Activity
          </Button>
        }
      />
      <FieldTripStats stats={stats} />
      <FieldTripFilters
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />
      {filteredTrips.length === 0 ? (
        <FieldTripsEmptyState hasTrips={tripsData.trips.length > 0} />
      ) : (
        <FieldTripCardList
          trips={filteredTrips}
          students={students}
          subjects={subjects}
          expandedTripId={expandedTripId}
          newTaskTitle={newTaskTitle}
          newTaskPhase={newTaskPhase}
          data={cardListData}
          handlers={cardListHandlers}
        />
      )}
      <FieldTripsPageModals
        form={form}
        duplicate={duplicate}
        students={students}
        subjects={subjects}
      />
    </PageContainer>
  );
}
