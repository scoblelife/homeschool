/**
 * Sponsored Content Repository
 *
 * Privacy-first sponsorship management:
 * - Anonymous click tracking only (NO PII)
 * - Sponsor management (Basic/Premium/Enterprise tiers)
 * - Sponsored resource content
 * - Analytics aggregation
 */

import { getDatabase } from '../connection'
import { v4 as uuidv4 } from 'uuid'
import type {
  Sponsor,
  CreateSponsor,
  UpdateSponsor,
  SponsoredResource,
  CreateSponsoredResource,
  UpdateSponsoredResource,
  SponsoredClick,
  SponsorAnalytics,
  SponsorTier,
  SponsoredLocation
} from '../../shared/types'

// ==========================================
// Sponsors
// ==========================================

export async function getSponsors(activeOnly = false): Promise<Sponsor[]> {
  const db = await getDatabase()
  const query = activeOnly
    ? 'SELECT * FROM sponsors WHERE is_active = TRUE ORDER BY tier DESC, name ASC'
    : 'SELECT * FROM sponsors ORDER BY tier DESC, name ASC'

  const rows = await db.all(query)
  return rows.map(mapSponsorFromDB)
}

export async function getSponsor(id: string): Promise<Sponsor | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM sponsors WHERE id = ?', id)
  return rows[0] ? mapSponsorFromDB(rows[0]) : null
}

export async function createSponsor(data: CreateSponsor): Promise<Sponsor> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO sponsors (
      id, name, tier, logo_url, website_url, description,
      monthly_fee, contact_name, contact_email, github_username,
      is_active, contract_signed_date, billing_start_date, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.tier,
    data.logoUrl || null,
    data.websiteUrl || null,
    data.description || null,
    data.monthlyFee,
    data.contactName || null,
    data.contactEmail,
    data.githubUsername || null,
    data.isActive !== false,
    data.contractSignedDate || null,
    data.billingStartDate || null,
    data.notes || null,
    now,
    now
  )

  const sponsor = await getSponsor(id)
  if (!sponsor) throw new Error('Failed to create sponsor')
  return sponsor
}

export async function updateSponsor(id: string, data: UpdateSponsor): Promise<Sponsor | null> {
  const db = await getDatabase()
  const existing = await getSponsor(id)
  if (!existing) return null

  const now = new Date().toISOString()
  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.logoUrl !== undefined) {
    updates.push('logo_url = ?')
    values.push(data.logoUrl || null)
  }
  if (data.websiteUrl !== undefined) {
    updates.push('website_url = ?')
    values.push(data.websiteUrl || null)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description || null)
  }
  if (data.monthlyFee !== undefined) {
    updates.push('monthly_fee = ?')
    values.push(data.monthlyFee)
  }
  if (data.contactName !== undefined) {
    updates.push('contact_name = ?')
    values.push(data.contactName || null)
  }
  if (data.contactEmail !== undefined) {
    updates.push('contact_email = ?')
    values.push(data.contactEmail)
  }
  if (data.githubUsername !== undefined) {
    updates.push('github_username = ?')
    values.push(data.githubUsername || null)
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    values.push(data.isActive)
  }
  if (data.contractSignedDate !== undefined) {
    updates.push('contract_signed_date = ?')
    values.push(data.contractSignedDate || null)
  }
  if (data.billingStartDate !== undefined) {
    updates.push('billing_start_date = ?')
    values.push(data.billingStartDate || null)
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?')
    values.push(data.notes || null)
  }

  if (updates.length === 0) return existing

  updates.push('updated_at = ?')
  values.push(now)
  values.push(id)

  await db.run(`UPDATE sponsors SET ${updates.join(', ')} WHERE id = ?`, ...values)

  return getSponsor(id)
}

export async function deleteSponsor(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM sponsors WHERE id = ?', id)
}

// ==========================================
// Sponsored Resources
// ==========================================

export async function getSponsoredResources(filters?: {
  tier?: SponsorTier
  subjects?: string[]
  gradeLevels?: string[]
  location?: SponsoredLocation
  activeOnly?: boolean
  limit?: number
}): Promise<SponsoredResource[]> {
  const db = await getDatabase()
  const conditions: string[] = []
  const values: unknown[] = []

  // Active resources only (if requested)
  if (filters?.activeOnly !== false) {
    conditions.push('is_active = TRUE')
  }

  // Filter by tier
  if (filters?.tier) {
    conditions.push('tier = ?')
    values.push(filters.tier)
  }

  // Filter by active contract dates
  const today = new Date().toISOString().split('T')[0]
  conditions.push('contract_start_date <= ?')
  values.push(today)
  conditions.push('contract_end_date >= ?')
  values.push(today)

  // TODO: Filter by subjects and grade levels (JSON arrays - need proper JSON query)
  // For now, we'll fetch all and filter in memory if needed

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const query = `
    SELECT * FROM sponsored_resources
    ${whereClause}
    ORDER BY display_priority DESC, tier DESC
    ${filters?.limit ? `LIMIT ${filters.limit}` : ''}
  `

  let rows = await db.all(query, ...values)

  // Post-filter by subjects and gradeLevels if needed
  if (filters?.subjects || filters?.gradeLevels) {
    rows = rows.filter((row: Record<string, unknown>) => {
      const resource = mapSponsoredResourceFromDB(row)

      if (filters.subjects) {
        const hasMatchingSubject = resource.subjects.some((s) =>
          filters.subjects!.includes(s)
        )
        if (!hasMatchingSubject) return false
      }

      if (filters.gradeLevels) {
        const hasMatchingGrade = resource.gradeLevels.some((g) =>
          filters.gradeLevels!.includes(g)
        )
        if (!hasMatchingGrade) return false
      }

      return true
    })
  }

  return rows.map(mapSponsoredResourceFromDB)
}

export async function getSponsoredResource(id: string): Promise<SponsoredResource | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM sponsored_resources WHERE id = ?', id)
  return rows[0] ? mapSponsoredResourceFromDB(rows[0]) : null
}

export async function createSponsoredResource(
  data: CreateSponsoredResource
): Promise<SponsoredResource> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO sponsored_resources (
      id, sponsor_id, tier, name, description, icon, url,
      subjects, grade_levels, category, pricing_info,
      display_priority, is_active,
      contract_start_date, contract_end_date,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.sponsorId,
    data.tier,
    data.name,
    data.description,
    data.icon || null,
    data.url,
    JSON.stringify(data.subjects),
    JSON.stringify(data.gradeLevels),
    data.category || null,
    data.pricingInfo || null,
    data.displayPriority || 0,
    data.isActive !== false,
    data.contractStartDate,
    data.contractEndDate,
    now,
    now
  )

  const resource = await getSponsoredResource(id)
  if (!resource) throw new Error('Failed to create sponsored resource')
  return resource
}

export async function updateSponsoredResource(
  id: string,
  data: UpdateSponsoredResource
): Promise<SponsoredResource | null> {
  const db = await getDatabase()
  const existing = await getSponsoredResource(id)
  if (!existing) return null

  const now = new Date().toISOString()
  const updates: string[] = []
  const values: unknown[] = []

  if (data.tier !== undefined) {
    updates.push('tier = ?')
    values.push(data.tier)
  }
  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?')
    values.push(data.icon || null)
  }
  if (data.url !== undefined) {
    updates.push('url = ?')
    values.push(data.url)
  }
  if (data.subjects !== undefined) {
    updates.push('subjects = ?')
    values.push(JSON.stringify(data.subjects))
  }
  if (data.gradeLevels !== undefined) {
    updates.push('grade_levels = ?')
    values.push(JSON.stringify(data.gradeLevels))
  }
  if (data.category !== undefined) {
    updates.push('category = ?')
    values.push(data.category || null)
  }
  if (data.pricingInfo !== undefined) {
    updates.push('pricing_info = ?')
    values.push(data.pricingInfo || null)
  }
  if (data.displayPriority !== undefined) {
    updates.push('display_priority = ?')
    values.push(data.displayPriority)
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    values.push(data.isActive)
  }
  if (data.contractStartDate !== undefined) {
    updates.push('contract_start_date = ?')
    values.push(data.contractStartDate)
  }
  if (data.contractEndDate !== undefined) {
    updates.push('contract_end_date = ?')
    values.push(data.contractEndDate)
  }

  if (updates.length === 0) return existing

  updates.push('updated_at = ?')
  values.push(now)
  values.push(id)

  await db.run(
    `UPDATE sponsored_resources SET ${updates.join(', ')} WHERE id = ?`,
    ...values
  )

  return getSponsoredResource(id)
}

export async function deleteSponsoredResource(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM sponsored_resources WHERE id = ?', id)
}

// ==========================================
// Anonymous Click Tracking (NO PII)
// ==========================================

export async function trackSponsoredClick(
  sponsoredResourceId: string,
  location: SponsoredLocation
): Promise<void> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO sponsored_clicks (id, sponsored_resource_id, location, clicked_at)
     VALUES (?, ?, ?, ?)`,
    id,
    sponsoredResourceId,
    location,
    now
  )
}

// ==========================================
// Analytics (Admin Only)
// ==========================================

export async function getSponsorAnalytics(filters?: {
  sponsorId?: string
  startDate?: string
  endDate?: string
}): Promise<SponsorAnalytics[]> {
  const db = await getDatabase()

  // Build date filter for clicks
  const clickConditions: string[] = []
  const clickValues: unknown[] = []

  if (filters?.startDate) {
    clickConditions.push('sc.clicked_at >= ?')
    clickValues.push(filters.startDate)
  }
  if (filters?.endDate) {
    clickConditions.push('sc.clicked_at <= ?')
    clickValues.push(filters.endDate)
  }

  const clickWhere =
    clickConditions.length > 0 ? `AND ${clickConditions.join(' AND ')}` : ''

  // Query for sponsor analytics
  const sponsorConditions: string[] = []
  const sponsorValues: unknown[] = []

  if (filters?.sponsorId) {
    sponsorConditions.push('s.id = ?')
    sponsorValues.push(filters.sponsorId)
  }

  const sponsorWhere =
    sponsorConditions.length > 0 ? `WHERE ${sponsorConditions.join(' AND ')}` : ''

  const query = `
    SELECT
      s.id as sponsor_id,
      s.name as sponsor_name,
      s.tier,
      s.monthly_fee,
      COUNT(DISTINCT sc.id) as total_clicks
    FROM sponsors s
    LEFT JOIN sponsored_resources sr ON sr.sponsor_id = s.id
    LEFT JOIN sponsored_clicks sc ON sc.sponsored_resource_id = sr.id ${clickWhere}
    ${sponsorWhere}
    GROUP BY s.id
    ORDER BY total_clicks DESC
  `

  const rows = await db.all<{
    sponsor_id: string
    sponsor_name: string
    tier: SponsorTier
    monthly_fee: number
    total_clicks: number
  }>(query, ...clickValues, ...sponsorValues)

  // Get clicks by location and resource for each sponsor
  const analytics: SponsorAnalytics[] = []

  for (const row of rows) {
    // Clicks by location
    const locationQuery = `
      SELECT
        sc.location,
        COUNT(*) as clicks
      FROM sponsored_clicks sc
      JOIN sponsored_resources sr ON sr.id = sc.sponsored_resource_id
      WHERE sr.sponsor_id = ? ${clickWhere}
      GROUP BY sc.location
    `
    const locationRows = await db.all<{ location: SponsoredLocation; clicks: number }>(
      locationQuery,
      row.sponsor_id,
      ...clickValues
    )

    const clicksByLocation: Record<SponsoredLocation, number> = {
      resources_page: 0,
      dashboard: 0,
      curriculum_page: 0,
      learning_log: 0
    }

    for (const loc of locationRows) {
      clicksByLocation[loc.location] = loc.clicks
    }

    // Clicks by resource
    const resourceQuery = `
      SELECT
        sr.id as resource_id,
        sr.name as resource_name,
        COUNT(sc.id) as clicks
      FROM sponsored_resources sr
      LEFT JOIN sponsored_clicks sc ON sc.sponsored_resource_id = sr.id ${clickWhere}
      WHERE sr.sponsor_id = ?
      GROUP BY sr.id
      ORDER BY clicks DESC
    `
    const resourceRows = await db.all<{
      resource_id: string
      resource_name: string
      clicks: number
    }>(resourceQuery, ...clickValues, row.sponsor_id)

    analytics.push({
      sponsorId: row.sponsor_id,
      sponsorName: row.sponsor_name,
      tier: row.tier,
      monthlyFee: row.monthly_fee,
      totalClicks: row.total_clicks,
      clicksByLocation,
      clicksByResource: resourceRows.map((r) => ({
        resourceId: r.resource_id,
        resourceName: r.resource_name,
        clicks: r.clicks
      }))
    })
  }

  return analytics
}

// ==========================================
// Database Mapping Helpers
// ==========================================

function mapSponsorFromDB(row: Record<string, unknown>): Sponsor {
  return {
    id: row.id as string,
    name: row.name as string,
    tier: row.tier as SponsorTier,
    logoUrl: (row.logo_url as string) || undefined,
    websiteUrl: (row.website_url as string) || undefined,
    description: (row.description as string) || undefined,
    monthlyFee: row.monthly_fee as number,
    contactName: (row.contact_name as string) || undefined,
    contactEmail: row.contact_email as string,
    githubUsername: (row.github_username as string) || undefined,
    isActive: Boolean(row.is_active),
    contractSignedDate: (row.contract_signed_date as string) || undefined,
    billingStartDate: (row.billing_start_date as string) || undefined,
    notes: (row.notes as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

function mapSponsoredResourceFromDB(row: Record<string, unknown>): SponsoredResource {
  return {
    id: row.id as string,
    sponsorId: row.sponsor_id as string,
    tier: row.tier as SponsorTier,
    name: row.name as string,
    description: row.description as string,
    icon: (row.icon as string) || undefined,
    url: row.url as string,
    subjects: JSON.parse((row.subjects as string) || '[]'),
    gradeLevels: JSON.parse((row.grade_levels as string) || '[]'),
    category: (row.category as string) || undefined,
    pricingInfo: (row.pricing_info as string) || undefined,
    displayPriority: row.display_priority as number,
    isActive: Boolean(row.is_active),
    contractStartDate: row.contract_start_date as string,
    contractEndDate: row.contract_end_date as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}
