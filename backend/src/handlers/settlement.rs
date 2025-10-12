use axum::{extract::{Path, State}, http::StatusCode, Json};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::job_posting::{JobPosting, SettlementStatus};
use crate::repositories::{customer, job_posting, job_seeking};

#[derive(Debug, Deserialize)]
pub struct UpdateSettlementRequest {
    pub settlement_status: Option<SettlementStatus>,
    pub settlement_amount: Option<Decimal>,
    pub settlement_memo: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct JobPostingResponse {
    pub job_posting: JobPosting,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Update job posting settlement
pub async fn update_job_posting_settlement(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(posting_id): Path<i64>,
    Json(payload): Json<UpdateSettlementRequest>,
) -> Result<Json<JobPostingResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get the posting to verify ownership
    let existing = job_posting::get_job_posting_by_id(&pool, posting_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "구인 공고를 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구인 공고 조회 실패: {}", e),
                }),
            ),
        })?;

    // Verify the customer belongs to the user
    customer::get_customer_by_id(&pool, existing.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    // Build update query
    let mut query_parts = vec!["UPDATE job_postings SET updated_at = NOW()".to_string()];
    let mut param_count = 1;

    if payload.settlement_status.is_some() {
        param_count += 1;
        query_parts.push(format!("settlement_status = ${}", param_count));
    }
    if payload.settlement_amount.is_some() {
        param_count += 1;
        query_parts.push(format!("settlement_amount = ${}", param_count));
    }
    if payload.settlement_memo.is_some() {
        param_count += 1;
        query_parts.push(format!("settlement_memo = ${}", param_count));
    }

    let query = format!(
        "{}, {} WHERE id = $1 AND deleted_at IS NULL RETURNING *",
        query_parts[0],
        query_parts[1..].join(", ")
    );

    let mut query_builder = sqlx::query_as::<_, JobPosting>(&query).bind(posting_id);

    if let Some(status) = payload.settlement_status {
        query_builder = query_builder.bind(status);
    }
    if let Some(amount) = payload.settlement_amount {
        query_builder = query_builder.bind(amount);
    }
    if let Some(memo) = payload.settlement_memo {
        query_builder = query_builder.bind(memo);
    }

    let updated = query_builder.fetch_one(&pool).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("정산 정보 업데이트 실패: {}", e),
            }),
        )
    })?;

    Ok(Json(JobPostingResponse {
        job_posting: updated,
    }))
}

/// Update job seeking settlement
pub async fn update_job_seeking_settlement(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(seeking_id): Path<i64>,
    Json(payload): Json<UpdateSettlementRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    // Get the seeking to verify ownership
    let existing = job_seeking::get_job_seeking_by_id(&pool, seeking_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "구직 공고를 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구직 공고 조회 실패: {}", e),
                }),
            ),
        })?;

    // Verify the customer belongs to the user
    customer::get_customer_by_id(&pool, existing.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    // Build update query
    let mut query_parts = vec!["UPDATE job_seeking_postings SET updated_at = NOW()".to_string()];
    let mut param_count = 1;

    if payload.settlement_status.is_some() {
        param_count += 1;
        query_parts.push(format!("settlement_status = ${}", param_count));
    }
    if payload.settlement_amount.is_some() {
        param_count += 1;
        query_parts.push(format!("settlement_amount = ${}", param_count));
    }
    if payload.settlement_memo.is_some() {
        param_count += 1;
        query_parts.push(format!("settlement_memo = ${}", param_count));
    }

    let query = format!(
        "{}, {} WHERE id = $1 AND deleted_at IS NULL",
        query_parts[0],
        query_parts[1..].join(", ")
    );

    let mut query_builder = sqlx::query(&query).bind(seeking_id);

    if let Some(status) = payload.settlement_status {
        query_builder = query_builder.bind(status);
    }
    if let Some(amount) = payload.settlement_amount {
        query_builder = query_builder.bind(amount);
    }
    if let Some(memo) = payload.settlement_memo {
        query_builder = query_builder.bind(memo);
    }

    query_builder.execute(&pool).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("정산 정보 업데이트 실패: {}", e),
            }),
        )
    })?;

    Ok(Json(serde_json::json!({
        "message": "정산 정보가 업데이트되었습니다"
    })))
}
