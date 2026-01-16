/**
 * Homeschool Admin Panel - Main App Component
 */

import { useState, useEffect } from 'react'
import { Modal } from './components/Modal'
import { SponsorForm } from './components/SponsorForm'
import { ResourceForm } from './components/ResourceForm'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import {
  useSponsors,
  useResources,
  useCreateSponsor,
  useUpdateSponsor,
  useDeleteSponsor,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  type Sponsor,
  type SponsoredResource,
} from './hooks/useConvex'

export default function App() {
  const [view, setView] = useState<'sponsors' | 'resources' | 'analytics'>(() => {
    // Restore last viewed tab from localStorage
    const savedView = localStorage.getItem('admin-panel-view')
    if (savedView === 'sponsors' || savedView === 'resources' || savedView === 'analytics') {
      return savedView
    }
    return 'sponsors'
  })

  // Convex queries - automatically reactive
  const sponsors = useSponsors()
  const resources = useResources()

  // Convex mutations
  const createSponsor = useCreateSponsor()
  const updateSponsor = useUpdateSponsor()
  const deleteSponsor = useDeleteSponsor()
  const createResource = useCreateResource()
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()

  // Modal state
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<SponsoredResource | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Loading state from Convex
  const isLoading = sponsors === undefined || resources === undefined

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin-panel-view', view)
  }, [view])

  const handleCreateSponsor = () => {
    setEditingSponsor(null)
    setIsSponsorModalOpen(true)
  }

  const handleEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor)
    setIsSponsorModalOpen(true)
  }

  const handleSaveSponsor = async (data: Partial<Sponsor>) => {
    try {
      if (editingSponsor) {
        await updateSponsor({
          id: editingSponsor._id,
          ...data,
        })
      } else {
        await createSponsor(data as any)
      }
      setIsSponsorModalOpen(false)
      setEditingSponsor(null)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save sponsor')
    }
  }

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor? This will also delete all associated resources.')) {
      return
    }

    try {
      await deleteSponsor({ id: id as any })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sponsor')
    }
  }

  const handleCreateResource = () => {
    setEditingResource(null)
    setIsResourceModalOpen(true)
  }

  const handleEditResource = (resource: SponsoredResource) => {
    setEditingResource(resource)
    setIsResourceModalOpen(true)
  }

  const handleSaveResource = async (data: Partial<SponsoredResource>) => {
    try {
      if (editingResource) {
        await updateResource({
          id: editingResource._id,
          ...data,
        })
      } else {
        await createResource(data as any)
      }
      setIsResourceModalOpen(false)
      setEditingResource(null)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save resource')
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return
    }

    try {
      await deleteResource({ id: id as any })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Homeschool Admin Panel
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage sponsors, resources, and analytics
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setView('sponsors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                view === 'sponsors'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sponsors
            </button>
            <button
              onClick={() => setView('resources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                view === 'resources'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                view === 'analytics'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        ) : (
          <>
            {view === 'sponsors' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sponsors ({sponsors?.length || 0})
                  </h2>
                  <button
                    onClick={handleCreateSponsor}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Sponsor
                  </button>
                </div>

                {!sponsors || sponsors.length === 0 ? (
                  <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sponsors yet</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first sponsor.</p>
                    <button
                      onClick={handleCreateSponsor}
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark"
                    >
                      Add First Sponsor
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {sponsors.map((sponsor: Sponsor) => (
                      <div
                        key={sponsor._id}
                        className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {sponsor.name}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  sponsor.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {sponsor.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="px-2 py-1 text-xs bg-student-purple-100 text-brand-primaryDark rounded capitalize">
                                {sponsor.tier}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              ${sponsor.monthlyFee}/month • {sponsor.contactEmail}
                            </p>
                            {sponsor.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                {sponsor.description}
                              </p>
                            )}
                            {sponsor.websiteUrl && (
                              <a
                                href={sponsor.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brand-primary hover:text-brand-primaryDark mt-2 inline-block"
                              >
                                Visit website →
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditSponsor(sponsor)}
                              className="p-2 text-gray-600 hover:text-brand-primary hover:bg-brand-primaryLight rounded"
                              title="Edit sponsor"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteSponsor(sponsor._id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete sponsor"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'resources' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sponsored Resources ({resources?.length || 0})
                  </h2>
                  <button
                    onClick={handleCreateResource}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark flex items-center gap-2"
                    disabled={!sponsors || sponsors.length === 0}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Resource
                  </button>
                </div>

                {!sponsors || sponsors.length === 0 ? (
                  <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sponsors yet</h3>
                    <p className="text-gray-500 mb-4">You need to add sponsors before creating resources.</p>
                    <button
                      onClick={() => setView('sponsors')}
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark"
                    >
                      Go to Sponsors
                    </button>
                  </div>
                ) : !resources || resources.length === 0 ? (
                  <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first sponsored resource.</p>
                    <button
                      onClick={handleCreateResource}
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark"
                    >
                      Add First Resource
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {resources.map((resource: SponsoredResource) => {
                      const sponsor = sponsors.find((s: Sponsor) => s._id === resource.sponsorId)
                      return (
                        <div
                          key={resource._id}
                          className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {resource.icon && (
                                  <span className="text-2xl">{resource.icon}</span>
                                )}
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {resource.name}
                                </h3>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    resource.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {resource.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="px-2 py-1 text-xs bg-student-purple-100 text-brand-primaryDark rounded capitalize">
                                  {resource.tier}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                by {sponsor?.name || 'Unknown Sponsor'}
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                {resource.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {resource.subjects?.slice(0, 5).map((subject: string) => (
                                  <span
                                    key={subject}
                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                                  >
                                    {subject}
                                  </span>
                                ))}
                                {resource.gradeLevels?.slice(0, 3).map((grade: string) => (
                                  <span
                                    key={grade}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                  >
                                    Grade {grade}
                                  </span>
                                ))}
                              </div>
                              {resource.url && (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-brand-primary hover:text-brand-primaryDark mt-2 inline-block"
                                >
                                  Visit resource →
                                </a>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditResource(resource)}
                                className="p-2 text-gray-600 hover:text-brand-primary hover:bg-brand-primaryLight rounded"
                                title="Edit resource"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteResource(resource._id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete resource"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {view === 'analytics' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Analytics
                </h2>
                <AnalyticsDashboard />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Homeschool Admin Panel • Powered by Convex
          </p>
        </div>
      </footer>

      {/* Sponsor Modal */}
      <Modal
        isOpen={isSponsorModalOpen}
        onClose={() => {
          setIsSponsorModalOpen(false)
          setEditingSponsor(null)
        }}
        title={editingSponsor ? 'Edit Sponsor' : 'Create New Sponsor'}
        size="xl"
      >
        <SponsorForm
          sponsor={editingSponsor}
          onSubmit={handleSaveSponsor}
          onCancel={() => {
            setIsSponsorModalOpen(false)
            setEditingSponsor(null)
          }}
        />
      </Modal>

      {/* Resource Modal */}
      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false)
          setEditingResource(null)
        }}
        title={editingResource ? 'Edit Resource' : 'Create New Resource'}
        size="xl"
      >
        <ResourceForm
          resource={editingResource}
          sponsors={sponsors}
          onSubmit={handleSaveResource}
          onCancel={() => {
            setIsResourceModalOpen(false)
            setEditingResource(null)
          }}
        />
      </Modal>
    </div>
  )
}
