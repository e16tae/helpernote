use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::user::User;

#[derive(Debug, Serialize)]
pub struct UserProfileResponse {
    pub user: UserProfile,
}

#[derive(Debug, Serialize)]
pub struct UserProfile {
    pub id: i64,
    pub username: String,
    pub phone: Option<String>,
    pub default_employer_fee_rate: String,
    pub default_employee_fee_rate: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserProfileRequest {
    pub phone: Option<String>,
    pub default_employer_fee_rate: Option<f64>,
    pub default_employee_fee_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Get current user profile
pub async fn get_profile(
    user: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<UserProfileResponse>, (StatusCode, Json<ErrorResponse>)> {
    let db_user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, password_hash, security_question_id, security_answer, phone,
               default_employer_fee_rate, default_employee_fee_rate,
               last_login_at, created_at, updated_at, deleted_at
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(user.user_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to fetch user profile: {}", e),
            }),
        )
    })?;

    Ok(Json(UserProfileResponse {
        user: UserProfile {
            id: db_user.id,
            username: db_user.username,
            phone: db_user.phone,
            default_employer_fee_rate: db_user.default_employer_fee_rate.to_string(),
            default_employee_fee_rate: db_user.default_employee_fee_rate.to_string(),
            created_at: db_user.created_at.to_string(),
        },
    }))
}

/// Update current user profile
pub async fn update_profile(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateUserProfileRequest>,
) -> Result<Json<UserProfileResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate fee rates if provided
    if let Some(rate) = payload.default_employer_fee_rate {
        if rate < 0.0 || rate > 100.0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Employer fee rate must be between 0 and 100".to_string(),
                }),
            ));
        }
    }

    if let Some(rate) = payload.default_employee_fee_rate {
        if rate < 0.0 || rate > 100.0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Employee fee rate must be between 0 and 100".to_string(),
                }),
            ));
        }
    }

    // Build dynamic query based on what fields are being updated
    let mut query = String::from("UPDATE users SET updated_at = NOW()");
    let mut param_count = 1;

    if payload.phone.is_some() {
        param_count += 1;
        query.push_str(&format!(", phone = ${}", param_count));
    }

    if payload.default_employer_fee_rate.is_some() {
        param_count += 1;
        query.push_str(&format!(", default_employer_fee_rate = ${}", param_count));
    }

    if payload.default_employee_fee_rate.is_some() {
        param_count += 1;
        query.push_str(&format!(", default_employee_fee_rate = ${}", param_count));
    }

    query.push_str(" WHERE id = $1 AND deleted_at IS NULL RETURNING id, username, password_hash, security_question_id, security_answer, phone, default_employer_fee_rate, default_employee_fee_rate, last_login_at, created_at, updated_at, deleted_at");

    // Execute query with bound parameters
    let mut query_builder = sqlx::query_as::<_, User>(&query).bind(user.user_id);

    if let Some(phone) = payload.phone {
        query_builder = query_builder.bind(phone);
    }

    if let Some(rate) = payload.default_employer_fee_rate {
        query_builder = query_builder.bind(rust_decimal::Decimal::try_from(rate).unwrap());
    }

    if let Some(rate) = payload.default_employee_fee_rate {
        query_builder = query_builder.bind(rust_decimal::Decimal::try_from(rate).unwrap());
    }

    let updated_user = query_builder.fetch_one(&pool).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to update user profile: {}", e),
            }),
        )
    })?;

    Ok(Json(UserProfileResponse {
        user: UserProfile {
            id: updated_user.id,
            username: updated_user.username,
            phone: updated_user.phone,
            default_employer_fee_rate: updated_user.default_employer_fee_rate.to_string(),
            default_employee_fee_rate: updated_user.default_employee_fee_rate.to_string(),
            created_at: updated_user.created_at.to_string(),
        },
    }))
}
