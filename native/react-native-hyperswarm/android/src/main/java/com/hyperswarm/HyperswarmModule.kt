package com.hyperswarm

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors

class HyperswarmModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val executor = Executors.newSingleThreadExecutor()
    private var pollThread: Thread? = null
    private var isPolling = false

    companion object {
        init {
            System.loadLibrary("hyperswarm_mobile")
        }

        // Native methods
        @JvmStatic external fun nativeInitLogging()
        @JvmStatic external fun nativeCreate(deviceId: String): Long
        @JvmStatic external fun nativeStart(swarmId: Long): Int
        @JvmStatic external fun nativeStop(swarmId: Long): Int
        @JvmStatic external fun nativeDestroy(swarmId: Long)
        @JvmStatic external fun nativeJoin(swarmId: Long, topic: String): Int
        @JvmStatic external fun nativeLeave(swarmId: Long, topic: String): Int
        @JvmStatic external fun nativeSend(swarmId: Long, peerId: String, data: ByteArray): Int
        @JvmStatic external fun nativeBroadcast(swarmId: Long, data: ByteArray): Int
        @JvmStatic external fun nativePollEvent(swarmId: Long): EventResult?
        @JvmStatic external fun nativeLocalPeerId(swarmId: Long): String?
        @JvmStatic external fun nativePeerCount(swarmId: Long): Int
    }

    data class EventResult(
        val eventType: Int,
        val peerId: String?,
        val data: ByteArray?
    )

    init {
        nativeInitLogging()
    }

    override fun getName(): String = "HyperswarmModule"

    @ReactMethod
    fun create(deviceId: String, promise: Promise) {
        executor.execute {
            try {
                val swarmId = nativeCreate(deviceId)
                if (swarmId == 0L) {
                    promise.reject("CREATE_ERROR", "Failed to create swarm")
                } else {
                    promise.resolve(swarmId.toDouble())
                }
            } catch (e: Exception) {
                promise.reject("CREATE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun start(swarmId: Double, promise: Promise) {
        executor.execute {
            try {
                val result = nativeStart(swarmId.toLong())
                if (result == 0) {
                    startPolling(swarmId.toLong())
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
    fun stop(swarmId: Double, promise: Promise) {
        executor.execute {
            try {
                stopPolling()
                val result = nativeStop(swarmId.toLong())
                if (result == 0) {
                    promise.resolve(null)
                } else {
                    promise.reject("STOP_ERROR", "Failed to stop swarm")
                }
            } catch (e: Exception) {
                promise.reject("STOP_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun destroy(swarmId: Double) {
        executor.execute {
            stopPolling()
            nativeDestroy(swarmId.toLong())
        }
    }

    @ReactMethod
    fun join(swarmId: Double, topic: String, promise: Promise) {
        executor.execute {
            try {
                val result = nativeJoin(swarmId.toLong(), topic)
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
    fun leave(swarmId: Double, topic: String, promise: Promise) {
        executor.execute {
            try {
                val result = nativeLeave(swarmId.toLong(), topic)
                if (result == 0) {
                    promise.resolve(null)
                } else {
                    promise.reject("LEAVE_ERROR", "Failed to leave topic")
                }
            } catch (e: Exception) {
                promise.reject("LEAVE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun send(swarmId: Double, peerId: String, data: String, promise: Promise) {
        executor.execute {
            try {
                val dataBytes = data.toByteArray(Charsets.UTF_8)
                val result = nativeSend(swarmId.toLong(), peerId, dataBytes)
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
    fun broadcast(swarmId: Double, data: String, promise: Promise) {
        executor.execute {
            try {
                val dataBytes = data.toByteArray(Charsets.UTF_8)
                val result = nativeBroadcast(swarmId.toLong(), dataBytes)
                if (result == 0) {
                    promise.resolve(null)
                } else {
                    promise.reject("BROADCAST_ERROR", "Failed to broadcast")
                }
            } catch (e: Exception) {
                promise.reject("BROADCAST_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getLocalPeerId(swarmId: Double, promise: Promise) {
        executor.execute {
            try {
                val peerId = nativeLocalPeerId(swarmId.toLong())
                if (peerId != null) {
                    promise.resolve(peerId)
                } else {
                    promise.reject("ERROR", "Failed to get peer ID")
                }
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getPeerCount(swarmId: Double, promise: Promise) {
        try {
            val count = nativePeerCount(swarmId.toLong())
            if (count >= 0) {
                promise.resolve(count)
            } else {
                promise.reject("ERROR", "Failed to get peer count")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // Event polling
    private fun startPolling(swarmId: Long) {
        isPolling = true
        pollThread = Thread {
            while (isPolling) {
                try {
                    val event = nativePollEvent(swarmId)
                    if (event != null) {
                        sendEvent(swarmId, event)
                    }
                    Thread.sleep(100)
                } catch (e: InterruptedException) {
                    break
                }
            }
        }.apply { start() }
    }

    private fun stopPolling() {
        isPolling = false
        pollThread?.interrupt()
        pollThread = null
    }

    private fun sendEvent(swarmId: Long, event: EventResult) {
        val params = Arguments.createMap().apply {
            putDouble("swarmId", swarmId.toDouble())
            putInt("type", event.eventType)
            event.peerId?.let { putString("peerId", it) }
            event.data?.let { putString("data", String(it, Charsets.UTF_8)) }
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("hyperswarmEvent", params)
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
