//! C FFI bindings for iOS and Android
//!
//! This module exposes the Rust API via C-compatible functions that can be
//! called from Swift (iOS) or Kotlin/Java via JNI (Android).

use crate::{init_runtime, Swarm, SwarmConfig, SwarmEvent};
use crate::swarm::Topic;

use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int, c_void};
use std::ptr;
use std::sync::Arc;
use once_cell::sync::Lazy;
use tokio::sync::{mpsc, RwLock};

/// Global swarm instances (thread-safe)
static SWARMS: Lazy<RwLock<HashMap<u64, Arc<SwarmHandle>>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

/// Counter for generating swarm IDs
static SWARM_ID_COUNTER: Lazy<RwLock<u64>> = Lazy::new(|| RwLock::new(0));

/// Handle to a running swarm
struct SwarmHandle {
    swarm: Arc<Swarm>,
    event_rx: RwLock<Option<mpsc::Receiver<SwarmEvent>>>,
}

/// Event callback type
pub type EventCallback = extern "C" fn(
    swarm_id: u64,
    event_type: c_int,
    peer_id: *const c_char,
    data: *const u8,
    data_len: usize,
    user_data: *mut c_void,
);

/// Event types for FFI
#[repr(C)]
pub enum FfiEventType {
    Ready = 0,
    PeerConnected = 1,
    PeerDisconnected = 2,
    Data = 3,
    Error = 4,
}

// ============================================================================
// Swarm Lifecycle
// ============================================================================

/// Create a new swarm instance
/// Returns swarm_id on success, 0 on failure
#[no_mangle]
pub extern "C" fn hyperswarm_create(device_id: *const c_char) -> u64 {
    let device_id = unsafe {
        if device_id.is_null() {
            return 0;
        }
        match CStr::from_ptr(device_id).to_str() {
            Ok(s) => s.to_string(),
            Err(_) => return 0,
        }
    };

    let config = SwarmConfig {
        device_id,
        ..Default::default()
    };

    let swarm = match Swarm::new(config) {
        Ok(s) => s,
        Err(e) => {
            log::error!("Failed to create swarm: {}", e);
            return 0;
        }
    };

    let runtime = init_runtime();

    // Generate ID and store
    let id = runtime.block_on(async {
        let mut counter = SWARM_ID_COUNTER.write().await;
        *counter += 1;
        let id = *counter;

        let mut swarm = swarm;
        let event_rx = swarm.take_event_receiver();

        let handle = SwarmHandle {
            swarm: Arc::new(swarm),
            event_rx: RwLock::new(event_rx),
        };

        SWARMS.write().await.insert(id, Arc::new(handle));
        id
    });

    id
}

/// Start the swarm
/// Returns 0 on success, -1 on failure
#[no_mangle]
pub extern "C" fn hyperswarm_start(swarm_id: u64) -> c_int {
    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        match handle.swarm.start().await {
            Ok(()) => 0,
            Err(e) => {
                log::error!("Failed to start swarm: {}", e);
                -1
            }
        }
    })
}

/// Stop the swarm
#[no_mangle]
pub extern "C" fn hyperswarm_stop(swarm_id: u64) -> c_int {
    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        match handle.swarm.stop().await {
            Ok(()) => 0,
            Err(e) => {
                log::error!("Failed to stop swarm: {}", e);
                -1
            }
        }
    })
}

/// Destroy the swarm and free resources
#[no_mangle]
pub extern "C" fn hyperswarm_destroy(swarm_id: u64) {
    let runtime = init_runtime();

    runtime.block_on(async {
        let mut swarms = SWARMS.write().await;
        if let Some(handle) = swarms.remove(&swarm_id) {
            let _ = handle.swarm.stop().await;
        }
    });
}

// ============================================================================
// Topic Management
// ============================================================================

/// Join a topic (topic is a 32-byte hex string or will be hashed)
#[no_mangle]
pub extern "C" fn hyperswarm_join(swarm_id: u64, topic: *const c_char) -> c_int {
    let topic_str = unsafe {
        if topic.is_null() {
            return -1;
        }
        match CStr::from_ptr(topic).to_str() {
            Ok(s) => s,
            Err(_) => return -1,
        }
    };

    let topic = Topic::from_string(topic_str);
    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        match handle.swarm.join(topic).await {
            Ok(()) => 0,
            Err(e) => {
                log::error!("Failed to join topic: {}", e);
                -1
            }
        }
    })
}

/// Leave a topic
#[no_mangle]
pub extern "C" fn hyperswarm_leave(swarm_id: u64, topic: *const c_char) -> c_int {
    let topic_str = unsafe {
        if topic.is_null() {
            return -1;
        }
        match CStr::from_ptr(topic).to_str() {
            Ok(s) => s,
            Err(_) => return -1,
        }
    };

    let topic = Topic::from_string(topic_str);
    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        match handle.swarm.leave(topic).await {
            Ok(()) => 0,
            Err(e) => {
                log::error!("Failed to leave topic: {}", e);
                -1
            }
        }
    })
}

// ============================================================================
// Data Transfer
// ============================================================================

/// Send data to a specific peer
#[no_mangle]
pub extern "C" fn hyperswarm_send(
    swarm_id: u64,
    peer_id: *const c_char,
    data: *const u8,
    data_len: usize,
) -> c_int {
    let peer_id_str = unsafe {
        if peer_id.is_null() {
            return -1;
        }
        match CStr::from_ptr(peer_id).to_str() {
            Ok(s) => s,
            Err(_) => return -1,
        }
    };

    let peer_id = match crate::peer::PeerId::from_hex(peer_id_str) {
        Some(id) => id,
        None => return -1,
    };

    let data = unsafe {
        if data.is_null() || data_len == 0 {
            return -1;
        }
        std::slice::from_raw_parts(data, data_len)
    };

    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        match handle.swarm.send(peer_id, bytes::Bytes::copy_from_slice(data)).await {
            Ok(()) => 0,
            Err(e) => {
                log::error!("Failed to send: {}", e);
                -1
            }
        }
    })
}

/// Broadcast data to all connected peers
#[no_mangle]
pub extern "C" fn hyperswarm_broadcast(
    swarm_id: u64,
    data: *const u8,
    data_len: usize,
) -> c_int {
    let data = unsafe {
        if data.is_null() || data_len == 0 {
            return -1;
        }
        std::slice::from_raw_parts(data, data_len)
    };

    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        match handle.swarm.broadcast(bytes::Bytes::copy_from_slice(data)).await {
            Ok(()) => 0,
            Err(e) => {
                log::error!("Failed to broadcast: {}", e);
                -1
            }
        }
    })
}

// ============================================================================
// Event Polling
// ============================================================================

/// Poll for the next event (non-blocking)
/// Returns event type, or -1 if no event available
/// Caller must free peer_id and data with hyperswarm_free_*
#[no_mangle]
pub extern "C" fn hyperswarm_poll_event(
    swarm_id: u64,
    out_peer_id: *mut *mut c_char,
    out_data: *mut *mut u8,
    out_data_len: *mut usize,
) -> c_int {
    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        let mut event_rx = handle.event_rx.write().await;
        let rx = match event_rx.as_mut() {
            Some(rx) => rx,
            None => return -1,
        };

        match rx.try_recv() {
            Ok(event) => {
                match event {
                    SwarmEvent::Ready { address } => {
                        unsafe {
                            if !out_peer_id.is_null() {
                                let addr = CString::new(address.to_string()).unwrap();
                                *out_peer_id = addr.into_raw();
                            }
                            if !out_data.is_null() {
                                *out_data = ptr::null_mut();
                            }
                            if !out_data_len.is_null() {
                                *out_data_len = 0;
                            }
                        }
                        FfiEventType::Ready as c_int
                    }
                    SwarmEvent::PeerConnected { peer_id, .. } => {
                        unsafe {
                            if !out_peer_id.is_null() {
                                let id = CString::new(peer_id.to_hex()).unwrap();
                                *out_peer_id = id.into_raw();
                            }
                            if !out_data.is_null() {
                                *out_data = ptr::null_mut();
                            }
                            if !out_data_len.is_null() {
                                *out_data_len = 0;
                            }
                        }
                        FfiEventType::PeerConnected as c_int
                    }
                    SwarmEvent::PeerDisconnected { peer_id } => {
                        unsafe {
                            if !out_peer_id.is_null() {
                                let id = CString::new(peer_id.to_hex()).unwrap();
                                *out_peer_id = id.into_raw();
                            }
                            if !out_data.is_null() {
                                *out_data = ptr::null_mut();
                            }
                            if !out_data_len.is_null() {
                                *out_data_len = 0;
                            }
                        }
                        FfiEventType::PeerDisconnected as c_int
                    }
                    SwarmEvent::Data { peer_id, data } => {
                        unsafe {
                            if !out_peer_id.is_null() {
                                let id = CString::new(peer_id.to_hex()).unwrap();
                                *out_peer_id = id.into_raw();
                            }
                            if !out_data.is_null() && !out_data_len.is_null() {
                                let len = data.len();
                                let ptr = libc::malloc(len) as *mut u8;
                                if !ptr.is_null() {
                                    std::ptr::copy_nonoverlapping(data.as_ptr(), ptr, len);
                                    *out_data = ptr;
                                    *out_data_len = len;
                                }
                            }
                        }
                        FfiEventType::Data as c_int
                    }
                    SwarmEvent::Error { message } => {
                        unsafe {
                            if !out_peer_id.is_null() {
                                let msg = CString::new(message).unwrap();
                                *out_peer_id = msg.into_raw();
                            }
                            if !out_data.is_null() {
                                *out_data = ptr::null_mut();
                            }
                            if !out_data_len.is_null() {
                                *out_data_len = 0;
                            }
                        }
                        FfiEventType::Error as c_int
                    }
                }
            }
            Err(_) => -1, // No event available
        }
    })
}

/// Free a string returned by poll_event
#[no_mangle]
pub extern "C" fn hyperswarm_free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            drop(CString::from_raw(s));
        }
    }
}

/// Free data returned by poll_event
#[no_mangle]
pub extern "C" fn hyperswarm_free_data(data: *mut u8) {
    if !data.is_null() {
        unsafe {
            libc::free(data as *mut c_void);
        }
    }
}

// ============================================================================
// Utility
// ============================================================================

/// Get the local peer ID as hex string
/// Caller must free with hyperswarm_free_string
#[no_mangle]
pub extern "C" fn hyperswarm_local_peer_id(swarm_id: u64) -> *mut c_char {
    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return ptr::null_mut(),
        };
        drop(swarms);

        let peer_id = handle.swarm.local_peer_id();
        match CString::new(peer_id.to_hex()) {
            Ok(s) => s.into_raw(),
            Err(_) => ptr::null_mut(),
        }
    })
}

/// Get the number of connected peers
#[no_mangle]
pub extern "C" fn hyperswarm_peer_count(swarm_id: u64) -> c_int {
    let runtime = init_runtime();

    runtime.block_on(async {
        let swarms = SWARMS.read().await;
        let handle = match swarms.get(&swarm_id) {
            Some(h) => h.clone(),
            None => return -1,
        };
        drop(swarms);

        handle.swarm.connected_peers().await.len() as c_int
    })
}

/// Initialize logging (call once at startup)
#[no_mangle]
pub extern "C" fn hyperswarm_init_logging() {
    #[cfg(target_os = "android")]
    {
        android_logger::init_once(
            android_logger::Config::default()
                .with_max_level(log::LevelFilter::Debug)
                .with_tag("hyperswarm"),
        );
    }

    #[cfg(target_os = "ios")]
    {
        // iOS logging via oslog
        let _ = oslog::OsLogger::new("com.homeschool.hyperswarm")
            .level_filter(log::LevelFilter::Debug)
            .init();
    }

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        let _ = env_logger::try_init();
    }
}
