/**
 * Type declarations for P2P libraries
 */

declare module 'hypercore' {
  import { EventEmitter } from 'events'

  interface HypercoreOptions {
    keyPair?: {
      publicKey: Buffer
      secretKey: Buffer
    }
  }

  class Hypercore extends EventEmitter {
    constructor(storage: string, key?: Buffer, options?: HypercoreOptions)

    key: Buffer
    discoveryKey: Buffer
    keyPair?: { publicKey: Buffer; secretKey: Buffer }
    length: number

    ready(): Promise<void>
    close(): Promise<void>
    append(data: Buffer): Promise<void>
    get(index: number): Promise<Buffer | null>
    createReadStream(options?: {
      start?: number
      end?: number
      live?: boolean
    }): AsyncIterable<Buffer>
    replicate(isInitiator: boolean): NodeJS.ReadWriteStream
  }

  export = Hypercore
}

declare module 'hyperswarm' {
  import { EventEmitter } from 'events'

  interface SwarmOptions {
    // Add options as needed
  }

  interface JoinOptions {
    server?: boolean
    client?: boolean
  }

  interface Discovery {
    flushed(): Promise<void>
  }

  interface PeerInfo {
    publicKey: Buffer
    client: boolean
  }

  class Hyperswarm extends EventEmitter {
    constructor(options?: SwarmOptions)

    join(topic: Buffer, options?: JoinOptions): Discovery
    leave(topic: Buffer): Promise<void>
    destroy(): Promise<void>

    on(event: 'connection', listener: (socket: NodeJS.ReadWriteStream, info: PeerInfo) => void): this
    on(event: string, listener: (...args: unknown[]) => void): this
  }

  export = Hyperswarm
}

declare module 'b4a' {
  export function from(input: string | Buffer | ArrayBuffer, encoding?: string): Buffer
  export function toString(buffer: Buffer, encoding?: string): string
  export function alloc(size: number): Buffer
  export function concat(buffers: Buffer[]): Buffer
}
