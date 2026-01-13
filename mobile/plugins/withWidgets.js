const { withXcodeProject, withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_TARGET_NAME = 'HomeschoolWidget';
const WIDGET_BUNDLE_ID = 'com.scoblelife.homeschool.widget';
const APP_GROUP = 'group.com.scoblelife.homeschool';

/**
 * Add widget target to Xcode project
 */
function withWidgetTarget(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    // Get the project and main target
    const project = xcodeProject.pbxProjectSection()[xcodeProject.getFirstProject().uuid];
    const mainTargetUuid = xcodeProject.getFirstTarget().uuid;

    // Check if widget target already exists
    const existingTarget = xcodeProject.pbxTargetByName(WIDGET_TARGET_NAME);
    if (existingTarget) {
      console.log(`Widget target ${WIDGET_TARGET_NAME} already exists, skipping...`);
      return config;
    }

    // Add widget target
    const widgetTarget = xcodeProject.addTarget(
      WIDGET_TARGET_NAME,
      'app_extension',
      WIDGET_TARGET_NAME,
      WIDGET_BUNDLE_ID
    );

    if (!widgetTarget) {
      console.error('Failed to create widget target');
      return config;
    }

    // Get widget source files
    const widgetDir = path.join(config.modRequest.platformProjectRoot, WIDGET_TARGET_NAME);

    if (fs.existsSync(widgetDir)) {
      const files = fs.readdirSync(widgetDir);
      const swiftFiles = files.filter(f => f.endsWith('.swift'));
      const plistFiles = files.filter(f => f.endsWith('.plist'));
      const entitlementsFiles = files.filter(f => f.endsWith('.entitlements'));

      // Create PBXGroup for widget files
      const widgetGroup = xcodeProject.addPbxGroup(
        [...swiftFiles, ...plistFiles, ...entitlementsFiles].map(f => path.join(WIDGET_TARGET_NAME, f)),
        WIDGET_TARGET_NAME,
        WIDGET_TARGET_NAME
      );

      // Add files to widget target
      swiftFiles.forEach(file => {
        const filePath = path.join(WIDGET_TARGET_NAME, file);
        xcodeProject.addSourceFile(filePath, { target: widgetTarget.uuid }, widgetGroup.uuid);
      });

      // Add to main group
      const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
      xcodeProject.addToPbxGroup(widgetGroup.uuid, mainGroup);
    }

    // Set build settings for widget target
    const widgetBuildConfig = xcodeProject.pbxXCBuildConfigurationSection();
    Object.keys(widgetBuildConfig).forEach(key => {
      const config = widgetBuildConfig[key];
      if (config.buildSettings && config.name) {
        // Check if this is the widget target config
        const targetName = config.buildSettings.PRODUCT_NAME;
        if (targetName === WIDGET_TARGET_NAME || targetName === `"${WIDGET_TARGET_NAME}"`) {
          config.buildSettings.INFOPLIST_FILE = `${WIDGET_TARGET_NAME}/Info.plist`;
          config.buildSettings.CODE_SIGN_ENTITLEMENTS = `${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements`;
          config.buildSettings.SWIFT_VERSION = '5.0';
          config.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
          config.buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
          config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = WIDGET_BUNDLE_ID;
          config.buildSettings.SKIP_INSTALL = 'YES';
          config.buildSettings.ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME = 'WidgetBackground';
          config.buildSettings.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = 'AccentColor';
        }
      }
    });

    // Add widget to app's embed frameworks phase
    const embedExtensionsPhase = xcodeProject.addBuildPhase(
      [],
      'PBXCopyFilesBuildPhase',
      'Embed App Extensions',
      mainTargetUuid,
      'app_extension'
    );

    if (embedExtensionsPhase) {
      embedExtensionsPhase.buildPhase.dstSubfolderSpec = 13; // PlugIns folder
      xcodeProject.addToPbxBuildFileSection({
        fileRef: widgetTarget.productReference,
        settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] }
      });
    }

    console.log(`Successfully added ${WIDGET_TARGET_NAME} target`);
    return config;
  });
}

/**
 * Add App Groups entitlement to main app
 */
function withAppGroups(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP];
    return config;
  });
}

/**
 * Main plugin export
 */
module.exports = function withWidgets(config) {
  config = withAppGroups(config);
  config = withWidgetTarget(config);
  return config;
};
