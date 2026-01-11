/**
 * Sync Crypto Module
 *
 * Provides Ed25519 keypairs and NaCl box encryption for secure
 * peer-to-peer communication and OAuth-style device joining.
 */

import sodium from 'sodium-universal'

export interface KeyPair {
  publicKey: string // base64
  secretKey: string // base64
}

/**
 * Generate a new Ed25519 keypair for device identity
 */
export function generateKeyPair(): KeyPair {
  const publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES)
  const secretKey = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES)

  sodium.crypto_box_keypair(publicKey, secretKey)

  return {
    publicKey: publicKey.toString('base64'),
    secretKey: secretKey.toString('base64'),
  }
}

/**
 * Generate a cryptographically secure nonce for one-time auth codes
 */
export function generateNonce(): string {
  const nonce = Buffer.alloc(32)
  sodium.randombytes_buf(nonce)
  return nonce.toString('base64')
}

/**
 * Generate a random topic ID for one-time use rooms
 */
export function generateTopic(): string {
  const topic = Buffer.alloc(16)
  sodium.randombytes_buf(topic)
  return topic.toString('base64url')
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
  const messageBytes = Buffer.from(message, 'utf8')
  const nonce = Buffer.alloc(sodium.crypto_box_NONCEBYTES)
  sodium.randombytes_buf(nonce)

  const ciphertext = Buffer.alloc(messageBytes.length + sodium.crypto_box_MACBYTES)

  sodium.crypto_box_easy(
    ciphertext,
    messageBytes,
    nonce,
    Buffer.from(recipientPubKey, 'base64'),
    Buffer.from(senderSecretKey, 'base64')
  )

  // Prepend nonce to ciphertext
  const result = Buffer.concat([nonce, ciphertext])
  return result.toString('base64')
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
    const data = Buffer.from(encrypted, 'base64')
    const nonce = data.subarray(0, sodium.crypto_box_NONCEBYTES)
    const ciphertext = data.subarray(sodium.crypto_box_NONCEBYTES)

    const plaintext = Buffer.alloc(ciphertext.length - sodium.crypto_box_MACBYTES)

    const success = sodium.crypto_box_open_easy(
      plaintext,
      ciphertext,
      nonce,
      Buffer.from(senderPubKey, 'base64'),
      Buffer.from(recipientSecretKey, 'base64')
    )

    if (!success) {
      return null
    }

    return plaintext.toString('utf8')
  } catch {
    return null
  }
}

/**
 * Sign a message with the device's secret key
 */
export function sign(message: string, secretKey: string): string {
  // Convert box keypair to sign keypair
  const signSecretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
  const signPublicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)

  // Note: sodium-universal uses crypto_sign_seed_keypair for deterministic keys
  // For signing, we'll use the secret key as a seed
  const seed = Buffer.from(secretKey, 'base64').subarray(0, sodium.crypto_sign_SEEDBYTES)
  sodium.crypto_sign_seed_keypair(signPublicKey, signSecretKey, seed)

  const messageBytes = Buffer.from(message, 'utf8')
  const signature = Buffer.alloc(sodium.crypto_sign_BYTES)

  sodium.crypto_sign_detached(signature, messageBytes, signSecretKey)

  return signature.toString('base64')
}

/**
 * Verify a signature
 */
export function verify(message: string, signature: string, publicKey: string): boolean {
  try {
    // Convert box public key to sign public key
    const signSecretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
    const signPublicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)

    // For verification, we need the corresponding sign public key
    // This is a limitation - we'd need to store sign keys separately
    // For now, we'll skip signature verification in the initial implementation
    // TODO: Store sign keypairs alongside box keypairs

    const messageBytes = Buffer.from(message, 'utf8')
    const signatureBytes = Buffer.from(signature, 'base64')

    return sodium.crypto_sign_verify_detached(
      signatureBytes,
      messageBytes,
      Buffer.from(publicKey, 'base64')
    )
  } catch {
    return false
  }
}

/**
 * Hash data using BLAKE2b
 */
export function hash(data: string): string {
  const output = Buffer.alloc(32)
  sodium.crypto_generichash(output, Buffer.from(data, 'utf8'))
  return output.toString('base64')
}
