/**
 * Event Projector - applies sync events to the SQLite database
 */

import { SyncEvent } from "./events";
import { EventLog } from "./eventLog";
import { getDatabase } from "../database/connection";
import type { SQLiteBindValue } from "expo-sqlite";

// Helper to safely cast values to SQLiteBindValue
function toBindValue(value: unknown): SQLiteBindValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value);
}

export class EventProjector {
  private static instance: EventProjector | null = null;
  private eventLog: EventLog;
  private processing = false;

  private constructor() {
    this.eventLog = EventLog.getInstance();
  }

  static getInstance(): EventProjector {
    if (!EventProjector.instance) {
      EventProjector.instance = new EventProjector();
    }
    return EventProjector.instance;
  }

  /**
   * Process all unprocessed events
   */
  async processEvents(): Promise<number> {
    if (this.processing) return 0;

    this.processing = true;
    let count = 0;

    try {
      const events = await this.eventLog.getUnprocessedEvents();

      for (const event of events) {
        await this.applyEvent(event);
        await this.eventLog.markProcessed(event.id);
        count++;
      }
    } finally {
      this.processing = false;
    }

    return count;
  }

  /**
   * Apply a single event to the database
   */
  async applyEvent(event: SyncEvent): Promise<void> {
    try {
      switch (event.type) {
        // Student events
        case "student.created":
          await this.applyStudentCreated(event);
          break;
        case "student.updated":
          await this.applyStudentUpdated(event);
          break;
        case "student.deleted":
          await this.applyStudentDeleted(event);
          break;

        // Activity events
        case "activity.logged":
          await this.applyActivityLogged(event);
          break;
        case "activity.updated":
          await this.applyActivityUpdated(event);
          break;
        case "activity.deleted":
          await this.applyActivityDeleted(event);
          break;

        // Milestone events
        case "milestone.created":
          await this.applyMilestoneCreated(event);
          break;
        case "milestone.updated":
          await this.applyMilestoneUpdated(event);
          break;
        case "milestone.completed":
          await this.applyMilestoneCompleted(event);
          break;
        case "milestone.deleted":
          await this.applyMilestoneDeleted(event);
          break;

        // Field trip events
        case "fieldTrip.created":
          await this.applyFieldTripCreated(event);
          break;
        case "fieldTrip.updated":
          await this.applyFieldTripUpdated(event);
          break;
        case "fieldTrip.deleted":
          await this.applyFieldTripDeleted(event);
          break;

        // Subject events
        case "subject.created":
          await this.applySubjectCreated(event);
          break;
        case "subject.updated":
          await this.applySubjectUpdated(event);
          break;
        case "subject.deleted":
          await this.applySubjectDeleted(event);
          break;

        // Book events
        case "book.created":
          await this.applyBookCreated(event);
          break;
        case "book.updated":
          await this.applyBookUpdated(event);
          break;
        case "book.deleted":
          await this.applyBookDeleted(event);
          break;

        default:
          console.log(`Unknown event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error applying event ${event.type}:`, error);
      throw error;
    }
  }

  // Student projections
  private async applyStudentCreated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    await db.runAsync(
      `INSERT OR REPLACE INTO students (id, name, date_of_birth, grade_level, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      toBindValue(data.id),
      toBindValue(data.name),
      toBindValue(data.dateOfBirth),
      toBindValue(data.gradeLevel),
      toBindValue(data.color),
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  private async applyStudentUpdated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(toBindValue(data.name));
    }
    if (data.dateOfBirth !== undefined) {
      updates.push("date_of_birth = ?");
      params.push(toBindValue(data.dateOfBirth));
    }
    if (data.gradeLevel !== undefined) {
      updates.push("grade_level = ?");
      params.push(toBindValue(data.gradeLevel));
    }
    if (data.color !== undefined) {
      updates.push("color = ?");
      params.push(toBindValue(data.color));
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      params.push(new Date().toISOString());
      params.push(toBindValue(data.id));

      await db.runAsync(
        `UPDATE students SET ${updates.join(", ")} WHERE id = ?`,
        ...params,
      );
    }
  }

  private async applyStudentDeleted(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM students WHERE id = ?`,
      toBindValue(event.data.id),
    );
  }

  // Activity projections
  private async applyActivityLogged(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO activities
       (id, student_id, subject_id, activity_type, title, description, date_completed, duration_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      toBindValue(data.id),
      toBindValue(data.studentId),
      toBindValue(data.subjectId),
      toBindValue(data.activityType),
      toBindValue(data.title),
      toBindValue(data.description),
      toBindValue(data.completedAt) || toBindValue(data.dateCompleted),
      toBindValue(data.duration) || toBindValue(data.durationMinutes),
      now,
      now,
    );
  }

  private async applyActivityUpdated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      params.push(toBindValue(data.title));
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      params.push(toBindValue(data.description));
    }
    if (data.duration !== undefined || data.durationMinutes !== undefined) {
      updates.push("duration_minutes = ?");
      params.push(
        toBindValue(data.duration) || toBindValue(data.durationMinutes),
      );
    }
    // Update timestamp
    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    if (updates.length > 0) {
      params.push(toBindValue(data.id));
      await db.runAsync(
        `UPDATE activities SET ${updates.join(", ")} WHERE id = ?`,
        ...params,
      );
    }
  }

  private async applyActivityDeleted(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM activities WHERE id = ?`,
      toBindValue(event.data.id),
    );
  }

  // Milestone projections
  private async applyMilestoneCreated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO milestones
       (id, student_id, subject_id, title, description, target_date, status, star_value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      toBindValue(data.id),
      toBindValue(data.studentId),
      toBindValue(data.subjectId),
      toBindValue(data.title),
      toBindValue(data.description),
      toBindValue(data.targetDate),
      toBindValue(data.status) || "not_started",
      toBindValue(data.starsReward) || toBindValue(data.starValue) || 1,
      now,
      now,
    );
  }

  private async applyMilestoneUpdated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      params.push(toBindValue(data.title));
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      params.push(toBindValue(data.description));
    }
    if (data.targetDate !== undefined) {
      updates.push("target_date = ?");
      params.push(toBindValue(data.targetDate));
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      params.push(toBindValue(data.status));
    }
    if (data.starsReward !== undefined || data.starValue !== undefined) {
      updates.push("star_value = ?");
      params.push(toBindValue(data.starsReward) || toBindValue(data.starValue));
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      params.push(new Date().toISOString());
      params.push(toBindValue(data.id));

      await db.runAsync(
        `UPDATE milestones SET ${updates.join(", ")} WHERE id = ?`,
        ...params,
      );
    }
  }

  private async applyMilestoneCompleted(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    await db.runAsync(
      `UPDATE milestones SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`,
      toBindValue(data.completedAt),
      new Date().toISOString(),
      toBindValue(data.id),
    );
  }

  private async applyMilestoneDeleted(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM milestones WHERE id = ?`,
      toBindValue(event.data.id),
    );
  }

  // Field trip projections
  private async applyFieldTripCreated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    await db.runAsync(
      `INSERT OR REPLACE INTO field_trips
       (id, title, location, date, description, event_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      toBindValue(data.id),
      toBindValue(data.title),
      toBindValue(data.location),
      toBindValue(data.date),
      toBindValue(data.description),
      toBindValue(data.eventType),
      new Date().toISOString(),
      new Date().toISOString(),
    );

    // Handle student associations
    const studentIds = data.studentIds as string[] | undefined;
    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        await db.runAsync(
          `INSERT OR IGNORE INTO field_trip_students (field_trip_id, student_id) VALUES (?, ?)`,
          toBindValue(data.id),
          studentId,
        );
      }
    }
  }

  private async applyFieldTripUpdated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      params.push(toBindValue(data.title));
    }
    if (data.location !== undefined) {
      updates.push("location = ?");
      params.push(toBindValue(data.location));
    }
    if (data.date !== undefined) {
      updates.push("date = ?");
      params.push(toBindValue(data.date));
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      params.push(toBindValue(data.description));
    }
    if (data.eventType !== undefined) {
      updates.push("event_type = ?");
      params.push(toBindValue(data.eventType));
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      params.push(new Date().toISOString());
      params.push(toBindValue(data.id));

      await db.runAsync(
        `UPDATE field_trips SET ${updates.join(", ")} WHERE id = ?`,
        ...params,
      );
    }

    // Update student associations if provided
    if (data.studentIds !== undefined) {
      await db.runAsync(
        `DELETE FROM field_trip_students WHERE field_trip_id = ?`,
        toBindValue(data.id),
      );
      const studentIds = data.studentIds as string[];
      for (const studentId of studentIds) {
        await db.runAsync(
          `INSERT INTO field_trip_students (field_trip_id, student_id) VALUES (?, ?)`,
          toBindValue(data.id),
          studentId,
        );
      }
    }
  }

  private async applyFieldTripDeleted(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM field_trip_students WHERE field_trip_id = ?`,
      toBindValue(event.data.id),
    );
    await db.runAsync(
      `DELETE FROM field_trips WHERE id = ?`,
      toBindValue(event.data.id),
    );
  }

  // Subject projections
  private async applySubjectCreated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    await db.runAsync(
      `INSERT OR REPLACE INTO subjects (id, name, color, icon, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      toBindValue(data.id),
      toBindValue(data.name),
      toBindValue(data.color),
      toBindValue(data.icon),
      new Date().toISOString(),
    );
  }

  private async applySubjectUpdated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(toBindValue(data.name));
    }
    if (data.color !== undefined) {
      updates.push("color = ?");
      params.push(toBindValue(data.color));
    }
    if (data.icon !== undefined) {
      updates.push("icon = ?");
      params.push(toBindValue(data.icon));
    }

    if (updates.length > 0) {
      params.push(toBindValue(data.id));
      await db.runAsync(
        `UPDATE subjects SET ${updates.join(", ")} WHERE id = ?`,
        ...params,
      );
    }
  }

  private async applySubjectDeleted(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM subjects WHERE id = ?`,
      toBindValue(event.data.id),
    );
  }

  // Book projections
  private async applyBookCreated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    await db.runAsync(
      `INSERT OR REPLACE INTO books
       (id, student_id, title, author, isbn, status, start_date, finish_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      toBindValue(data.id),
      toBindValue(data.studentId),
      toBindValue(data.title),
      toBindValue(data.author),
      toBindValue(data.isbn),
      toBindValue(data.status),
      toBindValue(data.startDate),
      toBindValue(data.finishDate),
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  private async applyBookUpdated(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    const data = event.data;

    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      params.push(toBindValue(data.title));
    }
    if (data.author !== undefined) {
      updates.push("author = ?");
      params.push(toBindValue(data.author));
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      params.push(toBindValue(data.status));
    }
    if (data.startDate !== undefined) {
      updates.push("start_date = ?");
      params.push(toBindValue(data.startDate));
    }
    if (data.finishDate !== undefined) {
      updates.push("finish_date = ?");
      params.push(toBindValue(data.finishDate));
    }
    if (data.currentPage !== undefined) {
      updates.push("current_page = ?");
      params.push(toBindValue(data.currentPage));
    }
    if (data.totalPages !== undefined) {
      updates.push("total_pages = ?");
      params.push(toBindValue(data.totalPages));
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      params.push(new Date().toISOString());
      params.push(toBindValue(data.id));

      await db.runAsync(
        `UPDATE books SET ${updates.join(", ")} WHERE id = ?`,
        ...params,
      );
    }
  }

  private async applyBookDeleted(event: SyncEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM books WHERE id = ?`,
      toBindValue(event.data.id),
    );
  }
}
