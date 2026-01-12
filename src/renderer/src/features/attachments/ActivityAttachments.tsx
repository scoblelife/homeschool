/**
 * Activity Attachments Component
 *
 * Allows adding, viewing, and removing photo attachments from activities.
 * Shows thumbnail grid with full-size view on click.
 */

import { useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { ActivityAttachment } from '../../../../shared/types'

interface Props {
  activityId: string
  readOnly?: boolean
}

export function ActivityAttachments({ activityId, readOnly = false }: Props) {
  const [attachments, setAttachments] = useState<ActivityAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAttachment, setSelectedAttachment] = useState<ActivityAttachment | null>(null)
  const [adding, setAdding] = useState(false)

  const loadAttachments = useCallback(async () => {
    try {
      const result = await window.api.getAttachmentsForActivity(activityId)
      setAttachments(result)
    } catch (error) {
      console.error('Failed to load attachments:', error)
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  const handleAdd = async () => {
    setAdding(true)
    try {
      const attachment = await window.api.addAttachment(activityId)
      if (attachment) {
        setAttachments((prev) => [...prev, attachment])
      }
    } catch (error) {
      console.error('Failed to add attachment:', error)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) return
    try {
      await window.api.deleteAttachment(id)
      setAttachments((prev) => prev.filter((a) => a.id !== id))
      if (selectedAttachment?.id === id) {
        setSelectedAttachment(null)
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error)
    }
  }

  const handleOpenFile = async (filePath: string) => {
    try {
      await window.api.openAttachmentFile(filePath)
    } catch (error) {
      console.error('Failed to open file:', error)
    }
  }

  const getFileUrl = (filePath: string) => {
    // Convert file path to file:// URL for display
    return `file://${filePath}`
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-2">Loading attachments...</div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Photos ({attachments.length})
        </h4>
        {!readOnly && (
          <button
            onClick={handleAdd}
            disabled={adding}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-fuchsia-600 hover:text-fuchsia-700 disabled:opacity-50"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {adding ? 'Adding...' : 'Add Photo'}
          </button>
        )}
      </div>

      {/* Thumbnail Grid */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-fuchsia-500"
              onClick={() => setSelectedAttachment(attachment)}
            >
              <img
                src={getFileUrl(attachment.thumbnailPath || attachment.filePath)}
                alt={attachment.fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to full image if thumbnail fails
                  const target = e.target as HTMLImageElement
                  if (attachment.thumbnailPath && target.src !== getFileUrl(attachment.filePath)) {
                    target.src = getFileUrl(attachment.filePath)
                  }
                }}
              />
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(attachment.id)
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          {readOnly ? 'No photos' : 'No photos yet. Click "Add Photo" to add one.'}
        </div>
      )}

      {/* Full-size View Modal */}
      <Transition appear show={selectedAttachment !== null} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setSelectedAttachment(null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative max-w-4xl max-h-[90vh]">
                  {selectedAttachment && (
                    <>
                      <img
                        src={getFileUrl(selectedAttachment.filePath)}
                        alt={selectedAttachment.fileName}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => handleOpenFile(selectedAttachment.filePath)}
                          className="p-2 bg-white/90 rounded-full hover:bg-white"
                          title="Open in default app"
                        >
                          <svg
                            className="w-5 h-5 text-gray-700"
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
                        </button>
                        <button
                          onClick={() => setSelectedAttachment(null)}
                          className="p-2 bg-white/90 rounded-full hover:bg-white"
                        >
                          <svg
                            className="w-5 h-5 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2 rounded-b-lg">
                        {selectedAttachment.fileName}
                        {selectedAttachment.width && selectedAttachment.height && (
                          <span className="text-gray-300 ml-2">
                            ({selectedAttachment.width} x {selectedAttachment.height})
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

/**
 * Compact attachment preview for activity lists
 * Shows small thumbnails inline
 */
export function AttachmentPreview({ attachments }: { attachments: ActivityAttachment[] }) {
  if (attachments.length === 0) return null

  const getFileUrl = (filePath: string) => `file://${filePath}`

  return (
    <div className="flex items-center gap-1 mt-1">
      {attachments.slice(0, 3).map((attachment) => (
        <div
          key={attachment.id}
          className="w-8 h-8 rounded overflow-hidden bg-gray-100"
        >
          <img
            src={getFileUrl(attachment.thumbnailPath || attachment.filePath)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {attachments.length > 3 && (
        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600">
          +{attachments.length - 3}
        </div>
      )}
    </div>
  )
}

export default ActivityAttachments
