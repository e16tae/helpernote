use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::job_posting::{
    CreateJobPostingRequest, JobPosting, PostingStatus, SettlementStatus, UpdateJobPostingRequest,
};
use crate::repositories::{customer, job_posting};

#[derive(Debug, Deserialize)]
pub struct ListJobPostingsQuery {
    pub status: Option<PostingStatus>,
    pub settlement_status: Option<SettlementStatus>,
    pub is_favorite: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct JobPostingResponse {
    pub job_posting: JobPosting,
}

#[derive(Debug, Serialize)]
pub struct JobPostingsListResponse {
    pub job_postings: Vec<JobPosting>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Create a new job posting
pub async fn create_job_posting(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateJobPostingRequest>,
) -> Result<(StatusCode, Json<JobPostingResponse>), (StatusCode, Json<ErrorResponse>)> {
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

    let job_posting = job_posting::create_job_posting(&pool, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구인 공고 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((
        StatusCode::CREATED,
        Json(JobPostingResponse { job_posting }),
    ))
}

/// List job postings with filters
pub async fn list_job_postings(
    user: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<ListJobPostingsQuery>,
) -> Result<Json<JobPostingsListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let job_postings = job_posting::list_job_postings(
        &pool,
        user.user_id,
        params.status,
        params.settlement_status,
        params.is_favorite,
        params.limit,
        params.offset,
    )
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("구인 공고 목록 조회 실패: {}", e),
            }),
        )
    })?;

    let total = job_postings.len();

    Ok(Json(JobPostingsListResponse {
        job_postings,
        total,
    }))
}

/// Get job posting by ID
pub async fn get_job_posting(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_posting_id): Path<i64>,
) -> Result<Json<JobPostingResponse>, (StatusCode, Json<ErrorResponse>)> {
    let job_posting = job_posting::get_job_posting_by_id(&pool, job_posting_id)
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
    customer::get_customer_by_id(&pool, job_posting.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    Ok(Json(JobPostingResponse { job_posting }))
}

/// Update job posting
pub async fn update_job_posting(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_posting_id): Path<i64>,
    Json(payload): Json<UpdateJobPostingRequest>,
) -> Result<Json<JobPostingResponse>, (StatusCode, Json<ErrorResponse>)> {
    // First get the posting to verify ownership
    let existing = job_posting::get_job_posting_by_id(&pool, job_posting_id)
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

    let job_posting = job_posting::update_job_posting(&pool, job_posting_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구인 공고 수정 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(JobPostingResponse { job_posting }))
}

/// Delete job posting (soft delete)
pub async fn delete_job_posting(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_posting_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // First get the posting to verify ownership
    let existing = job_posting::get_job_posting_by_id(&pool, job_posting_id)
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

    job_posting::delete_job_posting(&pool, job_posting_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("구인 공고 삭제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

/// Toggle favorite status for job posting
pub async fn toggle_favorite(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_posting_id): Path<i64>,
) -> Result<Json<JobPostingResponse>, (StatusCode, Json<ErrorResponse>)> {
    // First get the posting to verify ownership
    let existing = job_posting::get_job_posting_by_id(&pool, job_posting_id)
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

    // Toggle the favorite status
    let updated = sqlx::query_as!(
        JobPosting,
        r#"
        UPDATE job_postings
        SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING
            id,
            customer_id,
            salary,
            description,
            employer_fee_rate,
            settlement_status as "settlement_status: SettlementStatus",
            settlement_amount,
            settlement_memo,
            posting_status as "posting_status: PostingStatus",
            is_favorite as "is_favorite!",
            created_at as "created_at!",
            updated_at as "updated_at!",
            deleted_at
        "#,
        job_posting_id
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

    Ok(Json(JobPostingResponse {
        job_posting: updated,
    }))
}
