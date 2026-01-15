import { useState, useEffect, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { useStore } from "../stores/useStore";
import ScannerModal from "../components/ScannerModal";
import type {
  Book,
  BookWithProgress,
  CreateBook,
  UpdateStudentBook,
  ReadingStatus,
} from "../../../shared/types";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

type StatusFilter = "all" | "not_started" | "reading" | "finished";

const statusLabels: Record<
  ReadingStatus,
  { label: string; color: string; bg: string }
> = {
  not_started: {
    label: "Not Started",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  reading: { label: "Reading", color: "text-blue-600", bg: "bg-blue-100" },
  finished: { label: "Finished", color: "text-green-600", bg: "bg-green-100" },
};

function BookCard({
  book,
  studentId,
  onEdit,
  onDelete,
  onUpdateProgress,
  onLogReading,
}: {
  book: BookWithProgress;
  studentId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateProgress: (data: UpdateStudentBook) => void;
  onLogReading: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const progress = book.studentProgress;
  const status = progress?.status || "not_started";
  const currentPage = progress?.currentPage || 0;
  const statusInfo = statusLabels[status];
  const progressPercent = book.totalPages
    ? Math.round((currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div className="group rounded-xl bg-white border border-gray-200 hover:border-fuchsia-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Cover Image Section */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-fuchsia-100 via-purple-50 to-pink-100">
        {book.coverImagePath ? (
          <img
            src={`file://${book.coverImagePath}`}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = target.parentElement?.querySelector(
                ".cover-fallback",
              ) as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="cover-fallback absolute inset-0 items-center justify-center text-5xl"
          style={{ display: book.coverImagePath ? "none" : "flex" }}
        >
          📚
        </div>

        {/* Status Badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
        >
          {statusInfo.label}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            {studentId && status !== "finished" && book.totalPages && (
              <button
                onClick={onLogReading}
                className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors shadow-lg"
              >
                Log Reading
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2 bg-white rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shadow-lg"
              title="Edit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Ring for books being read */}
        {studentId && status === "reading" && book.totalPages && (
          <div className="absolute bottom-2 left-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <svg className="w-8 h-8 -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeDasharray={`${progressPercent * 0.754} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-fuchsia-600">
              {progressPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Book Info Section */}
      <div className="p-3">
        <h3
          className="font-semibold text-gray-900 leading-tight line-clamp-2 mb-1"
          title={book.title}
        >
          {book.title}
        </h3>
        {book.author && (
          <p className="text-sm text-gray-500 truncate">{book.author}</p>
        )}

        {/* Metadata Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {book.totalPages && (
            <span className="text-xs text-gray-400">
              {book.totalPages} pages
            </span>
          )}
          {book.totalPages && (book.genre || book.readingLevel) && (
            <span className="text-xs text-gray-300">•</span>
          )}
          {book.genre && (
            <span className="text-xs text-gray-400">{book.genre}</span>
          )}
          {book.readingLevel && (
            <span className="text-xs px-1.5 py-0.5 bg-fuchsia-50 text-fuchsia-600 rounded">
              {book.readingLevel}
            </span>
          )}
        </div>

        {/* Student Progress Section */}
        {studentId && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {book.totalPages && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Page {currentPage}</span>
                  <span>{book.totalPages}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      status === "finished" ? "bg-green-500" : "bg-fuchsia-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <select
                value={status}
                onChange={(e) =>
                  onUpdateProgress({ status: e.target.value as ReadingStatus })
                }
                className="text-xs border-0 bg-gray-100 rounded-lg px-2 py-1.5 text-gray-700 focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="not_started">Not Started</option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
              </select>

              {/* More Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                      <button
                        onClick={() => {
                          onEdit();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <a
                        href={
                          book.isbn
                            ? `https://www.goodreads.com/search?q=${encodeURIComponent(book.isbn)}`
                            : `https://www.goodreads.com/search?q=${encodeURIComponent(book.title + (book.author ? " " + book.author : ""))}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowMenu(false)}
                        className="w-full px-3 py-1.5 text-left text-sm text-fuchsia-600 hover:bg-fuchsia-50 flex items-center gap-1"
                      >
                        Goodreads
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                      <button
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rating */}
        {progress?.rating && (
          <div className="mt-2 text-sm">{"⭐".repeat(progress.rating)}</div>
        )}
      </div>
    </div>
  );
}

export default function Library(): JSX.Element {
  const { selectedStudentId, getSelectedStudent } = useStore();
  const selectedStudent = getSelectedStudent();
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showAddBook, setShowAddBook] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [loggingBook, setLoggingBook] = useState<BookWithProgress | null>(null);
  const [logPagesRead, setLogPagesRead] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const [formData, setFormData] = useState<CreateBook>({
    title: "",
    author: "",
    isbn: "",
    totalPages: undefined,
    readingLevel: "",
    genre: "",
    notes: "",
  });

  const loadBooks = async () => {
    if (selectedStudentId) {
      const data = await window.api.getBooksWithProgress(selectedStudentId);
      setBooks(data);
    } else {
      const data = await window.api.getBooks();
      setBooks(data.map((book) => ({ ...book })));
    }
  };

  useEffect(() => {
    loadBooks();
  }, [selectedStudentId]);

  const filteredBooks = useMemo(() => {
    let filtered = books;

    if (filterStatus !== "all") {
      filtered = filtered.filter((b) => {
        const status = b.studentProgress?.status || "not_started";
        return status === filterStatus;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author?.toLowerCase().includes(query) ||
          b.genre?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [books, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = books.length;
    const finished = books.filter(
      (b) => b.studentProgress?.status === "finished",
    ).length;
    const reading = books.filter(
      (b) => b.studentProgress?.status === "reading",
    ).length;
    const notStarted = books.filter(
      (b) => !b.studentProgress || b.studentProgress.status === "not_started",
    ).length;
    return { total, finished, reading, notStarted };
  }, [books]);

  const openAddModal = () => {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      totalPages: undefined,
      readingLevel: "",
      genre: "",
      notes: "",
    });
    setShowAddBook(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author || "",
      isbn: book.isbn || "",
      totalPages: book.totalPages,
      readingLevel: book.readingLevel || "",
      genre: book.genre || "",
      notes: book.notes || "",
    });
  };

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const bookData: CreateBook = {
      ...formData,
      totalPages: formData.totalPages || undefined,
    };

    if (editingBook) {
      await window.api.updateBook(editingBook.id, bookData);
      setEditingBook(null);
    } else {
      await window.api.createBook(bookData);
      setShowAddBook(false);
    }

    loadBooks();
  };

  const handleDeleteBook = async (id: string) => {
    if (confirm("Are you sure you want to delete this book?")) {
      await window.api.deleteBook(id);
      loadBooks();
    }
  };

  const handleUpdateProgress = async (
    bookId: string,
    data: UpdateStudentBook,
  ) => {
    if (!selectedStudentId) return;
    await window.api.updateStudentBook(selectedStudentId, bookId, data);
    loadBooks();
  };

  const openLogReading = (book: BookWithProgress) => {
    setLoggingBook(book);
    setLogPagesRead("");
    setLogNotes("");
  };

  const handleLogReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingBook || !selectedStudentId || !logPagesRead) return;

    await window.api.logReading(
      selectedStudentId,
      loggingBook.id,
      parseInt(logPagesRead),
      logNotes || undefined,
    );
    setLoggingBook(null);
    loadBooks();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          {selectedStudent && (
            <p className="text-sm text-gray-500 mt-1">
              {selectedStudent.name}'s Reading Progress
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowScanner(true)}>
            Scan Books
          </Button>
          <Button variant="primary" onClick={openAddModal}>
            + Add Book
          </Button>
        </div>
      </div>
      {/* Stats */}
      {selectedStudentId && (
        <Card className="mb-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-500">Total Books</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.finished}
              </div>
              <div className="text-sm text-gray-500">Finished</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.reading}
              </div>
              <div className="text-sm text-gray-500">Reading</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">
                {stats.notStarted}
              </div>
              <div className="text-sm text-gray-500">Not Started</div>
            </div>
          </div>
        </Card>
      )}
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
          />
        </div>

        {selectedStudentId && (
          <div className="flex gap-1">
            {(
              ["all", "not_started", "reading", "finished"] as StatusFilter[]
            ).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-fuchsia-100 text-fuchsia-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status === "not_started"
                    ? "Not Started"
                    : status === "reading"
                      ? "Reading"
                      : "Finished"}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            {books.length === 0
              ? "No books in your library yet. Add your first book!"
              : "No books match your search or filters."}
          </p>
        </Card>
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
          setShowAddBook(false);
          setEditingBook(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editingBook ? "Edit Book" : "Add Book"}
            </Dialog.Title>

            <form onSubmit={handleSubmitBook} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Author</label>
                <Input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Pages</label>
                  <Input
                    type="number"
                    value={formData.totalPages || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalPages: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    min="1"
                  />
                </div>

                <div>
                  <label className="label">Reading Level</label>
                  <Input
                    type="text"
                    value={formData.readingLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, readingLevel: e.target.value })
                    }
                    placeholder="e.g., Level 2, AR 2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Genre</label>
                  <Input
                    type="text"
                    value={formData.genre}
                    onChange={(e) =>
                      setFormData({ ...formData, genre: e.target.value })
                    }
                    placeholder="e.g., Fiction, Science"
                  />
                </div>

                <div>
                  <label className="label">ISBN</label>
                  <Input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) =>
                      setFormData({ ...formData, isbn: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="input"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setShowAddBook(false);
                    setEditingBook(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingBook ? "Save Changes" : "Add Book"}
                </Button>
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
                  <p className="text-gray-700 font-medium">
                    {loggingBook.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Currently on page{" "}
                    {loggingBook.studentProgress?.currentPage || 0}
                    {loggingBook.totalPages && ` of ${loggingBook.totalPages}`}
                  </p>
                </div>

                <div>
                  <label className="label">Pages Read</label>
                  <Input
                    type="number"
                    value={logPagesRead}
                    onChange={(e) => setLogPagesRead(e.target.value)}
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
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setLoggingBook(null)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Log Reading
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* Scanner Modal */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onBookAdded={() => loadBooks()}
      />
    </div>
  );
}
