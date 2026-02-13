import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('[DB] DATABASE_URL not set — PostgreSQL features disabled')
}

const client = connectionString ? postgres(connectionString) : null

export const db = client ? drizzle(client, { schema }) : null
