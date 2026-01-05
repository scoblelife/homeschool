import { useState, useEffect, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import { useStore } from '../stores/useStore'
import type { Book, BookWithProgress, CreateBook, UpdateStudentBook, ReadingStatus } from '../../../shared/types'

type StatusFilter = 'all' | 'not_started' | 'reading' | 'finished'

const statusLabels: Record<ReadingStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600', bg: 'bg-gray-100' },
  reading: { label: 'Reading', color: 'text-blue-600', bg: 'bg-blue-100' },
  finished: { label: 'Finished', color: 'text-green-600', bg: 'bg-green-100' }
}

function BookCard({
  book,
  studentId,
  onEdit,
  onDelete,
  onUpdateProgress,
  onLogReading
}: {
  book: BookWithProgress
  studentId: string | null
  onEdit: () => void
  onDelete: () => void
  onUpdateProgress: (data: UpdateStudentBook) => void
  onLogReading: () => void
}) {
  const progress = book.studentProgress
  const status = progress?.status || 'not_started'
  const currentPage = progress?.currentPage || 0
  const statusInfo = statusLabels[status]
  const progressPercent = book.totalPages ? Math.round((currentPage / book.totalPages) * 100) : 0

  return (
    <div className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Book cover placeholder */}
        <div className="w-16 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded flex items-center justify-center text-2xl flex-shrink-0">
          {book.coverImagePath ? (
            <img src={book.coverImagePath} alt={book.title} className="w-full h-full object-cover rounded" />
          ) : (
            '📚'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
              {book.author && <p className="text-sm text-gray-500">{book.author}</p>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            {book.readingLevel && (
              <span className="bg-gray-100 px-2 py-0.5 rounded">{book.readingLevel}</span>
            )}
            {book.genre && (
              <span className="bg-gray-100 px-2 py-0.5 rounded">{book.genre}</span>
            )}
            {book.totalPages && (
              <span className="bg-gray-100 px-2 py-0.5 rounded">{book.totalPages} pages</span>
            )}
          </div>

          {/* Progress bar */}
          {studentId && book.totalPages && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Page {currentPage} of {book.totalPages}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {studentId && (
              <>
                <select
                  value={status}
                  onChange={(e) => onUpdateProgress({ status: e.target.value as ReadingStatus })}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="not_started">Not Started</option>
                  <option value="reading">Reading</option>
                  <option value="finished">Finished</option>
                </select>
                {status !== 'finished' && book.totalPages && (
                  <button
                    onClick={onLogReading}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    Log Reading
                  </button>
                )}
              </>
            )}
            <button
              onClick={onEdit}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>

          {/* Rating */}
          {progress?.rating && (
            <div className="mt-2 text-sm">
              {'⭐'.repeat(progress.rating)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Library(): JSX.Element {
  const { selectedStudentId, getSelectedStudent } = useStore()
  const selectedStudent = getSelectedStudent()
  const [books, setBooks] = useState<BookWithProgress[]>([])
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [showAddBook, setShowAddBook] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [loggingBook, setLoggingBook] = useState<BookWithProgress | null>(null)
  const [logPagesRead, setLogPagesRead] = useState('')
  const [logNotes, setLogNotes] = useState('')

  const [formData, setFormData] = useState<CreateBook>({
    title: '',
    author: '',
    isbn: '',
    totalPages: undefined,
    readingLevel: '',
    genre: '',
    notes: ''
  })

  const loadBooks = async () => {
    if (selectedStudentId) {
      const data = await window.api.getBooksWithProgress(selectedStudentId)
      setBooks(data)
    } else {
      const data = await window.api.getBooks()
      setBooks(data.map(book => ({ ...book })))
    }
  }

  useEffect(() => {
    loadBooks()
  }, [selectedStudentId])

  const filteredBooks = useMemo(() => {
    let filtered = books

    if (filterStatus !== 'all') {
      filtered = filtered.filter((b) => {
        const status = b.studentProgress?.status || 'not_started'
        return status === filterStatus
      })
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author?.toLowerCase().includes(query) ||
          b.genre?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [books, filterStatus, searchQuery])

  const stats = useMemo(() => {
    const total = books.length
    const finished = books.filter((b) => b.studentProgress?.status === 'finished').length
    const reading = books.filter((b) => b.studentProgress?.status === 'reading').length
    const notStarted = books.filter((b) => !b.studentProgress || b.studentProgress.status === 'not_started').length
    return { total, finished, reading, notStarted }
  }, [books])

  const openAddModal = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      totalPages: undefined,
      readingLevel: '',
      genre: '',
      notes: ''
    })
    setShowAddBook(true)
  }

  const openEditModal = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || '',
      totalPages: book.totalPages,
      readingLevel: book.readingLevel || '',
      genre: book.genre || '',
      notes: book.notes || ''
    })
  }

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return

    const bookData: CreateBook = {
      ...formData,
      totalPages: formData.totalPages || undefined
    }

    if (editingBook) {
      await window.api.updateBook(editingBook.id, bookData)
      setEditingBook(null)
    } else {
      await window.api.createBook(bookData)
      setShowAddBook(false)
    }

    loadBooks()
  }

  const handleDeleteBook = async (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      await window.api.deleteBook(id)
      loadBooks()
    }
  }

  const handleUpdateProgress = async (bookId: string, data: UpdateStudentBook) => {
    if (!selectedStudentId) return
    await window.api.updateStudentBook(selectedStudentId, bookId, data)
    loadBooks()
  }

  const openLogReading = (book: BookWithProgress) => {
    setLoggingBook(book)
    setLogPagesRead('')
    setLogNotes('')
  }

  const handleLogReading = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loggingBook || !selectedStudentId || !logPagesRead) return

    await window.api.logReading(
      selectedStudentId,
      loggingBook.id,
      parseInt(logPagesRead),
      logNotes || undefined
    )
    setLoggingBook(null)
    loadBooks()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          {selectedStudent && (
            <p className="text-sm text-gray-500 mt-1">{selectedStudent.name}'s Reading Progress</p>
          )}
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          + Add Book
        </button>
      </div>

      {/* Stats */}
      {selectedStudentId && (
        <div className="card mb-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Books</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.finished}</div>
              <div className="text-sm text-gray-500">Finished</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.reading}</div>
              <div className="text-sm text-gray-500">Reading</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{stats.notStarted}</div>
              <div className="text-sm text-gray-500">Not Started</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
            className="input"
          />
        </div>

        {selectedStudentId && (
          <div className="flex gap-1">
            {(['all', 'not_started', 'reading', 'finished'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all'
                  ? 'All'
                  : status === 'not_started'
                    ? 'Not Started'
                    : status === 'reading'
                      ? 'Reading'
                      : 'Finished'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {books.length === 0
              ? 'No books in your library yet. Add your first book!'
              : 'No books match your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              studentId={selectedStudentId}
              onEdit={() => openEditModal(book)}
              onDelete={() => handleDeleteBook(book.id)}
              onUpdateProgress={(data) => handleUpdateProgress(book.id, data)}
              onLogReading={() => openLogReading(book)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Book Modal */}
      <Dialog
        open={showAddBook || !!editingBook}
        onClose={() => {
          setShowAddBook(false)
          setEditingBook(null)
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editingBook ? 'Edit Book' : 'Add Book'}
            </Dialog.Title>

            <form onSubmit={handleSubmitBook} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Pages</label>
                  <input
                    type="number"
                    value={formData.totalPages || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalPages: e.target.value ? parseInt(e.target.value) : undefined
                      })
                    }
                    className="input"
                    min="1"
                  />
                </div>

                <div>
                  <label className="label">Reading Level</label>
                  <input
                    type="text"
                    value={formData.readingLevel}
                    onChange={(e) => setFormData({ ...formData, readingLevel: e.target.value })}
                    className="input"
                    placeholder="e.g., Level 2, AR 2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Genre</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="input"
                    placeholder="e.g., Fiction, Science"
                  />
                </div>

                <div>
                  <label className="label">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBook(false)
                    setEditingBook(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBook ? 'Save Changes' : 'Add Book'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Log Reading Modal */}
      <Dialog
        open={!!loggingBook}
        onClose={() => setLoggingBook(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Log Reading
            </Dialog.Title>

            {loggingBook && (
              <form onSubmit={handleLogReading} className="space-y-4">
                <div>
                  <p className="text-gray-700 font-medium">{loggingBook.title}</p>
                  <p className="text-sm text-gray-500">
                    Currently on page {loggingBook.studentProgress?.currentPage || 0}
                    {loggingBook.totalPages && ` of ${loggingBook.totalPages}`}
                  </p>
                </div>

                <div>
                  <label className="label">Pages Read</label>
                  <input
                    type="number"
                    value={logPagesRead}
                    onChange={(e) => setLogPagesRead(e.target.value)}
                    className="input"
                    min="1"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="What happened in the story? New words learned?"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setLoggingBook(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Log Reading
                  </button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
