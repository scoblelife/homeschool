import { v4 as uuid } from "uuid";
import { startOfWeek, format } from "date-fns";
import { getDatabase } from "../connection";
import type {
  StudentReward,
  FamilyGoal,
  CreateFamilyGoal,
  UpdateFamilyGoal,
} from "../../types";

// Student Rewards
function rowToReward(row: Record<string, unknown>): StudentReward {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    milestoneId: row.milestone_id as string | null,
    starsAwarded: row.stars_awarded as number,
    awardedDate: row.awarded_date as string,
    weekStart: row.week_start as string | null,
    syncedToSkylight: Boolean(row.synced_to_skylight),
    createdAt: row.created_at as string,
  };
}

export async function getStudentRewards(
  studentId: string,
  weekStart?: string,
): Promise<StudentReward[]> {
  const db = await getDatabase();

  let query = "SELECT * FROM student_rewards WHERE student_id = ?";
  const params: (string | number | null)[] = [studentId];

  if (weekStart) {
    query += " AND week_start = ?";
    params.push(weekStart);
  }

  query += " ORDER BY awarded_date DESC";

  const rows = (await db.getAllAsync(query, ...params)) as Record<
    string,
    unknown
  >[];
  return rows.map(rowToReward);
}

export async function getStudentStarTotals(
  studentId: string,
): Promise<{ weeklyTotal: number; allTimeTotal: number }> {
  const db = await getDatabase();

  const currentWeekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );

  const weeklyResult = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(stars_awarded) as total FROM student_rewards WHERE student_id = ? AND week_start = ?",
    studentId,
    currentWeekStart,
  );

  const allTimeResult = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(stars_awarded) as total FROM student_rewards WHERE student_id = ?",
    studentId,
  );

  return {
    weeklyTotal: weeklyResult?.total ?? 0,
    allTimeTotal: allTimeResult?.total ?? 0,
  };
}

export async function createReward(
  data: Omit<StudentReward, "id" | "createdAt">,
): Promise<StudentReward> {
  const db = await getDatabase();
  const id = uuid();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO student_rewards (id, student_id, milestone_id, stars_awarded, awarded_date, week_start, synced_to_skylight, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.milestoneId ?? null,
    data.starsAwarded,
    data.awardedDate,
    data.weekStart ?? null,
    data.syncedToSkylight ? 1 : 0,
    now,
  );

  const row = await db.getFirstAsync(
    "SELECT * FROM student_rewards WHERE id = ?",
    id,
  );
  return rowToReward(row as Record<string, unknown>);
}

// Family Goals
function rowToFamilyGoal(row: Record<string, unknown>): FamilyGoal {
  return {
    id: row.id as string,
    title: row.title as string,
    starTarget: row.star_target as number,
    rewardDescription: row.reward_description as string | null,
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    achievedAt: row.achieved_at as string | null,
    createdAt: row.created_at as string,
  };
}

export async function getFamilyGoals(): Promise<FamilyGoal[]> {
  const db = await getDatabase();
  const rows = (await db.getAllAsync(
    "SELECT * FROM family_goals ORDER BY created_at DESC",
  )) as Record<string, unknown>[];
  return rows.map(rowToFamilyGoal);
}

export async function getActiveFamilyGoal(): Promise<FamilyGoal | null> {
  const db = await getDatabase();
  const today = format(new Date(), "yyyy-MM-dd");

  const row = await db.getFirstAsync(
    `SELECT * FROM family_goals
     WHERE achieved_at IS NULL
       AND (start_date IS NULL OR start_date <= ?)
       AND (end_date IS NULL OR end_date >= ?)
     ORDER BY created_at DESC
     LIMIT 1`,
    today,
    today,
  );

  return row ? rowToFamilyGoal(row as Record<string, unknown>) : null;
}

export async function createFamilyGoal(
  data: CreateFamilyGoal,
): Promise<FamilyGoal> {
  const db = await getDatabase();
  const id = uuid();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO family_goals (id, title, star_target, reward_description, start_date, end_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.title,
    data.starTarget,
    data.rewardDescription ?? null,
    data.startDate ?? null,
    data.endDate ?? null,
    now,
  );

  const row = await db.getFirstAsync(
    "SELECT * FROM family_goals WHERE id = ?",
    id,
  );
  return rowToFamilyGoal(row as Record<string, unknown>);
}

export async function updateFamilyGoal(
  id: string,
  data: UpdateFamilyGoal,
): Promise<FamilyGoal> {
  const db = await getDatabase();

  const current = await db.getFirstAsync(
    "SELECT * FROM family_goals WHERE id = ?",
    id,
  );
  if (!current) throw new Error(`Family goal ${id} not found`);

  const goal = rowToFamilyGoal(current as Record<string, unknown>);
  const updated = { ...goal, ...data };

  await db.runAsync(
    `UPDATE family_goals SET title = ?, star_target = ?, reward_description = ?, start_date = ?, end_date = ?
     WHERE id = ?`,
    updated.title,
    updated.starTarget,
    updated.rewardDescription ?? null,
    updated.startDate ?? null,
    updated.endDate ?? null,
    id,
  );

  const row = await db.getFirstAsync(
    "SELECT * FROM family_goals WHERE id = ?",
    id,
  );
  return rowToFamilyGoal(row as Record<string, unknown>);
}

export async function achieveFamilyGoal(id: string): Promise<FamilyGoal> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    "UPDATE family_goals SET achieved_at = ? WHERE id = ?",
    now,
    id,
  );

  const row = await db.getFirstAsync(
    "SELECT * FROM family_goals WHERE id = ?",
    id,
  );
  return rowToFamilyGoal(row as Record<string, unknown>);
}

export async function getFamilyTotalStars(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(stars_awarded) as total FROM student_rewards",
  );
  return result?.total ?? 0;
}
