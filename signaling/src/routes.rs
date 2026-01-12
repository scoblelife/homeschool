//! HTTP route handlers for signaling API
//!
//! Implements the same endpoints as the Cloudflare Worker:
//! - Offers/answers for device pairing
//! - Presence heartbeats
//! - Signal relay for WebRTC SDP/ICE exchange

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::store::Store;

/// TTL constants (in seconds)
const OFFER_TTL: u64 = 172800;     // 48 hours
const ANSWER_TTL: u64 = 300;       // 5 minutes
const PRESENCE_TTL: u64 = 60;      // 60 seconds
const SIGNAL_TTL: u64 = 300;       // 5 minutes

/// App state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub store: Store,
}

/// Standard success response
#[derive(Serialize)]
pub struct OkResponse {
    ok: bool,
}

/// Health check response
#[derive(Serialize)]
pub struct HealthResponse {
    status: &'static str,
    timestamp: i64,
    entries_total: usize,
    entries_active: usize,
}

/// Offer response
#[derive(Serialize)]
pub struct OfferResponse {
    offer: Option<serde_json::Value>,
}

/// Answer response
#[derive(Serialize)]
pub struct AnswerResponse {
    answer: Option<serde_json::Value>,
}

/// Presence heartbeat request
#[derive(Deserialize)]
pub struct HeartbeatRequest {
    #[serde(rename = "pubKey")]
    pub_key: String,
}

/// Presence entry
#[derive(Serialize, Deserialize)]
pub struct PresenceEntry {
    #[serde(rename = "pubKey")]
    pub_key: String,
    ts: i64,
}

/// Online peer
#[derive(Serialize)]
pub struct OnlinePeer {
    #[serde(rename = "deviceId")]
    device_id: String,
    #[serde(rename = "pubKey")]
    pub_key: String,
    ts: i64,
}

/// Online peers response
#[derive(Serialize)]
pub struct OnlinePeersResponse {
    peers: Vec<OnlinePeer>,
}

/// Signals response
#[derive(Serialize)]
pub struct SignalsResponse {
    messages: Vec<serde_json::Value>,
}

/// Signal post response
#[derive(Serialize)]
pub struct SignalPostResponse {
    ok: bool,
    id: String,
}

// =============================================================================
// Health Check
// =============================================================================

pub async fn health(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let (total, active) = state.store.stats().await;
    Json(HealthResponse {
        status: "ok",
        timestamp: chrono::Utc::now().timestamp_millis(),
        entries_total: total,
        entries_active: active,
    })
}

// =============================================================================
// Offers (device pairing)
// =============================================================================

pub async fn post_offer(
    State(state): State<Arc<AppState>>,
    Path(topic): Path<String>,
    body: String,
) -> impl IntoResponse {
    let key = format!("offer:{}", topic);
    state.store.set(key, body, OFFER_TTL).await;
    tracing::info!("Stored offer for topic: {}...", &topic[..8.min(topic.len())]);
    Json(OkResponse { ok: true })
}

pub async fn get_offer(
    State(state): State<Arc<AppState>>,
    Path(topic): Path<String>,
) -> impl IntoResponse {
    let key = format!("offer:{}", topic);
    let offer = state.store.get_and_delete(&key).await;

    if offer.is_some() {
        tracing::info!("Retrieved offer for topic: {}...", &topic[..8.min(topic.len())]);
    }

    let offer_json = offer.and_then(|s| serde_json::from_str(&s).ok());
    Json(OfferResponse { offer: offer_json })
}

// =============================================================================
// Answers (device pairing response)
// =============================================================================

pub async fn post_answer(
    State(state): State<Arc<AppState>>,
    Path(topic): Path<String>,
    body: String,
) -> impl IntoResponse {
    let key = format!("answer:{}", topic);
    state.store.set(key, body, ANSWER_TTL).await;
    tracing::info!("Stored answer for topic: {}...", &topic[..8.min(topic.len())]);
    Json(OkResponse { ok: true })
}

pub async fn get_answer(
    State(state): State<Arc<AppState>>,
    Path(topic): Path<String>,
) -> impl IntoResponse {
    let key = format!("answer:{}", topic);
    let answer = state.store.get_and_delete(&key).await;

    if answer.is_some() {
        tracing::info!("Retrieved answer for topic: {}...", &topic[..8.min(topic.len())]);
    }

    let answer_json = answer.and_then(|s| serde_json::from_str(&s).ok());
    Json(AnswerResponse { answer: answer_json })
}

// =============================================================================
// Presence (device online status)
// =============================================================================

pub async fn post_presence(
    State(state): State<Arc<AppState>>,
    Path((family_id, device_id)): Path<(String, String)>,
    Json(req): Json<HeartbeatRequest>,
) -> impl IntoResponse {
    let key = format!("presence:{}:{}", family_id, device_id);
    let entry = PresenceEntry {
        pub_key: req.pub_key,
        ts: chrono::Utc::now().timestamp_millis(),
    };
    let value = serde_json::to_string(&entry).unwrap();
    state.store.set(key, value, PRESENCE_TTL).await;
    Json(OkResponse { ok: true })
}

pub async fn delete_presence(
    State(state): State<Arc<AppState>>,
    Path((family_id, device_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let key = format!("presence:{}:{}", family_id, device_id);
    state.store.delete(&key).await;
    Json(OkResponse { ok: true })
}

pub async fn get_online_peers(
    State(state): State<Arc<AppState>>,
    Path(family_id): Path<String>,
) -> impl IntoResponse {
    let prefix = format!("presence:{}:", family_id);
    let entries = state.store.list_prefix(&prefix).await;

    let peers: Vec<OnlinePeer> = entries
        .into_iter()
        .filter_map(|(key, value)| {
            // Extract device_id from key: "presence:familyId:deviceId"
            let device_id = key.strip_prefix(&prefix)?.to_string();
            let entry: PresenceEntry = serde_json::from_str(&value).ok()?;
            Some(OnlinePeer {
                device_id,
                pub_key: entry.pub_key,
                ts: entry.ts,
            })
        })
        .collect();

    Json(OnlinePeersResponse { peers })
}

// =============================================================================
// Signals (WebRTC SDP/ICE exchange)
// =============================================================================

pub async fn post_signal(
    State(state): State<Arc<AppState>>,
    Path((topic, peer_id)): Path<(String, String)>,
    body: String,
) -> impl IntoResponse {
    let id = format!(
        "{}-{}",
        chrono::Utc::now().timestamp_millis(),
        rand_id()
    );
    let key = format!("sig:{}:{}:{}", topic, peer_id, id);
    state.store.set(key, body, SIGNAL_TTL).await;
    Json(SignalPostResponse { ok: true, id })
}

pub async fn get_signals(
    State(state): State<Arc<AppState>>,
    Path((topic, peer_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let prefix = format!("sig:{}:{}:", topic, peer_id);
    let values = state.store.get_and_delete_prefix(&prefix).await;

    let messages: Vec<serde_json::Value> = values
        .into_iter()
        .filter_map(|s| serde_json::from_str(&s).ok())
        .collect();

    Json(SignalsResponse { messages })
}

// =============================================================================
// Helpers
// =============================================================================

/// Generate a short random ID
fn rand_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    format!("{:x}", nanos)
}

/// 404 handler
pub async fn not_found() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, Json(serde_json::json!({"error": "Not found"})))
}
