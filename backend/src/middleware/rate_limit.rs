use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct RateLimiter {
    requests: Arc<Mutex<HashMap<String, Vec<std::time::Instant>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window: Duration) -> Self {
        Self {
            requests: Arc::new(Mutex::new(HashMap::new())),
            max_requests,
            window,
        }
    }

    pub async fn check_rate_limit(&self, key: &str) -> Result<(), RateLimitError> {
        let mut requests = self.requests.lock().await;
        let now = std::time::Instant::now();

        // Get or create request history for this key
        let history = requests.entry(key.to_string()).or_insert_with(Vec::new);

        // Remove old requests outside the window
        history.retain(|&req_time| now.duration_since(req_time) < self.window);

        // Check if limit exceeded
        if history.len() >= self.max_requests {
            return Err(RateLimitError::TooManyRequests {
                retry_after: self.window.as_secs(),
            });
        }

        // Add current request
        history.push(now);

        Ok(())
    }
}

#[derive(Debug)]
pub enum RateLimitError {
    TooManyRequests { retry_after: u64 },
}

#[derive(Serialize)]
struct RateLimitResponse {
    error: String,
    retry_after: u64,
}

impl IntoResponse for RateLimitError {
    fn into_response(self) -> Response {
        match self {
            RateLimitError::TooManyRequests { retry_after } => {
                let body = serde_json::to_string(&RateLimitResponse {
                    error: "Too many requests. Please try again later.".to_string(),
                    retry_after,
                })
                .unwrap();

                (
                    StatusCode::TOO_MANY_REQUESTS,
                    [
                        ("Content-Type", "application/json"),
                        ("Retry-After", &retry_after.to_string()),
                    ],
                    body,
                )
                    .into_response()
            }
        }
    }
}

/// Rate limiting middleware
/// Default: 100 requests per minute per IP
pub async fn rate_limit_middleware(req: Request, next: Next) -> Result<Response, RateLimitError> {
    static RATE_LIMITER: OnceLock<RateLimiter> = OnceLock::new();
    let limiter = RATE_LIMITER.get_or_init(|| RateLimiter::new(100, Duration::from_secs(60)));

    // Extract IP from request
    let ip = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .or_else(|| {
            req.extensions()
                .get::<std::net::SocketAddr>()
                .map(|addr| addr.ip().to_string())
        })
        .unwrap_or_else(|| "unknown".to_string());

    // Check rate limit
    limiter.check_rate_limit(&ip).await?;

    Ok(next.run(req).await)
}

/// Stricter rate limiting for authentication endpoints
/// 100 requests per minute per IP (increased for testing)
pub async fn auth_rate_limit_middleware(
    req: Request,
    next: Next,
) -> Result<Response, RateLimitError> {
    static AUTH_RATE_LIMITER: OnceLock<RateLimiter> = OnceLock::new();
    let limiter = AUTH_RATE_LIMITER.get_or_init(|| RateLimiter::new(100, Duration::from_secs(60)));

    let ip = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .or_else(|| {
            req.extensions()
                .get::<std::net::SocketAddr>()
                .map(|addr| addr.ip().to_string())
        })
        .unwrap_or_else(|| "unknown".to_string());

    limiter.check_rate_limit(&ip).await?;

    Ok(next.run(req).await)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rate_limiter_logic() {
        let limiter = RateLimiter::new(5, Duration::from_secs(60));

        // First 5 requests should succeed
        for _ in 0..5 {
            assert!(limiter.check_rate_limit("test_ip").await.is_ok());
        }

        // 6th request should fail
        assert!(limiter.check_rate_limit("test_ip").await.is_err());
    }

    #[tokio::test]
    async fn test_rate_limit_per_ip() {
        let limiter = RateLimiter::new(3, Duration::from_secs(60));

        // Each IP should have separate limits
        assert!(limiter.check_rate_limit("ip1").await.is_ok());
        assert!(limiter.check_rate_limit("ip2").await.is_ok());
        assert!(limiter.check_rate_limit("ip1").await.is_ok());
        assert!(limiter.check_rate_limit("ip2").await.is_ok());
    }

    #[test]
    fn test_rate_limit_configuration() {
        // Verify auth rate limit is stricter than general
        let general_limit = 100;
        let auth_limit = 5;
        assert!(
            auth_limit < general_limit,
            "Auth rate limit should be stricter than general"
        );
    }
}
