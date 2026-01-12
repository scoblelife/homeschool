/**
 * AI IPC Handlers
 *
 * Exposes AI service to the renderer process via IPC.
 */

import { ipcMain } from 'electron'
import { aiService } from './aiService'

export function registerAIHandlers(): void {
  // Initialize AI service
  ipcMain.handle('ai:initialize', async () => {
    await aiService.initialize()
    return { success: true }
  })

  // Check if AI is available
  ipcMain.handle('ai:isAvailable', () => {
    return aiService.isAvailable()
  })

  // Get AI configuration
  ipcMain.handle('ai:getConfig', () => {
    return aiService.getConfig()
  })

  // Set API key
  ipcMain.handle('ai:setApiKey', async (_event, apiKey: string | null) => {
    await aiService.setApiKey(apiKey)
    return { success: true }
  })

  // Enable/disable AI
  ipcMain.handle('ai:setEnabled', async (_event, enabled: boolean) => {
    await aiService.setEnabled(enabled)
    return { success: true }
  })

  // Send completion request
  ipcMain.handle(
    'ai:complete',
    async (
      _event,
      prompt: string,
      options?: {
        maxTokens?: number
        temperature?: number
        systemPrompt?: string
        useCache?: boolean
      }
    ) => {
      try {
        const response = await aiService.complete(prompt, options)
        return { success: true, response }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }
  )

  // Clear cache
  ipcMain.handle('ai:clearCache', async () => {
    await aiService.clearCache()
    return { success: true }
  })
}
