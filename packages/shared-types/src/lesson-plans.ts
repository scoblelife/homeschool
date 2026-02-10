import type { ActivityType, GradeLevel } from './enums'

// Lesson Plan status for the web community platform
export type LessonPlanStatus = 'draft' | 'published' | 'archived' | 'flagged' | 'removed'

export interface LessonPlan {
  id: string
  authorId: string
  title: string
  description: string
  gradeLevel: GradeLevel
  subject: string
  activityType: ActivityType
  duration: number // minutes
  materials: string[]
  instructions: string
  objectives: string[]
  status: LessonPlanStatus
  voteCount: number
  viewCount: number
  forkCount: number
  forkedFromId?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export type CreateLessonPlan = Omit<LessonPlan, 'id' | 'voteCount' | 'viewCount' | 'forkCount' | 'publishedAt' | 'createdAt' | 'updatedAt'>
export type UpdateLessonPlan = Partial<Omit<CreateLessonPlan, 'authorId'>>

export interface Tag {
  id: string
  name: string
  slug: string
  usageCount: number
  createdAt: string
}

export interface LessonPlanTag {
  lessonPlanId: string
  tagId: string
}

export interface Vote {
  id: string
  userId: string
  lessonPlanId: string
  createdAt: string
}

export interface Comment {
  id: string
  userId: string
  lessonPlanId: string
  parentCommentId?: string
  content: string
  createdAt: string
  updatedAt: string
}

export type CreateComment = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>

export type ModerationContentType = 'lesson_plan' | 'comment'
export type ModerationResolution = 'approved' | 'removed' | 'warning'

export interface ModerationQueueItem {
  id: string
  contentType: ModerationContentType
  contentId: string
  reportedBy?: string
  reason?: string
  autoFlagged: boolean
  moderatorId?: string
  resolution?: ModerationResolution
  resolvedAt?: string
  createdAt: string
}

export interface Collection {
  id: string
  userId: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CollectionItem {
  id: string
  collectionId: string
  lessonPlanId: string
  addedAt: string
}

export interface WebUser {
  id: string
  displayName: string
  email: string
  isVerified: boolean
  isModerator: boolean
  isBanned: boolean
  createdAt: string
  updatedAt: string
}
