use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::matching::{
    CreateMatchingRequest, Matching, MatchingStatus, UpdateMatchingRequest,
};
use crate::repositories::{customer, job_posting, job_seeking, matching};

#[derive(Debug, Deserialize)]
pub struct ListMatchingsQuery {
    pub status: Option<MatchingStatus>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
pub struct UpdateStatusRequest {
    pub matching_status: MatchingStatus,
}

#[derive(Debug, Deserialize)]
pub struct CancelMatchingRequest {
    pub cancellation_reason: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct MatchingResponse {
    pub matching: Matching,
}

#[derive(Debug, Serialize)]
pub struct MatchingsListResponse {
    pub matchings: Vec<Matching>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Helper function to verify user owns a matching
async fn verify_matching_ownership(
    pool: &PgPool,
    matching_id: i64,
    user_id: i64,
) -> Result<Matching, (StatusCode, Json<ErrorResponse>)> {
    let matching = matching::get_matching_by_id(pool, matching_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "매칭을 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("매칭 조회 실패: {}", e),
                }),
            ),
        })?;

    // Verify through job posting ownership
    let job_posting = job_posting::get_job_posting_by_id(pool, matching.job_posting_id)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "구인 공고 조회 실패".to_string(),
                }),
            )
        })?;

    customer::get_customer_by_id(pool, job_posting.customer_id, user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    Ok(matching)
}

/// Create a new matching
pub async fn create_matching(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateMatchingRequest>,
) -> Result<(StatusCode, Json<MatchingResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Verify the job posting exists and belongs to the user
    let job_posting = job_posting::get_job_posting_by_id(&pool, payload.job_posting_id)
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

    // Verify the job seeking posting exists and belongs to the user
    let job_seeking =
        job_seeking::get_job_seeking_posting_by_id(&pool, payload.job_seeking_posting_id)
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

    let matching = matching::create_matching(&pool, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("매칭 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(MatchingResponse { matching })))
}

/// List matchings with filters
pub async fn list_matchings(
    user: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<ListMatchingsQuery>,
) -> Result<Json<MatchingsListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let matchings = matching::list_matchings(
        &pool,
        user.user_id,
        params.status,
        params.limit,
        params.offset,
    )
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("매칭 목록 조회 실패: {}", e),
            }),
        )
    })?;

    let total = matchings.len();

    Ok(Json(MatchingsListResponse { matchings, total }))
}

/// Get matching by ID
pub async fn get_matching(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(matching_id): Path<i64>,
) -> Result<Json<MatchingResponse>, (StatusCode, Json<ErrorResponse>)> {
    let matching = verify_matching_ownership(&pool, matching_id, user.user_id).await?;

    Ok(Json(MatchingResponse { matching }))
}

/// Update matching status
pub async fn update_matching_status(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(matching_id): Path<i64>,
    Json(payload): Json<UpdateMatchingRequest>,
) -> Result<Json<MatchingResponse>, (StatusCode, Json<ErrorResponse>)> {
    verify_matching_ownership(&pool, matching_id, user.user_id).await?;

    if matches!(payload.matching_status, Some(MatchingStatus::Cancelled)) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "매칭 취소는 별도의 취소 API를 사용해주세요".to_string(),
            }),
        ));
    }

    let matching = matching::update_matching_status(&pool, matching_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("매칭 상태 수정 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(MatchingResponse { matching }))
}

/// Complete a matching
pub async fn complete_matching(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(matching_id): Path<i64>,
) -> Result<Json<MatchingResponse>, (StatusCode, Json<ErrorResponse>)> {
    let current = verify_matching_ownership(&pool, matching_id, user.user_id).await?;

    if current.matching_status == MatchingStatus::Completed {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "이미 완료된 매칭입니다".to_string(),
            }),
        ));
    }

    if current.matching_status == MatchingStatus::Cancelled {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "취소된 매칭은 완료할 수 없습니다".to_string(),
            }),
        ));
    }

    let matching = matching::complete_matching(&pool, matching_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("매칭 완료 처리 실패: {}", e),
                }),
            )
        })?;

    // Automatically update settlement amounts in job postings and job seekings
    // Update job_posting settlement_amount with employer fee
    if let Some(employer_fee) = matching.employer_fee_amount {
        let _ = sqlx::query(
            r#"
            UPDATE job_postings
            SET settlement_amount = COALESCE(settlement_amount, 0) + $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL
            "#,
        )
        .bind(employer_fee)
        .bind(matching.job_posting_id)
        .execute(&pool)
        .await;
    }

    // Update job_seeking settlement_amount with employee fee
    if let Some(employee_fee) = matching.employee_fee_amount {
        let _ = sqlx::query(
            r#"
            UPDATE job_seeking_postings
            SET settlement_amount = COALESCE(settlement_amount, 0) + $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL
            "#,
        )
        .bind(employee_fee)
        .bind(matching.job_seeking_posting_id)
        .execute(&pool)
        .await;
    }

    Ok(Json(MatchingResponse { matching }))
}

/// Update matching details (salary and fee rates)
pub async fn update_matching(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(matching_id): Path<i64>,
    Json(payload): Json<UpdateMatchingRequest>,
) -> Result<Json<MatchingResponse>, (StatusCode, Json<ErrorResponse>)> {
    verify_matching_ownership(&pool, matching_id, user.user_id).await?;

    // Disallow status changes through this endpoint
    if payload.matching_status.is_some() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "매칭 상태 변경은 별도의 상태 변경 API를 사용해주세요".to_string(),
            }),
        ));
    }

    // Disallow cancellation reason changes through this endpoint
    if payload.cancellation_reason.is_some() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "취소 사유는 취소 API를 통해서만 설정할 수 있습니다".to_string(),
            }),
        ));
    }

    let matching = matching::update_matching_status(&pool, matching_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("매칭 정보 수정 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(MatchingResponse { matching }))
}

/// Cancel a matching
pub async fn cancel_matching(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(matching_id): Path<i64>,
    Json(payload): Json<CancelMatchingRequest>,
) -> Result<Json<MatchingResponse>, (StatusCode, Json<ErrorResponse>)> {
    let current = verify_matching_ownership(&pool, matching_id, user.user_id).await?;

    if current.matching_status == MatchingStatus::Completed {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "완료된 매칭은 취소할 수 없습니다".to_string(),
            }),
        ));
    }

    if current.matching_status == MatchingStatus::Cancelled {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "이미 취소된 매칭입니다".to_string(),
            }),
        ));
    }

    let matching = matching::cancel_matching(
        &pool,
        matching_id,
        user.user_id,
        payload.cancellation_reason,
    )
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("매칭 취소 처리 실패: {}", e),
            }),
        )
    })?;

    Ok(Json(MatchingResponse { matching }))
}
