import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initializeSchema, seedDefaultSubjects, seedMilestoneTemplates, closeDatabase } from '../database'
import { registerIpcHandlers } from './ipc'
import { registerSyncIPC, shutdownSync } from './sync-ipc'
import { errorReporting } from '../errorReporting'
import { registerAIHandlers } from '../ai'
import { registerComplianceIpcHandlers } from './compliance-ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 12 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Window control IPC handlers
function registerWindowControls(): void {
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.restore()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  ipcMain.handle('window:getPlatform', () => {
    return process.platform
  })
}

app.whenReady().then(async () => {
  // Initialize error reporting first
  errorReporting.initialize()

  // Register window control handlers
  registerWindowControls()

  electronApp.setAppUserModelId('com.homeschool')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database (required for app to function)
  try {
    await initializeSchema()
    await seedDefaultSubjects()
    await seedMilestoneTemplates()
  } catch (err) {
    console.error('[Main] Database initialization failed:', err)
    // Still try to create window - user can see error in UI
  }

  // Register IPC handlers (required for UI to work)
  try {
    registerIpcHandlers()
  } catch (err) {
    console.error('[Main] Failed to register IPC handlers:', err)
  }

  // Register sync handlers (optional - sync can fail gracefully)
  try {
    registerSyncIPC()
  } catch (err) {
    console.error('[Main] Failed to register sync IPC:', err)
  }

  // Register AI handlers (optional - AI features can fail gracefully)
  try {
    registerAIHandlers()
  } catch (err) {
    console.error('[Main] Failed to register AI IPC:', err)
  }

  // Register compliance handlers (optional - compliance features can fail gracefully)
  try {
    registerComplianceIpcHandlers()
  } catch (err) {
    console.error('[Main] Failed to register compliance IPC:', err)
  }

  // Always create window, even if initialization partially failed
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await shutdownSync()
  await closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
