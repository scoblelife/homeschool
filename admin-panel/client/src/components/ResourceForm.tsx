import React, { useState, useEffect } from 'react'
import { SponsoredResource, Sponsor } from '../hooks/useConvex'

interface ResourceFormProps {
  resource?: SponsoredResource | null
  sponsors: Sponsor[]
  onSubmit: (data: Partial<SponsoredResource>) => Promise<void>
  onCancel: () => void
}

export function ResourceForm({ resource, sponsors, onSubmit, onCancel }: ResourceFormProps) {
  const [formData, setFormData] = useState({
    sponsorId: '',
    name: '',
    description: '',
    icon: '',
    url: '',
    subjects: '',
    gradeLevels: '',
    category: '',
    pricingInfo: '',
    displayPriority: '0',
    isActive: true,
    contractStartDate: '',
    contractEndDate: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (resource) {
      setFormData({
        sponsorId: resource.sponsorId || '',
        name: resource.name || '',
        description: resource.description || '',
        icon: resource.icon || '',
        url: resource.url || '',
        subjects: Array.isArray(resource.subjects) ? resource.subjects.join(', ') : '',
        gradeLevels: Array.isArray(resource.gradeLevels) ? resource.gradeLevels.join(', ') : '',
        category: resource.category || '',
        pricingInfo: resource.pricingInfo || '',
        displayPriority: resource.displayPriority?.toString() || '0',
        isActive: resource.isActive !== false,
        contractStartDate: resource.contractStartDate || '',
        contractEndDate: resource.contractEndDate || '',
      })
    }
  }, [resource])

  const selectedSponsor = sponsors.find(s => s._id === formData.sponsorId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Parse comma-separated values into arrays
      const subjectsArray = formData.subjects
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const gradeLevelsArray = formData.gradeLevels
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      await onSubmit({
        sponsorId: formData.sponsorId as any,
        tier: selectedSponsor?.tier,
        name: formData.name,
        description: formData.description,
        icon: formData.icon || undefined,
        url: formData.url,
        subjects: subjectsArray,
        gradeLevels: gradeLevelsArray,
        category: formData.category || undefined,
        pricingInfo: formData.pricingInfo || undefined,
        displayPriority: parseInt(formData.displayPriority),
        isActive: formData.isActive,
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sponsor <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.sponsorId}
              onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              disabled={!!resource}
            >
              <option value="">Select a sponsor...</option>
              {sponsors.map((sponsor) => (
                <option key={sponsor._id} value={sponsor._id}>
                  {sponsor.name} ({sponsor.tier})
                </option>
              ))}
            </select>
            {resource && (
              <p className="text-xs text-gray-500 mt-1">Sponsor cannot be changed after creation</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="IXL Math Practice"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Comprehensive math practice for grades K-12..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="https://www.ixl.com/math"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (emoji or URL)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="📚 or https://example.com/icon.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="">Select a category...</option>
              <option value="video">Video</option>
              <option value="practice">Practice</option>
              <option value="reading">Reading</option>
              <option value="game">Game</option>
              <option value="tool">Tool</option>
              <option value="reference">Reference</option>
              <option value="curriculum">Curriculum</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pricing Info
            </label>
            <input
              type="text"
              value={formData.pricingInfo}
              onChange={(e) => setFormData({ ...formData, pricingInfo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Free or $9.95/month"
            />
          </div>
        </div>
      </div>

      {/* Targeting */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Targeting & Placement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subjects (comma-separated)
            </label>
            <input
              type="text"
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Math, Science, Reading"
            />
            <p className="text-xs text-gray-500 mt-1">Enter subjects separated by commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Levels (comma-separated)
            </label>
            <input
              type="text"
              value={formData.gradeLevels}
              onChange={(e) => setFormData({ ...formData, gradeLevels: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="K, 1, 2, 3, 4, 5"
            />
            <p className="text-xs text-gray-500 mt-1">Enter grade levels separated by commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Priority
            </label>
            <input
              type="number"
              value={formData.displayPriority}
              onChange={(e) => setFormData({ ...formData, displayPriority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Higher numbers appear first</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Contract Dates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contract Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.contractStartDate}
              onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.contractEndDate}
              onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Resource will only be shown during this date range
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : resource ? 'Update Resource' : 'Create Resource'}
        </button>
      </div>
    </form>
  )
}
