use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use axum_test::TestServer;
use helpernote_backend::{handlers, AppState};
use sqlx::PgPool;
use std::sync::Arc;

#[sqlx::test]
async fn test_health_check_success(pool: PgPool) {
    let config = helpernote_backend::config::Config::from_env().unwrap();
    let app_state = AppState {
        pool: pool.clone(),
        config: config.clone(),
    };

    let app = axum::Router::new()
        .route("/health", axum::routing::get(handlers::health::health_check))
        .with_state(app_state);

    let server = TestServer::new(app).unwrap();

    let response = server.get("/health").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let body: serde_json::Value = response.json();
    assert_eq!(body["status"], "healthy");
}

#[sqlx::test]
async fn test_health_check_with_db_connection(pool: PgPool) {
    // Verify database connection is working
    let result = sqlx::query("SELECT 1 as value")
        .fetch_one(&pool)
        .await;

    assert!(result.is_ok());
}
