import React, { useState, useEffect } from 'react'
import { Sponsor } from '../hooks/useConvex'

interface SponsorFormProps {
  sponsor?: Sponsor | null
  onSubmit: (data: Partial<Sponsor>) => Promise<void>
  onCancel: () => void
}

export function SponsorForm({ sponsor, onSubmit, onCancel }: SponsorFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    tier: 'basic' as 'basic' | 'premium' | 'enterprise',
    logoUrl: '',
    websiteUrl: '',
    description: '',
    monthlyFee: '0',
    contactName: '',
    contactEmail: '',
    githubUsername: '',
    isActive: true,
    contractSignedDate: '',
    billingStartDate: '',
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sponsor) {
      setFormData({
        name: sponsor.name || '',
        tier: sponsor.tier || 'basic',
        logoUrl: sponsor.logoUrl || '',
        websiteUrl: sponsor.websiteUrl || '',
        description: sponsor.description || '',
        monthlyFee: sponsor.monthlyFee?.toString() || '0',
        contactName: sponsor.contactName || '',
        contactEmail: sponsor.contactEmail || '',
        githubUsername: sponsor.githubUsername || '',
        isActive: sponsor.isActive !== false,
        contractSignedDate: sponsor.contractSignedDate || '',
        billingStartDate: sponsor.billingStartDate || '',
        notes: sponsor.notes || '',
      })
    }
  }, [sponsor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        name: formData.name,
        tier: formData.tier,
        logoUrl: formData.logoUrl || undefined,
        websiteUrl: formData.websiteUrl || undefined,
        description: formData.description || undefined,
        monthlyFee: parseFloat(formData.monthlyFee),
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail,
        githubUsername: formData.githubUsername || undefined,
        isActive: formData.isActive,
        contractSignedDate: formData.contractSignedDate || undefined,
        billingStartDate: formData.billingStartDate || undefined,
        notes: formData.notes || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sponsor')
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Khan Academy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="basic">Basic ($500/mo)</option>
              <option value="premium">Premium ($1,500/mo)</option>
              <option value="enterprise">Enterprise ($2,500/mo)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Fee <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="500.00"
            />
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

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="partnerships@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Username (Enterprise tier only)
            </label>
            <input
              type="text"
              value={formData.githubUsername}
              onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="username"
              disabled={formData.tier !== 'enterprise'}
            />
            {formData.tier === 'enterprise' && (
              <p className="text-xs text-gray-500 mt-1">For PR write access to private repository</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Signed Date
            </label>
            <input
              type="date"
              value={formData.contractSignedDate}
              onChange={(e) => setFormData({ ...formData, contractSignedDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Start Date
            </label>
            <input
              type="date"
              value={formData.billingStartDate}
              onChange={(e) => setFormData({ ...formData, billingStartDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Brief description of the sponsor and their products..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Internal notes about this sponsor..."
            />
          </div>
        </div>
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
          {isSubmitting ? 'Saving...' : sponsor ? 'Update Sponsor' : 'Create Sponsor'}
        </button>
      </div>
    </form>
  )
}
