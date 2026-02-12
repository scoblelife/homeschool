/**
 * WDIO Multiremote Configuration — Two iOS Simulators
 *
 * Drives two separate Appium sessions for multi-device family sync testing.
 * Device A: iPhone 17 Pro (port 4723, wdaLocalPort 8100)
 * Device B: iPhone 17 Pro Max (port 4724, wdaLocalPort 8101)
 *
 * Pre-populates AsyncStorage on both devices before tests start (bypasses onboarding).
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DEVICE_A_UDID = '61185A47-BE90-4A2B-A9D5-C9374866B6A9'
const DEVICE_B_UDID = '6E67C284-6762-47CF-AAB9-AF188F9822D8'
const BUNDLE_ID = 'com.scoblelife.homeschool'

// ---------------------------------------------------------------------------
// AsyncStorage filesystem helpers
// ---------------------------------------------------------------------------

function getAsyncStoragePath(udid) {
  const container = execSync(
    `xcrun simctl get_app_container ${udid} ${BUNDLE_ID} data`
  ).toString().trim()
  return path.join(
    container,
    'Library', 'Application Support',
    BUNDLE_ID,
    'RCTAsyncLocalStorage_V1', 'manifest.json'
  )
}

function readManifest(udid) {
  try {
    return JSON.parse(fs.readFileSync(getAsyncStoragePath(udid), 'utf-8'))
  } catch {
    return {}
  }
}

function writeManifest(udid, data) {
  const manifestPath = getAsyncStoragePath(udid)
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
  fs.writeFileSync(manifestPath, JSON.stringify(data))
}

function mergeAsyncStorage(udid, extraKeys) {
  const manifest = readManifest(udid)
  Object.assign(manifest, extraKeys)
  writeManifest(udid, manifest)
}

function removeAsyncStorageKeys(udid, keys) {
  const manifest = readManifest(udid)
  for (const key of keys) {
    delete manifest[key]
  }
  writeManifest(udid, manifest)
}

// ---------------------------------------------------------------------------
// WDIO Config
// ---------------------------------------------------------------------------

exports.config = {
  runner: 'local',
  specs: ['./specs/family-sync.spec.js'],
  maxInstances: 1,

  capabilities: {
    deviceA: {
      port: 4723,
      capabilities: {
        platformName: 'iOS',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': 'iPhone 17 Pro',
        'appium:udid': DEVICE_A_UDID,
        'appium:bundleId': BUNDLE_ID,
        'appium:noReset': true,
        'appium:usePreinstalledApp': true,
        'appium:wdaLocalPort': 8100,
      },
    },
    deviceB: {
      port: 4724,
      capabilities: {
        platformName: 'iOS',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': 'iPhone 17 Pro Max',
        'appium:udid': DEVICE_B_UDID,
        'appium:bundleId': BUNDLE_ID,
        'appium:noReset': true,
        'appium:usePreinstalledApp': true,
        'appium:wdaLocalPort': 8101,
      },
    },
  },

  logLevel: 'warn',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 300000,
  },

  onPrepare: function () {
    console.log('\n--- Pre-populating AsyncStorage on both devices ---')

    // Terminate apps so they read fresh data on relaunch
    try { execSync(`xcrun simctl terminate ${DEVICE_A_UDID} ${BUNDLE_ID}`) } catch {}
    try { execSync(`xcrun simctl terminate ${DEVICE_B_UDID} ${BUNDLE_ID}`) } catch {}

    // Bypass onboarding on both devices
    mergeAsyncStorage(DEVICE_A_UDID, { '@homeschool/onboarding_complete': 'true' })
    mergeAsyncStorage(DEVICE_B_UDID, { '@homeschool/onboarding_complete': 'true' })

    // Clear any stale family config so tests start fresh
    removeAsyncStorageKeys(DEVICE_A_UDID, ['@homeschool/family_config', '@homeschool/device_config'])
    removeAsyncStorageKeys(DEVICE_B_UDID, ['@homeschool/family_config', '@homeschool/device_config'])

    console.log('AsyncStorage pre-populated on both devices\n')
  },
}

// Export helpers for test spec to use
exports.DEVICE_A_UDID = DEVICE_A_UDID
exports.DEVICE_B_UDID = DEVICE_B_UDID
exports.BUNDLE_ID = BUNDLE_ID
exports.readManifest = readManifest
exports.mergeAsyncStorage = mergeAsyncStorage
exports.removeAsyncStorageKeys = removeAsyncStorageKeys
