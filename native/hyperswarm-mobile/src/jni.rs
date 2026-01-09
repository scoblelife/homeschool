//! JNI bindings for Android
//!
//! This module provides JNI-compatible functions that can be called from
//! Kotlin/Java on Android.

#![cfg(target_os = "android")]

use jni::objects::{JClass, JMap, JObject, JString, JValue};
use jni::sys::{jint, jlong, jobject, jstring};
use jni::JNIEnv;

use crate::ffi;
use std::ffi::CString;

/// Helper to convert JString to Rust String
fn jstring_to_string(env: &mut JNIEnv, s: &JString) -> Option<String> {
    env.get_string(s).ok().map(|s| s.into())
}

/// Helper to create a Java String from Rust
fn string_to_jstring(env: &mut JNIEnv, s: &str) -> jstring {
    env.new_string(s)
        .map(|s| s.into_raw())
        .unwrap_or(std::ptr::null_mut())
}

/// Create a new swarm
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeCreate(
    mut env: JNIEnv,
    _class: JClass,
    device_id: JString,
) -> jint {
    let device_id = match jstring_to_string(&mut env, &device_id) {
        Some(s) => s,
        None => return -1,
    };

    let c_device_id = match CString::new(device_id) {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let id = ffi::hyperswarm_create(c_device_id.as_ptr());
    if id == 0 {
        -1
    } else {
        id as jint
    }
}

/// Start the swarm
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeStart(
    _env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
) -> jint {
    ffi::hyperswarm_start(swarm_id as u64) as jint
}

/// Stop the swarm
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeStop(
    _env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
) -> jint {
    ffi::hyperswarm_stop(swarm_id as u64) as jint
}

/// Destroy the swarm
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeDestroy(
    _env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
) {
    ffi::hyperswarm_destroy(swarm_id as u64);
}

/// Join a topic
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeJoin(
    mut env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
    topic: JString,
) -> jint {
    let topic = match jstring_to_string(&mut env, &topic) {
        Some(s) => s,
        None => return -1,
    };

    let c_topic = match CString::new(topic) {
        Ok(s) => s,
        Err(_) => return -1,
    };

    ffi::hyperswarm_join(swarm_id as u64, c_topic.as_ptr()) as jint
}

/// Leave a topic
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeLeave(
    mut env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
    topic: JString,
) -> jint {
    let topic = match jstring_to_string(&mut env, &topic) {
        Some(s) => s,
        None => return -1,
    };

    let c_topic = match CString::new(topic) {
        Ok(s) => s,
        Err(_) => return -1,
    };

    ffi::hyperswarm_leave(swarm_id as u64, c_topic.as_ptr()) as jint
}

/// Send data to a peer
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeSend(
    mut env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
    peer_id: JString,
    data: JString,
    _data_len: jint,
) -> jint {
    let peer_id = match jstring_to_string(&mut env, &peer_id) {
        Some(s) => s,
        None => return -1,
    };

    let data = match jstring_to_string(&mut env, &data) {
        Some(s) => s,
        None => return -1,
    };

    let c_peer_id = match CString::new(peer_id) {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let data_bytes = data.as_bytes();

    ffi::hyperswarm_send(
        swarm_id as u64,
        c_peer_id.as_ptr(),
        data_bytes.as_ptr(),
        data_bytes.len(),
    ) as jint
}

/// Broadcast data to all peers
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeBroadcast(
    mut env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
    data: JString,
    _data_len: jint,
) -> jint {
    let data = match jstring_to_string(&mut env, &data) {
        Some(s) => s,
        None => return -1,
    };

    let data_bytes = data.as_bytes();

    ffi::hyperswarm_broadcast(swarm_id as u64, data_bytes.as_ptr(), data_bytes.len()) as jint
}

/// Get local peer ID
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeLocalPeerId(
    mut env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
) -> jstring {
    let ptr = ffi::hyperswarm_local_peer_id(swarm_id as u64);
    if ptr.is_null() {
        return std::ptr::null_mut();
    }

    let c_str = unsafe { std::ffi::CStr::from_ptr(ptr) };
    let result = match c_str.to_str() {
        Ok(s) => string_to_jstring(&mut env, s),
        Err(_) => std::ptr::null_mut(),
    };

    ffi::hyperswarm_free_string(ptr);
    result
}

/// Get peer count
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativePeerCount(
    _env: JNIEnv,
    _class: JClass,
    swarm_id: jint,
) -> jint {
    ffi::hyperswarm_peer_count(swarm_id as u64) as jint
}

/// Poll for events - returns a Map with event data or null
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativePollEvent<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    swarm_id: jint,
) -> jobject {
    let mut peer_id_ptr: *mut std::os::raw::c_char = std::ptr::null_mut();
    let mut data_ptr: *mut u8 = std::ptr::null_mut();
    let mut data_len: usize = 0;

    let event_type = ffi::hyperswarm_poll_event(
        swarm_id as u64,
        &mut peer_id_ptr,
        &mut data_ptr,
        &mut data_len,
    );

    if event_type < 0 {
        return std::ptr::null_mut();
    }

    // Create a HashMap to return the event data
    let hash_map_class = match env.find_class("java/util/HashMap") {
        Ok(c) => c,
        Err(_) => return std::ptr::null_mut(),
    };

    let map = match env.new_object(&hash_map_class, "()V", &[]) {
        Ok(m) => m,
        Err(_) => return std::ptr::null_mut(),
    };

    // Add type to map
    let type_key = env.new_string("type").unwrap();
    let type_val = env.new_object(
        "java/lang/Integer",
        "(I)V",
        &[JValue::Int(event_type)],
    ).unwrap();
    let _ = env.call_method(
        &map,
        "put",
        "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;",
        &[JValue::Object(&type_key.into()), JValue::Object(&type_val)],
    );

    // Add peer_id if present
    if !peer_id_ptr.is_null() {
        let c_str = unsafe { std::ffi::CStr::from_ptr(peer_id_ptr) };
        if let Ok(s) = c_str.to_str() {
            let key = env.new_string("peerId").unwrap();
            let val = env.new_string(s).unwrap();
            let _ = env.call_method(
                &map,
                "put",
                "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;",
                &[JValue::Object(&key.into()), JValue::Object(&val.into())],
            );
        }
        ffi::hyperswarm_free_string(peer_id_ptr);
    }

    // Add data if present
    if !data_ptr.is_null() && data_len > 0 {
        let data_slice = unsafe { std::slice::from_raw_parts(data_ptr, data_len) };
        if let Ok(s) = std::str::from_utf8(data_slice) {
            let key = env.new_string("data").unwrap();
            let val = env.new_string(s).unwrap();
            let _ = env.call_method(
                &map,
                "put",
                "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;",
                &[JValue::Object(&key.into()), JValue::Object(&val.into())],
            );
        }
        ffi::hyperswarm_free_data(data_ptr);
    }

    map.into_raw()
}

/// Initialize logging
#[no_mangle]
pub extern "system" fn Java_com_hyperswarm_HyperswarmModule_nativeInitLogging(
    _env: JNIEnv,
    _class: JClass,
) {
    ffi::hyperswarm_init_logging();
}
