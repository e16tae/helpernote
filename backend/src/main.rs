// Allow uninlined format args - these are clearer with explicit placeholders
#![allow(clippy::uninlined_format_args)]

use axum::{
    extract::FromRef,
    middleware::{from_fn, from_fn_with_state},
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod handlers;
mod middleware;
mod models;
mod repositories;
mod services;

#[derive(Clone, FromRef)]
struct AppState {
    pool: PgPool,
    config: config::Config,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "helpernote_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let config = config::Config::from_env().expect("Failed to load configuration");

    // Set up database connection pool
    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations automatically on startup
    // Temporarily commented out for testing - schema.sql already initializes DB
    // sqlx::migrate!("./migrations")
    //     .run(&db_pool)
    //     .await
    //     .expect("Failed to run migrations");

    // Build application routes
    // Public routes (no authentication required)
    // Auth routes with stricter rate limiting
    let auth_routes = Router::new()
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/refresh", post(handlers::auth::refresh_token))
        .route(
            "/api/auth/forgot-password",
            post(handlers::auth::forgot_password),
        )
        .layer(from_fn(middleware::rate_limit::auth_rate_limit_middleware));

    let public_routes = Router::new()
        .route("/", get(|| async { "Helpernote API" }))
        .route("/health", get(handlers::health::health_check))
        .merge(auth_routes);

    // Protected routes (require JWT authentication)
    let protected_routes = Router::new()
        // User profile routes
        .route("/api/profile", get(handlers::user::get_profile))
        .route("/api/profile", put(handlers::user::update_profile))
        // Customer routes
        .route("/api/customers", post(handlers::customer::create_customer))
        .route("/api/customers", get(handlers::customer::list_customers))
        .route(
            "/api/customers/search",
            get(handlers::customer::search_customers),
        )
        .route("/api/customers/{id}", get(handlers::customer::get_customer))
        .route(
            "/api/customers/{id}",
            put(handlers::customer::update_customer),
        )
        .route(
            "/api/customers/{id}",
            delete(handlers::customer::delete_customer),
        )
        // Customer memos
        .route(
            "/api/customers/{id}/memos",
            post(handlers::memo::create_customer_memo),
        )
        .route(
            "/api/customers/{id}/memos",
            get(handlers::memo::list_customer_memos),
        )
        // Customer tags
        .route(
            "/api/customers/{id}/tags",
            post(handlers::tag::attach_customer_tags),
        )
        .route(
            "/api/customers/{id}/tags",
            get(handlers::tag::list_customer_tags),
        )
        .route(
            "/api/customers/{id}/tags/{tag_id}",
            delete(handlers::tag::detach_customer_tag),
        )
        // Customer files
        .route(
            "/api/customers/{id}/files",
            post(handlers::file::upload_customer_file),
        )
        .route(
            "/api/customers/{id}/files",
            get(handlers::file::list_customer_files),
        )
        .route(
            "/api/customers/{id}/files/{file_id}",
            delete(handlers::file::delete_customer_file),
        )
        .route(
            "/api/customers/{id}/profile-photo",
            post(handlers::file::upload_customer_profile_photo),
        )
        // Job posting routes
        .route(
            "/api/job-postings",
            post(handlers::job_posting::create_job_posting),
        )
        .route(
            "/api/job-postings",
            get(handlers::job_posting::list_job_postings),
        )
        .route(
            "/api/job-postings/{id}",
            get(handlers::job_posting::get_job_posting),
        )
        .route(
            "/api/job-postings/{id}",
            put(handlers::job_posting::update_job_posting),
        )
        .route(
            "/api/job-postings/{id}",
            delete(handlers::job_posting::delete_job_posting),
        )
        // Job seeking routes
        .route(
            "/api/job-seekings",
            post(handlers::job_seeking::create_job_seeking),
        )
        .route(
            "/api/job-seekings",
            get(handlers::job_seeking::list_job_seekings),
        )
        .route(
            "/api/job-seekings/{id}",
            get(handlers::job_seeking::get_job_seeking),
        )
        .route(
            "/api/job-seekings/{id}",
            put(handlers::job_seeking::update_job_seeking),
        )
        .route(
            "/api/job-seekings/{id}",
            delete(handlers::job_seeking::delete_job_seeking),
        )
        // Matching routes
        .route("/api/matchings", post(handlers::matching::create_matching))
        .route("/api/matchings", get(handlers::matching::list_matchings))
        .route("/api/matchings/{id}", get(handlers::matching::get_matching))
        .route(
            "/api/matchings/{id}/status",
            put(handlers::matching::update_matching_status),
        )
        .route(
            "/api/matchings/{id}/complete",
            post(handlers::matching::complete_matching),
        )
        .route(
            "/api/matchings/{id}/cancel",
            post(handlers::matching::cancel_matching),
        )
        // Matching memos
        .route(
            "/api/matchings/{id}/memos",
            post(handlers::memo::create_matching_memo),
        )
        .route(
            "/api/matchings/{id}/memos",
            get(handlers::memo::list_matching_memos),
        )
        // Tag routes
        .route("/api/tags", post(handlers::tag::create_tag))
        .route("/api/tags", get(handlers::tag::list_tags))
        .route("/api/tags/{id}", get(handlers::tag::get_tag))
        .route("/api/tags/{id}", put(handlers::tag::update_tag))
        .route("/api/tags/{id}", delete(handlers::tag::delete_tag))
        .layer(from_fn_with_state(
            db_pool.clone(),
            middleware::auth::auth_middleware,
        ));

    // Create application state
    let app_state = AppState {
        pool: db_pool,
        config: config.clone(),
    };

    // Configure CORS
    // In production, replace with specific origins
    let cors = if cfg!(debug_assertions) {
        // Development: permissive CORS
        CorsLayer::permissive()
    } else {
        // Production: restrictive CORS
        CorsLayer::new()
            .allow_origin(["https://helpernote.com", "https://www.helpernote.com"].map(|s| s.parse().unwrap()))
            .allow_methods([
                axum::http::Method::GET,
                axum::http::Method::POST,
                axum::http::Method::PUT,
                axum::http::Method::DELETE,
                axum::http::Method::OPTIONS,
            ])
            .allow_headers([
                axum::http::header::AUTHORIZATION,
                axum::http::header::CONTENT_TYPE,
                axum::http::header::ACCEPT,
            ])
            .allow_credentials(true)
            .max_age(std::time::Duration::from_secs(3600))
    };

    // Combine routes with global rate limiting
    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(from_fn(middleware::rate_limit::rate_limit_middleware))
        .layer(cors)
        .with_state(app_state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
