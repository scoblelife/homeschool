/**
 * API Client for Admin Panel
 * Connects to Express server REST API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface Sponsor {
  id: string
  name: string
  tier: 'basic' | 'premium' | 'enterprise'
  logo_url?: string
  website_url?: string
  description?: string
  monthly_fee: number
  contact_name?: string
  contact_email: string
  github_username?: string
  is_active: boolean
  contract_signed_date?: string
  billing_start_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SponsoredResource {
  id: string
  sponsor_id: string
  sponsor_name: string
  tier: string
  name: string
  description: string
  icon?: string
  url: string
  subjects: string[]
  grade_levels: string[]
  category?: string
  pricing_info?: string
  display_priority: number
  is_active: boolean
  contract_start_date: string
  contract_end_date: string
  created_at: string
  updated_at: string
}

export interface SponsorAnalytics {
  sponsorId: string
  sponsorName: string
  tier: string
  monthlyFee: number
  totalClicks: number
  clicksByLocation: Record<string, number>
  clicksByResource: Array<{
    resourceId: string
    resourceName: string
    clicks: number
  }>
}

// Sponsors API
export const sponsorsApi = {
  getAll: async (activeOnly = false): Promise<Sponsor[]> => {
    const url = activeOnly ? `${API_BASE_URL}/sponsors?activeOnly=true` : `${API_BASE_URL}/sponsors`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch sponsors')
    return response.json()
  },

  getOne: async (id: string): Promise<Sponsor> => {
    const response = await fetch(`${API_BASE_URL}/sponsors/${id}`)
    if (!response.ok) throw new Error('Failed to fetch sponsor')
    return response.json()
  },

  create: async (data: Partial<Sponsor>): Promise<Sponsor> => {
    const response = await fetch(`${API_BASE_URL}/sponsors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create sponsor')
    return response.json()
  },

  update: async (id: string, data: Partial<Sponsor>): Promise<Sponsor> => {
    const response = await fetch(`${API_BASE_URL}/sponsors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update sponsor')
    return response.json()
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/sponsors/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete sponsor')
  },
}

// Resources API
export const resourcesApi = {
  getAll: async (activeOnly = false): Promise<SponsoredResource[]> => {
    const url = activeOnly
      ? `${API_BASE_URL}/resources?activeOnly=true`
      : `${API_BASE_URL}/resources`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch resources')
    return response.json()
  },

  getOne: async (id: string): Promise<SponsoredResource> => {
    const response = await fetch(`${API_BASE_URL}/resources/${id}`)
    if (!response.ok) throw new Error('Failed to fetch resource')
    return response.json()
  },

  create: async (data: Partial<SponsoredResource>): Promise<SponsoredResource> => {
    const response = await fetch(`${API_BASE_URL}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create resource')
    return response.json()
  },

  update: async (id: string, data: Partial<SponsoredResource>): Promise<SponsoredResource> => {
    const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update resource')
    return response.json()
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete resource')
  },
}

// Analytics API
export const analyticsApi = {
  getAnalytics: async (startDate?: string, endDate?: string): Promise<SponsorAnalytics[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `${API_BASE_URL}/analytics${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch analytics')
    return response.json()
  },

  getSummary: async (startDate?: string, endDate?: string): Promise<{
    totalRevenue: number
    totalClicks: number
    activeSponsors: number
    avgRevenuePerClick: number
  }> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `${API_BASE_URL}/analytics/summary${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch summary')
    return response.json()
  },
}
