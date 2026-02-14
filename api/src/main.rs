//! Homeschool API Server
//!
//! Lesson Plan API + Content Moderation Service.
//! Provides gRPC services for:
//! - Authentication (register, login, JWT)
//! - Lesson Plan CRUD (create, update, publish, fork)
//! - Content Moderation (criteria-based evaluation, admin queue)
//! - Social features (votes, comments, tags, collections)

mod auth;
mod db;
mod interceptor;
mod models;
mod moderation;
mod services;

use axum::{routing::get, Router};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub mod proto {
    tonic::include_proto!("homeschool.v1");
}

use proto::auth_service_server::AuthServiceServer;
use proto::lesson_plan_service_server::LessonPlanServiceServer;
use proto::moderation_service_server::ModerationServiceServer;
use proto::social_service_server::SocialServiceServer;

use services::auth_service::AuthServiceImpl;
use services::lesson_plan_service::LessonPlanServiceImpl;
use services::moderation_service::ModerationServiceImpl;
use services::social_service::SocialServiceImpl;

async fn health() -> &'static str {
    "OK"
}

#[tokio::main]
async fn main() {
    // Initialize logging with JSON format for Railway
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "homeschool_api=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Load configuration from environment
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    // Connect to database
    let pool = db::create_pool(&database_url)
        .await
        .expect("failed to connect to database");

    // Run migrations
    db::run_migrations(&pool)
        .await
        .expect("failed to run migrations");

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    // Build gRPC services
    let auth_service = AuthServiceImpl::new(pool.clone(), jwt_secret.clone());
    let lesson_plan_service = LessonPlanServiceImpl::new(pool.clone(), jwt_secret.clone());
    let moderation_service = ModerationServiceImpl::new(pool.clone(), jwt_secret.clone());
    let social_service = SocialServiceImpl::new(pool.clone(), jwt_secret.clone());

    // Build Axum router for HTTP endpoints (health check)
    let http_router = Router::new()
        .route("/health", get(health))
        .layer(cors.clone())
        .layer(TraceLayer::new_for_http());

    // Build gRPC server with tonic-web for browser compatibility
    #[allow(deprecated)] // into_router renamed in newer tonic; pinned to 0.12
    let grpc_router = tonic::transport::Server::builder()
        .accept_http1(true)
        .add_service(tonic_web::enable(AuthServiceServer::new(auth_service)))
        .add_service(tonic_web::enable(LessonPlanServiceServer::new(lesson_plan_service)))
        .add_service(tonic_web::enable(ModerationServiceServer::new(moderation_service)))
        .add_service(tonic_web::enable(SocialServiceServer::new(social_service)))
        .into_router();

    // Combine HTTP and gRPC routers
    let app = http_router.merge(grpc_router);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("API server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
