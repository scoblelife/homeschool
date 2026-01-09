import Foundation

@objc(HyperswarmModule)
class HyperswarmModule: NSObject {

    private var pollTimer: Timer?
    private var swarmId: UInt64 = 0

    override init() {
        super.init()
        hyperswarm_init_logging()
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    func create(_ deviceId: String,
                resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let id = hyperswarm_create(deviceId)
            if id == 0 {
                reject("CREATE_ERROR", "Failed to create swarm", nil)
            } else {
                self.swarmId = id
                resolve(NSNumber(value: id))
            }
        }
    }

    @objc
    func start(_ swarmId: NSNumber,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let result = hyperswarm_start(swarmId.uint64Value)
            if result == 0 {
                self.startPolling(swarmId.uint64Value)
                resolve(nil)
            } else {
                reject("START_ERROR", "Failed to start swarm", nil)
            }
        }
    }

    @objc
    func stop(_ swarmId: NSNumber,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            self.stopPolling()
            let result = hyperswarm_stop(swarmId.uint64Value)
            if result == 0 {
                resolve(nil)
            } else {
                reject("STOP_ERROR", "Failed to stop swarm", nil)
            }
        }
    }

    @objc
    func destroy(_ swarmId: NSNumber) {
        stopPolling()
        hyperswarm_destroy(swarmId.uint64Value)
    }

    @objc
    func join(_ swarmId: NSNumber,
              topic: String,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let result = hyperswarm_join(swarmId.uint64Value, topic)
            if result == 0 {
                resolve(nil)
            } else {
                reject("JOIN_ERROR", "Failed to join topic", nil)
            }
        }
    }

    @objc
    func leave(_ swarmId: NSNumber,
               topic: String,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            let result = hyperswarm_leave(swarmId.uint64Value, topic)
            if result == 0 {
                resolve(nil)
            } else {
                reject("LEAVE_ERROR", "Failed to leave topic", nil)
            }
        }
    }

    @objc
    func send(_ swarmId: NSNumber,
              peerId: String,
              data: String,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            guard let dataBytes = data.data(using: .utf8) else {
                reject("SEND_ERROR", "Invalid data", nil)
                return
            }

            let result = dataBytes.withUnsafeBytes { ptr -> Int32 in
                return hyperswarm_send(
                    swarmId.uint64Value,
                    peerId,
                    ptr.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    dataBytes.count
                )
            }

            if result == 0 {
                resolve(nil)
            } else {
                reject("SEND_ERROR", "Failed to send data", nil)
            }
        }
    }

    @objc
    func broadcast(_ swarmId: NSNumber,
                   data: String,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            guard let dataBytes = data.data(using: .utf8) else {
                reject("BROADCAST_ERROR", "Invalid data", nil)
                return
            }

            let result = dataBytes.withUnsafeBytes { ptr -> Int32 in
                return hyperswarm_broadcast(
                    swarmId.uint64Value,
                    ptr.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    dataBytes.count
                )
            }

            if result == 0 {
                resolve(nil)
            } else {
                reject("BROADCAST_ERROR", "Failed to broadcast", nil)
            }
        }
    }

    @objc
    func getLocalPeerId(_ swarmId: NSNumber,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            guard let ptr = hyperswarm_local_peer_id(swarmId.uint64Value) else {
                reject("ERROR", "Failed to get peer ID", nil)
                return
            }
            let peerId = String(cString: ptr)
            hyperswarm_free_string(ptr)
            resolve(peerId)
        }
    }

    @objc
    func getPeerCount(_ swarmId: NSNumber,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        let count = hyperswarm_peer_count(swarmId.uint64Value)
        if count >= 0 {
            resolve(NSNumber(value: count))
        } else {
            reject("ERROR", "Failed to get peer count", nil)
        }
    }

    // MARK: - Event Polling

    private func startPolling(_ swarmId: UInt64) {
        DispatchQueue.main.async {
            self.pollTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
                self?.pollEvents(swarmId)
            }
        }
    }

    private func stopPolling() {
        DispatchQueue.main.async {
            self.pollTimer?.invalidate()
            self.pollTimer = nil
        }
    }

    private func pollEvents(_ swarmId: UInt64) {
        var peerId: UnsafeMutablePointer<CChar>?
        var data: UnsafeMutablePointer<UInt8>?
        var dataLen: Int = 0

        let eventType = hyperswarm_poll_event(swarmId, &peerId, &data, &dataLen)

        guard eventType >= 0 else { return }

        var eventData: [String: Any] = [
            "swarmId": swarmId,
            "type": eventType
        ]

        if let peerId = peerId {
            eventData["peerId"] = String(cString: peerId)
            hyperswarm_free_string(peerId)
        }

        if let data = data, dataLen > 0 {
            let dataBytes = Data(bytes: data, count: dataLen)
            eventData["data"] = String(data: dataBytes, encoding: .utf8) ?? ""
            hyperswarm_free_data(data)
        }

        // Send event to JavaScript
        sendEvent(withName: "hyperswarmEvent", body: eventData)
    }

    // MARK: - Event Emitter

    @objc
    func supportedEvents() -> [String] {
        return ["hyperswarmEvent"]
    }

    private func sendEvent(withName name: String, body: Any) {
        // This would be implemented by RCTEventEmitter
        // For now, just log
        print("[Hyperswarm] Event: \(name) - \(body)")
    }
}
