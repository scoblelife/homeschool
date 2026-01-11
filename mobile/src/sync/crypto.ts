/**
 * Mobile Sync Crypto Module
 *
 * Provides NaCl box encryption for secure peer-to-peer communication
 * and OAuth-style device joining using tweetnacl.
 */

import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'
import * as Crypto from 'expo-crypto'

export interface KeyPair {
  publicKey: string // base64
  secretKey: string // base64
}

/**
 * Generate a new keypair for device identity
 */
export function generateKeyPair(): KeyPair {
  const keyPair = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  }
}

/**
 * Generate a cryptographically secure nonce for one-time auth codes
 */
export async function generateNonce(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32)
  return encodeBase64(new Uint8Array(randomBytes))
}

/**
 * Generate a random topic ID for one-time use rooms
 */
export async function generateTopic(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16)
  // Use URL-safe base64
  const base64 = encodeBase64(new Uint8Array(randomBytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Encrypt a message for a specific recipient using NaCl box
 * The nonce is prepended to the ciphertext
 */
export function encrypt(
  message: string,
  recipientPubKey: string,
  senderSecretKey: string
): string {
  const messageBytes = new TextEncoder().encode(message)
  const nonce = nacl.randomBytes(nacl.box.nonceLength)

  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    decodeBase64(recipientPubKey),
    decodeBase64(senderSecretKey)
  )

  // Prepend nonce to ciphertext
  const result = new Uint8Array(nonce.length + ciphertext.length)
  result.set(nonce)
  result.set(ciphertext, nonce.length)

  return encodeBase64(result)
}

/**
 * Decrypt a message from a specific sender using NaCl box
 * Expects nonce to be prepended to the ciphertext
 */
export function decrypt(
  encrypted: string,
  senderPubKey: string,
  recipientSecretKey: string
): string | null {
  try {
    const data = decodeBase64(encrypted)
    const nonce = data.slice(0, nacl.box.nonceLength)
    const ciphertext = data.slice(nacl.box.nonceLength)

    const plaintext = nacl.box.open(
      ciphertext,
      nonce,
      decodeBase64(senderPubKey),
      decodeBase64(recipientSecretKey)
    )

    if (!plaintext) {
      return null
    }

    return new TextDecoder().decode(plaintext)
  } catch {
    return null
  }
}

/**
 * Hash data using SHA-256 (via expo-crypto)
 */
export async function hash(data: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  )
  return digest
}
