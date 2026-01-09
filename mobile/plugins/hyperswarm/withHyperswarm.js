/**
 * Expo Config Plugin for Hyperswarm Native Module
 *
 * This plugin:
 * 1. Downloads pre-built native libraries from GitHub releases
 * 2. Configures iOS to link the static library
 * 3. Configures Android to include JNI libraries
 */

const {
  withDangerousMod,
  withXcodeProject,
  withGradleProperties,
  withAppBuildGradle,
  withMainApplication,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_REPO = 'sscoble/homeschool'; // Update with your repo
const NATIVE_LIBS_TAG = 'latest'; // Or specific tag like 'native-libs-abc1234'

/**
 * Download native libraries from GitHub releases
 */
async function downloadNativeLibs(projectRoot) {
  const nativeDir = path.join(projectRoot, 'native-libs');

  // Check if already downloaded
  if (fs.existsSync(path.join(nativeDir, 'android', 'jniLibs'))) {
    console.log('[Hyperswarm] Native libs already present, skipping download');
    return nativeDir;
  }

  console.log('[Hyperswarm] Downloading native libraries...');

  try {
    // Create directory
    fs.mkdirSync(nativeDir, { recursive: true });

    // Download from GitHub releases
    // In production, you'd fetch the latest release URL via GitHub API
    const releaseUrl = `https://github.com/${GITHUB_REPO}/releases/download/${NATIVE_LIBS_TAG}/hyperswarm-native-libs.tar.gz`;

    execSync(`curl -L -o "${nativeDir}/libs.tar.gz" "${releaseUrl}"`, { stdio: 'inherit' });
    execSync(`tar -xzf "${nativeDir}/libs.tar.gz" -C "${nativeDir}"`, { stdio: 'inherit' });
    execSync(`rm "${nativeDir}/libs.tar.gz"`, { stdio: 'inherit' });

    console.log('[Hyperswarm] Native libraries downloaded successfully');
  } catch (error) {
    console.warn('[Hyperswarm] Could not download native libs, will use local if available:', error.message);
  }

  return nativeDir;
}

/**
 * Configure iOS project to link Hyperswarm
 */
const withHyperswarmIOS = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const nativeDir = path.join(projectRoot, 'native-libs');

    // Add library search path
    const buildConfigurationList = xcodeProject.pbxXCBuildConfigurationSection();

    for (const key in buildConfigurationList) {
      const buildConfig = buildConfigurationList[key];
      if (typeof buildConfig === 'object' && buildConfig.buildSettings) {
        // Add library search path
        const libSearchPaths = buildConfig.buildSettings.LIBRARY_SEARCH_PATHS || ['$(inherited)'];
        if (!Array.isArray(libSearchPaths)) {
          buildConfig.buildSettings.LIBRARY_SEARCH_PATHS = [libSearchPaths];
        }
        if (!buildConfig.buildSettings.LIBRARY_SEARCH_PATHS.includes('"$(SRCROOT)/../native-libs/ios/device"')) {
          buildConfig.buildSettings.LIBRARY_SEARCH_PATHS.push('"$(SRCROOT)/../native-libs/ios/device"');
          buildConfig.buildSettings.LIBRARY_SEARCH_PATHS.push('"$(SRCROOT)/../native-libs/ios/simulator"');
        }

        // Add header search path
        const headerSearchPaths = buildConfig.buildSettings.HEADER_SEARCH_PATHS || ['$(inherited)'];
        if (!Array.isArray(headerSearchPaths)) {
          buildConfig.buildSettings.HEADER_SEARCH_PATHS = [headerSearchPaths];
        }
        if (!buildConfig.buildSettings.HEADER_SEARCH_PATHS.includes('"$(SRCROOT)/../native-libs"')) {
          buildConfig.buildSettings.HEADER_SEARCH_PATHS.push('"$(SRCROOT)/../native-libs"');
        }

        // Link against the static library
        let otherLdFlags = buildConfig.buildSettings.OTHER_LDFLAGS || ['$(inherited)'];
        if (!Array.isArray(otherLdFlags)) {
          otherLdFlags = [otherLdFlags];
        }
        if (!otherLdFlags.includes('-lhyperswarm_mobile')) {
          otherLdFlags.push('-lhyperswarm_mobile');
          otherLdFlags.push('-lresolv');
        }
        buildConfig.buildSettings.OTHER_LDFLAGS = otherLdFlags;
      }
    }

    return config;
  });
};

/**
 * Configure Android to include JNI libraries
 */
const withHyperswarmAndroid = (config) => {
  // Add JNI libs directory
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const nativeDir = path.join(projectRoot, 'native-libs');
      const jniLibsSource = path.join(nativeDir, 'android', 'jniLibs');
      const jniLibsDest = path.join(projectRoot, 'android', 'app', 'src', 'main', 'jniLibs');

      // Copy JNI libs if they exist
      if (fs.existsSync(jniLibsSource)) {
        fs.cpSync(jniLibsSource, jniLibsDest, { recursive: true });
        console.log('[Hyperswarm] Copied JNI libraries to Android project');
      }

      return config;
    },
  ]);

  // Update build.gradle to include native libs
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Add source sets for jniLibs if not present
    if (!buildGradle.includes('jniLibs.srcDirs')) {
      const androidBlock = buildGradle.indexOf('android {');
      if (androidBlock !== -1) {
        const insertPos = buildGradle.indexOf('{', androidBlock) + 1;
        const jniConfig = `
    sourceSets {
        main {
            jniLibs.srcDirs = ['src/main/jniLibs']
        }
    }
`;
        config.modResults.contents =
          buildGradle.slice(0, insertPos) + jniConfig + buildGradle.slice(insertPos);
      }
    }

    return config;
  });

  return config;
};

/**
 * Copy native module source files
 */
const withHyperswarmSources = (config) => {
  // iOS Swift module
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosDir = path.join(projectRoot, 'ios', 'Homeschool');

      // Create HyperswarmModule.swift
      const swiftSource = `
import Foundation
import React

@objc(HyperswarmModule)
class HyperswarmModule: RCTEventEmitter {

    override static func moduleName() -> String! {
        return "HyperswarmModule"
    }

    override func supportedEvents() -> [String]! {
        return ["hyperswarmEvent"]
    }

    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    func create(_ deviceId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let idCString = deviceId.cString(using: .utf8)
            let swarmId = hyperswarm_create(idCString)
            if swarmId >= 0 {
                resolver(swarmId)
            } else {
                rejecter("CREATE_ERROR", "Failed to create swarm", nil)
            }
        }
    }

    @objc
    func start(_ swarmId: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let result = hyperswarm_start(Int32(swarmId))
            if result == 0 {
                self.startEventLoop(swarmId: swarmId)
                resolver(nil)
            } else {
                rejecter("START_ERROR", "Failed to start swarm", nil)
            }
        }
    }

    @objc
    func stop(_ swarmId: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let result = hyperswarm_stop(Int32(swarmId))
        if result == 0 {
            resolver(nil)
        } else {
            rejecter("STOP_ERROR", "Failed to stop swarm", nil)
        }
    }

    @objc
    func destroy(_ swarmId: Int) {
        hyperswarm_destroy(Int32(swarmId))
    }

    @objc
    func join(_ swarmId: Int, topic: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let topicCString = topic.cString(using: .utf8)
            let result = hyperswarm_join(Int32(swarmId), topicCString)
            if result == 0 {
                resolver(nil)
            } else {
                rejecter("JOIN_ERROR", "Failed to join topic", nil)
            }
        }
    }

    @objc
    func leave(_ swarmId: Int, topic: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let topicCString = topic.cString(using: .utf8)
        let result = hyperswarm_leave(Int32(swarmId), topicCString)
        if result == 0 {
            resolver(nil)
        } else {
            rejecter("LEAVE_ERROR", "Failed to leave topic", nil)
        }
    }

    @objc
    func send(_ swarmId: Int, peerId: String, data: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let peerIdCString = peerId.cString(using: .utf8)
            let dataCString = data.cString(using: .utf8)
            let result = hyperswarm_send(Int32(swarmId), peerIdCString, dataCString, UInt(data.utf8.count))
            if result == 0 {
                resolver(nil)
            } else {
                rejecter("SEND_ERROR", "Failed to send data", nil)
            }
        }
    }

    @objc
    func broadcast(_ swarmId: Int, data: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let dataCString = data.cString(using: .utf8)
            let result = hyperswarm_broadcast(Int32(swarmId), dataCString, UInt(data.utf8.count))
            if result == 0 {
                resolver(nil)
            } else {
                rejecter("BROADCAST_ERROR", "Failed to broadcast data", nil)
            }
        }
    }

    @objc
    func getLocalPeerId(_ swarmId: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let peerId = hyperswarm_local_peer_id(Int32(swarmId))
        if let peerId = peerId {
            resolver(String(cString: peerId))
            hyperswarm_free_string(UnsafeMutablePointer(mutating: peerId))
        } else {
            rejecter("PEER_ID_ERROR", "Failed to get local peer ID", nil)
        }
    }

    @objc
    func getPeerCount(_ swarmId: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let count = hyperswarm_peer_count(Int32(swarmId))
        resolver(count)
    }

    private func startEventLoop(swarmId: Int) {
        DispatchQueue.global(qos: .utility).async { [weak self] in
            var event = HyperswarmEvent()

            while true {
                let hasEvent = hyperswarm_poll_event(Int32(swarmId), &event)
                if hasEvent == 0 {
                    break // Swarm stopped
                }

                if hasEvent > 0 {
                    var eventData: [String: Any] = [
                        "swarmId": swarmId,
                        "type": Int(event.event_type)
                    ]

                    if let peerId = event.peer_id {
                        eventData["peerId"] = String(cString: peerId)
                    }

                    if let data = event.data, event.data_len > 0 {
                        eventData["data"] = String(cString: data)
                    }

                    if let address = event.address {
                        eventData["address"] = String(cString: address)
                    }

                    if let message = event.message {
                        eventData["message"] = String(cString: message)
                    }

                    DispatchQueue.main.async {
                        self?.sendEvent(withName: "hyperswarmEvent", body: eventData)
                    }

                    hyperswarm_free_event(&event)
                }

                Thread.sleep(forTimeInterval: 0.01)
            }
        }
    }
}
`;

      fs.writeFileSync(path.join(iosDir, 'HyperswarmModule.swift'), swiftSource);

      // Create bridging header
      const bridgingHeader = `
#ifndef Hyperswarm_Bridging_Header_h
#define Hyperswarm_Bridging_Header_h

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#include "hyperswarm.h"

#endif
`;

      fs.writeFileSync(path.join(iosDir, 'Hyperswarm-Bridging-Header.h'), bridgingHeader);

      // Create ObjC bridge for React Native
      const objcBridge = `
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(HyperswarmModule, RCTEventEmitter)

RCT_EXTERN_METHOD(create:(NSString *)deviceId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(start:(int)swarmId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stop:(int)swarmId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(destroy:(int)swarmId)
RCT_EXTERN_METHOD(join:(int)swarmId topic:(NSString *)topic resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(leave:(int)swarmId topic:(NSString *)topic resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(send:(int)swarmId peerId:(NSString *)peerId data:(NSString *)data resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(broadcast:(int)swarmId data:(NSString *)data resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getLocalPeerId:(int)swarmId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getPeerCount:(int)swarmId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
`;

      fs.writeFileSync(path.join(iosDir, 'HyperswarmModule.m'), objcBridge);

      console.log('[Hyperswarm] Created iOS native module files');

      return config;
    },
  ]);

  // Android Kotlin module
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'hyperswarm');

      fs.mkdirSync(androidDir, { recursive: true });

      const kotlinSource = `
package com.hyperswarm

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors

class HyperswarmModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        init {
            System.loadLibrary("hyperswarm_mobile")
        }
    }

    private val executor = Executors.newCachedThreadPool()
    private val eventLoops = mutableMapOf<Int, Boolean>()

    override fun getName() = "HyperswarmModule"

    // Native method declarations
    private external fun nativeCreate(deviceId: String): Int
    private external fun nativeStart(swarmId: Int): Int
    private external fun nativeStop(swarmId: Int): Int
    private external fun nativeDestroy(swarmId: Int)
    private external fun nativeJoin(swarmId: Int, topic: String): Int
    private external fun nativeLeave(swarmId: Int, topic: String): Int
    private external fun nativeSend(swarmId: Int, peerId: String, data: String, dataLen: Int): Int
    private external fun nativeBroadcast(swarmId: Int, data: String, dataLen: Int): Int
    private external fun nativeLocalPeerId(swarmId: Int): String?
    private external fun nativePeerCount(swarmId: Int): Int
    private external fun nativePollEvent(swarmId: Int): Map<String, Any>?

    @ReactMethod
    fun create(deviceId: String, promise: Promise) {
        executor.execute {
            try {
                val swarmId = nativeCreate(deviceId)
                if (swarmId >= 0) {
                    promise.resolve(swarmId)
                } else {
                    promise.reject("CREATE_ERROR", "Failed to create swarm")
                }
            } catch (e: Exception) {
                promise.reject("CREATE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun start(swarmId: Int, promise: Promise) {
        executor.execute {
            try {
                val result = nativeStart(swarmId)
                if (result == 0) {
                    startEventLoop(swarmId)
                    promise.resolve(null)
                } else {
                    promise.reject("START_ERROR", "Failed to start swarm")
                }
            } catch (e: Exception) {
                promise.reject("START_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun stop(swarmId: Int, promise: Promise) {
        eventLoops[swarmId] = false
        try {
            val result = nativeStop(swarmId)
            if (result == 0) {
                promise.resolve(null)
            } else {
                promise.reject("STOP_ERROR", "Failed to stop swarm")
            }
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun destroy(swarmId: Int) {
        eventLoops[swarmId] = false
        nativeDestroy(swarmId)
    }

    @ReactMethod
    fun join(swarmId: Int, topic: String, promise: Promise) {
        executor.execute {
            try {
                val result = nativeJoin(swarmId, topic)
                if (result == 0) {
                    promise.resolve(null)
                } else {
                    promise.reject("JOIN_ERROR", "Failed to join topic")
                }
            } catch (e: Exception) {
                promise.reject("JOIN_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun leave(swarmId: Int, topic: String, promise: Promise) {
        try {
            val result = nativeLeave(swarmId, topic)
            if (result == 0) {
                promise.resolve(null)
            } else {
                promise.reject("LEAVE_ERROR", "Failed to leave topic")
            }
        } catch (e: Exception) {
            promise.reject("LEAVE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun send(swarmId: Int, peerId: String, data: String, promise: Promise) {
        executor.execute {
            try {
                val result = nativeSend(swarmId, peerId, data, data.length)
                if (result == 0) {
                    promise.resolve(null)
                } else {
                    promise.reject("SEND_ERROR", "Failed to send data")
                }
            } catch (e: Exception) {
                promise.reject("SEND_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun broadcast(swarmId: Int, data: String, promise: Promise) {
        executor.execute {
            try {
                val result = nativeBroadcast(swarmId, data, data.length)
                if (result == 0) {
                    promise.resolve(null)
                } else {
                    promise.reject("BROADCAST_ERROR", "Failed to broadcast data")
                }
            } catch (e: Exception) {
                promise.reject("BROADCAST_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getLocalPeerId(swarmId: Int, promise: Promise) {
        try {
            val peerId = nativeLocalPeerId(swarmId)
            if (peerId != null) {
                promise.resolve(peerId)
            } else {
                promise.reject("PEER_ID_ERROR", "Failed to get local peer ID")
            }
        } catch (e: Exception) {
            promise.reject("PEER_ID_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getPeerCount(swarmId: Int, promise: Promise) {
        try {
            val count = nativePeerCount(swarmId)
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("PEER_COUNT_ERROR", e.message)
        }
    }

    private fun startEventLoop(swarmId: Int) {
        eventLoops[swarmId] = true

        executor.execute {
            while (eventLoops[swarmId] == true) {
                try {
                    val event = nativePollEvent(swarmId)
                    if (event != null) {
                        val params = Arguments.createMap().apply {
                            putInt("swarmId", swarmId)
                            putInt("type", event["type"] as? Int ?: 0)
                            (event["peerId"] as? String)?.let { putString("peerId", it) }
                            (event["data"] as? String)?.let { putString("data", it) }
                            (event["address"] as? String)?.let { putString("address", it) }
                            (event["message"] as? String)?.let { putString("message", it) }
                        }

                        reactApplicationContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit("hyperswarmEvent", params)
                    }
                    Thread.sleep(10)
                } catch (e: Exception) {
                    break
                }
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }
}
`;

      fs.writeFileSync(path.join(androidDir, 'HyperswarmModule.kt'), kotlinSource);

      // Create package file
      const packageSource = `
package com.hyperswarm

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class HyperswarmPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(HyperswarmModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

      fs.writeFileSync(path.join(androidDir, 'HyperswarmPackage.kt'), packageSource);

      console.log('[Hyperswarm] Created Android native module files');

      return config;
    },
  ]);

  return config;
};

/**
 * Main plugin export
 */
const withHyperswarm = (config, props = {}) => {
  config = withHyperswarmIOS(config);
  config = withHyperswarmAndroid(config);
  config = withHyperswarmSources(config);

  return config;
};

module.exports = withHyperswarm;
