import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db

  db = await SQLite.openDatabaseAsync('homeschool.db')
  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync()
    db = null
  }
}
