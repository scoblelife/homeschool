/**
 * Expo Config Plugin for react-native-webrtc
 * Adds necessary permissions and configurations for WebRTC
 */

const { withInfoPlist, withAndroidManifest, withPlugins } = require('@expo/config-plugins');

/**
 * Add iOS permissions for WebRTC
 */
function withWebRTCIOS(config) {
  return withInfoPlist(config, (config) => {
    // Camera and microphone permissions for WebRTC
    config.modResults.NSCameraUsageDescription =
      config.modResults.NSCameraUsageDescription ||
      'Allow $(PRODUCT_NAME) to access your camera for video calls';
    config.modResults.NSMicrophoneUsageDescription =
      config.modResults.NSMicrophoneUsageDescription ||
      'Allow $(PRODUCT_NAME) to access your microphone for voice calls';

    return config;
  });
}

/**
 * Add Android permissions for WebRTC
 */
function withWebRTCAndroid(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application?.[0];

    if (!mainApplication) {
      console.warn('withWebRTC: No application found in AndroidManifest.xml');
      return config;
    }

    // Ensure permissions array exists
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];

    // Add WebRTC permissions
    const webrtcPermissions = [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.INTERNET',
    ];

    webrtcPermissions.forEach((permission) => {
      if (!permissions.find((p) => p.$?.['android:name'] === permission)) {
        permissions.push({
          $: { 'android:name': permission },
        });
      }
    });

    return config;
  });
}

/**
 * Main plugin export
 */
module.exports = function withWebRTC(config) {
  return withPlugins(config, [
    withWebRTCIOS,
    withWebRTCAndroid,
  ]);
};
