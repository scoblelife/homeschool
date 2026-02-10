import { getDatabase } from "./connection";

export async function initializeSchema(): Promise<void> {
  const db = await getDatabase();

  // Create students table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'child1',
      calendar_feed_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create subjects table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      grade_levels TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create sessions table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create activities table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      student_id TEXT NOT NULL REFERENCES students(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      activity_type TEXT NOT NULL,
      activity_sub_type TEXT,
      title TEXT NOT NULL,
      description TEXT,
      date_completed TEXT NOT NULL,
      duration_minutes INTEGER,
      grade REAL,
      max_grade REAL,
      notes TEXT,
      book_title TEXT,
      pages_read INTEGER,
      total_pages INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create milestones table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      template_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      target_date TEXT,
      completed_date TEXT,
      status TEXT NOT NULL DEFAULT 'not_started',
      evidence_notes TEXT,
      star_value INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create books table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      isbn TEXT,
      total_pages INTEGER,
      reading_level TEXT,
      genre TEXT,
      cover_image_path TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create student_books table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS student_books (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      book_id TEXT NOT NULL REFERENCES books(id),
      status TEXT NOT NULL DEFAULT 'not_started',
      current_page INTEGER DEFAULT 0,
      started_date TEXT,
      finished_date TEXT,
      rating INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, book_id)
    )
  `);

  // Create field_trips table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS field_trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started',
      student_ids TEXT NOT NULL,
      subject_ids TEXT NOT NULL,
      cost REAL,
      website_url TEXT,
      notes TEXT,
      learning_outcomes TEXT,
      activity_type TEXT DEFAULT 'educational',
      event_category TEXT DEFAULT 'educational',
      start_time TEXT,
      end_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create activity_tasks table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_tasks (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      phase TEXT NOT NULL DEFAULT 'before',
      assigned_to TEXT,
      due_date TEXT,
      completed_at TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create student_rewards table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS student_rewards (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      milestone_id TEXT REFERENCES milestones(id),
      stars_awarded INTEGER NOT NULL,
      awarded_date TEXT NOT NULL,
      week_start TEXT,
      synced_to_skylight INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create family_goals table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS family_goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      star_target INTEGER NOT NULL,
      reward_description TEXT,
      start_date TEXT,
      end_date TEXT,
      achieved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default subjects if empty
  await seedDefaultSubjects();

  // Run type consolidation migration
  await migrateTypeConsolidation();
}

async function seedDefaultSubjects(): Promise<void> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM subjects",
  );
  if (result && result.count > 0) return;

  const allGrades = JSON.stringify(["pre-k", "1st", "2nd"]);
  const subjects = [
    {
      id: "math",
      name: "Mathematics",
      description: "Numbers, counting, operations, and problem solving",
      gradeLevels: allGrades,
    },
    {
      id: "reading",
      name: "Reading",
      description: "Phonics, decoding, fluency, and comprehension",
      gradeLevels: allGrades,
    },
    {
      id: "writing",
      name: "Writing",
      description: "Handwriting, spelling, and composition",
      gradeLevels: allGrades,
    },
    {
      id: "science",
      name: "Science",
      description: "Nature, experiments, and discovery",
      gradeLevels: allGrades,
    },
    {
      id: "social-studies",
      name: "Social Studies",
      description: "Community, geography, and history",
      gradeLevels: allGrades,
    },
    {
      id: "life-skills",
      name: "Life Skills",
      description:
        "Self-care, responsibility, and social-emotional development",
      gradeLevels: allGrades,
    },
    {
      id: "physical-ed",
      name: "Physical Education",
      description: "Gross motor skills, coordination, and fitness",
      gradeLevels: allGrades,
    },
    {
      id: "art-music",
      name: "Art & Music",
      description: "Creativity, fine motor skills, and music appreciation",
      gradeLevels: allGrades,
    },
  ];

  for (const subject of subjects) {
    await db.runAsync(
      "INSERT INTO subjects (id, name, description, grade_levels) VALUES (?, ?, ?, ?)",
      subject.id,
      subject.name,
      subject.description,
      subject.gradeLevels,
    );
  }
}

/**
 * Migration: Consolidate activity types, field trip statuses, and event types
 * to match desktop's unified type system.
 *
 * Activity types: writing_print/writing_cursive → writing (with activity_sub_type)
 *                 game/assessment/field_trip → interactive (with activity_sub_type)
 * Field trip status: planned → not_started
 * Event types: field_trip/park_day/game_night/playdate/coop_class/custom → educational/social/coop
 * Task phases: pre → before, day_of → during, post → after
 * Reading status: reading → in_progress, finished → completed
 */
async function migrateTypeConsolidation(): Promise<void> {
  const db = await getDatabase();

  // Check if migration has already run by looking for a marker
  const migrationCheck = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM activities WHERE activity_type IN ('writing_print', 'writing_cursive', 'game', 'assessment', 'field_trip')",
  );

  // Also add activity_sub_type column if it doesn't exist
  try {
    await db.execAsync(
      "ALTER TABLE activities ADD COLUMN activity_sub_type TEXT",
    );
  } catch {
    // Column already exists, ignore
  }

  // Also add event_category column if it doesn't exist
  try {
    await db.execAsync(
      "ALTER TABLE field_trips ADD COLUMN event_category TEXT DEFAULT 'educational'",
    );
  } catch {
    // Column already exists, ignore
  }

  if (migrationCheck && migrationCheck.count > 0) {
    // Migrate activity types
    // writing_print → writing with sub_type 'print'
    await db.runAsync(
      "UPDATE activities SET activity_sub_type = 'print', activity_type = 'writing' WHERE activity_type = 'writing_print'",
    );
    // writing_cursive → writing with sub_type 'cursive'
    await db.runAsync(
      "UPDATE activities SET activity_sub_type = 'cursive', activity_type = 'writing' WHERE activity_type = 'writing_cursive'",
    );
    // game → interactive with sub_type 'game'
    await db.runAsync(
      "UPDATE activities SET activity_sub_type = 'game', activity_type = 'interactive' WHERE activity_type = 'game'",
    );
    // assessment → interactive with sub_type 'test'
    await db.runAsync(
      "UPDATE activities SET activity_sub_type = 'test', activity_type = 'interactive' WHERE activity_type = 'assessment'",
    );
    // field_trip → interactive with sub_type 'event'
    await db.runAsync(
      "UPDATE activities SET activity_sub_type = 'event', activity_type = 'interactive' WHERE activity_type = 'field_trip'",
    );
  }

  // Migrate field trip statuses: planned → not_started
  await db.runAsync(
    "UPDATE field_trips SET status = 'not_started' WHERE status = 'planned'",
  );

  // Migrate event types to event categories
  // Map old activity_type values to new event_category
  await db.runAsync(
    "UPDATE field_trips SET event_category = 'educational' WHERE activity_type IN ('field_trip', 'custom') AND (event_category IS NULL OR event_category = 'educational')",
  );
  await db.runAsync(
    "UPDATE field_trips SET event_category = 'social' WHERE activity_type IN ('park_day', 'game_night', 'playdate') AND (event_category IS NULL OR event_category NOT IN ('educational', 'social', 'coop'))",
  );
  await db.runAsync(
    "UPDATE field_trips SET event_category = 'coop' WHERE activity_type = 'coop_class' AND (event_category IS NULL OR event_category NOT IN ('educational', 'social', 'coop'))",
  );

  // Migrate task phases: pre → before, day_of → during, post → after
  await db.runAsync(
    "UPDATE activity_tasks SET phase = 'before' WHERE phase = 'pre'",
  );
  await db.runAsync(
    "UPDATE activity_tasks SET phase = 'during' WHERE phase = 'day_of'",
  );
  await db.runAsync(
    "UPDATE activity_tasks SET phase = 'after' WHERE phase = 'post'",
  );

  // Migrate reading status: reading → in_progress, finished → completed
  await db.runAsync(
    "UPDATE student_books SET status = 'in_progress' WHERE status = 'reading'",
  );
  await db.runAsync(
    "UPDATE student_books SET status = 'completed' WHERE status = 'finished'",
  );
}
