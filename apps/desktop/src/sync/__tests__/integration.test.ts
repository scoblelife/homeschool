/**
 * Sync Integration Tests
 *
 * Tests the WebRTC signaling flow via the Cloudflare Worker.
 * These tests simulate multiple devices exchanging signaling messages.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { SignalingClient, type SignalingMessage, type JoinOffer, type JoinAnswer } from '../signalingClient'
import { WORKER_URL } from '../config'

// Use the production worker for integration tests
const TEST_WORKER_URL = WORKER_URL

// Generate unique IDs for test isolation
function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Helper to wait for a condition with retries (for eventual consistency)
async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (result: T) => boolean,
  maxAttempts = 5,
  delayMs = 200
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await fn()
    if (predicate(result)) {
      return result
    }
    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return fn() // Return last result for assertion
}

describe('Cloudflare Worker Health', () => {
  let client: SignalingClient

  beforeAll(() => {
    client = new SignalingClient(TEST_WORKER_URL)
  })

  it('should respond to health check', async () => {
    const healthy = await client.healthCheck()
    expect(healthy).toBe(true)
  })
})

describe('Presence System', () => {
  it('should register device presence via heartbeat', async () => {
    const client = new SignalingClient(TEST_WORKER_URL)
    const familyId = generateTestId()
    const deviceId = generateTestId()

    await client.heartbeat(familyId, deviceId, 'pubkey1')

    const peers = await client.getOnlinePeers(familyId)
    expect(peers).toHaveLength(1)
    expect(peers[0].deviceId).toBe(deviceId)
    expect(peers[0].pubKey).toBe('pubkey1')

    // Cleanup
    await client.removePresence(familyId, deviceId)
  })

  it('should show multiple online peers', async () => {
    const client1 = new SignalingClient(TEST_WORKER_URL)
    const client2 = new SignalingClient(TEST_WORKER_URL)
    const familyId = generateTestId()
    const device1Id = generateTestId()
    const device2Id = generateTestId()

    // Register both devices in quick succession
    await client1.heartbeat(familyId, device1Id, 'pubkey1')
    await client2.heartbeat(familyId, device2Id, 'pubkey2')

    const peers = await client1.getOnlinePeers(familyId)
    expect(peers).toHaveLength(2)

    const deviceIds = peers.map((p) => p.deviceId).sort()
    expect(deviceIds).toContain(device1Id)
    expect(deviceIds).toContain(device2Id)

    // Cleanup
    await client1.removePresence(familyId, device1Id)
    await client2.removePresence(familyId, device2Id)
  })

  it('should remove presence when requested', async () => {
    const client1 = new SignalingClient(TEST_WORKER_URL)
    const client2 = new SignalingClient(TEST_WORKER_URL)
    const familyId = generateTestId()
    const device1Id = generateTestId()
    const device2Id = generateTestId()

    // Register both devices
    await client1.heartbeat(familyId, device1Id, 'pubkey1')
    await client2.heartbeat(familyId, device2Id, 'pubkey2')

    // Remove device 1
    await client1.removePresence(familyId, device1Id)

    const peers = await client2.getOnlinePeers(familyId)
    expect(peers).toHaveLength(1)
    expect(peers[0].deviceId).toBe(device2Id)

    // Cleanup
    await client2.removePresence(familyId, device2Id)
  })
})

describe('Signaling Message Exchange', () => {
  let client1: SignalingClient
  let client2: SignalingClient
  let topic: string
  let device1Id: string
  let device2Id: string

  beforeAll(() => {
    client1 = new SignalingClient(TEST_WORKER_URL)
    client2 = new SignalingClient(TEST_WORKER_URL)
    topic = generateTestId()
    device1Id = generateTestId()
    device2Id = generateTestId()
  })

  it('should send and receive signaling messages', async () => {
    // Device 1 sends an offer to Device 2
    const offerMessage: SignalingMessage = {
      type: 'offer',
      from: device1Id,
      to: device2Id,
      payload: {
        sdp: 'mock-sdp-offer',
        iceCandidates: ['candidate1', 'candidate2'],
      },
    }

    await client1.sendSignal(topic, device2Id, offerMessage)

    // Device 2 polls for messages
    const messages = await client2.pollSignals(topic, device2Id)
    expect(messages).toHaveLength(1)
    expect(messages[0].type).toBe('offer')
    expect(messages[0].from).toBe(device1Id)
    expect(messages[0].to).toBe(device2Id)
    expect((messages[0].payload as { sdp: string }).sdp).toBe('mock-sdp-offer')
  })

  it('should delete messages after retrieval (one-time read)', async () => {
    // Poll again - should be empty since messages were consumed
    const messages = await client2.pollSignals(topic, device2Id)
    expect(messages).toHaveLength(0)
  })

  it('should handle offer/answer exchange flow', async () => {
    const newTopic = generateTestId()

    // Device 1 sends offer
    const offerMsg: SignalingMessage = {
      type: 'offer',
      from: device1Id,
      to: device2Id,
      payload: { sdp: 'offer-sdp' },
    }
    await client1.sendSignal(newTopic, device2Id, offerMsg)

    // Device 2 receives offer
    const offers = await client2.pollSignals(newTopic, device2Id)
    expect(offers).toHaveLength(1)
    expect(offers[0].type).toBe('offer')

    // Device 2 sends answer back
    const answerMsg: SignalingMessage = {
      type: 'answer',
      from: device2Id,
      to: device1Id,
      payload: { sdp: 'answer-sdp' },
    }
    await client2.sendSignal(newTopic, device1Id, answerMsg)

    // Device 1 receives answer
    const answers = await client1.pollSignals(newTopic, device1Id)
    expect(answers).toHaveLength(1)
    expect(answers[0].type).toBe('answer')
    expect((answers[0].payload as { sdp: string }).sdp).toBe('answer-sdp')
  })
})

describe('Join Flow (Offer/Answer)', () => {
  let client1: SignalingClient
  let client2: SignalingClient
  let topic: string

  beforeAll(() => {
    client1 = new SignalingClient(TEST_WORKER_URL)
    client2 = new SignalingClient(TEST_WORKER_URL)
    topic = generateTestId()
  })

  it('should exchange join offer and answer', async () => {
    // New device posts join offer
    const joinOffer: JoinOffer = {
      nonce: 'test-nonce-123',
      newPubKey: 'new-device-pubkey',
      newDeviceId: 'new-device-id',
      newDeviceName: 'Test Phone',
      offer: 'encrypted-webrtc-offer',
      iceCandidates: 'encrypted-ice-candidates',
    }

    await client2.postOffer(topic, joinOffer)

    // Trusted device retrieves offer
    const retrievedOffer = await client1.getOffer(topic)
    expect(retrievedOffer).not.toBeNull()
    expect(retrievedOffer!.nonce).toBe('test-nonce-123')
    expect(retrievedOffer!.newDeviceName).toBe('Test Phone')

    // Offer should be deleted after retrieval
    const secondRetrieval = await client1.getOffer(topic)
    expect(secondRetrieval).toBeNull()

    // Trusted device posts answer
    const joinAnswer: JoinAnswer = {
      trustedPubKey: 'trusted-device-pubkey',
      trustedDeviceId: 'trusted-device-id',
      answer: 'encrypted-webrtc-answer',
      iceCandidates: 'encrypted-answer-ice',
      familyData: 'encrypted-initial-sync-data',
    }

    await client1.postAnswer(topic, joinAnswer)

    // New device retrieves answer
    const retrievedAnswer = await client2.getAnswer(topic)
    expect(retrievedAnswer).not.toBeNull()
    expect(retrievedAnswer!.trustedDeviceId).toBe('trusted-device-id')
    expect(retrievedAnswer!.familyData).toBe('encrypted-initial-sync-data')

    // Answer should be deleted after retrieval
    const secondAnswerRetrieval = await client2.getAnswer(topic)
    expect(secondAnswerRetrieval).toBeNull()
  })
})

describe('Multi-Device Sync Simulation', () => {
  it('should simulate 3 devices coming online and discovering each other', async () => {
    const deviceA = new SignalingClient(TEST_WORKER_URL)
    const deviceB = new SignalingClient(TEST_WORKER_URL)
    const deviceC = new SignalingClient(TEST_WORKER_URL)
    const familyId = generateTestId()

    try {
      // Register all 3 devices
      await deviceA.heartbeat(familyId, 'deviceA', 'pubkeyA')
      await deviceB.heartbeat(familyId, 'deviceB', 'pubkeyB')
      await deviceC.heartbeat(familyId, 'deviceC', 'pubkeyC')

      // Refresh all heartbeats to ensure visibility (KV eventual consistency)
      await deviceA.heartbeat(familyId, 'deviceA', 'pubkeyA')
      await deviceB.heartbeat(familyId, 'deviceB', 'pubkeyB')
      await deviceC.heartbeat(familyId, 'deviceC', 'pubkeyC')

      // Wait for KV to propagate, then verify all devices see each other
      const peers = await waitFor(
        async () => {
          // Keep refreshing heartbeats while waiting
          await deviceA.heartbeat(familyId, 'deviceA', 'pubkeyA')
          await deviceB.heartbeat(familyId, 'deviceB', 'pubkeyB')
          await deviceC.heartbeat(familyId, 'deviceC', 'pubkeyC')
          return deviceA.getOnlinePeers(familyId)
        },
        (p) => p.length >= 3,
        10, // More attempts
        300 // Longer delay
      )

      expect(peers.length).toBeGreaterThanOrEqual(3)

      // Verify device IDs
      const deviceIds = peers.map((p) => p.deviceId)
      expect(deviceIds).toContain('deviceA')
      expect(deviceIds).toContain('deviceB')
      expect(deviceIds).toContain('deviceC')
    } finally {
      // Cleanup
      await deviceA.removePresence(familyId, 'deviceA').catch(() => {})
      await deviceB.removePresence(familyId, 'deviceB').catch(() => {})
      await deviceC.removePresence(familyId, 'deviceC').catch(() => {})
    }
  })

  it('should simulate signaling between 3 devices', async () => {
    const deviceA = new SignalingClient(TEST_WORKER_URL)
    const deviceB = new SignalingClient(TEST_WORKER_URL)
    const deviceC = new SignalingClient(TEST_WORKER_URL)
    const familyId = generateTestId()

    // Device A initiates connections to B and C
    const offerToB: SignalingMessage = {
      type: 'offer',
      from: 'deviceA',
      to: 'deviceB',
      payload: { sdp: 'A-to-B-offer' },
    }
    const offerToC: SignalingMessage = {
      type: 'offer',
      from: 'deviceA',
      to: 'deviceC',
      payload: { sdp: 'A-to-C-offer' },
    }

    await deviceA.sendSignal(familyId, 'deviceB', offerToB)
    await deviceA.sendSignal(familyId, 'deviceC', offerToC)

    // B receives its offer
    const messagesB = await deviceB.pollSignals(familyId, 'deviceB')
    expect(messagesB).toHaveLength(1)
    expect((messagesB[0].payload as { sdp: string }).sdp).toBe('A-to-B-offer')

    // C receives its offer
    const messagesC = await deviceC.pollSignals(familyId, 'deviceC')
    expect(messagesC).toHaveLength(1)
    expect((messagesC[0].payload as { sdp: string }).sdp).toBe('A-to-C-offer')

    // B and C send answers back
    const answerFromB: SignalingMessage = {
      type: 'answer',
      from: 'deviceB',
      to: 'deviceA',
      payload: { sdp: 'B-to-A-answer' },
    }
    const answerFromC: SignalingMessage = {
      type: 'answer',
      from: 'deviceC',
      to: 'deviceA',
      payload: { sdp: 'C-to-A-answer' },
    }

    await deviceB.sendSignal(familyId, 'deviceA', answerFromB)
    await deviceC.sendSignal(familyId, 'deviceA', answerFromC)

    // A receives both answers
    const messagesA = await deviceA.pollSignals(familyId, 'deviceA')
    expect(messagesA).toHaveLength(2)

    const sdps = messagesA.map((m) => (m.payload as { sdp: string }).sdp).sort()
    expect(sdps).toContain('B-to-A-answer')
    expect(sdps).toContain('C-to-A-answer')
  })
})

describe('Data Sync Round-Trip Simulation', () => {
  it('should simulate full WebRTC signaling handshake', async () => {
    const deviceA = new SignalingClient(TEST_WORKER_URL)
    const deviceB = new SignalingClient(TEST_WORKER_URL)
    const familyId = generateTestId()

    try {
      // Both devices register presence
      await deviceA.heartbeat(familyId, 'deviceA', 'pubkeyA')
      await deviceB.heartbeat(familyId, 'deviceB', 'pubkeyB')

      // Device A discovers Device B
      const peers = await deviceA.getOnlinePeers(familyId)
      const deviceBInfo = peers.find((p) => p.deviceId === 'deviceB')
      expect(deviceBInfo).toBeDefined()

      // Device A creates WebRTC offer (simulated)
      const mockOffer: SignalingMessage = {
        type: 'offer',
        from: 'deviceA',
        to: 'deviceB',
        payload: {
          offer: {
            type: 'offer',
            sdp: 'v=0\r\no=- 123 1 IN IP4 127.0.0.1\r\n...',
          },
          iceCandidates: [
            { candidate: 'candidate:1 1 UDP 123 192.168.1.1 5000 typ host' },
            { candidate: 'candidate:2 1 UDP 456 10.0.0.1 5001 typ srflx' },
          ],
          deviceName: 'Device A',
        },
      }

      await deviceA.sendSignal(familyId, 'deviceB', mockOffer)

      // Device B receives and processes offer
      const offers = await deviceB.pollSignals(familyId, 'deviceB')
      expect(offers).toHaveLength(1)

      const receivedOffer = offers[0]
      expect(receivedOffer.type).toBe('offer')
      expect((receivedOffer.payload as { deviceName: string }).deviceName).toBe('Device A')

      // Device B creates answer
      const mockAnswer: SignalingMessage = {
        type: 'answer',
        from: 'deviceB',
        to: 'deviceA',
        payload: {
          answer: {
            type: 'answer',
            sdp: 'v=0\r\no=- 456 1 IN IP4 127.0.0.1\r\n...',
          },
          iceCandidates: [
            { candidate: 'candidate:3 1 UDP 789 192.168.1.2 5002 typ host' },
          ],
          deviceName: 'Device B',
        },
      }

      await deviceB.sendSignal(familyId, 'deviceA', mockAnswer)

      // Device A receives answer
      const answers = await deviceA.pollSignals(familyId, 'deviceA')
      expect(answers).toHaveLength(1)

      const receivedAnswer = answers[0]
      expect(receivedAnswer.type).toBe('answer')
      expect((receivedAnswer.payload as { deviceName: string }).deviceName).toBe('Device B')

      // At this point, WebRTC connection would be established
      // and data sync would happen over the peer-to-peer channel
    } finally {
      await deviceA.removePresence(familyId, 'deviceA').catch(() => {})
      await deviceB.removePresence(familyId, 'deviceB').catch(() => {})
    }
  })

  it('should handle sync event broadcast simulation', async () => {
    const deviceA = new SignalingClient(TEST_WORKER_URL)
    const deviceB = new SignalingClient(TEST_WORKER_URL)
    const familyId = generateTestId()

    // Simulate what happens after WebRTC connection:
    // Device A creates a sync event and would broadcast it

    const syncEvent = {
      id: generateTestId(),
      type: 'activity.created',
      timestamp: new Date().toISOString(),
      deviceId: 'deviceA',
      data: {
        activityId: 'act-123',
        studentId: 'student-1',
        subjectId: 'math',
        duration: 30,
        notes: 'Completed math worksheet',
      },
    }

    // In real sync, this would go over WebRTC data channel
    // For this test, we verify the signaling path works
    const syncMessage: SignalingMessage = {
      type: 'offer', // Using offer type for test, real sync uses data channel
      from: 'deviceA',
      to: 'deviceB',
      payload: { syncEvent },
    }

    await deviceA.sendSignal(familyId, 'deviceB', syncMessage)

    const received = await deviceB.pollSignals(familyId, 'deviceB')
    expect(received).toHaveLength(1)

    const receivedEvent = (received[0].payload as { syncEvent: typeof syncEvent }).syncEvent
    expect(receivedEvent.type).toBe('activity.created')
    expect(receivedEvent.data.activityId).toBe('act-123')
  })
})
