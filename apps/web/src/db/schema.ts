import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  isVerified: boolean('is_verified').notNull().default(false),
  isModerator: boolean('is_moderator').notNull().default(false),
  isBanned: boolean('is_banned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const lessonPlans = pgTable(
  'lesson_plans',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    gradeLevel: varchar('grade_level', { length: 50 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    activityType: varchar('activity_type', { length: 50 }).notNull(),
    duration: integer('duration').notNull(),
    materials: text('materials').array().notNull().default([]),
    instructions: text('instructions').notNull(),
    objectives: text('objectives').array().notNull().default([]),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    voteCount: integer('vote_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    forkCount: integer('fork_count').notNull().default(0),
    forkedFromId: text('forked_from_id'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_lesson_plans_author').on(table.authorId),
    index('idx_lesson_plans_status').on(table.status),
    index('idx_lesson_plans_grade_level').on(table.gradeLevel),
    index('idx_lesson_plans_subject').on(table.subject),
    index('idx_lesson_plans_vote_count').on(table.voteCount),
    index('idx_lesson_plans_published_at').on(table.publishedAt),
  ]
)

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const lessonPlanTags = pgTable(
  'lesson_plan_tags',
  {
    lessonPlanId: text('lesson_plan_id')
      .notNull()
      .references(() => lessonPlans.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('idx_lesson_plan_tags_unique').on(
      table.lessonPlanId,
      table.tagId
    ),
  ]
)

export const votes = pgTable(
  'votes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    lessonPlanId: text('lesson_plan_id')
      .notNull()
      .references(() => lessonPlans.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_votes_user_plan').on(table.userId, table.lessonPlanId),
  ]
)

export const comments = pgTable(
  'comments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    lessonPlanId: text('lesson_plan_id')
      .notNull()
      .references(() => lessonPlans.id, { onDelete: 'cascade' }),
    parentCommentId: text('parent_comment_id'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_comments_lesson_plan').on(table.lessonPlanId),
    index('idx_comments_parent').on(table.parentCommentId),
  ]
)

export const moderationQueue = pgTable(
  'moderation_queue',
  {
    id: text('id').primaryKey(),
    contentType: varchar('content_type', { length: 50 }).notNull(),
    contentId: text('content_id').notNull(),
    reportedBy: text('reported_by').references(() => users.id),
    reason: text('reason'),
    autoFlagged: boolean('auto_flagged').notNull().default(false),
    moderatorId: text('moderator_id').references(() => users.id),
    resolution: varchar('resolution', { length: 20 }),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_moderation_queue_content').on(
      table.contentType,
      table.contentId
    ),
    index('idx_moderation_queue_unresolved').on(table.resolution),
  ]
)

export const collections = pgTable(
  'collections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_collections_user').on(table.userId)]
)

export const collectionItems = pgTable(
  'collection_items',
  {
    id: text('id').primaryKey(),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    lessonPlanId: text('lesson_plan_id')
      .notNull()
      .references(() => lessonPlans.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_collection_items_unique').on(
      table.collectionId,
      table.lessonPlanId
    ),
  ]
)
