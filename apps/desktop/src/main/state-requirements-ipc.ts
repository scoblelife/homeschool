/**
 * IPC handlers for state requirements OTA data.
 */
import { ipcMain } from 'electron'
import {
  getCurrentData,
  getUpdateStatus,
  checkForUpdate,
} from './stateRequirementsUpdater'

export function registerStateRequirementsIPC(): void {
  ipcMain.handle('stateRequirements:getData', () => {
    return getCurrentData()
  })

  ipcMain.handle('stateRequirements:getUpdateStatus', () => {
    return getUpdateStatus()
  })

  ipcMain.handle('stateRequirements:checkForUpdate', async () => {
    return checkForUpdate()
  })
}
