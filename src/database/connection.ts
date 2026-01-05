import initSqlJs, { Database as SqlJsDatabase, BindParams } from 'sql.js'
import path from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'

// Wrapper to provide a compatible interface
export interface Database {
  all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]>
  run(sql: string, ...params: unknown[]): Promise<void>
  close(): Promise<void>
}

let db: Database | null = null
let sqliteDb: SqlJsDatabase | null = null
let dbPath: string | null = null

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

  dbPath = path.join(userDataPath, 'homeschool.db')

  // Initialize SQL.js
  const SQL = await initSqlJs()

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath)
    sqliteDb = new SQL.Database(fileBuffer)
  } else {
    sqliteDb = new SQL.Database()
  }

  db = {
    async all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
      if (!sqliteDb) throw new Error('Database not connected')

      try {
        const stmt = sqliteDb.prepare(sql)
        if (params.length > 0) {
          stmt.bind(params as BindParams)
        }

        const results: T[] = []
        while (stmt.step()) {
          const row = stmt.getAsObject() as T
          results.push(row)
        }
        stmt.free()
        return results
      } catch (err) {
        console.error('SQL error:', sql, params, err)
        throw err
      }
    },
    async run(sql: string, ...params: unknown[]): Promise<void> {
      if (!sqliteDb) throw new Error('Database not connected')

      try {
        if (params.length > 0) {
          sqliteDb.run(sql, params as BindParams)
        } else {
          sqliteDb.run(sql)
        }
        // Save after writes
        saveDatabase()
      } catch (err) {
        console.error('SQL error:', sql, params, err)
        throw err
      }
    },
    async close(): Promise<void> {
      saveDatabase()
      if (sqliteDb) {
        sqliteDb.close()
        sqliteDb = null
      }
      db = null
    }
  }

  return db
}

function saveDatabase(): void {
  if (!sqliteDb || !dbPath) return

  try {
    const data = sqliteDb.export()
    const buffer = Buffer.from(data)
    writeFileSync(dbPath, buffer)
  } catch (err) {
    console.error('Failed to save database:', err)
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close()
  }
}
