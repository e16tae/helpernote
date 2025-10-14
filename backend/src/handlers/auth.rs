use axum::{
    extract::State,
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use validator::Validate;

use crate::config::Config;
use crate::repositories::user::{UserRepository, UserRepositoryError};
use crate::services::auth::{hash_password, verify_password, AuthService, TokenType};

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    #[validate(length(min = 8))]
    pub password: String,
    pub security_question_id: i64,
    #[validate(length(min = 1))]
    pub security_answer: String,
    pub phone: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: i64,
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

impl ErrorResponse {
    fn new(error: impl Into<String>) -> Self {
        Self {
            error: error.into(),
        }
    }
}

pub async fn register(
    State(pool): State<PgPool>,
    State(config): State<Config>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    // Validate input
    if let Err(e) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(format!("Validation error: {}", e))),
        ));
    }

    // Hash password
    let password_hash = hash_password(&payload.password).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!(
                "Password hashing failed: {}",
                e
            ))),
        )
    })?;

    // Normalize and hash security answer
    let normalized_security_answer = payload.security_answer.trim().to_lowercase();
    let security_answer_hash = hash_password(&normalized_security_answer).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!(
                "Security answer hashing failed: {}",
                e
            ))),
        )
    })?;

    // Create user repository
    let user_repo = UserRepository::new(pool.clone());

    // Create user in database
    let user = user_repo
        .create_user(
            &payload.username,
            &password_hash,
            payload.security_question_id,
            &security_answer_hash,
            payload.phone.as_deref(),
        )
        .await
        .map_err(|e| match e {
            UserRepositoryError::UsernameExists => (
                StatusCode::CONFLICT,
                Json(ErrorResponse::new("Username already exists")),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Database error: {}", e))),
            ),
        })?;

    // Generate tokens
    let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
    let access_token = auth_service
        .generate_access_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Token generation failed: {}",
                    e
                ))),
            )
        })?;

    let refresh_token = auth_service
        .generate_refresh_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Token generation failed: {}",
                    e
                ))),
            )
        })?;

    // Update last login
    let _ = user_repo.update_last_login(user.id).await;

    let mut response = Json(AuthResponse {
        user: UserInfo {
            id: user.id,
            username: user.username,
        },
    })
    .into_response();
    *response.status_mut() = StatusCode::CREATED;
    set_auth_cookies(&config, &mut response, &access_token, &refresh_token)?;

    Ok(response)
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 1))]
    pub username: String,
    #[validate(length(min = 1))]
    pub password: String,
}

pub async fn login(
    State(pool): State<PgPool>,
    State(config): State<Config>,
    Json(payload): Json<LoginRequest>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    // Validate input
    if let Err(e) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(format!("Validation error: {}", e))),
        ));
    }

    // Create user repository
    let user_repo = UserRepository::new(pool.clone());

    // Find user by username
    let user = user_repo
        .find_by_username(&payload.username)
        .await
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse::new("Invalid username or password")),
            )
        })?;

    // Verify password
    let password_valid = verify_password(&payload.password, &user.password_hash).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!(
                "Password verification failed: {}",
                e
            ))),
        )
    })?;

    if !password_valid {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse::new("Invalid username or password")),
        ));
    }

    // Generate tokens
    let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
    let access_token = auth_service
        .generate_access_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Token generation failed: {}",
                    e
                ))),
            )
        })?;

    let refresh_token = auth_service
        .generate_refresh_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Token generation failed: {}",
                    e
                ))),
            )
        })?;

    // Update last login
    let _ = user_repo.update_last_login(user.id).await;

    let mut response = Json(AuthResponse {
        user: UserInfo {
            id: user.id,
            username: user.username,
        },
    })
    .into_response();
    set_auth_cookies(&config, &mut response, &access_token, &refresh_token)?;

    Ok(response)
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: Option<String>,
}

pub async fn refresh_token(
    State(pool): State<PgPool>,
    State(config): State<Config>,
    headers: HeaderMap,
    Json(payload): Json<RefreshRequest>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    let refresh_token_value = payload
        .refresh_token
        .and_then(|token| {
            let trimmed = token.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        })
        .or_else(|| extract_cookie_value(&headers, "refresh_token"))
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse::new("Refresh token is required")),
            )
        })?;

    // Validate refresh token
    let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
    let claims = auth_service
        .validate_token(&refresh_token_value, TokenType::Refresh)
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse::new(format!("Invalid refresh token: {}", e))),
            )
        })?;

    // Parse user_id from claims
    let user_id: i64 = claims.sub.parse().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("Invalid user ID in token")),
        )
    })?;

    // Verify user still exists
    let user_repo = UserRepository::new(pool.clone());
    let user = user_repo.find_by_id(user_id).await.map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse::new("User not found")),
        )
    })?;

    // Generate new tokens
    let new_access_token = auth_service
        .generate_access_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Token generation failed: {}",
                    e
                ))),
            )
        })?;

    let new_refresh_token = auth_service
        .generate_refresh_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Token generation failed: {}",
                    e
                ))),
            )
        })?;

    let mut response = Json(AuthResponse {
        user: UserInfo {
            id: user.id,
            username: user.username,
        },
    })
    .into_response();
    set_auth_cookies(
        &config,
        &mut response,
        &new_access_token,
        &new_refresh_token,
    )?;

    Ok(response)
}

#[derive(Debug, Deserialize, Validate)]
pub struct ForgotPasswordRequest {
    #[validate(length(min = 1))]
    pub username: String,
    pub security_question_id: i64,
    #[validate(length(min = 1))]
    pub security_answer: String,
    #[validate(length(min = 8))]
    pub new_password: String,
}

pub async fn forgot_password(
    State(pool): State<PgPool>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, Json<ErrorResponse>)> {
    // Validate input
    if let Err(e) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(format!("Validation error: {}", e))),
        ));
    }

    // Create user repository
    let user_repo = UserRepository::new(pool.clone());

    // Verify security answer
    let user_id = user_repo
        .verify_security_answer(
            &payload.username,
            payload.security_question_id,
            &payload.security_answer,
        )
        .await
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse::new("Invalid security answer")),
            )
        })?;

    // Hash new password
    let new_password_hash = hash_password(&payload.new_password).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!(
                "Password hashing failed: {}",
                e
            ))),
        )
    })?;

    // Update password
    user_repo
        .update_password(user_id, &new_password_hash)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Password update failed: {}", e))),
            )
        })?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Password successfully reset"
        })),
    ))
}

pub async fn logout(
    State(config): State<Config>,
) -> Result<Response, (StatusCode, Json<ErrorResponse>)> {
    let mut response = Json(serde_json::json!({ "message": "Logged out" })).into_response();
    clear_auth_cookies(&config, &mut response)?;
    Ok(response)
}

fn set_auth_cookies(
    config: &Config,
    response: &mut Response,
    access_token: &str,
    refresh_token: &str,
) -> Result<(), (StatusCode, Json<ErrorResponse>)> {
    let domain = config.cookie_domain.as_deref();
    let access_cookie = build_cookie(
        "token",
        access_token,
        config.jwt_expiration,
        true,
        None,
        domain,
    )?;
    let refresh_cookie = build_cookie(
        "refresh_token",
        refresh_token,
        7 * 24 * 3600,
        true,
        None,
        domain,
    )?;

    let headers = response.headers_mut();
    headers.append(header::SET_COOKIE, access_cookie);
    headers.append(header::SET_COOKIE, refresh_cookie);

    Ok(())
}

fn clear_auth_cookies(
    config: &Config,
    response: &mut Response,
) -> Result<(), (StatusCode, Json<ErrorResponse>)> {
    let domain = config.cookie_domain.as_deref();
    let clear_access = build_cookie("token", "", 0, true, Some(true), domain)?;
    let clear_refresh = build_cookie("refresh_token", "", 0, true, Some(true), domain)?;
    let headers = response.headers_mut();
    headers.append(header::SET_COOKIE, clear_access);
    headers.append(header::SET_COOKIE, clear_refresh);
    Ok(())
}

fn extract_cookie_value(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(header::COOKIE)
        .and_then(|value| value.to_str().ok())
        .and_then(|cookie_header| {
            cookie_header.split(';').find_map(|pair| {
                let trimmed = pair.trim();
                if let Some(rest) = trimmed.strip_prefix(name) {
                    if let Some(value) = rest.strip_prefix('=') {
                        return Some(value.to_string());
                    }
                }
                None
            })
        })
}

fn build_cookie(
    name: &str,
    value: &str,
    max_age: i64,
    http_only: bool,
    remove: Option<bool>,
    domain: Option<&str>,
) -> Result<HeaderValue, (StatusCode, Json<ErrorResponse>)> {
    let mut cookie = format!("{}={}; Path=/; SameSite=Lax", name, value);

    if let Some(true) = remove {
        cookie.push_str("; Max-Age=0");
    } else if max_age > 0 {
        cookie.push_str(&format!("; Max-Age={}", max_age));
    }

    if let Some(domain) = domain {
        if !domain.trim().is_empty() {
            cookie.push_str(&format!("; Domain={}", domain.trim()));
        }
    }

    if http_only {
        cookie.push_str("; HttpOnly");
    }

    if !cfg!(debug_assertions) {
        cookie.push_str("; Secure");
    }

    HeaderValue::from_str(&cookie).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!("Failed to build cookie: {}", e))),
        )
    })
}
