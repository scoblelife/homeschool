import { Database as DuckDBDatabase } from 'duckdb-async'
import path from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { homedir } from 'os'

// Wrapper to provide a compatible interface
export interface Database {
  all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]>
  run(sql: string, ...params: unknown[]): Promise<void>
  close(): Promise<void>
}

let db: Database | null = null

// Base directory for all app data
export function getAppDataPath(): string {
  if (app.isPackaged) {
    return app.getPath('userData')
  }
  // Dev mode: use ~/.homeschool/
  return path.join(homedir(), '.homeschool')
}

// Path for parquet exports
export function getParquetPath(): string {
  const parquetPath = path.join(getAppDataPath(), 'parquet')
  if (!existsSync(parquetPath)) {
    mkdirSync(parquetPath, { recursive: true })
  }
  return parquetPath
}

export async function getDatabase(): Promise<Database> {
  if (db) return db

  const userDataPath = getAppDataPath()
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }

  const dbPath = path.join(userDataPath, 'homeschool.db')
  const duckdb = await DuckDBDatabase.create(dbPath)

  db = {
    async all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
      return duckdb.all(sql, ...params) as Promise<T[]>
    },
    async run(sql: string, ...params: unknown[]): Promise<void> {
      await duckdb.run(sql, ...params)
    },
    async close(): Promise<void> {
      await duckdb.close()
      db = null
    }
  }

  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close()
  }
}
