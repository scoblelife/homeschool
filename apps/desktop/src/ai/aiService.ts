/**
 * AI Service Module
 *
 * Provides AI-powered features using Claude API.
 * Handles API key management, rate limiting, and caching.
 */

import Anthropic from '@anthropic-ai/sdk'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const CONFIG_FILE = 'ai-config.json'
const CACHE_FILE = 'ai-cache.json'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface AIConfig {
  apiKey: string | null
  enabled: boolean
  cacheEnabled: boolean
}

interface CacheEntry {
  response: string
  timestamp: number
  promptHash: string
}

interface AICache {
  entries: Record<string, CacheEntry>
}

class AIService {
  private client: Anthropic | null = null
  private config: AIConfig = {
    apiKey: null,
    enabled: true,
    cacheEnabled: true,
  }
  private cache: AICache = { entries: {} }
  private configPath: string = ''
  private cachePath: string = ''
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    const userDataPath = app.getPath('userData')
    this.configPath = path.join(userDataPath, CONFIG_FILE)
    this.cachePath = path.join(userDataPath, CACHE_FILE)

    await this.loadConfig()
    await this.loadCache()

    if (this.config.apiKey) {
      this.initializeClient()
    }

    this.initialized = true
  }

  private async loadConfig(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        const parsed = JSON.parse(data) as Partial<AIConfig>
        this.config = {
          apiKey: parsed.apiKey ?? null,
          enabled: parsed.enabled ?? true,
          cacheEnabled: parsed.cacheEnabled ?? true,
        }
      }
    } catch (err) {
      console.error('[AI] Failed to load config:', err)
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
    } catch (err) {
      console.error('[AI] Failed to save config:', err)
    }
  }

  private async loadCache(): Promise<void> {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = fs.readFileSync(this.cachePath, 'utf-8')
        this.cache = JSON.parse(data) as AICache
        this.cleanExpiredCache()
      }
    } catch (err) {
      console.error('[AI] Failed to load cache:', err)
      this.cache = { entries: {} }
    }
  }

  private async saveCache(): Promise<void> {
    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2))
    } catch (err) {
      console.error('[AI] Failed to save cache:', err)
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now()
    const entries = this.cache.entries
    for (const key of Object.keys(entries)) {
      if (now - entries[key].timestamp > CACHE_TTL_MS) {
        delete entries[key]
      }
    }
  }

  private initializeClient(): void {
    if (this.config.apiKey) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
      })
    }
  }

  private hashPrompt(prompt: string): string {
    // Simple hash for cache key
    let hash = 0
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * Set or update the API key
   */
  async setApiKey(apiKey: string | null): Promise<void> {
    this.config.apiKey = apiKey
    await this.saveConfig()

    if (apiKey) {
      this.initializeClient()
    } else {
      this.client = null
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config }
  }

  /**
   * Check if AI is available (API key configured)
   */
  isAvailable(): boolean {
    return this.config.enabled && this.client !== null
  }

  /**
   * Enable or disable AI features
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.config.enabled = enabled
    await this.saveConfig()
  }

  /**
   * Send a prompt to Claude and get a response
   */
  async complete(
    prompt: string,
    options: {
      maxTokens?: number
      temperature?: number
      systemPrompt?: string
      useCache?: boolean
    } = {}
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI service not available. Please configure your API key.')
    }

    const {
      maxTokens = 1024,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant for a homeschool management app.',
      useCache = this.config.cacheEnabled,
    } = options

    // Check cache
    const cacheKey = this.hashPrompt(systemPrompt + prompt)
    if (useCache && this.cache.entries[cacheKey]) {
      const entry = this.cache.entries[cacheKey]
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return entry.response
      }
    }

    try {
      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      })

      const text =
        response.content[0].type === 'text' ? response.content[0].text : ''

      // Cache response
      if (useCache) {
        this.cache.entries[cacheKey] = {
          response: text,
          timestamp: Date.now(),
          promptHash: cacheKey,
        }
        await this.saveCache()
      }

      return text
    } catch (err) {
      console.error('[AI] API call failed:', err)
      throw err
    }
  }

  /**
   * Clear the response cache
   */
  async clearCache(): Promise<void> {
    this.cache = { entries: {} }
    await this.saveCache()
  }
}

// Singleton instance
export const aiService = new AIService()
