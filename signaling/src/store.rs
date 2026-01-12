//! In-memory storage with TTL cleanup
//!
//! Stores signaling data (offers, answers, presence, signals) with automatic expiration.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tokio::time::interval;

/// Entry with expiration time
#[derive(Clone)]
struct Entry {
    value: String,
    expires_at: Instant,
}

/// Thread-safe store with TTL cleanup
#[derive(Clone)]
pub struct Store {
    data: Arc<RwLock<HashMap<String, Entry>>>,
}

impl Store {
    /// Create a new store and start background cleanup task
    pub fn new() -> Self {
        let store = Self {
            data: Arc::new(RwLock::new(HashMap::new())),
        };

        // Start background cleanup task
        let store_clone = store.clone();
        tokio::spawn(async move {
            let mut cleanup_interval = interval(Duration::from_secs(10));
            loop {
                cleanup_interval.tick().await;
                store_clone.cleanup_expired().await;
            }
        });

        store
    }

    /// Set a value with TTL in seconds
    pub async fn set(&self, key: String, value: String, ttl_secs: u64) {
        let entry = Entry {
            value,
            expires_at: Instant::now() + Duration::from_secs(ttl_secs),
        };
        let mut data = self.data.write().await;
        data.insert(key, entry);
    }

    /// Get a value (returns None if expired or not found)
    pub async fn get(&self, key: &str) -> Option<String> {
        let data = self.data.read().await;
        data.get(key).and_then(|entry| {
            if entry.expires_at > Instant::now() {
                Some(entry.value.clone())
            } else {
                None
            }
        })
    }

    /// Get and delete a value (one-time use)
    pub async fn get_and_delete(&self, key: &str) -> Option<String> {
        let mut data = self.data.write().await;
        data.remove(key).and_then(|entry| {
            if entry.expires_at > Instant::now() {
                Some(entry.value)
            } else {
                None
            }
        })
    }

    /// Delete a value
    pub async fn delete(&self, key: &str) {
        let mut data = self.data.write().await;
        data.remove(key);
    }

    /// List all keys with a prefix (for presence/signals)
    pub async fn list_prefix(&self, prefix: &str) -> Vec<(String, String)> {
        let data = self.data.read().await;
        let now = Instant::now();
        data.iter()
            .filter(|(k, entry)| k.starts_with(prefix) && entry.expires_at > now)
            .map(|(k, entry)| (k.clone(), entry.value.clone()))
            .collect()
    }

    /// Get and delete all entries with a prefix (for signals)
    pub async fn get_and_delete_prefix(&self, prefix: &str) -> Vec<String> {
        let mut data = self.data.write().await;
        let now = Instant::now();
        let keys_to_remove: Vec<String> = data
            .iter()
            .filter(|(k, entry)| k.starts_with(prefix) && entry.expires_at > now)
            .map(|(k, _)| k.clone())
            .collect();

        keys_to_remove
            .into_iter()
            .filter_map(|k| data.remove(&k).map(|entry| entry.value))
            .collect()
    }

    /// Remove expired entries
    async fn cleanup_expired(&self) {
        let mut data = self.data.write().await;
        let now = Instant::now();
        let before_count = data.len();
        data.retain(|_, entry| entry.expires_at > now);
        let removed = before_count - data.len();
        if removed > 0 {
            tracing::debug!("Cleaned up {} expired entries", removed);
        }
    }

    /// Get stats for health check
    pub async fn stats(&self) -> (usize, usize) {
        let data = self.data.read().await;
        let now = Instant::now();
        let total = data.len();
        let active = data.values().filter(|e| e.expires_at > now).count();
        (total, active)
    }
}

impl Default for Store {
    fn default() -> Self {
        Self::new()
    }
}
