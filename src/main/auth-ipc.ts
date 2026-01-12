/**
 * Auth IPC Handlers
 *
 * IPC handlers for authentication and cloud backup features.
 */

import { ipcMain } from 'electron'
import { authService, cloudBackupService, initializeSupabase, isSupabaseConfigured } from '../auth'

export function registerAuthIpcHandlers(): void {
  // Auth Configuration
  ipcMain.handle('auth:configure', async (_, config: { supabaseUrl: string; supabaseAnonKey: string }) => {
    await authService.configure(config)
    return { success: true }
  })

  ipcMain.handle('auth:isConfigured', async () => {
    return isSupabaseConfigured()
  })

  // Auth State
  ipcMain.handle('auth:getState', async () => {
    return authService.getState()
  })

  // Sign Up
  ipcMain.handle('auth:signUp', async (_, email: string, password: string) => {
    return authService.signUp(email, password)
  })

  // Sign In
  ipcMain.handle('auth:signIn', async (_, email: string, password: string) => {
    return authService.signIn(email, password)
  })

  // OAuth Sign In
  ipcMain.handle('auth:signInWithOAuth', async (_, provider: 'google' | 'github' | 'apple') => {
    return authService.signInWithOAuth(provider)
  })

  // Sign Out
  ipcMain.handle('auth:signOut', async () => {
    cloudBackupService.clearKey()
    return authService.signOut()
  })

  // Password Reset
  ipcMain.handle('auth:resetPassword', async (_, email: string) => {
    return authService.resetPassword(email)
  })

  // Cloud Backup
  ipcMain.handle('backup:setKey', async (_, password: string, salt?: Uint8Array) => {
    const result = await cloudBackupService.generateKey(password, salt)
    return { success: true, salt: Array.from(result.salt) }
  })

  ipcMain.handle('backup:hasKey', async () => {
    return cloudBackupService.hasEncryptionKey()
  })

  ipcMain.handle('backup:create', async (_, eventLog: string) => {
    return cloudBackupService.createBackup(eventLog)
  })

  ipcMain.handle('backup:list', async () => {
    return cloudBackupService.listBackups()
  })

  ipcMain.handle('backup:restore', async (_, backupId: string) => {
    return cloudBackupService.restoreBackup(backupId)
  })

  ipcMain.handle('backup:delete', async (_, backupId: string) => {
    return cloudBackupService.deleteBackup(backupId)
  })
}
