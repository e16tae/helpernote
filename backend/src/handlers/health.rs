use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub database: bool,
    pub version: String,
    pub uptime: Option<u64>,
}

static START_TIME: std::sync::OnceLock<std::time::Instant> = std::sync::OnceLock::new();

pub async fn health_check(State(pool): State<PgPool>) -> (StatusCode, Json<HealthResponse>) {
    // Initialize start time on first call
    START_TIME.get_or_init(std::time::Instant::now);

    // Check database connectivity
    let db_ok = sqlx::query("SELECT 1")
        .fetch_one(&pool)
        .await
        .is_ok();

    let uptime = START_TIME
        .get()
        .map(|start| start.elapsed().as_secs());

    let status = if db_ok { "healthy" } else { "degraded" };
    let status_code = if db_ok { StatusCode::OK } else { StatusCode::SERVICE_UNAVAILABLE };

    (
        status_code,
        Json(HealthResponse {
            status: status.to_string(),
            database: db_ok,
            version: env!("CARGO_PKG_VERSION").to_string(),
            uptime,
        }),
    )
}
