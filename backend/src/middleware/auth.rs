use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use serde::Serialize;
use sqlx::PgPool;

use crate::config::Config;
use crate::repositories::user::UserRepository;
use crate::services::auth::{AuthService, TokenType};

#[derive(Clone)]
pub struct AuthUser {
    pub user_id: i64,
    #[allow(dead_code)]
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct AuthErrorResponse {
    pub error: String,
}

/// Middleware to authenticate requests using JWT tokens
pub async fn auth_middleware(
    State(pool): State<PgPool>,
    State(config): State<Config>,
    mut req: Request,
    next: Next,
) -> Result<Response, (StatusCode, Json<AuthErrorResponse>)> {
    // Extract authorization header
    let token = extract_token(&req).ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            Json(AuthErrorResponse {
                error: "Missing authentication token".to_string(),
            }),
        )
    })?;

    let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
    let claims = auth_service
        .validate_token(&token, TokenType::Access)
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(AuthErrorResponse {
                    error: format!("Invalid token: {}", e),
                }),
            )
        })?;

    // Parse user_id from claims
    let user_id: i64 = claims.sub.parse().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(AuthErrorResponse {
                error: "Invalid user ID in token".to_string(),
            }),
        )
    })?;

    // Verify user exists
    let user_repo = UserRepository::new(pool);
    let user = user_repo.find_by_id(user_id).await.map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(AuthErrorResponse {
                error: "User not found".to_string(),
            }),
        )
    })?;

    // Add user info to request extensions
    req.extensions_mut().insert(AuthUser {
        user_id: user.id,
        username: user.username,
    });

    Ok(next.run(req).await)
}

/// Extractor for getting authenticated user from request
/// Use this in your handlers like: `Extension(user): Extension<AuthUser>`
pub mod extract {
    use super::AuthUser;
    use axum::{
        extract::FromRequestParts,
        http::{request::Parts, StatusCode},
        Json,
    };

    use super::AuthErrorResponse;

    impl<S> FromRequestParts<S> for AuthUser
    where
        S: Send + Sync,
    {
        type Rejection = (StatusCode, Json<AuthErrorResponse>);

        async fn from_request_parts(
            parts: &mut Parts,
            _state: &S,
        ) -> Result<Self, Self::Rejection> {
            parts.extensions.get::<AuthUser>().cloned().ok_or_else(|| {
                (
                    StatusCode::UNAUTHORIZED,
                    Json(AuthErrorResponse {
                        error: "Unauthorized".to_string(),
                    }),
                )
            })
        }
    }
}

fn extract_token(req: &Request) -> Option<String> {
    if let Some(header_value) = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
    {
        if let Some(token) = header_value.strip_prefix("Bearer ") {
            return Some(token.to_string());
        }
    }

    req.headers()
        .get(header::COOKIE)
        .and_then(|header| header.to_str().ok())
        .and_then(|cookie_header| {
            cookie_header.split(';').find_map(|pair| {
                let trimmed = pair.trim();
                trimmed
                    .strip_prefix("token=")
                    .map(|value| value.to_string())
            })
        })
}
