import { getDatabase } from './connection'

export async function initializeSchema(): Promise<void> {
  const db = await getDatabase()

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
  `)

  // Create subjects table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      grade_levels TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

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
  `)

  // Create activities table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      student_id TEXT NOT NULL REFERENCES students(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      activity_type TEXT NOT NULL,
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
  `)

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
  `)

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
  `)

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
  `)

  // Create field_trips table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS field_trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      student_ids TEXT NOT NULL,
      subject_ids TEXT NOT NULL,
      cost REAL,
      website_url TEXT,
      notes TEXT,
      learning_outcomes TEXT,
      activity_type TEXT DEFAULT 'field_trip',
      start_time TEXT,
      end_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activity_tasks table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_tasks (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      phase TEXT NOT NULL DEFAULT 'pre',
      assigned_to TEXT,
      due_date TEXT,
      completed_at TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

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
  `)

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
  `)

  // Seed default subjects if empty
  await seedDefaultSubjects()
}

async function seedDefaultSubjects(): Promise<void> {
  const db = await getDatabase()

  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM subjects')
  if (result && result.count > 0) return

  const allGrades = JSON.stringify(['pre-k', '1st', '2nd'])
  const subjects = [
    { id: 'math', name: 'Mathematics', description: 'Numbers, counting, operations, and problem solving', gradeLevels: allGrades },
    { id: 'reading', name: 'Reading', description: 'Phonics, decoding, fluency, and comprehension', gradeLevels: allGrades },
    { id: 'writing', name: 'Writing', description: 'Handwriting, spelling, and composition', gradeLevels: allGrades },
    { id: 'science', name: 'Science', description: 'Nature, experiments, and discovery', gradeLevels: allGrades },
    { id: 'social-studies', name: 'Social Studies', description: 'Community, geography, and history', gradeLevels: allGrades },
    { id: 'life-skills', name: 'Life Skills', description: 'Self-care, responsibility, and social-emotional development', gradeLevels: allGrades },
    { id: 'physical-ed', name: 'Physical Education', description: 'Gross motor skills, coordination, and fitness', gradeLevels: allGrades },
    { id: 'art-music', name: 'Art & Music', description: 'Creativity, fine motor skills, and music appreciation', gradeLevels: allGrades }
  ]

  for (const subject of subjects) {
    await db.runAsync(
      'INSERT INTO subjects (id, name, description, grade_levels) VALUES (?, ?, ?, ?)',
      subject.id,
      subject.name,
      subject.description,
      subject.gradeLevels
    )
  }
}
