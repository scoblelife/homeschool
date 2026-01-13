import { getDatabase } from './connection'
import { milestoneTemplates } from './milestones-data'

async function runMigrations(): Promise<void> {
  const db = await getDatabase()

  // Check if milestones table needs new columns
  try {
    const columns = await db.all(`PRAGMA table_info(milestones)`)
    const columnNames = columns.map((c: Record<string, unknown>) => c.name as string)

    if (!columnNames.includes('template_id')) {
      await db.run(`ALTER TABLE milestones ADD COLUMN template_id VARCHAR`)
    }
    if (!columnNames.includes('category')) {
      await db.run(`ALTER TABLE milestones ADD COLUMN category VARCHAR`)
    }
    if (!columnNames.includes('evidence_notes')) {
      await db.run(`ALTER TABLE milestones ADD COLUMN evidence_notes VARCHAR`)
    }
    if (!columnNames.includes('star_value')) {
      await db.run(`ALTER TABLE milestones ADD COLUMN star_value INTEGER DEFAULT 1`)
    }
  } catch {
    // Table doesn't exist yet, will be created below
  }

  // Add calendar_feed_url to students table
  try {
    const studentColumns = await db.all(`PRAGMA table_info(students)`)
    const studentColumnNames = studentColumns.map((c: Record<string, unknown>) => c.name as string)

    if (!studentColumnNames.includes('calendar_feed_url')) {
      await db.run(`ALTER TABLE students ADD COLUMN calendar_feed_url VARCHAR`)
    }
  } catch {
    // Table doesn't exist yet
  }

  // Add activity_type, start_time, end_time to field_trips table
  try {
    const fieldTripColumns = await db.all(`PRAGMA table_info(field_trips)`)
    const fieldTripColumnNames = fieldTripColumns.map((c: Record<string, unknown>) => c.name as string)

    if (!fieldTripColumnNames.includes('activity_type')) {
      await db.run(`ALTER TABLE field_trips ADD COLUMN activity_type VARCHAR DEFAULT 'field_trip'`)
    }
    if (!fieldTripColumnNames.includes('start_time')) {
      await db.run(`ALTER TABLE field_trips ADD COLUMN start_time VARCHAR`)
    }
    if (!fieldTripColumnNames.includes('end_time')) {
      await db.run(`ALTER TABLE field_trips ADD COLUMN end_time VARCHAR`)
    }
  } catch {
    // Table doesn't exist yet
  }

  // Create field_trip_activities linking table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS field_trip_activities (
      id VARCHAR PRIMARY KEY,
      field_trip_id VARCHAR NOT NULL,
      activity_id VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(field_trip_id, activity_id)
    )
  `)

  // Create coop_groups table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS coop_groups (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      description VARCHAR,
      invite_code VARCHAR NOT NULL UNIQUE,
      created_by VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create coop_members table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS coop_members (
      id VARCHAR PRIMARY KEY,
      group_id VARCHAR NOT NULL,
      family_name VARCHAR NOT NULL,
      email VARCHAR,
      phone VARCHAR,
      role VARCHAR NOT NULL DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create coop_events table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS coop_events (
      id VARCHAR PRIMARY KEY,
      group_id VARCHAR NOT NULL,
      field_trip_id VARCHAR,
      title VARCHAR NOT NULL,
      description VARCHAR,
      location VARCHAR NOT NULL,
      date DATE NOT NULL,
      start_time VARCHAR,
      end_time VARCHAR,
      organizer_id VARCHAR NOT NULL,
      max_attendees INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create coop_sharing_preferences table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS coop_sharing_preferences (
      id VARCHAR PRIMARY KEY,
      group_id VARCHAR NOT NULL UNIQUE,
      share_events BOOLEAN DEFAULT TRUE,
      share_resources BOOLEAN DEFAULT FALSE,
      share_reading_lists BOOLEAN DEFAULT FALSE,
      share_packages BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES coop_groups(id) ON DELETE CASCADE
    )
  `)

  // Create shared_resources table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS shared_resources (
      id VARCHAR PRIMARY KEY,
      group_id VARCHAR NOT NULL,
      shared_by VARCHAR NOT NULL,
      resource_type VARCHAR NOT NULL DEFAULT 'link',
      title VARCHAR NOT NULL,
      description VARCHAR,
      url VARCHAR,
      subject VARCHAR,
      grade_level VARCHAR,
      average_rating DECIMAL(3,2) DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES coop_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (shared_by) REFERENCES coop_members(id) ON DELETE CASCADE
    )
  `)

  // Create resource_ratings table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS resource_ratings (
      id VARCHAR PRIMARY KEY,
      resource_id VARCHAR NOT NULL,
      member_id VARCHAR NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES shared_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES coop_members(id) ON DELETE CASCADE,
      UNIQUE (resource_id, member_id)
    )
  `)

  // Create mentor_profiles table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS mentor_profiles (
      id VARCHAR PRIMARY KEY,
      member_id VARCHAR NOT NULL UNIQUE,
      years_homeschooling INTEGER NOT NULL,
      expertise VARCHAR NOT NULL,
      bio VARCHAR NOT NULL,
      max_mentees INTEGER NOT NULL DEFAULT 3,
      current_mentee_count INTEGER NOT NULL DEFAULT 0,
      is_accepting_requests BOOLEAN DEFAULT TRUE,
      contact_email VARCHAR,
      contact_phone VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES coop_members(id) ON DELETE CASCADE
    )
  `)

  // Create mentor_requests table if it doesn't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS mentor_requests (
      id VARCHAR PRIMARY KEY,
      mentor_id VARCHAR NOT NULL,
      requester_id VARCHAR NOT NULL,
      message VARCHAR NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending',
      response_message VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (requester_id) REFERENCES coop_members(id) ON DELETE CASCADE,
      UNIQUE (mentor_id, requester_id)
    )
  `)
}

export async function initializeSchema(): Promise<void> {
  const db = await getDatabase()

  // Create students table
  await db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      date_of_birth DATE NOT NULL,
      grade_level VARCHAR NOT NULL,
      color VARCHAR NOT NULL DEFAULT 'child1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create subjects table
  await db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      description VARCHAR,
      grade_levels VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create sessions table
  await db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      subject_id VARCHAR NOT NULL REFERENCES subjects(id),
      date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activities table
  await db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id VARCHAR PRIMARY KEY,
      session_id VARCHAR REFERENCES sessions(id),
      student_id VARCHAR NOT NULL REFERENCES students(id),
      subject_id VARCHAR NOT NULL REFERENCES subjects(id),
      activity_type VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      description VARCHAR,
      date_completed DATE NOT NULL,
      duration_minutes INTEGER,
      grade DECIMAL,
      max_grade DECIMAL,
      notes VARCHAR,
      book_title VARCHAR,
      pages_read INTEGER,
      total_pages INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create milestones table
  await db.run(`
    CREATE TABLE IF NOT EXISTS milestones (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      subject_id VARCHAR NOT NULL REFERENCES subjects(id),
      template_id VARCHAR,
      title VARCHAR NOT NULL,
      description VARCHAR,
      category VARCHAR,
      target_date DATE,
      completed_date DATE,
      status VARCHAR NOT NULL DEFAULT 'not_started',
      evidence_notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create milestone templates table
  await db.run(`
    CREATE TABLE IF NOT EXISTS milestone_templates (
      id VARCHAR PRIMARY KEY,
      grade_level VARCHAR NOT NULL,
      subject_id VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      description VARCHAR,
      category VARCHAR,
      sort_order INTEGER DEFAULT 0
    )
  `)

  // Create milestone_resources table
  await db.run(`
    CREATE TABLE IF NOT EXISTS milestone_resources (
      id VARCHAR PRIMARY KEY,
      milestone_id VARCHAR NOT NULL REFERENCES milestones(id),
      type VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      url VARCHAR,
      file_path VARCHAR,
      file_name VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create weekly_plans table
  await db.run(`
    CREATE TABLE IF NOT EXISTS weekly_plans (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      week_start DATE NOT NULL,
      milestone_ids VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create books table (library catalog)
  await db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id VARCHAR PRIMARY KEY,
      title VARCHAR NOT NULL,
      author VARCHAR,
      isbn VARCHAR,
      total_pages INTEGER,
      reading_level VARCHAR,
      genre VARCHAR,
      cover_image_path VARCHAR,
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create student_books table (track reading progress per student)
  await db.run(`
    CREATE TABLE IF NOT EXISTS student_books (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      book_id VARCHAR NOT NULL REFERENCES books(id),
      status VARCHAR NOT NULL DEFAULT 'not_started',
      current_page INTEGER DEFAULT 0,
      started_date DATE,
      finished_date DATE,
      rating INTEGER,
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, book_id)
    )
  `)

  // Create field_trips table
  await db.run(`
    CREATE TABLE IF NOT EXISTS field_trips (
      id VARCHAR PRIMARY KEY,
      title VARCHAR NOT NULL,
      location VARCHAR NOT NULL,
      description VARCHAR,
      date DATE NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'planned',
      student_ids VARCHAR NOT NULL,
      subject_ids VARCHAR NOT NULL,
      cost DECIMAL,
      website_url VARCHAR,
      notes VARCHAR,
      learning_outcomes VARCHAR,
      activity_type VARCHAR DEFAULT 'field_trip',
      start_time VARCHAR,
      end_time VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activity_tasks table
  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_tasks (
      id VARCHAR PRIMARY KEY,
      activity_id VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      description VARCHAR,
      phase VARCHAR NOT NULL DEFAULT 'pre',
      assigned_to VARCHAR,
      due_date DATE,
      completed_at TIMESTAMP,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activity_contacts table
  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_contacts (
      id VARCHAR PRIMARY KEY,
      activity_id VARCHAR NOT NULL,
      name VARCHAR NOT NULL,
      role VARCHAR,
      phone VARCHAR,
      email VARCHAR,
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activity_rsvps table
  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_rsvps (
      id VARCHAR PRIMARY KEY,
      activity_id VARCHAR NOT NULL,
      family_name VARCHAR NOT NULL,
      attending_count INTEGER DEFAULT 0,
      status VARCHAR NOT NULL DEFAULT 'invited',
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activity_expenses table
  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_expenses (
      id VARCHAR PRIMARY KEY,
      activity_id VARCHAR NOT NULL,
      description VARCHAR NOT NULL,
      amount DECIMAL NOT NULL,
      category VARCHAR,
      paid_by VARCHAR,
      expense_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activity_payments table
  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_payments (
      id VARCHAR PRIMARY KEY,
      activity_id VARCHAR NOT NULL,
      family_name VARCHAR NOT NULL,
      amount DECIMAL NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending',
      paid_date DATE,
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create calendar_sync table for tracking Google Calendar sync state
  await db.run(`
    CREATE TABLE IF NOT EXISTS calendar_sync (
      id VARCHAR PRIMARY KEY,
      milestone_id VARCHAR NOT NULL,
      week_start DATE NOT NULL,
      google_event_id VARCHAR NOT NULL,
      calendar_id VARCHAR NOT NULL,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(milestone_id, week_start)
    )
  `)

  // Create user_settings table for app settings (including Google credentials)
  await db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key VARCHAR PRIMARY KEY,
      value VARCHAR NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create subject_chore_mappings table for Skylight integration
  await db.run(`
    CREATE TABLE IF NOT EXISTS subject_chore_mappings (
      id VARCHAR PRIMARY KEY,
      subject_id VARCHAR NOT NULL UNIQUE,
      chore_name VARCHAR NOT NULL,
      default_stars INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create student_rewards table for tracking earned stars
  await db.run(`
    CREATE TABLE IF NOT EXISTS student_rewards (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      milestone_id VARCHAR REFERENCES milestones(id),
      stars_awarded INTEGER NOT NULL,
      awarded_date DATE NOT NULL,
      week_start DATE,
      synced_to_skylight BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create family_goals table for shared family rewards
  await db.run(`
    CREATE TABLE IF NOT EXISTS family_goals (
      id VARCHAR PRIMARY KEY,
      title VARCHAR NOT NULL,
      star_target INTEGER NOT NULL,
      reward_description VARCHAR,
      start_date DATE,
      end_date DATE,
      achieved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create activity_attachments table for photos and files
  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_attachments (
      id VARCHAR PRIMARY KEY,
      activity_id VARCHAR NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      file_path VARCHAR NOT NULL,
      thumbnail_path VARCHAR,
      file_name VARCHAR NOT NULL,
      file_type VARCHAR NOT NULL,
      file_size INTEGER,
      width INTEGER,
      height INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create recurring_activities table for scheduled activity templates
  await db.run(`
    CREATE TABLE IF NOT EXISTS recurring_activities (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      subject_id VARCHAR NOT NULL REFERENCES subjects(id),
      title VARCHAR NOT NULL,
      activity_type VARCHAR NOT NULL,
      duration_minutes INTEGER,
      recurrence_pattern VARCHAR NOT NULL,
      recurrence_days VARCHAR,
      start_time VARCHAR,
      is_active BOOLEAN DEFAULT TRUE,
      last_logged_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create attendance table for tracking school days
  await db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      date DATE NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'school',
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date)
    )
  `)

  // Create activity_standards junction table for curriculum mapping
  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_standards (
      id VARCHAR PRIMARY KEY,
      activity_id VARCHAR NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      standard_id VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(activity_id, standard_id)
    )
  `)

  // Create custom_standards table for user-defined curriculum standards
  await db.run(`
    CREATE TABLE IF NOT EXISTS custom_standards (
      id VARCHAR PRIMARY KEY,
      code VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      description VARCHAR,
      grade_level VARCHAR NOT NULL,
      subject_id VARCHAR NOT NULL,
      domain VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create curriculum_packages table for commercial curriculum products
  await db.run(`
    CREATE TABLE IF NOT EXISTS curriculum_packages (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      publisher VARCHAR,
      subject_ids VARCHAR,
      grade_levels VARCHAR,
      website_url VARCHAR,
      notes VARCHAR,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create assessments table for tracking standardized tests and evaluations
  await db.run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id VARCHAR PRIMARY KEY,
      student_id VARCHAR NOT NULL REFERENCES students(id),
      type VARCHAR NOT NULL,
      name VARCHAR NOT NULL,
      provider VARCHAR,
      date DATE NOT NULL,
      scheduled_time VARCHAR,
      location VARCHAR,
      status VARCHAR NOT NULL DEFAULT 'scheduled',
      score VARCHAR,
      percentile INTEGER,
      grade_equivalent VARCHAR,
      results_url VARCHAR,
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create umbrella_schools table for tracking cover school enrollments
  await db.run(`
    CREATE TABLE IF NOT EXISTS umbrella_schools (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      state VARCHAR NOT NULL,
      contact_name VARCHAR,
      contact_email VARCHAR,
      contact_phone VARCHAR,
      website_url VARCHAR,
      address VARCHAR,
      enrollment_fee DECIMAL,
      annual_fee DECIMAL,
      enrollment_start_date DATE,
      enrollment_end_date DATE,
      report_frequency VARCHAR,
      report_due_day INTEGER,
      requirements_json VARCHAR,
      notes VARCHAR,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create umbrella_school_enrollments table for per-student enrollments
  await db.run(`
    CREATE TABLE IF NOT EXISTS umbrella_school_enrollments (
      id VARCHAR PRIMARY KEY,
      umbrella_school_id VARCHAR NOT NULL REFERENCES umbrella_schools(id),
      student_id VARCHAR NOT NULL REFERENCES students(id),
      student_id_at_school VARCHAR,
      grade_level VARCHAR,
      enrolled_date DATE NOT NULL,
      withdrawn_date DATE,
      status VARCHAR NOT NULL DEFAULT 'active',
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(umbrella_school_id, student_id)
    )
  `)

  // Create umbrella_school_reports table for tracking submitted reports
  await db.run(`
    CREATE TABLE IF NOT EXISTS umbrella_school_reports (
      id VARCHAR PRIMARY KEY,
      umbrella_school_id VARCHAR NOT NULL REFERENCES umbrella_schools(id),
      student_id VARCHAR NOT NULL REFERENCES students(id),
      report_type VARCHAR NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      due_date DATE,
      submitted_date DATE,
      status VARCHAR NOT NULL DEFAULT 'pending',
      content_json VARCHAR,
      file_path VARCHAR,
      notes VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Run migrations for existing databases
  await runMigrations()
}

export async function seedDefaultSubjects(): Promise<void> {
  const db = await getDatabase()

  const allGrades = ['pre-k', '1st', '2nd']
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

  // Insert each subject if it doesn't exist
  for (const subject of subjects) {
    const existing = await db.all('SELECT id FROM subjects WHERE id = ?', subject.id)
    if (existing.length === 0) {
      await db.run(
        `INSERT INTO subjects (id, name, description, grade_levels) VALUES (?, ?, ?, ?)`,
        subject.id,
        subject.name,
        subject.description,
        JSON.stringify(subject.gradeLevels)
      )
    }
  }
}

export async function seedMilestoneTemplates(): Promise<void> {
  const db = await getDatabase()

  // Check if templates already exist
  const result = await db.all<{ count: number }>('SELECT COUNT(*) as count FROM milestone_templates')
  if (result[0].count > 0) return

  let sortOrder = 0
  for (const template of milestoneTemplates) {
    const id = `${template.gradeLevel}-${template.subjectId}-${sortOrder.toString().padStart(3, '0')}`
    await db.run(
      `INSERT INTO milestone_templates (id, grade_level, subject_id, title, description, category, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      template.gradeLevel,
      template.subjectId,
      template.title,
      template.description,
      template.category,
      sortOrder
    )
    sortOrder++
  }
}
