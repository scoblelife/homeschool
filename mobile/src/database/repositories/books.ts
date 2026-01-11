import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import type { Book, BookWithProgress, StudentBook, CreateBook, UpdateBook, ReadingStatus } from '../../types'

function rowToBook(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    title: row.title as string,
    author: row.author as string | undefined,
    isbn: row.isbn as string | undefined,
    totalPages: row.total_pages as number | undefined,
    readingLevel: row.reading_level as string | undefined,
    genre: row.genre as string | undefined,
    coverImagePath: row.cover_image_path as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function rowToStudentBook(row: Record<string, unknown>): StudentBook {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    bookId: row.book_id as string,
    status: row.status as ReadingStatus,
    currentPage: row.current_page as number,
    startedDate: row.started_date as string | undefined,
    finishedDate: row.finished_date as string | undefined,
    rating: row.rating as number | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getBooks(): Promise<Book[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync('SELECT * FROM books ORDER BY title') as Record<string, unknown>[]
  return rows.map(rowToBook)
}

export async function getBook(id: string): Promise<Book | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', id)
  return row ? rowToBook(row as Record<string, unknown>) : null
}

export async function getBooksWithProgress(studentId: string): Promise<BookWithProgress[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync(`
    SELECT b.*,
           sb.id as sb_id, sb.student_id, sb.status, sb.current_page,
           sb.started_date, sb.finished_date, sb.rating, sb.notes as sb_notes,
           sb.created_at as sb_created_at, sb.updated_at as sb_updated_at
    FROM books b
    LEFT JOIN student_books sb ON b.id = sb.book_id AND sb.student_id = ?
    ORDER BY b.title
  `, studentId) as Record<string, unknown>[]

  return rows.map(row => {
    const book = rowToBook(row)
    const studentProgress = row.sb_id ? {
      id: row.sb_id as string,
      studentId: row.student_id as string,
      bookId: book.id,
      status: (row.status as ReadingStatus) || 'not_started',
      currentPage: (row.current_page as number) || 0,
      startedDate: row.started_date as string | undefined,
      finishedDate: row.finished_date as string | undefined,
      rating: row.rating as number | undefined,
      notes: row.sb_notes as string | undefined,
      createdAt: row.sb_created_at as string,
      updatedAt: row.sb_updated_at as string,
    } : undefined

    return { ...book, studentProgress }
  })
}

export async function createBook(data: CreateBook): Promise<Book> {
  const db = await getDatabase()
  const id = uuid()
  const now = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO books (id, title, author, isbn, total_pages, reading_level, genre, cover_image_path, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.title,
    data.author ?? null,
    data.isbn ?? null,
    data.totalPages ?? null,
    data.readingLevel ?? null,
    data.genre ?? null,
    data.coverImagePath ?? null,
    data.notes ?? null,
    now,
    now
  )

  return (await getBook(id))!
}

export async function updateBook(id: string, data: UpdateBook): Promise<Book> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const current = await getBook(id)
  if (!current) throw new Error(`Book ${id} not found`)

  const updated = { ...current, ...data }

  await db.runAsync(
    `UPDATE books SET title = ?, author = ?, isbn = ?, total_pages = ?, reading_level = ?, genre = ?, cover_image_path = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.author ?? null,
    updated.isbn ?? null,
    updated.totalPages ?? null,
    updated.readingLevel ?? null,
    updated.genre ?? null,
    updated.coverImagePath ?? null,
    updated.notes ?? null,
    now,
    id
  )

  return (await getBook(id))!
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDatabase()
  await db.runAsync('DELETE FROM student_books WHERE book_id = ?', id)
  await db.runAsync('DELETE FROM books WHERE id = ?', id)
}

export async function getStudentBook(studentId: string, bookId: string): Promise<StudentBook | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync(
    'SELECT * FROM student_books WHERE student_id = ? AND book_id = ?',
    studentId, bookId
  )
  return row ? rowToStudentBook(row as Record<string, unknown>) : null
}

export async function updateStudentBook(
  studentId: string,
  bookId: string,
  data: { status?: ReadingStatus; currentPage?: number; rating?: number; notes?: string }
): Promise<StudentBook> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  let existing = await getStudentBook(studentId, bookId)

  if (!existing) {
    // Create new student_book entry
    const id = uuid()
    await db.runAsync(
      `INSERT INTO student_books (id, student_id, book_id, status, current_page, started_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id, studentId, bookId, 'not_started', 0, null, now, now
    )
    existing = await getStudentBook(studentId, bookId)
  }

  const updated = {
    status: data.status ?? existing!.status,
    currentPage: data.currentPage ?? existing!.currentPage,
    rating: data.rating ?? existing!.rating,
    notes: data.notes ?? existing!.notes,
    startedDate: existing!.startedDate,
    finishedDate: existing!.finishedDate,
  }

  // Auto-set dates based on status
  if (data.status === 'reading' && !updated.startedDate) {
    updated.startedDate = now.split('T')[0]
  }
  if (data.status === 'finished' && !updated.finishedDate) {
    updated.finishedDate = now.split('T')[0]
  }

  await db.runAsync(
    `UPDATE student_books SET status = ?, current_page = ?, rating = ?, notes = ?, started_date = ?, finished_date = ?, updated_at = ?
     WHERE student_id = ? AND book_id = ?`,
    updated.status,
    updated.currentPage,
    updated.rating ?? null,
    updated.notes ?? null,
    updated.startedDate ?? null,
    updated.finishedDate ?? null,
    now,
    studentId,
    bookId
  )

  return (await getStudentBook(studentId, bookId))!
}

export async function logReading(
  studentId: string,
  bookId: string,
  pagesRead: number,
  notes?: string
): Promise<StudentBook> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  let existing = await getStudentBook(studentId, bookId)
  const book = await getBook(bookId)

  if (!existing) {
    const id = uuid()
    await db.runAsync(
      `INSERT INTO student_books (id, student_id, book_id, status, current_page, started_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id, studentId, bookId, 'reading', 0, now.split('T')[0], now, now
    )
    existing = await getStudentBook(studentId, bookId)
  }

  const newPage = existing!.currentPage + pagesRead
  const isFinished = book?.totalPages && newPage >= book.totalPages

  await db.runAsync(
    `UPDATE student_books SET
       status = ?,
       current_page = ?,
       notes = ?,
       started_date = COALESCE(started_date, ?),
       finished_date = ?,
       updated_at = ?
     WHERE student_id = ? AND book_id = ?`,
    isFinished ? 'finished' : 'reading',
    isFinished && book?.totalPages ? book.totalPages : newPage,
    notes ?? existing!.notes ?? null,
    now.split('T')[0],
    isFinished ? now.split('T')[0] : null,
    now,
    studentId,
    bookId
  )

  return (await getStudentBook(studentId, bookId))!
}
