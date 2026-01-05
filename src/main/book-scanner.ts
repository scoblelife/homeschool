import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'
import { EventSource } from 'eventsource'
import type { ScannedBook, ScannerSession } from '../shared/types'

// GitHub Pages URL for the scanner web app
const SCANNER_PAGE_URL = 'https://wscoble.github.io/homeschool/scanner'

interface SmeeEvent {
  body: {
    type: 'book' | 'ping'
    data?: ScannedBook
  }
}

interface MessageEvent {
  data: string
}

class BookScanner {
  private eventSource: EventSource | null = null
  private channelId: string | null = null
  private channelUrl: string | null = null
  private onBookCallback: ((book: ScannedBook) => void) | null = null

  async start(): Promise<ScannerSession> {
    // Generate a unique channel ID
    this.channelId = uuidv4()
    this.channelUrl = `https://smee.io/${this.channelId}`

    // Create the full URL for the phone scanner page
    const scannerUrl = `${SCANNER_PAGE_URL}?channel=${this.channelId}`

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(scannerUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // Connect to smee.io channel to receive events
    this.eventSource = new EventSource(this.channelUrl)

    this.eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as SmeeEvent
        if (data.body?.type === 'book' && data.body.data && this.onBookCallback) {
          this.onBookCallback(data.body.data)
        }
      } catch (err: unknown) {
        console.error('Failed to parse smee event:', err)
      }
    }

    this.eventSource.onerror = (err: unknown) => {
      console.error('Smee EventSource error:', err)
    }

    return {
      channelId: this.channelId,
      channelUrl: this.channelUrl,
      qrCodeDataUrl,
      isActive: true
    }
  }

  stop(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.channelId = null
    this.channelUrl = null
  }

  onBook(callback: (book: ScannedBook) => void): void {
    this.onBookCallback = callback
  }

  getStatus(): { isRunning: boolean; channelId: string | null } {
    return {
      isRunning: this.eventSource !== null,
      channelId: this.channelId
    }
  }
}

// Singleton instance
export const bookScanner = new BookScanner()
