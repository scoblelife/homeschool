import {
  pgTable,
  text,
  timestamp,
  serial,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

export const families = pgTable('families', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const devices = pgTable(
  'devices',
  {
    id: text('id').primaryKey(),
    familyId: text('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    deviceName: text('device_name').notNull(),
    publicKey: text('public_key'),
    lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_devices_family_id').on(table.familyId)],
)

export const syncEvents = pgTable(
  'sync_events',
  {
    id: serial('id').primaryKey(),
    familyId: text('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').notNull(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_sync_events_family_created').on(table.familyId, table.createdAt),
  ],
)
