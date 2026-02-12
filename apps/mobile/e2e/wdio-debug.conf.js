exports.config = {
  runner: 'local',
  port: 4723,
  specs: ['./specs/debug-dismiss.spec.js'],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': 'iPhone 17 Pro',
      'appium:udid': '61185A47-BE90-4A2B-A9D5-C9374866B6A9',
      'appium:bundleId': 'com.scoblelife.homeschool',
      'appium:noReset': true,
      'appium:usePreinstalledApp': true,
    },
  ],
  logLevel: 'warn',
  waitforTimeout: 10000,
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
}
