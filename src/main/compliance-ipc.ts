/**
 * Compliance IPC Handlers
 *
 * IPC handlers for state homeschool compliance features.
 */

import { ipcMain } from 'electron'
import {
  getStateRequirements,
  getSupportedStates,
  getUpcomingDeadlines,
  generateNoticeOfIntent,
  generateAttendanceRecord,
  generateIHIP,
  generateQuarterlyReport,
  type DocumentData,
} from '../features/compliance'

export function registerComplianceIpcHandlers(): void {
  // Get supported states list
  ipcMain.handle('compliance:getSupportedStates', async () => {
    return getSupportedStates()
  })

  // Get requirements for a specific state
  ipcMain.handle('compliance:getStateRequirements', async (_, stateCode: string) => {
    return getStateRequirements(stateCode)
  })

  // Get upcoming deadlines for a state
  ipcMain.handle('compliance:getUpcomingDeadlines', async (_, stateCode: string, referenceDate?: string) => {
    const date = referenceDate ? new Date(referenceDate) : new Date()
    return getUpcomingDeadlines(stateCode, date)
  })

  // Generate Notice of Intent document
  ipcMain.handle('compliance:generateNoticeOfIntent', async (_, data: DocumentData) => {
    return generateNoticeOfIntent(data)
  })

  // Generate Attendance Record document
  ipcMain.handle(
    'compliance:generateAttendanceRecord',
    async (_, data: DocumentData, attendanceData: Array<{ date: string; status: string }>) => {
      return generateAttendanceRecord(data, attendanceData)
    }
  )

  // Generate IHIP (Individualized Home Instruction Plan) for NY
  ipcMain.handle(
    'compliance:generateIHIP',
    async (_, data: DocumentData, curriculum: Array<{ subject: string; materials: string; goals: string }>) => {
      return generateIHIP(data, curriculum)
    }
  )

  // Generate Quarterly Report for NY
  ipcMain.handle(
    'compliance:generateQuarterlyReport',
    async (
      _,
      data: DocumentData,
      quarter: 1 | 2 | 3 | 4,
      activities: Array<{ subject: string; description: string; hours: number }>
    ) => {
      return generateQuarterlyReport(data, quarter, activities)
    }
  )
}
