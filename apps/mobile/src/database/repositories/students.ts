import { v4 as uuid } from "uuid";
import { getDatabase } from "../connection";
import type { Student, CreateStudent, UpdateStudent } from "../../types";

function rowToStudent(row: Record<string, unknown>): Student {
  return {
    id: row.id as string,
    name: row.name as string,
    dateOfBirth: row.date_of_birth as string,
    gradeLevel: row.grade_level as Student["gradeLevel"],
    color: row.color as string,
    calendarFeedUrl: row.calendar_feed_url as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getStudents(): Promise<Student[]> {
  const db = await getDatabase();
  const rows = (await db.getAllAsync(
    "SELECT * FROM students ORDER BY name",
  )) as Record<string, unknown>[];
  return rows.map(rowToStudent);
}

export async function getStudent(id: string): Promise<Student | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync("SELECT * FROM students WHERE id = ?", id);
  return row ? rowToStudent(row as Record<string, unknown>) : null;
}

export async function createStudent(data: CreateStudent): Promise<Student> {
  const db = await getDatabase();
  const id = uuid();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO students (id, name, date_of_birth, grade_level, color, calendar_feed_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.dateOfBirth,
    data.gradeLevel,
    data.color,
    data.calendarFeedUrl ?? null,
    now,
    now,
  );

  return (await getStudent(id))!;
}

export async function updateStudent(
  id: string,
  data: UpdateStudent,
): Promise<Student> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const current = await getStudent(id);
  if (!current) throw new Error(`Student ${id} not found`);

  const updated = { ...current, ...data, updatedAt: now };

  await db.runAsync(
    `UPDATE students SET name = ?, date_of_birth = ?, grade_level = ?, color = ?, calendar_feed_url = ?, updated_at = ?
     WHERE id = ?`,
    updated.name,
    updated.dateOfBirth,
    updated.gradeLevel,
    updated.color,
    updated.calendarFeedUrl ?? null,
    now,
    id,
  );

  return (await getStudent(id))!;
}

export async function deleteStudent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM students WHERE id = ?", id);
}
