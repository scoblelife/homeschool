/**
 * Expo Config Plugin: Local Notifications Only
 *
 * expo-notifications adds push notification entitlements (aps-environment)
 * and remote-notification background mode by default. Since this app only
 * uses LOCAL notifications (scheduled reminders, streak warnings), we
 * strip the push-specific configuration to avoid needing a provisioning
 * profile with Push Notifications capability.
 *
 * This plugin must be listed BEFORE "expo-notifications" in app.json plugins
 * (Expo config mods execute in LIFO order, so earlier = runs later).
 */

const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    // Remove the aps-environment entitlement (push notifications)
    delete config.modResults['aps-environment'];
    return config;
  });
}

function withoutRemoteNotificationBackground(config) {
  return withInfoPlist(config, (config) => {
    const bgModes = config.modResults.UIBackgroundModes;
    if (Array.isArray(bgModes)) {
      config.modResults.UIBackgroundModes = bgModes.filter(
        (mode) => mode !== 'remote-notification'
      );
      // Remove empty array
      if (config.modResults.UIBackgroundModes.length === 0) {
        delete config.modResults.UIBackgroundModes;
      }
    }
    return config;
  });
}

module.exports = function withLocalNotificationsOnly(config) {
  config = withoutPushEntitlement(config);
  config = withoutRemoteNotificationBackground(config);
  return config;
};
