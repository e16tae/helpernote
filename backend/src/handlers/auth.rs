use axum::{
    extract::State,
    http::StatusCode,
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
    pub access_token: String,
    pub refresh_token: String,
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
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<AuthResponse>), (StatusCode, Json<ErrorResponse>)> {
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
            Json(ErrorResponse::new(format!("Password hashing failed: {}", e))),
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
            &payload.security_answer,
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

    // Get config from environment (we'll need to pass this through app state in a real scenario)
    let config = Config::from_env().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!("Config error: {}", e))),
        )
    })?;

    // Generate tokens
    let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
    let access_token = auth_service
        .generate_access_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Token generation failed: {}", e))),
            )
        })?;

    let refresh_token = auth_service
        .generate_refresh_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Token generation failed: {}", e))),
            )
        })?;

    // Update last login
    let _ = user_repo.update_last_login(user.id).await;

    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            access_token,
            refresh_token,
            user: UserInfo {
                id: user.id,
                username: user.username,
            },
        }),
    ))
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
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
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
            Json(ErrorResponse::new(format!("Password verification failed: {}", e))),
        )
    })?;

    if !password_valid {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse::new("Invalid username or password")),
        ));
    }

    // Get config from environment
    let config = Config::from_env().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!("Config error: {}", e))),
        )
    })?;

    // Generate tokens
    let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
    let access_token = auth_service
        .generate_access_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Token generation failed: {}", e))),
            )
        })?;

    let refresh_token = auth_service
        .generate_refresh_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Token generation failed: {}", e))),
            )
        })?;

    // Update last login
    let _ = user_repo.update_last_login(user.id).await;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username,
        },
    }))
}

#[derive(Debug, Deserialize, Validate)]
pub struct RefreshRequest {
    #[validate(length(min = 1))]
    pub refresh_token: String,
}

pub async fn refresh_token(
    State(pool): State<PgPool>,
    Json(payload): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate input
    if let Err(e) = payload.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(format!("Validation error: {}", e))),
        ));
    }

    // Get config from environment
    let config = Config::from_env().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!("Config error: {}", e))),
        )
    })?;

    // Validate refresh token
    let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
    let claims = auth_service
        .validate_token(&payload.refresh_token, TokenType::Refresh)
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
                Json(ErrorResponse::new(format!("Token generation failed: {}", e))),
            )
        })?;

    let new_refresh_token = auth_service
        .generate_refresh_token(user.id, &user.username)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Token generation failed: {}", e))),
            )
        })?;

    Ok(Json(AuthResponse {
        access_token: new_access_token,
        refresh_token: new_refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username,
        },
    }))
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
            Json(ErrorResponse::new(format!("Password hashing failed: {}", e))),
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
