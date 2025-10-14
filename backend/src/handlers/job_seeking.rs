use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::job_posting::{
    CreateJobSeekingPostingRequest, JobSeekingPosting, PostingStatus, SettlementStatus,
    UpdateJobSeekingPostingRequest,
};
use crate::repositories::{customer, job_seeking};

#[derive(Debug, Deserialize)]
pub struct ListJobSeekingsQuery {
    pub status: Option<PostingStatus>,
    pub settlement_status: Option<SettlementStatus>,
    pub preferred_location: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct JobSeekingResponse {
    pub job_seeking: JobSeekingPosting,
}

#[derive(Debug, Serialize)]
pub struct JobSeekingsListResponse {
    pub job_seekings: Vec<JobSeekingPosting>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Create a new job seeking posting
pub async fn create_job_seeking(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateJobSeekingPostingRequest>,
) -> Result<(StatusCode, Json<JobSeekingResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Verify the customer belongs to the user
    customer::get_customer_by_id(&pool, payload.customer_id, user.user_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "고객을 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("고객 확인 실패: {}", e),
                }),
            ),
        })?;

    let job_seeking = job_seeking::create_job_seeking_posting(&pool, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구직 공고 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((
        StatusCode::CREATED,
        Json(JobSeekingResponse { job_seeking }),
    ))
}

/// List job seeking postings with filters
pub async fn list_job_seekings(
    user: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<ListJobSeekingsQuery>,
) -> Result<Json<JobSeekingsListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let job_seekings = job_seeking::list_job_seeking_postings(
        &pool,
        user.user_id,
        params.status,
        params.settlement_status,
        params.preferred_location,
        params.limit,
        params.offset,
    )
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("구직 공고 목록 조회 실패: {}", e),
            }),
        )
    })?;

    let total = job_seekings.len();

    Ok(Json(JobSeekingsListResponse {
        job_seekings,
        total,
    }))
}

/// Get job seeking posting by ID
pub async fn get_job_seeking(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_seeking_id): Path<i64>,
) -> Result<Json<JobSeekingResponse>, (StatusCode, Json<ErrorResponse>)> {
    let job_seeking = job_seeking::get_job_seeking_posting_by_id(&pool, job_seeking_id)
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
    customer::get_customer_by_id(&pool, job_seeking.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    Ok(Json(JobSeekingResponse { job_seeking }))
}

/// Update job seeking posting
pub async fn update_job_seeking(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_seeking_id): Path<i64>,
    Json(payload): Json<UpdateJobSeekingPostingRequest>,
) -> Result<Json<JobSeekingResponse>, (StatusCode, Json<ErrorResponse>)> {
    // First get the posting to verify ownership
    let existing = job_seeking::get_job_seeking_posting_by_id(&pool, job_seeking_id)
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

    let job_seeking = job_seeking::update_job_seeking_posting(&pool, job_seeking_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구직 공고 수정 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(JobSeekingResponse { job_seeking }))
}

/// Delete job seeking posting (soft delete)
pub async fn delete_job_seeking(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_seeking_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // First get the posting to verify ownership
    let existing = job_seeking::get_job_seeking_posting_by_id(&pool, job_seeking_id)
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

    job_seeking::delete_job_seeking_posting(&pool, job_seeking_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구직 공고 삭제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

/// Toggle favorite status for job seeking posting
pub async fn toggle_favorite(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_seeking_id): Path<i64>,
) -> Result<Json<JobSeekingResponse>, (StatusCode, Json<ErrorResponse>)> {
    use crate::models::job_posting::{JobSeekingPosting, PostingStatus, SettlementStatus};

    // First get the posting to verify ownership
    let existing = job_seeking::get_job_seeking_posting_by_id(&pool, job_seeking_id)
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

    // Toggle the favorite status
    let updated = sqlx::query_as!(
        JobSeekingPosting,
        r#"
        UPDATE job_seeking_postings
        SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING
            id,
            customer_id,
            desired_salary,
            description,
            preferred_location,
            employee_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount,
            settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!",
            created_at as "created_at!",
            updated_at as "updated_at!",
            deleted_at
        "#,
        job_seeking_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("즐겨찾기 업데이트 실패: {}", e),
            }),
        )
    })?;

    Ok(Json(JobSeekingResponse {
        job_seeking: updated,
    }))
}
