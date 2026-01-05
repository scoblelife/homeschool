# Homeschool Management System - Product Requirements Document

## Overview

A desktop application for managing homeschool education for two children: a 4-year-old (Pre-K) and a 6-year-old (1st Grade), starting from the second half of the 2024-2025 school year.

## Technical Stack

- **Platform**: Electron desktop application (macOS primary)
- **Frontend**: React + TypeScript
- **Database**: DuckDB with Parquet file storage
- **UI Framework**: TBD (Tailwind CSS recommended)

## Users

| Child | Age | Grade Level | Focus Areas |
|-------|-----|-------------|-------------|
| Child 1 | 4 | Pre-K | Pre-reading, motor skills, number recognition, social skills |
| Child 2 | 6 | 1st Grade | Reading fluency, basic math, handwriting (print + cursive intro) |

## Core Subjects

- Mathematics
- Reading
- Writing (Print and Cursive)
- Science
- Social Studies

## Data Model

### Students
- id, name, date_of_birth, grade_level, start_date

### Subjects
- id, name, grade_level, description

### Sessions
A session is a single teaching/learning event.
- id, student_id, subject_id, date, start_time, end_time, type (lesson/practice/assessment), notes, location

### Activities
Individual items completed within or outside sessions.
- id, session_id (nullable), student_id, subject_id, activity_type, title, description, date_completed, duration_minutes, grade (nullable), notes

#### Activity Types
- `worksheet` - printed or digital worksheet
- `video` - educational video watched
- `reading` - book or passage read
- `writing_print` - print handwriting practice
- `writing_cursive` - cursive handwriting practice
- `hands_on` - manipulatives, experiments, crafts
- `game` - educational games
- `assessment` - quiz or test
- `outing` - field trip or educational outing

### Milestones
Learning objectives and developmental markers.
- id, student_id, subject_id, title, description, target_date (nullable), completed_date (nullable), status (not_started/in_progress/completed), evidence_notes

### Outings
Field trips and educational excursions.
- id, title, location, date, students (array), subjects_covered (array), description, learning_objectives, photos_path (nullable)

### Resources
Reusable learning materials.
- id, title, type (book/video/worksheet/website/app), subject_id, grade_levels (array), url (nullable), file_path (nullable), notes

### Grades
Assessment records for reporting.
- id, student_id, subject_id, activity_id, score, max_score, percentage, grade_letter (nullable), date, notes

### Schedule Templates
Recurring weekly schedule patterns.
- id, student_id, day_of_week, start_time, end_time, subject_id, activity_type, notes

## Features

### 1. Dashboard
- Today's schedule for each child
- Recent activity summary
- Upcoming milestones
- Quick-add buttons for common actions

### 2. Calendar View
- Monthly, weekly, and daily views
- Color-coded by subject and child
- Drag-and-drop session scheduling
- Recurring schedule support
- Outing planning

### 3. Session Management
- Log completed sessions with activities
- Timer for tracking duration
- Quick templates for common session types
- Attach resources to sessions

### 4. Activity Tracking
- Log worksheets completed (with optional grade)
- Track videos watched with timestamps
- Reading log with book tracking (title, pages, comprehension notes)
- Writing practice log (distinguish print vs cursive)
- Photo capture for physical work samples

### 5. Milestone Tracking
- Pre-defined milestones by grade level (Pre-K, 1st Grade)
- Custom milestone creation
- Progress indicators
- Link activities as evidence of milestone completion

### 6. Resource Library
- Catalog of books, videos, worksheets, websites
- Organize by subject and grade level
- Track which resources have been used with which child
- Favorites and ratings

### 7. Outing Management
- Plan field trips with learning objectives
- Log completed outings with photos and notes
- Map subjects covered to outings
- Outing ideas database

### 8. Reporting

#### Personal Reports
- Progress by subject over time
- Activity breakdown (time spent per subject)
- Milestone completion status
- Reading log summary
- Writing samples collection

#### Nevada State Compliance
Nevada homeschool requirements:
- File Notice of Intent to Homeschool (one-time, handled outside app)
- No mandatory testing or reporting to state
- Maintain records for your own documentation

The app will generate:
- Annual summary report (hours per subject, activities completed)
- Portfolio-ready documentation
- Attendance record
- Grade report by subject and quarter/semester

### 9. Data Management
- Export to Parquet files for backup
- Import historical data
- Data validation and integrity checks

## User Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Homeschool Manager    [Child1] [Child2]    [⚙️]     │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Dashboard  │                                               │
│  Calendar   │              Main Content Area                │
│  Sessions   │                                               │
│  Activities │                                               │
│  Milestones │                                               │
│  Resources  │                                               │
│  Outings    │                                               │
│  Reports    │                                               │
│             │                                               │
├─────────────┴───────────────────────────────────────────────┤
│  Quick Add: [+ Session] [+ Activity] [+ Reading] [+ Outing] │
└─────────────────────────────────────────────────────────────┘
```

## Grade-Level Specifics

### Pre-K (4-year-old) Focus
- **Math**: Counting 1-20, shapes, colors, patterns, sorting
- **Reading**: Letter recognition, phonemic awareness, sight words intro
- **Writing**: Pencil grip, tracing, letter formation (print only)
- **Science**: Nature observation, seasons, animals, senses
- **Social Studies**: Family, community helpers, basic geography

### 1st Grade (6-year-old) Focus
- **Math**: Addition/subtraction to 20, place value, time, measurement
- **Reading**: Decoding, fluency, comprehension, chapter books intro
- **Writing**: Sentences, capitalization, punctuation, print mastery, cursive intro
- **Science**: Life cycles, matter, weather, simple machines
- **Social Studies**: Maps, US symbols, historical figures, communities

## MVP Scope (Phase 1)

1. Student profiles
2. Basic session logging
3. Activity tracking (all types)
4. Simple calendar view
5. Reading log
6. Writing practice log (print vs cursive)
7. Basic reporting (activity summary)
8. DuckDB/Parquet data persistence

## Phase 2

1. Milestone tracking with grade-level presets
2. Resource library
3. Outing management
4. Advanced calendar with recurring schedules
5. Grade tracking and report cards

## Phase 3

1. Photo/document attachment for work samples
2. Advanced reporting and analytics
3. Data export/import
4. Printable reports for portfolio

## File Structure (Proposed)

```
homeschool/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React frontend
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── stores/
│   ├── database/       # DuckDB operations
│   └── shared/         # Shared types and utilities
├── data/               # DuckDB files and Parquet exports
├── resources/          # Attached files (worksheets, photos)
├── PRD.md
├── CLAUDE.md
└── package.json
```

## Success Metrics

- All sessions logged within 24 hours of completion
- Complete activity records for state documentation if ever requested
- Clear visibility into progress for both children
- Easy generation of end-of-year portfolio/report
