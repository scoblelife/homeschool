import { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../src/stores/useStore'
import {
  getBooks,
  getBooksWithProgress,
  createBook,
  updateBook,
  deleteBook,
  updateStudentBook,
  logReading,
} from '../../src/database'
import type { Book, BookWithProgress, CreateBook, ReadingStatus } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { Card, Badge, Button, EmptyState, Modal, Input, ProgressBar } from '../../src/components/ui'
import { useColors } from '../../src/theme/createStyles'

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'completed'

const statusLabels: Record<ReadingStatus, { label: string; color: string; bgColor: string }> = {
  not_started: { label: 'Not Started', color: '#6b7280', bgColor: '#f3f4f6' },
  in_progress: { label: 'Reading', color: '#3b82f6', bgColor: '#dbeafe' },
  completed: { label: 'Finished', color: '#10b981', bgColor: '#d1fae5' },
}

function BookCard({
  book,
  studentId,
  studentColor,
  onPress,
  onUpdateStatus,
}: {
  book: BookWithProgress
  studentId: string | null
  studentColor: string
  onPress: () => void
  onUpdateStatus: (status: ReadingStatus) => void
}) {
  const colors = useColors()
  const progress = book.studentProgress
  const status = progress?.status || 'not_started'
  const currentPage = progress?.currentPage || 0
  const statusInfo = statusLabels[status]
  const progressPercent = book.totalPages ? Math.round((currentPage / book.totalPages) * 100) : 0

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${book.title}${book.author ? ` by ${book.author}` : ''}, ${statusInfo.label}`}
      accessibilityRole="button"
    >
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Book Cover Placeholder */}
          <View
            style={{
              width: 60,
              height: 80,
              borderRadius: 6,
              backgroundColor: '#e0e7ff',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessibilityElementsHidden
          >
            <Text style={{ fontSize: 28 }}>📚</Text>
          </View>

          {/* Book Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={2}>
              {book.title}
            </Text>
            {book.author && (
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>by {book.author}</Text>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <Badge
                variant="default"
                style={{ backgroundColor: statusInfo.bgColor }}
              >
                {statusInfo.label}
              </Badge>
              {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
              {book.readingLevel && (
                <Badge variant="primary">{book.readingLevel}</Badge>
              )}
            </View>

            {/* Progress Bar */}
            {studentId && book.totalPages && (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.textTertiary }}>Page {currentPage}</Text>
                  <Text style={{ fontSize: 11, color: colors.textTertiary }}>{book.totalPages} pages</Text>
                </View>
                <ProgressBar progress={progressPercent} color={status === 'completed' ? colors.success : studentColor} height={4} />
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

export default function LibraryScreen() {
  const { selectedStudentId, getSelectedStudent } = useStore()
  const [books, setBooks] = useState<BookWithProgress[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookWithProgress | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [logModalVisible, setLogModalVisible] = useState(false)
  const [logPagesRead, setLogPagesRead] = useState('')
  const [logNotes, setLogNotes] = useState('')

  // Form state
  const [formData, setFormData] = useState<CreateBook>({
    title: '',
    author: '',
    isbn: '',
    totalPages: undefined,
    readingLevel: '',
    genre: '',
    notes: '',
  })

  const colors = useColors()

  const selectedStudent = getSelectedStudent()
  const studentColor = selectedStudent?.color === 'child2' ? colors.studentTeal : colors.studentFuchsia

  const loadBooks = useCallback(async () => {
    try {
      if (selectedStudentId) {
        const data = await getBooksWithProgress(selectedStudentId)
        setBooks(data)
      } else {
        const data = await getBooks()
        setBooks(data.map((book) => ({ ...book })))
      }
    } catch (err) {
      console.error('Failed to load books:', err)
    }
  }, [selectedStudentId])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadBooks()
    setRefreshing(false)
  }, [loadBooks])

  const filteredBooks = useMemo(() => {
    let filtered = books

    if (filter !== 'all') {
      filtered = filtered.filter((b) => {
        const status = b.studentProgress?.status || 'not_started'
        return status === filter
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
  }, [books, filter, searchQuery])

  const stats = useMemo(() => {
    const total = books.length
    const finished = books.filter((b) => b.studentProgress?.status === 'completed').length
    const reading = books.filter((b) => b.studentProgress?.status === 'in_progress').length
    const notStarted = books.filter((b) => !b.studentProgress || b.studentProgress.status === 'not_started').length
    return { total, finished, reading, notStarted }
  }, [books])

  const openAddModal = () => {
    setEditingBook(null)
    setFormData({
      title: '',
      author: '',
      isbn: '',
      totalPages: undefined,
      readingLevel: '',
      genre: '',
      notes: '',
    })
    setModalVisible(true)
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
      notes: book.notes || '',
    })
    setModalVisible(true)
  }

  const handleSubmitBook = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a book title')
      return
    }

    try {
      if (editingBook) {
        await updateBook(editingBook.id, formData)
      } else {
        await createBook(formData)
      }
      setModalVisible(false)
      loadBooks()
    } catch (err) {
      console.error('Failed to save book:', err)
      Alert.alert('Error', 'Failed to save book')
    }
  }

  const handleDeleteBook = async (book: Book) => {
    Alert.alert('Delete Book', `Are you sure you want to delete "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBook(book.id)
            setDetailModalVisible(false)
            setSelectedBook(null)
            loadBooks()
          } catch (err) {
            console.error('Failed to delete book:', err)
            Alert.alert('Error', 'Failed to delete book')
          }
        },
      },
    ])
  }

  const handleUpdateStatus = async (book: BookWithProgress, status: ReadingStatus) => {
    if (!selectedStudentId) return

    try {
      await updateStudentBook(selectedStudentId, book.id, { status })
      loadBooks()
    } catch (err) {
      console.error('Failed to update status:', err)
      Alert.alert('Error', 'Failed to update status')
    }
  }

  const openLogReading = (book: BookWithProgress) => {
    setSelectedBook(book)
    setLogPagesRead('')
    setLogNotes('')
    setLogModalVisible(true)
  }

  const handleLogReading = async () => {
    if (!selectedBook || !selectedStudentId || !logPagesRead) return

    try {
      await logReading(selectedStudentId, selectedBook.id, parseInt(logPagesRead), logNotes || undefined)
      setLogModalVisible(false)
      setSelectedBook(null)
      loadBooks()
    } catch (err) {
      console.error('Failed to log reading:', err)
      Alert.alert('Error', 'Failed to log reading')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
      >
        <View style={{ padding: 16 }}>
          <StudentSelector />

          {/* Stats */}
          {selectedStudentId && (
            <Card style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${stats.total} total books`}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{stats.total}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Total</Text>
                </View>
                <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${stats.finished} books finished`}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.success }}>{stats.finished}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Finished</Text>
                </View>
                <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${stats.reading} books reading`}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.studentBlue }}>{stats.reading}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Reading</Text>
                </View>
                <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${stats.notStarted} books not started`}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textTertiary }}>{stats.notStarted}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Not Started</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Search */}
          <View style={{ marginTop: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: colors.text }}
                placeholder="Search books..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Search books"
                accessibilityRole="search"
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          {selectedStudentId && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'in_progress', label: 'Reading' },
                  { key: 'not_started', label: 'Not Started' },
                  { key: 'completed', label: 'Finished' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setFilter(item.key as StatusFilter)}
                    accessibilityLabel={`Filter: ${item.label}${filter === item.key ? ', selected' : ''}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: filter === item.key }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: filter === item.key ? studentColor : colors.surfaceSecondary,
                    }}
                  >
                    <Text style={{ color: filter === item.key ? colors.textInverse : colors.textSecondary, fontWeight: '500' }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Add Book Button */}
          <TouchableOpacity
            onPress={openAddModal}
            accessibilityLabel="Add book"
            accessibilityRole="button"
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: studentColor,
              paddingVertical: 12,
              borderRadius: 10,
              gap: 8,
            }}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
            <Text style={{ color: colors.textInverse, fontWeight: '600', fontSize: 15 }}>Add Book</Text>
          </TouchableOpacity>

          {/* Books List */}
          <View style={{ marginTop: 16 }}>
            {filteredBooks.length === 0 ? (
              <EmptyState
                icon="book"
                title="No Books"
                description={
                  books.length === 0
                    ? 'Add your first book to start tracking reading'
                    : 'No books match your search or filters'
                }
              />
            ) : (
              filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  studentId={selectedStudentId}
                  studentColor={studentColor}
                  onPress={() => {
                    setSelectedBook(book)
                    setDetailModalVisible(true)
                  }}
                  onUpdateStatus={(status) => handleUpdateStatus(book, status)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Book Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingBook ? 'Edit Book' : 'Add Book'}
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button onPress={handleSubmitBook} color={studentColor} style={{ flex: 1 }}>
              {editingBook ? 'Save' : 'Add'}
            </Button>
          </View>
        }
      >
        <View style={{ gap: 12 }}>
          <Input
            label="Title *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Enter book title"
          />
          <Input
            label="Author"
            value={formData.author || ''}
            onChangeText={(text) => setFormData({ ...formData, author: text })}
            placeholder="Enter author name"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Total Pages"
                value={formData.totalPages?.toString() || ''}
                onChangeText={(text) =>
                  setFormData({ ...formData, totalPages: text ? parseInt(text) : undefined })
                }
                placeholder="e.g., 200"
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Reading Level"
                value={formData.readingLevel || ''}
                onChangeText={(text) => setFormData({ ...formData, readingLevel: text })}
                placeholder="e.g., Level 2"
              />
            </View>
          </View>
          <Input
            label="Genre"
            value={formData.genre || ''}
            onChangeText={(text) => setFormData({ ...formData, genre: text })}
            placeholder="e.g., Fiction, Science"
          />
          <Input
            label="Notes"
            value={formData.notes || ''}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Any notes about this book"
            multiline
            numberOfLines={2}
          />
        </View>
      </Modal>

      {/* Book Detail Modal */}
      {selectedBook && (
        <Modal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false)
            setSelectedBook(null)
          }}
          title="Book Details"
          footer={
            <View style={{ gap: 8 }}>
              {selectedStudentId && selectedBook.totalPages && selectedBook.studentProgress?.status !== 'completed' && (
                <Button onPress={() => openLogReading(selectedBook)} color={studentColor} fullWidth>
                  Log Reading
                </Button>
              )}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  variant="secondary"
                  onPress={() => {
                    setDetailModalVisible(false)
                    openEditModal(selectedBook)
                  }}
                  style={{ flex: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => handleDeleteBook(selectedBook)}
                  style={{ flex: 1, backgroundColor: colors.errorLight }}
                >
                  Delete
                </Button>
              </View>
            </View>
          }
        >
          <View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
              {selectedBook.title}
            </Text>
            {selectedBook.author && (
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>by {selectedBook.author}</Text>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {selectedBook.genre && <Badge variant="secondary">{selectedBook.genre}</Badge>}
              {selectedBook.readingLevel && <Badge variant="primary">{selectedBook.readingLevel}</Badge>}
              {selectedBook.totalPages && (
                <Badge variant="default">{`${selectedBook.totalPages} pages`}</Badge>
              )}
            </View>

            {/* Reading Progress */}
            {selectedStudentId && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 }}>
                  Reading Progress
                </Text>

                {/* Status Selector */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {(['not_started', 'in_progress', 'completed'] as ReadingStatus[]).map((status) => {
                    const info = statusLabels[status]
                    const isSelected = (selectedBook.studentProgress?.status || 'not_started') === status
                    return (
                      <TouchableOpacity
                        key={status}
                        onPress={() => handleUpdateStatus(selectedBook, status)}
                        accessibilityLabel={`${info.label}${isSelected ? ', selected' : ''}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: isSelected ? info.bgColor : colors.background,
                          borderWidth: 1,
                          borderColor: isSelected ? info.color : colors.border,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 12, color: isSelected ? info.color : colors.textTertiary, fontWeight: '500' }}>
                          {info.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                {/* Progress Bar */}
                {selectedBook.totalPages && (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        Page {selectedBook.studentProgress?.currentPage || 0}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{selectedBook.totalPages}</Text>
                    </View>
                    <ProgressBar
                      progress={
                        ((selectedBook.studentProgress?.currentPage || 0) / selectedBook.totalPages) * 100
                      }
                      color={selectedBook.studentProgress?.status === 'completed' ? colors.success : studentColor}
                    />
                  </View>
                )}
              </View>
            )}

            {selectedBook.notes && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 }}>Notes</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{selectedBook.notes}</Text>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* Log Reading Modal */}
      {selectedBook && (
        <Modal
          visible={logModalVisible}
          onClose={() => {
            setLogModalVisible(false)
          }}
          title="Log Reading"
          footer={
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button variant="secondary" onPress={() => setLogModalVisible(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button onPress={handleLogReading} color={studentColor} style={{ flex: 1 }}>
                Log
              </Button>
            </View>
          }
        >
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>{selectedBook.title}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Currently on page {selectedBook.studentProgress?.currentPage || 0}
              {selectedBook.totalPages && ` of ${selectedBook.totalPages}`}
            </Text>

            <Input
              label="Pages Read"
              value={logPagesRead}
              onChangeText={setLogPagesRead}
              placeholder="How many pages did you read?"
              keyboardType="number-pad"
            />
            <Input
              label="Notes (optional)"
              value={logNotes}
              onChangeText={setLogNotes}
              placeholder="What happened? New words learned?"
              multiline
              numberOfLines={3}
            />
          </View>
        </Modal>
      )}
    </View>
  )
}
