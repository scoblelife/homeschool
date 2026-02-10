// Universal status for all trackable entities (milestones, field trips, reading, assessments)
export type UniversalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled'

// Activity types supported by the system (consolidated from 9 to 6)
export type ActivityType =
  | 'worksheet'
  | 'video'
  | 'reading'
  | 'writing'        // MERGED: was writing_print + writing_cursive
  | 'hands_on'
  | 'interactive'    // MERGED: was game + assessment + field_trip

// Event category for field trips (replaces EventActivityType)
export type EventCategory = 'educational' | 'social' | 'coop'

export type GradeLevel = 'pre-k' | 'k' | '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th'

// Reading status (subset of UniversalStatus - 'reading' mapped to 'in_progress', 'finished' to 'completed')
export type ReadingStatus = 'not_started' | 'in_progress' | 'completed'

// Assessments
export type AssessmentType = 'standardized_test' | 'evaluation' | 'portfolio_review' | 'progress_assessment' | 'other'

// Recurring Activities
export type RecurrencePattern = 'daily' | 'weekdays' | 'weekly' | 'custom'

// Activity Tasks
export type TaskPhase = 'before' | 'during' | 'after'

// Activity Contacts
export type ContactRole = 'venue' | 'coordinator' | 'emergency'

// Activity RSVPs
export type RSVPStatus = 'yes' | 'no' | 'maybe'

// Activity Expenses
export type ExpenseCategory = 'admission' | 'food' | 'materials' | 'travel'

// Activity Payments
export type PaymentStatus = 'pending' | 'paid' | 'partial'

// Attendance
export type AttendanceStatus = 'present' | 'absent' | 'holiday'

// Curriculum Mapping
export type StandardSet = 'common-core' | 'custom'

// Co-op
export type CoopMemberRole = 'organizer' | 'member'
export type SharedResourceType = 'link' | 'template' | 'curriculum' | 'book' | 'other'
export type MentorExpertise = 'new_to_homeschool' | 'curriculum' | 'special_needs' | 'high_school' | 'college_prep' | 'organization' | 'legal' | 'other'
export type MentorRequestStatus = 'pending' | 'accepted' | 'declined'

// Umbrella Schools
export type UmbrellaReportFrequency = 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'annual'
export type UmbrellaEnrollmentStatus = 'active' | 'withdrawn' | 'pending'
export type UmbrellaReportStatus = 'pending' | 'submitted' | 'approved' | 'rejected'
export type UmbrellaReportType = 'attendance' | 'progress' | 'grades' | 'annual_summary' | 'custom'

// Sponsorship
export type SponsorTier = 'basic' | 'premium' | 'enterprise'
export type SponsoredLocation = 'resources_page' | 'dashboard' | 'curriculum_page' | 'learning_log'

// Sync
export type SyncState = 'synced' | 'syncing' | 'offline' | 'error'
