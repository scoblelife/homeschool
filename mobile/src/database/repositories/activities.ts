import { v4 as uuid } from "uuid";
import { getDatabase } from "../connection";
import type {
  Activity,
  CreateActivity,
  UpdateActivity,
  ActivityType,
} from "../../types";

function rowToActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    sessionId: row.session_id as string | null,
    studentId: row.student_id as string,
    subjectId: row.subject_id as string,
    activityType: row.activity_type as ActivityType,
    activitySubType: row.activity_sub_type as string | undefined,
    title: row.title as string,
    description: row.description as string,
    dateCompleted: row.date_completed as string,
    durationMinutes: row.duration_minutes as number | null,
    grade: row.grade as number | null,
    maxGrade: row.max_grade as number | null,
    notes: row.notes as string,
    bookTitle: row.book_title as string | undefined,
    pagesRead: row.pages_read as number | undefined,
    totalPages: row.total_pages as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

interface ActivityFilters {
  studentId?: string;
  subjectId?: string;
  activityType?: ActivityType;
  startDate?: string;
  endDate?: string;
}

export async function getActivities(
  filters?: ActivityFilters,
): Promise<Activity[]> {
  const db = await getDatabase();

  let query = "SELECT * FROM activities WHERE 1=1";
  const params: (string | number | null)[] = [];

  if (filters?.studentId) {
    query += " AND student_id = ?";
    params.push(filters.studentId);
  }
  if (filters?.subjectId) {
    query += " AND subject_id = ?";
    params.push(filters.subjectId);
  }
  if (filters?.activityType) {
    query += " AND activity_type = ?";
    params.push(filters.activityType);
  }
  if (filters?.startDate) {
    query += " AND date_completed >= ?";
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    query += " AND date_completed <= ?";
    params.push(filters.endDate);
  }

  query += " ORDER BY date_completed DESC, created_at DESC";

  const rows = (await db.getAllAsync(query, ...params)) as Record<
    string,
    unknown
  >[];
  return rows.map(rowToActivity);
}

export async function getActivity(id: string): Promise<Activity | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT * FROM activities WHERE id = ?",
    id,
  );
  return row ? rowToActivity(row as Record<string, unknown>) : null;
}

export async function createActivity(data: CreateActivity): Promise<Activity> {
  const db = await getDatabase();
  const id = uuid();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO activities (id, session_id, student_id, subject_id, activity_type, activity_sub_type, title, description,
       date_completed, duration_minutes, grade, max_grade, notes, book_title, pages_read, total_pages,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.sessionId ?? null,
    data.studentId,
    data.subjectId,
    data.activityType,
    data.activitySubType ?? null,
    data.title,
    data.description,
    data.dateCompleted,
    data.durationMinutes ?? null,
    data.grade ?? null,
    data.maxGrade ?? null,
    data.notes,
    data.bookTitle ?? null,
    data.pagesRead ?? null,
    data.totalPages ?? null,
    now,
    now,
  );

  return (await getActivity(id))!;
}

export async function updateActivity(
  id: string,
  data: UpdateActivity,
): Promise<Activity> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const current = await getActivity(id);
  if (!current) throw new Error(`Activity ${id} not found`);

  const updated = { ...current, ...data, updatedAt: now };

  await db.runAsync(
    `UPDATE activities SET session_id = ?, student_id = ?, subject_id = ?, activity_type = ?,
       activity_sub_type = ?, title = ?, description = ?, date_completed = ?, duration_minutes = ?,
       grade = ?, max_grade = ?, notes = ?, book_title = ?, pages_read = ?, total_pages = ?, updated_at = ?
     WHERE id = ?`,
    updated.sessionId ?? null,
    updated.studentId,
    updated.subjectId,
    updated.activityType,
    updated.activitySubType ?? null,
    updated.title,
    updated.description,
    updated.dateCompleted,
    updated.durationMinutes ?? null,
    updated.grade ?? null,
    updated.maxGrade ?? null,
    updated.notes,
    updated.bookTitle ?? null,
    updated.pagesRead ?? null,
    updated.totalPages ?? null,
    now,
    id,
  );

  return (await getActivity(id))!;
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM activities WHERE id = ?", id);
}

interface ActivitySummaryResult {
  subjectId: string;
  subjectName: string;
  totalActivities: number;
  totalMinutes: number;
  averageGrade: number | null;
  byType: Record<ActivityType, number>;
}

interface DailySummaryResult {
  date: string;
  sessionsCount: number;
  activitiesCount: number;
  totalMinutes: number;
}

export async function getActivitySummary(
  studentId: string,
  startDate: string,
  endDate: string,
): Promise<ActivitySummaryResult[]> {
  const db = await getDatabase();

  const rows = (await db.getAllAsync(
    `
    SELECT
      a.subject_id,
      s.name as subject_name,
      COUNT(*) as total_activities,
      COALESCE(SUM(a.duration_minutes), 0) as total_minutes,
      AVG(CASE WHEN a.grade IS NOT NULL AND a.max_grade IS NOT NULL AND a.max_grade > 0
               THEN (a.grade * 100.0 / a.max_grade) END) as average_grade,
      a.activity_type
    FROM activities a
    JOIN subjects s ON a.subject_id = s.id
    WHERE a.student_id = ?
      AND a.date_completed >= ?
      AND a.date_completed <= ?
    GROUP BY a.subject_id, a.activity_type
    ORDER BY s.name
  `,
    studentId,
    startDate,
    endDate,
  )) as Record<string, unknown>[];

  // Group by subject
  const summaryMap = new Map<string, ActivitySummaryResult>();

  for (const row of rows) {
    const subjectId = row.subject_id as string;
    const activityType = row.activity_type as ActivityType;

    if (!summaryMap.has(subjectId)) {
      summaryMap.set(subjectId, {
        subjectId,
        subjectName: row.subject_name as string,
        totalActivities: 0,
        totalMinutes: 0,
        averageGrade: null,
        byType: {
          worksheet: 0,
          video: 0,
          reading: 0,
          writing: 0,
          hands_on: 0,
          interactive: 0,
        },
      });
    }

    const summary = summaryMap.get(subjectId)!;
    summary.totalActivities += row.total_activities as number;
    summary.totalMinutes += row.total_minutes as number;
    if (row.average_grade !== null) {
      summary.averageGrade = row.average_grade as number;
    }
    if (activityType in summary.byType) {
      summary.byType[activityType] = row.total_activities as number;
    }
  }

  return Array.from(summaryMap.values());
}

export async function getDailySummaries(
  studentId: string,
  startDate: string,
  endDate: string,
): Promise<DailySummaryResult[]> {
  const db = await getDatabase();

  const rows = (await db.getAllAsync(
    `
    SELECT
      date_completed as date,
      COUNT(*) as activities_count,
      COALESCE(SUM(duration_minutes), 0) as total_minutes
    FROM activities
    WHERE student_id = ?
      AND date_completed >= ?
      AND date_completed <= ?
    GROUP BY date_completed
    ORDER BY date_completed DESC
  `,
    studentId,
    startDate,
    endDate,
  )) as Record<string, unknown>[];

  return rows.map((row) => ({
    date: row.date as string,
    sessionsCount: 0,
    activitiesCount: row.activities_count as number,
    totalMinutes: row.total_minutes as number,
  }));
}
