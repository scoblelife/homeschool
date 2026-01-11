/**
 * Portfolio HTML Template Generator
 * Creates a printable HTML document for PDF export
 */

import type { PortfolioData, PortfolioConfig, PortfolioSection } from './types'
import { readFile } from 'fs/promises'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}hr`
  return `${hours}hr ${mins}min`
}

function getGradeLevelDisplay(gradeLevel: string): string {
  const map: Record<string, string> = {
    'pre-k': 'Pre-Kindergarten',
    'k': 'Kindergarten',
    '1st': '1st Grade',
    '2nd': '2nd Grade',
    '3rd': '3rd Grade',
    '4th': '4th Grade',
    '5th': '5th Grade',
    '6th': '6th Grade',
    '7th': '7th Grade',
    '8th': '8th Grade',
    '9th': '9th Grade',
    '10th': '10th Grade',
    '11th': '11th Grade',
    '12th': '12th Grade'
  }
  return map[gradeLevel] || gradeLevel
}

export function generateCoverPage(config: PortfolioConfig, data: PortfolioData): string {
  return `
    <div class="page cover-page">
      <div class="cover-content">
        <h1>${config.title}</h1>
        ${config.subtitle ? `<h2>${config.subtitle}</h2>` : ''}
        <div class="cover-details">
          <p class="student-name">${data.student.name}</p>
          <p class="grade-level">${getGradeLevelDisplay(data.student.gradeLevel)}</p>
          <p class="school-year">${config.schoolYear} School Year</p>
          <p class="date-range">${formatDate(config.dateRange.startDate)} - ${formatDate(config.dateRange.endDate)}</p>
        </div>
      </div>
    </div>
  `
}

export function generateStudentInfoPage(data: PortfolioData): string {
  return `
    <div class="page">
      <h2>Student Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Name</label>
          <span>${data.student.name}</span>
        </div>
        <div class="info-item">
          <label>Date of Birth</label>
          <span>${formatDate(data.student.dateOfBirth)}</span>
        </div>
        <div class="info-item">
          <label>Grade Level</label>
          <span>${getGradeLevelDisplay(data.student.gradeLevel)}</span>
        </div>
        <div class="info-item">
          <label>School Year</label>
          <span>${data.schoolYear}</span>
        </div>
      </div>
    </div>
  `
}

export function generateAttendancePage(data: PortfolioData): string {
  const { stats, records } = data.attendance

  // Group records by month
  const byMonth: Record<string, typeof records> = {}
  for (const record of records) {
    const month = record.date.substring(0, 7) // YYYY-MM
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(record)
  }

  const monthRows = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, recs]) => {
      const schoolDays = recs.filter(r => r.status === 'school').length
      const [year, monthNum] = month.split('-')
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      return `
        <tr>
          <td>${monthName}</td>
          <td>${schoolDays}</td>
          <td>${recs.length - schoolDays}</td>
          <td>${recs.length}</td>
        </tr>
      `
    })
    .join('')

  return `
    <div class="page">
      <h2>Attendance Record</h2>

      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-value">${stats.totalDays}</span>
          <span class="stat-label">Total Days</span>
        </div>
        <div class="stat-box success">
          <span class="stat-value">${stats.schoolDays}</span>
          <span class="stat-label">School Days</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${stats.absences}</span>
          <span class="stat-label">Non-School Days</span>
        </div>
        <div class="stat-box ${stats.percentage >= 90 ? 'success' : stats.percentage >= 80 ? 'warning' : 'danger'}">
          <span class="stat-value">${stats.percentage}%</span>
          <span class="stat-label">Attendance Rate</span>
        </div>
      </div>

      <h3>Monthly Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>School Days</th>
            <th>Non-School Days</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${monthRows}
        </tbody>
      </table>
    </div>
  `
}

export function generateActivitiesPage(data: PortfolioData): string {
  const totalActivities = data.activities.all.length
  const totalMinutes = data.activities.all.reduce((sum, a) => sum + (a.durationMinutes || 0), 0)

  // Show recent activities (last 20)
  const recentActivities = [...data.activities.all]
    .sort((a, b) => b.dateCompleted.localeCompare(a.dateCompleted))
    .slice(0, 20)

  const activityRows = recentActivities
    .map(activity => {
      const subject = data.subjects.find(s => s.id === activity.subjectId)
      return `
        <tr>
          <td>${formatDate(activity.dateCompleted)}</td>
          <td>${activity.title}</td>
          <td>${subject?.name || 'Unknown'}</td>
          <td>${activity.durationMinutes ? formatMinutes(activity.durationMinutes) : '-'}</td>
        </tr>
      `
    })
    .join('')

  return `
    <div class="page">
      <h2>Learning Activities</h2>

      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-value">${totalActivities}</span>
          <span class="stat-label">Total Activities</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${formatMinutes(totalMinutes)}</span>
          <span class="stat-label">Total Learning Time</span>
        </div>
      </div>

      <h3>Recent Activities</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>Subject</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${activityRows}
        </tbody>
      </table>
      ${totalActivities > 20 ? `<p class="note">Showing 20 of ${totalActivities} activities</p>` : ''}
    </div>
  `
}

export function generateSubjectsPage(data: PortfolioData): string {
  const subjectRows = data.subjects
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .map(subject => `
      <tr>
        <td>${subject.name}</td>
        <td>${subject.totalActivities}</td>
        <td>${formatMinutes(subject.totalMinutes)}</td>
      </tr>
    `)
    .join('')

  return `
    <div class="page">
      <h2>Subject Summaries</h2>

      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Activities</th>
            <th>Total Time</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>
    </div>
  `
}

export function generateReadingPage(data: PortfolioData): string {
  const bookRows = data.reading.books
    .map(book => `
      <tr>
        <td>${book.title}</td>
        <td>${book.author || '-'}</td>
        <td class="${book.status === 'finished' ? 'status-complete' : 'status-progress'}">
          ${book.status === 'finished' ? 'Completed' : book.status === 'reading' ? 'In Progress' : 'Not Started'}
        </td>
        <td>${book.pagesRead || 0}${book.totalPages ? ` / ${book.totalPages}` : ''}</td>
      </tr>
    `)
    .join('')

  return `
    <div class="page">
      <h2>Reading Log</h2>

      <div class="stats-grid">
        <div class="stat-box success">
          <span class="stat-value">${data.reading.booksCompleted}</span>
          <span class="stat-label">Books Completed</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${data.reading.currentlyReading}</span>
          <span class="stat-label">Currently Reading</span>
        </div>
      </div>

      ${data.reading.books.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${bookRows}
          </tbody>
        </table>
      ` : '<p class="no-data">No books recorded for this period.</p>'}
    </div>
  `
}

export function generateMilestonesPage(data: PortfolioData): string {
  const completedMilestones = data.milestones.items.filter(m => m.status === 'completed')
  const inProgressMilestones = data.milestones.items.filter(m => m.status === 'in_progress')

  const milestoneList = (items: typeof data.milestones.items, showDate: boolean) =>
    items
      .map(m => `
        <li>
          <strong>${m.title}</strong>
          <span class="milestone-subject">${m.subject}</span>
          ${showDate && m.completedDate ? `<span class="milestone-date">Completed: ${formatDate(m.completedDate)}</span>` : ''}
        </li>
      `)
      .join('')

  return `
    <div class="page">
      <h2>Milestones</h2>

      <div class="stats-grid">
        <div class="stat-box success">
          <span class="stat-value">${data.milestones.completed}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${data.milestones.inProgress}</span>
          <span class="stat-label">In Progress</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${data.milestones.total}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>

      ${completedMilestones.length > 0 ? `
        <h3>Completed Milestones</h3>
        <ul class="milestone-list">
          ${milestoneList(completedMilestones, true)}
        </ul>
      ` : ''}

      ${inProgressMilestones.length > 0 ? `
        <h3>In Progress</h3>
        <ul class="milestone-list">
          ${milestoneList(inProgressMilestones, false)}
        </ul>
      ` : ''}
    </div>
  `
}

export async function generatePhotosPage(data: PortfolioData): Promise<string> {
  // Limit to first 12 photos for PDF size
  const photosToShow = data.photos.slice(0, 12)

  const photoItems = await Promise.all(
    photosToShow.map(async (photo) => {
      try {
        const imageBuffer = await readFile(photo.path)
        const base64 = imageBuffer.toString('base64')
        const ext = photo.path.split('.').pop()?.toLowerCase() || 'jpg'
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

        return `
          <div class="photo-item">
            <img src="data:${mimeType};base64,${base64}" alt="${photo.activityTitle}" />
            <div class="photo-caption">
              <span class="photo-title">${photo.activityTitle}</span>
              <span class="photo-date">${formatDate(photo.date)}</span>
            </div>
          </div>
        `
      } catch {
        return '' // Skip photos that can't be read
      }
    })
  )

  return `
    <div class="page">
      <h2>Photo Gallery</h2>

      ${photosToShow.length > 0 ? `
        <div class="photo-grid">
          ${photoItems.filter(Boolean).join('')}
        </div>
        ${data.photos.length > 12 ? `<p class="note">Showing 12 of ${data.photos.length} photos</p>` : ''}
      ` : '<p class="no-data">No photos recorded for this period.</p>'}
    </div>
  `
}

export const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    color: #1f2937;
  }

  .page {
    padding: 40px;
    page-break-after: always;
    min-height: 100vh;
  }

  .page:last-child {
    page-break-after: auto;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  /* Cover Page */
  .cover-page {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .cover-content h1 {
    font-size: 3rem;
    color: white;
    margin-bottom: 0.5rem;
  }

  .cover-content h2 {
    font-size: 1.5rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    border: none;
  }

  .cover-details {
    margin-top: 3rem;
  }

  .cover-details p {
    margin: 0.5rem 0;
  }

  .cover-details .student-name {
    font-size: 2rem;
    font-weight: 600;
  }

  .cover-details .grade-level {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .cover-details .school-year {
    font-size: 1.25rem;
    margin-top: 1.5rem;
  }

  .cover-details .date-range {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .info-item {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .info-item label {
    display: block;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .info-item span {
    font-size: 1.125rem;
    font-weight: 500;
    color: #111827;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-box {
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    text-align: center;
  }

  .stat-box.success {
    background: #d1fae5;
  }

  .stat-box.warning {
    background: #fef3c7;
  }

  .stat-box.danger {
    background: #fee2e2;
  }

  .stat-value {
    display: block;
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
  }

  .stat-label {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }

  td {
    color: #1f2937;
    font-size: 0.875rem;
  }

  .status-complete {
    color: #059669;
    font-weight: 500;
  }

  .status-progress {
    color: #d97706;
    font-weight: 500;
  }

  /* Milestone List */
  .milestone-list {
    list-style: none;
    padding: 0;
  }

  .milestone-list li {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .milestone-list strong {
    display: block;
    color: #111827;
  }

  .milestone-subject {
    display: inline-block;
    font-size: 0.875rem;
    color: #6b7280;
    margin-right: 1rem;
  }

  .milestone-date {
    display: inline-block;
    font-size: 0.875rem;
    color: #059669;
  }

  /* Photo Grid */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
  }

  .photo-item {
    border-radius: 0.5rem;
    overflow: hidden;
    background: #f9fafb;
  }

  .photo-item img {
    width: 100%;
    height: 150px;
    object-fit: cover;
  }

  .photo-caption {
    padding: 0.5rem;
  }

  .photo-title {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .photo-date {
    display: block;
    font-size: 0.625rem;
    color: #6b7280;
  }

  /* Utilities */
  .note {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
  }

  .no-data {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  @media print {
    .page {
      padding: 20px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .photo-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`

export async function generateFullHTML(
  config: PortfolioConfig,
  data: PortfolioData
): Promise<string> {
  const enabledSections = config.sections.filter(s => s.enabled).map(s => s.id)
  const sections: string[] = []

  if (enabledSections.includes('cover')) {
    sections.push(generateCoverPage(config, data))
  }

  if (enabledSections.includes('student-info')) {
    sections.push(generateStudentInfoPage(data))
  }

  if (enabledSections.includes('attendance')) {
    sections.push(generateAttendancePage(data))
  }

  if (enabledSections.includes('activities')) {
    sections.push(generateActivitiesPage(data))
  }

  if (enabledSections.includes('subjects')) {
    sections.push(generateSubjectsPage(data))
  }

  if (enabledSections.includes('reading')) {
    sections.push(generateReadingPage(data))
  }

  if (enabledSections.includes('milestones')) {
    sections.push(generateMilestonesPage(data))
  }

  if (enabledSections.includes('photos') && config.includePhotos) {
    sections.push(await generatePhotosPage(data))
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title} - ${data.student.name}</title>
      <style>${styles}</style>
    </head>
    <body>
      ${sections.join('\n')}
    </body>
    </html>
  `
}
