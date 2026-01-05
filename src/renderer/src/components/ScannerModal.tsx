import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import type { Book, ScannerSession } from '../../../shared/types'

interface ScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onBookAdded: (book: Book) => void
}

export default function ScannerModal({ isOpen, onClose, onBookAdded }: ScannerModalProps): JSX.Element {
  const [session, setSession] = useState<ScannerSession | null>(null)
  const [scannedBooks, setScannedBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !session) {
      startScanner()
    }

    return () => {
      if (session) {
        window.api.stopScanner()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    // Listen for scanned books
    const unsubscribe = window.api.onBookScanned((book: Book) => {
      setScannedBooks((prev) => [book, ...prev])
      onBookAdded(book)
    })

    return unsubscribe
  }, [isOpen, onBookAdded])

  const startScanner = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const newSession = await window.api.startScanner()
      setSession(newSession)
    } catch (err) {
      setError('Failed to start scanner. Please try again.')
      console.error('Scanner error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    window.api.stopScanner()
    setSession(null)
    setScannedBooks([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
            Scan Books with Your Phone
          </Dialog.Title>

          {isLoading && (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4" />
              <p className="text-gray-500">Starting scanner...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={startScanner}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {session && !isLoading && (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-2 rounded-lg border-2 border-gray-200 mb-3">
                  <img
                    src={session.qrCodeDataUrl}
                    alt="Scan with phone"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Scan this QR code with your phone camera
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Opens a webpage where you can scan book barcodes
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-indigo-900 text-sm mb-2">How it works:</h4>
                <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
                  <li>Scan the QR code with your phone</li>
                  <li>Point your phone at book barcodes</li>
                  <li>Books appear here automatically!</li>
                </ol>
              </div>

              {/* Scanned Books List */}
              {scannedBooks.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                    Recently Added ({scannedBooks.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {scannedBooks.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="w-8 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                          {book.coverImagePath ? (
                            <img
                              src={`file://${book.coverImagePath}`}
                              alt=""
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement!.innerHTML = '📚'
                              }}
                            />
                          ) : (
                            '📚'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {book.title}
                          </p>
                          {book.author && (
                            <p className="text-xs text-gray-500 truncate">{book.author}</p>
                          )}
                        </div>
                        <span className="text-green-600 text-lg">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={handleClose}
              className="btn btn-primary"
            >
              Done
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
