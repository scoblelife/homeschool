/**
 * PDF Generator using Electron's built-in PDF printing
 */

import { BrowserWindow, app } from 'electron'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { PortfolioConfig, PortfolioData, GeneratePDFResult } from './types'
import { collectPortfolioData } from './dataCollector'
import { generateFullHTML } from './htmlTemplate'

/**
 * Generate a portfolio PDF
 */
export async function generatePortfolioPDF(config: PortfolioConfig): Promise<GeneratePDFResult> {
  let window: BrowserWindow | null = null

  try {
    // Collect all portfolio data
    const data = await collectPortfolioData(config)

    // Generate HTML
    const html = await generateFullHTML(config, data)

    // Create hidden window for PDF generation
    window = new BrowserWindow({
      width: 816, // 8.5 inches at 96 DPI
      height: 1056, // 11 inches at 96 DPI
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // Load HTML content
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    // Wait for content to be ready
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate PDF
    const pdfBuffer = await window.webContents.printToPDF({
      printBackground: true,
      pageSize: 'Letter',
      margins: {
        marginType: 'custom',
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5
      }
    })

    // Ensure output directory exists
    const outputDir = dirname(config.title)
    const portfolioDir = join(app.getPath('documents'), 'Homeschool Portfolios')
    await mkdir(portfolioDir, { recursive: true })

    // Create filename
    const sanitizedName = data.student.name.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Portfolio_${sanitizedName}_${config.schoolYear.replace('/', '-')}_${timestamp}.pdf`
    const outputPath = join(portfolioDir, filename)

    // Write PDF file
    await writeFile(outputPath, pdfBuffer)

    return {
      success: true,
      filePath: outputPath
    }
  } catch (error) {
    console.error('Failed to generate portfolio PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    if (window) {
      window.close()
    }
  }
}

/**
 * Preview portfolio HTML in a window (for development/preview)
 */
export async function previewPortfolioHTML(config: PortfolioConfig): Promise<string> {
  const data = await collectPortfolioData(config)
  return generateFullHTML(config, data)
}

/**
 * Get default portfolio configuration
 */
export function getDefaultConfig(studentId: string, schoolYear: string): PortfolioConfig {
  // Calculate school year date range
  const [startYear] = schoolYear.split('/')
  const startDate = `${startYear}-08-01`
  const endYear = parseInt(startYear) + 1
  const endDate = `${endYear}-07-31`

  return {
    title: 'Homeschool Portfolio',
    schoolYear,
    studentId,
    dateRange: {
      startDate,
      endDate
    },
    sections: [
      { id: 'cover', name: 'Cover Page', enabled: true },
      { id: 'student-info', name: 'Student Information', enabled: true },
      { id: 'attendance', name: 'Attendance Record', enabled: true },
      { id: 'activities', name: 'Learning Activities', enabled: true },
      { id: 'subjects', name: 'Subject Summaries', enabled: true },
      { id: 'reading', name: 'Reading Log', enabled: true },
      { id: 'milestones', name: 'Milestones', enabled: true },
      { id: 'photos', name: 'Photo Gallery', enabled: false }
    ],
    includePhotos: false,
    includeSummaryStats: true
  }
}

/**
 * Get current school year string (e.g., "2025/2026")
 */
export function getCurrentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // If we're in Jan-Jul, school year started previous August
  // If we're in Aug-Dec, school year started this August
  const startYear = month < 7 ? year - 1 : year
  return `${startYear}/${startYear + 1}`
}
