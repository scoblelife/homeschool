import { v4 as uuid } from "uuid";
import { getDatabase } from "../connection";
import type {
  FieldTrip,
  CreateFieldTrip,
  UpdateFieldTrip,
  UniversalStatus,
  EventCategory,
} from "../../types";

function rowToFieldTrip(row: Record<string, unknown>): FieldTrip {
  // Map old activity_type column to new eventCategory
  const rawCategory = row.event_category as string | null;
  const rawActivityType = row.activity_type as string | null;

  // Support both old and new column names during migration
  let eventCategory: EventCategory = "educational";
  if (rawCategory) {
    eventCategory = rawCategory as EventCategory;
  } else if (rawActivityType) {
    // Map old EventActivityType values to new EventCategory
    const categoryMap: Record<string, EventCategory> = {
      field_trip: "educational",
      park_day: "social",
      game_night: "social",
      playdate: "social",
      coop_class: "coop",
      custom: "educational",
      // New values pass through
      educational: "educational",
      social: "social",
      coop: "coop",
    };
    eventCategory = categoryMap[rawActivityType] || "educational";
  }

  // Map old status values
  const rawStatus = row.status as string;
  const statusMap: Record<string, UniversalStatus> = {
    planned: "not_started",
    not_started: "not_started",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
  };

  return {
    id: row.id as string,
    title: row.title as string,
    eventCategory,
    location: row.location as string,
    description: row.description as string | undefined,
    date: row.date as string,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    status: statusMap[rawStatus] || "not_started",
    studentIds: JSON.parse(row.student_ids as string) as string[],
    subjectIds: JSON.parse(row.subject_ids as string) as string[],
    cost: row.cost as number | undefined,
    websiteUrl: row.website_url as string | undefined,
    notes: row.notes as string | undefined,
    learningOutcomes: row.learning_outcomes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

interface FieldTripFilters {
  studentId?: string;
  status?: UniversalStatus;
  eventCategory?: EventCategory;
}

export async function getFieldTrips(
  filters?: FieldTripFilters,
): Promise<FieldTrip[]> {
  const db = await getDatabase();

  let query = "SELECT * FROM field_trips WHERE 1=1";
  const params: (string | number | null)[] = [];

  if (filters?.status) {
    // Support both old and new status values in queries
    const statusValue =
      filters.status === "not_started" ? "planned" : filters.status;
    query += " AND (status = ? OR status = ?)";
    params.push(filters.status, statusValue);
  }
  if (filters?.eventCategory) {
    // Support both old activity_type column and new event_category
    query += " AND (event_category = ? OR activity_type = ?)";
    params.push(filters.eventCategory, filters.eventCategory);
  }

  query += " ORDER BY date DESC";

  const rows = (await db.getAllAsync(query, ...params)) as Record<
    string,
    unknown
  >[];
  let trips = rows.map(rowToFieldTrip);

  // Filter by studentId if provided (need to check JSON array)
  if (filters?.studentId) {
    trips = trips.filter((trip) =>
      trip.studentIds.includes(filters.studentId!),
    );
  }

  return trips;
}

export async function getFieldTrip(id: string): Promise<FieldTrip | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT * FROM field_trips WHERE id = ?",
    id,
  );
  return row ? rowToFieldTrip(row as Record<string, unknown>) : null;
}

export async function createFieldTrip(
  data: CreateFieldTrip,
): Promise<FieldTrip> {
  const db = await getDatabase();
  const id = uuid();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO field_trips (id, title, event_category, activity_type, location, description, date, start_time, end_time,
       status, student_ids, subject_ids, cost, website_url, notes, learning_outcomes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.title,
    data.eventCategory,
    data.eventCategory, // Also write to activity_type for backwards compat
    data.location,
    data.description ?? null,
    data.date,
    data.startTime ?? null,
    data.endTime ?? null,
    data.status,
    JSON.stringify(data.studentIds),
    JSON.stringify(data.subjectIds),
    data.cost ?? null,
    data.websiteUrl ?? null,
    data.notes ?? null,
    data.learningOutcomes ?? null,
    now,
    now,
  );

  return (await getFieldTrip(id))!;
}

export async function updateFieldTrip(
  id: string,
  data: UpdateFieldTrip,
): Promise<FieldTrip> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const current = await getFieldTrip(id);
  if (!current) throw new Error(`Field trip ${id} not found`);

  const updated = { ...current, ...data, updatedAt: now };

  await db.runAsync(
    `UPDATE field_trips SET title = ?, event_category = ?, activity_type = ?, location = ?, description = ?, date = ?,
       start_time = ?, end_time = ?, status = ?, student_ids = ?, subject_ids = ?, cost = ?,
       website_url = ?, notes = ?, learning_outcomes = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.eventCategory,
    updated.eventCategory,
    updated.location,
    updated.description ?? null,
    updated.date,
    updated.startTime ?? null,
    updated.endTime ?? null,
    updated.status,
    JSON.stringify(updated.studentIds),
    JSON.stringify(updated.subjectIds),
    updated.cost ?? null,
    updated.websiteUrl ?? null,
    updated.notes ?? null,
    updated.learningOutcomes ?? null,
    now,
    id,
  );

  return (await getFieldTrip(id))!;
}

export async function deleteFieldTrip(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM field_trips WHERE id = ?", id);
}

export async function getUpcomingFieldTrips(
  studentId?: string,
  limit = 5,
): Promise<FieldTrip[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split("T")[0];

  const rows = (await db.getAllAsync(
    `SELECT * FROM field_trips
     WHERE (status = 'planned' OR status = 'not_started') AND date >= ?
     ORDER BY date ASC
     LIMIT ?`,
    today,
    limit,
  )) as Record<string, unknown>[];

  let trips = rows.map(rowToFieldTrip);

  if (studentId) {
    trips = trips.filter((trip) => trip.studentIds.includes(studentId));
  }

  return trips;
}
