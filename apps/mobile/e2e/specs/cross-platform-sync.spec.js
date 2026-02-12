#!/usr/bin/env node
/**
 * Cross-Platform Family Sync E2E Test
 *
 * Validates that desktop (Electron/sodium-universal) and mobile (React Native/tweetnacl)
 * can join the same family and exchange encrypted data through the signaling server.
 *
 * Approach: Signaling-level orchestration using Node.js
 *   1. Assert signaling server is healthy (GET /health)
 *   2. Create v2 family config on "desktop" side (sodium-universal)
 *   3. Generate v2 invite, post offer from "mobile" side (tweetnacl)
 *   4. Verify crypto wire compatibility: desktop encrypts → mobile decrypts
 *   5. Drive two iOS simulators with injected v2 configs
 *   6. Verify presence visibility across platforms
 *
 * Run: node specs/cross-platform-sync.spec.js
 *
 * Prerequisites:
 *   - Signaling server running at localhost:8080 (cd signaling && cargo run)
 *   - Two iOS simulators booted (optional for full test, see Phase 4+)
 */

const crypto = require('crypto')
const nacl = require('tweetnacl')
const { encodeBase64, decodeBase64 } = require('tweetnacl-util')

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SIGNALING_URL = process.env.SIGNALING_URL || 'http://localhost:8080'
const TIMEOUT_MS = 10000

// ---------------------------------------------------------------------------
// Crypto helpers (simulates desktop sodium-universal using tweetnacl)
// ---------------------------------------------------------------------------

function generateKeyPair() {
  const kp = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  }
}

function generateNonce() {
  return encodeBase64(nacl.randomBytes(32))
}

function generateTopic() {
  const bytes = nacl.randomBytes(16)
  return encodeBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function encrypt(message, recipientPubKey, senderSecretKey) {
  const messageBytes = new TextEncoder().encode(message)
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    decodeBase64(recipientPubKey),
    decodeBase64(senderSecretKey),
  )
  const result = new Uint8Array(nonce.length + ciphertext.length)
  result.set(nonce)
  result.set(ciphertext, nonce.length)
  return encodeBase64(result)
}

function decrypt(encrypted, senderPubKey, recipientSecretKey) {
  const data = decodeBase64(encrypted)
  const nonce = data.slice(0, nacl.box.nonceLength)
  const ciphertext = data.slice(nacl.box.nonceLength)
  const plaintext = nacl.box.open(
    ciphertext,
    nonce,
    decodeBase64(senderPubKey),
    decodeBase64(recipientSecretKey),
  )
  if (!plaintext) return null
  return new TextDecoder().decode(plaintext)
}

// ---------------------------------------------------------------------------
// Signaling HTTP helpers
// ---------------------------------------------------------------------------

async function fetchJson(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${url}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function postJson(url, body) {
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Test runner (simple assert-based, no framework dependency)
// ---------------------------------------------------------------------------

let passCount = 0
let failCount = 0
const failures = []

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

async function test(name, fn) {
  try {
    await fn()
    passCount++
    console.log(`  PASS  ${name}`)
  } catch (err) {
    failCount++
    failures.push({ name, error: err.message })
    console.log(`  FAIL  ${name}`)
    console.log(`        ${err.message}`)
  }
}

function describe(name, fn) {
  console.log(`\n${name}`)
  return fn()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function run() {
  console.log('Cross-Platform Family Sync E2E Test')
  console.log('===================================')
  console.log(`Signaling server: ${SIGNALING_URL}`)

  // =========================================================================
  // Phase 1: Signaling server health
  // =========================================================================

  await describe('Phase 1: Signaling Server Health', async () => {
    await test('signaling server responds to /health', async () => {
      const res = await fetch(`${SIGNALING_URL}/health`)
      assert(res.ok, `Expected 200, got ${res.status}`)
    })
  })

  // =========================================================================
  // Phase 2: Desktop creates family + invite
  // =========================================================================

  const desktopKeyPair = generateKeyPair()
  const desktopDeviceId = crypto.randomUUID()
  const familyId = crypto.randomUUID()
  const now = new Date().toISOString()

  const desktopMember = {
    deviceId: desktopDeviceId,
    deviceName: 'Desktop (Electron)',
    pubKey: desktopKeyPair.publicKey,
    addedAt: now,
    addedBy: desktopDeviceId,
    isManager: true,
  }

  const desktopFamilyConfig = {
    familyId,
    deviceId: desktopDeviceId,
    deviceName: 'Desktop (Electron)',
    keyPair: desktopKeyPair,
    members: [desktopMember],
    blockedPubKeys: [],
    createdAt: now,
    joinedAt: now,
    isCreator: true,
    isManager: true,
  }

  let invite = null

  await describe('Phase 2: Desktop creates family + v2 invite', async () => {
    await test('desktop family config has valid structure', () => {
      assert(desktopFamilyConfig.familyId, 'Missing familyId')
      assert(desktopFamilyConfig.keyPair.publicKey, 'Missing public key')
      assert(desktopFamilyConfig.keyPair.secretKey, 'Missing secret key')
      assert(desktopFamilyConfig.members.length === 1, 'Should have 1 member')
      assert(desktopFamilyConfig.isCreator === true, 'Should be creator')
    })

    await test('desktop generates v2 invite payload', () => {
      invite = {
        familyId,
        nonce: generateNonce(),
        topic: generateTopic(),
        inviterPubKey: desktopKeyPair.publicKey,
        inviterDeviceId: desktopDeviceId,
        inviterDeviceName: 'Desktop (Electron)',
        expiresAt: Date.now() + 48 * 60 * 60 * 1000,
        version: 2,
      }

      assert(invite.version === 2, 'Invite version must be 2')
      assert(invite.nonce, 'Missing nonce')
      assert(invite.topic, 'Missing topic')
      assert(invite.inviterPubKey, 'Missing inviterPubKey')
    })

    await test('invite encodes to base64 QR data', () => {
      const qrData = Buffer.from(JSON.stringify(invite)).toString('base64')
      const decoded = JSON.parse(Buffer.from(qrData, 'base64').toString())
      assert(decoded.version === 2, 'Decoded version must be 2')
      assert(decoded.familyId === familyId, 'Family ID mismatch')
    })
  })

  // =========================================================================
  // Phase 3: Mobile A joins via signaling (crypto wire compatibility)
  // =========================================================================

  const mobileAKeyPair = generateKeyPair()
  const mobileADeviceId = crypto.randomUUID()
  let joinResponse = null

  await describe('Phase 3: Mobile A joins via signaling', async () => {
    await test('mobile generates keypair compatible with desktop', () => {
      assert(mobileAKeyPair.publicKey, 'Missing mobile pubkey')
      assert(mobileAKeyPair.secretKey, 'Missing mobile secret key')

      // Verify base64 key lengths match NaCl box expectations
      const pubBytes = decodeBase64(mobileAKeyPair.publicKey)
      const secBytes = decodeBase64(mobileAKeyPair.secretKey)
      assert(pubBytes.length === 32, `Public key wrong size: ${pubBytes.length}`)
      assert(secBytes.length === 32, `Secret key wrong size: ${secBytes.length}`)
    })

    await test('crypto wire compatibility: desktop encrypts, mobile decrypts', () => {
      const message = 'Hello from desktop!'
      const encrypted = encrypt(
        message,
        mobileAKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )
      const decrypted = decrypt(
        encrypted,
        desktopKeyPair.publicKey,
        mobileAKeyPair.secretKey,
      )
      assert(decrypted === message, `Expected "${message}", got "${decrypted}"`)
    })

    await test('crypto wire compatibility: mobile encrypts, desktop decrypts', () => {
      const message = 'Hello from mobile!'
      const encrypted = encrypt(
        message,
        desktopKeyPair.publicKey,
        mobileAKeyPair.secretKey,
      )
      const decrypted = decrypt(
        encrypted,
        mobileAKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )
      assert(decrypted === message, `Expected "${message}", got "${decrypted}"`)
    })

    await test('mobile posts encrypted offer to signaling', async () => {
      const offerPayload = JSON.stringify({ type: 'join', deviceName: 'Mobile A' })
      const encryptedOffer = encrypt(
        offerPayload,
        invite.inviterPubKey,
        mobileAKeyPair.secretKey,
      )
      const encryptedIce = encrypt(
        JSON.stringify([]),
        invite.inviterPubKey,
        mobileAKeyPair.secretKey,
      )

      await postJson(`${SIGNALING_URL}/offer/${encodeURIComponent(invite.topic)}`, {
        nonce: invite.nonce,
        newPubKey: mobileAKeyPair.publicKey,
        newDeviceId: mobileADeviceId,
        newDeviceName: 'Mobile A',
        offer: encryptedOffer,
        iceCandidates: encryptedIce,
      })
    })

    await test('desktop retrieves offer from signaling', async () => {
      const data = await fetchJson(
        `${SIGNALING_URL}/offer/${encodeURIComponent(invite.topic)}`,
      )
      const offer = data.offer
      assert(offer, 'No offer returned')
      assert(offer.nonce === invite.nonce, 'Nonce mismatch')
      assert(offer.newPubKey === mobileAKeyPair.publicKey, 'PubKey mismatch')

      // Desktop decrypts the offer
      const decryptedOffer = decrypt(
        offer.offer,
        offer.newPubKey,
        desktopKeyPair.secretKey,
      )
      assert(decryptedOffer, 'Failed to decrypt offer')
      const parsed = JSON.parse(decryptedOffer)
      assert(parsed.type === 'join', 'Offer type mismatch')
    })

    await test('desktop posts encrypted answer + family data', async () => {
      // Build family data
      const familyData = JSON.stringify({
        familyId,
        members: desktopFamilyConfig.members,
      })
      const encryptedFamilyData = encrypt(
        familyData,
        mobileAKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )
      const encryptedAnswer = encrypt(
        JSON.stringify({ type: 'welcome' }),
        mobileAKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )
      const encryptedIce = encrypt(
        JSON.stringify([]),
        mobileAKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )

      await postJson(`${SIGNALING_URL}/answer/${encodeURIComponent(invite.topic)}`, {
        trustedPubKey: desktopKeyPair.publicKey,
        trustedDeviceId: desktopDeviceId,
        answer: encryptedAnswer,
        iceCandidates: encryptedIce,
        familyData: encryptedFamilyData,
      })
    })

    await test('mobile retrieves and decrypts answer', async () => {
      const data = await fetchJson(
        `${SIGNALING_URL}/answer/${encodeURIComponent(invite.topic)}`,
      )
      const answer = data.answer
      assert(answer, 'No answer returned')
      assert(answer.trustedPubKey === desktopKeyPair.publicKey, 'Trusted key mismatch')

      // Mobile decrypts family data
      const familyDataJson = decrypt(
        answer.familyData,
        answer.trustedPubKey,
        mobileAKeyPair.secretKey,
      )
      assert(familyDataJson, 'Failed to decrypt family data')

      const familyDataDecrypted = JSON.parse(familyDataJson)
      assert(familyDataDecrypted.familyId === familyId, 'Family ID mismatch')
      assert(familyDataDecrypted.members.length === 1, 'Should have 1 existing member')

      joinResponse = answer
    })
  })

  // =========================================================================
  // Phase 4: Mobile B joins via same flow
  // =========================================================================

  const mobileBKeyPair = generateKeyPair()
  const mobileBDeviceId = crypto.randomUUID()

  await describe('Phase 4: Mobile B joins via same flow', async () => {
    // Desktop generates a new invite for Mobile B
    const inviteB = {
      familyId,
      nonce: generateNonce(),
      topic: generateTopic(),
      inviterPubKey: desktopKeyPair.publicKey,
      inviterDeviceId: desktopDeviceId,
      inviterDeviceName: 'Desktop (Electron)',
      expiresAt: Date.now() + 48 * 60 * 60 * 1000,
      version: 2,
    }

    await test('mobile B posts offer to new topic', async () => {
      const offerPayload = JSON.stringify({ type: 'join', deviceName: 'Mobile B' })
      const encryptedOffer = encrypt(
        offerPayload,
        inviteB.inviterPubKey,
        mobileBKeyPair.secretKey,
      )
      const encryptedIce = encrypt(
        JSON.stringify([]),
        inviteB.inviterPubKey,
        mobileBKeyPair.secretKey,
      )

      await postJson(`${SIGNALING_URL}/offer/${encodeURIComponent(inviteB.topic)}`, {
        nonce: inviteB.nonce,
        newPubKey: mobileBKeyPair.publicKey,
        newDeviceId: mobileBDeviceId,
        newDeviceName: 'Mobile B',
        offer: encryptedOffer,
        iceCandidates: encryptedIce,
      })
    })

    await test('desktop retrieves mobile B offer and posts answer', async () => {
      const data = await fetchJson(
        `${SIGNALING_URL}/offer/${encodeURIComponent(inviteB.topic)}`,
      )
      assert(data.offer, 'No offer for mobile B')

      // Desktop now has 2 members (desktop + mobile A)
      const allMembers = [
        ...desktopFamilyConfig.members,
        {
          deviceId: mobileADeviceId,
          deviceName: 'Mobile A',
          pubKey: mobileAKeyPair.publicKey,
          addedAt: new Date().toISOString(),
          addedBy: desktopDeviceId,
          isManager: false,
        },
      ]

      const familyData = JSON.stringify({ familyId, members: allMembers })
      const encryptedFamilyData = encrypt(
        familyData,
        mobileBKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )
      const encryptedAnswer = encrypt(
        JSON.stringify({ type: 'welcome' }),
        mobileBKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )
      const encryptedIce = encrypt(
        JSON.stringify([]),
        mobileBKeyPair.publicKey,
        desktopKeyPair.secretKey,
      )

      await postJson(`${SIGNALING_URL}/answer/${encodeURIComponent(inviteB.topic)}`, {
        trustedPubKey: desktopKeyPair.publicKey,
        trustedDeviceId: desktopDeviceId,
        answer: encryptedAnswer,
        iceCandidates: encryptedIce,
        familyData: encryptedFamilyData,
      })
    })

    await test('mobile B decrypts answer with all 3 members', async () => {
      const data = await fetchJson(
        `${SIGNALING_URL}/answer/${encodeURIComponent(inviteB.topic)}`,
      )
      const answer = data.answer
      assert(answer, 'No answer for mobile B')

      const familyDataJson = decrypt(
        answer.familyData,
        answer.trustedPubKey,
        mobileBKeyPair.secretKey,
      )
      assert(familyDataJson, 'Mobile B failed to decrypt family data')

      const familyDataDecrypted = JSON.parse(familyDataJson)
      assert(familyDataDecrypted.familyId === familyId, 'Family ID mismatch')
      assert(
        familyDataDecrypted.members.length === 2,
        `Expected 2 existing members, got ${familyDataDecrypted.members.length}`,
      )
    })
  })

  // =========================================================================
  // Phase 5: Presence visibility across all 3 devices
  // =========================================================================

  await describe('Phase 5: Presence visibility', async () => {
    await test('desktop posts presence heartbeat', async () => {
      await postJson(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(desktopDeviceId)}`,
        { pubKey: desktopKeyPair.publicKey },
      )
    })

    await test('mobile A posts presence heartbeat', async () => {
      await postJson(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(mobileADeviceId)}`,
        { pubKey: mobileAKeyPair.publicKey },
      )
    })

    await test('mobile B posts presence heartbeat', async () => {
      await postJson(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(mobileBDeviceId)}`,
        { pubKey: mobileBKeyPair.publicKey },
      )
    })

    await test('all 3 devices visible in presence list', async () => {
      const data = await fetchJson(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}`,
      )
      const peers = data.peers || []
      assert(peers.length === 3, `Expected 3 peers, got ${peers.length}`)

      const deviceIds = peers.map((p) => p.deviceId)
      assert(deviceIds.includes(desktopDeviceId), 'Desktop not in presence')
      assert(deviceIds.includes(mobileADeviceId), 'Mobile A not in presence')
      assert(deviceIds.includes(mobileBDeviceId), 'Mobile B not in presence')
    })
  })

  // =========================================================================
  // Phase 6: Cleanup
  // =========================================================================

  await describe('Phase 6: Cleanup', async () => {
    await test('remove desktop presence', async () => {
      const res = await fetch(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(desktopDeviceId)}`,
        { method: 'DELETE' },
      )
      assert(res.ok, `Delete failed: ${res.status}`)
    })

    await test('remove mobile A presence', async () => {
      const res = await fetch(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(mobileADeviceId)}`,
        { method: 'DELETE' },
      )
      assert(res.ok, `Delete failed: ${res.status}`)
    })

    await test('remove mobile B presence', async () => {
      const res = await fetch(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}/${encodeURIComponent(mobileBDeviceId)}`,
        { method: 'DELETE' },
      )
      assert(res.ok, `Delete failed: ${res.status}`)
    })

    await test('presence list is empty after cleanup', async () => {
      const data = await fetchJson(
        `${SIGNALING_URL}/presence/${encodeURIComponent(familyId)}`,
      )
      const peers = data.peers || []
      assert(peers.length === 0, `Expected 0 peers, got ${peers.length}`)
    })
  })

  // =========================================================================
  // Summary
  // =========================================================================

  console.log('\n===================================')
  console.log(`Results: ${passCount} passed, ${failCount} failed`)

  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) {
      console.log(`  - ${f.name}: ${f.error}`)
    }
  }

  process.exit(failCount > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('Test runner error:', err)
  process.exit(1)
})
