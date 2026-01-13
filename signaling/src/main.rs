//! Homeschool Signaling Server
//!
//! A lightweight WebRTC signaling server for P2P sync.
//! This server handles:
//! - Device discovery (presence heartbeats)
//! - WebRTC connection setup (SDP/ICE exchange)
//! - Device pairing (offer/answer exchange)
//!
//! All actual sync data flows P2P via WebRTC - this server never sees user data.

mod routes;
mod store;

use axum::{
    routing::{get, post, delete},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use routes::AppState;
use store::Store;

#[tokio::main]
async fn main() {
    // Initialize logging with JSON format for Fly.io
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "homeschool_signaling=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Create shared state
    let state = Arc::new(AppState {
        store: Store::new(),
    });

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        // Health check
        .route("/health", get(routes::health))
        // Offers (device pairing)
        .route("/offer/:topic", post(routes::post_offer))
        .route("/offer/:topic", get(routes::get_offer))
        // Answers (device pairing response)
        .route("/answer/:topic", post(routes::post_answer))
        .route("/answer/:topic", get(routes::get_answer))
        // Presence (device online status)
        .route("/presence/:family_id/:device_id", post(routes::post_presence))
        .route("/presence/:family_id/:device_id", delete(routes::delete_presence))
        .route("/presence/:family_id", get(routes::get_online_peers))
        // Signals (WebRTC SDP/ICE exchange)
        .route("/signal/:topic/:peer_id", post(routes::post_signal))
        .route("/signal/:topic/:peer_id", get(routes::get_signals))
        // Fallback
        .fallback(routes::not_found)
        // Middleware
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Get port from environment or default to 8080
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Signaling server listening on {}", addr);

    // Run server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
