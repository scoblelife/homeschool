//! Hyperswarm Mobile - Native P2P networking for iOS and Android
//!
//! This library provides a native implementation of the Hyperswarm protocol
//! for peer-to-peer networking with NAT traversal capabilities.

pub mod dht;
pub mod noise;
pub mod transport;
pub mod ffi;

#[cfg(target_os = "android")]
mod jni;

mod error;
mod swarm;
mod peer;

pub use error::{Error, Result};
pub use swarm::{Swarm, SwarmConfig, SwarmEvent};
pub use peer::{Peer, PeerId};

use once_cell::sync::OnceCell;
use std::sync::Arc;
use tokio::runtime::Runtime;

/// Global Tokio runtime for async operations
static RUNTIME: OnceCell<Runtime> = OnceCell::new();

/// Initialize the global runtime
pub fn init_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()
            .expect("Failed to create Tokio runtime")
    })
}

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
