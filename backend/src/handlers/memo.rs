use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::memo::{
    CreateCustomerMemoRequest, CreateMatchingMemoRequest, CustomerMemo, MatchingMemo,
};
use crate::repositories::{customer, matching as matching_repo, memo};

#[derive(Debug, Deserialize)]
pub struct ListMemosQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct CustomerMemoResponse {
    pub memo: CustomerMemo,
}

#[derive(Debug, Serialize)]
pub struct CustomerMemosListResponse {
    pub memos: Vec<CustomerMemo>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct MatchingMemoResponse {
    pub memo: MatchingMemo,
}

#[derive(Debug, Serialize)]
pub struct MatchingMemosListResponse {
    pub memos: Vec<MatchingMemo>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

// ========================================
// Customer Memos
// ========================================

/// Create a customer memo
pub async fn create_customer_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
    Json(payload): Json<CreateCustomerMemoRequest>,
) -> Result<(StatusCode, Json<CustomerMemoResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Verify the customer belongs to the user
    customer::get_customer_by_id(&pool, customer_id, user.user_id)
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

    // Validate customer_id matches the path parameter
    if payload.customer_id != customer_id {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "고객 ID가 일치하지 않습니다".to_string(),
            }),
        ));
    }

    let memo = memo::create_customer_memo(&pool, payload, user.user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(CustomerMemoResponse { memo })))
}

/// List customer memos
pub async fn list_customer_memos(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
    Query(params): Query<ListMemosQuery>,
) -> Result<Json<CustomerMemosListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify the customer belongs to the user
    customer::get_customer_by_id(&pool, customer_id, user.user_id)
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

    let memos =
        memo::list_customer_memos_by_customer(&pool, customer_id, params.limit, params.offset)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: format!("메모 목록 조회 실패: {}", e),
                    }),
                )
            })?;

    let total = memos.len();

    Ok(Json(CustomerMemosListResponse { memos, total }))
}

/// Update a customer memo
pub async fn update_customer_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path((customer_id, memo_id)): Path<(i64, i64)>,
    Json(payload): Json<crate::models::memo::UpdateMemoRequest>,
) -> Result<Json<CustomerMemoResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify the customer belongs to the user
    customer::get_customer_by_id(&pool, customer_id, user.user_id)
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

    // Verify memo belongs to this customer
    let existing_memo = memo::get_customer_memo_by_id(&pool, memo_id)
        .await
        .map_err(|_| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "메모를 찾을 수 없습니다".to_string(),
                }),
            )
        })?;

    if existing_memo.customer_id != customer_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "이 메모에 접근할 권한이 없습니다".to_string(),
            }),
        ));
    }

    let updated_memo = memo::update_customer_memo(&pool, memo_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 수정 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(CustomerMemoResponse { memo: updated_memo }))
}

/// Delete a customer memo
pub async fn delete_customer_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path((customer_id, memo_id)): Path<(i64, i64)>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Verify the customer belongs to the user
    customer::get_customer_by_id(&pool, customer_id, user.user_id)
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

    // Verify memo belongs to this customer
    let existing_memo = memo::get_customer_memo_by_id(&pool, memo_id)
        .await
        .map_err(|_| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "메모를 찾을 수 없습니다".to_string(),
                }),
            )
        })?;

    if existing_memo.customer_id != customer_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "이 메모에 접근할 권한이 없습니다".to_string(),
            }),
        ));
    }

    memo::delete_customer_memo(&pool, memo_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 삭제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

// ========================================
// Matching Memos
// ========================================

/// Create a matching memo
pub async fn create_matching_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(matching_id): Path<i64>,
    Json(payload): Json<CreateMatchingMemoRequest>,
) -> Result<(StatusCode, Json<MatchingMemoResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Verify the matching exists and belongs to the user
    let matching = matching_repo::get_matching_by_id(&pool, matching_id)
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
    let job_posting =
        crate::repositories::job_posting::get_job_posting_by_id(&pool, matching.job_posting_id)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "구인 공고 조회 실패".to_string(),
                    }),
                )
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

    // Validate matching_id matches the path parameter
    if payload.matching_id != matching_id {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "매칭 ID가 일치하지 않습니다".to_string(),
            }),
        ));
    }

    let memo = memo::create_matching_memo(&pool, payload, user.user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(MatchingMemoResponse { memo })))
}

/// List matching memos
pub async fn list_matching_memos(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(matching_id): Path<i64>,
    Query(params): Query<ListMemosQuery>,
) -> Result<Json<MatchingMemosListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify the matching exists and belongs to the user
    let matching = matching_repo::get_matching_by_id(&pool, matching_id)
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
    let job_posting =
        crate::repositories::job_posting::get_job_posting_by_id(&pool, matching.job_posting_id)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "구인 공고 조회 실패".to_string(),
                    }),
                )
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

    let memos =
        memo::list_matching_memos_by_matching(&pool, matching_id, params.limit, params.offset)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: format!("메모 목록 조회 실패: {}", e),
                    }),
                )
            })?;

    let total = memos.len();

    Ok(Json(MatchingMemosListResponse { memos, total }))
}

/// Update a matching memo
pub async fn update_matching_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path((matching_id, memo_id)): Path<(i64, i64)>,
    Json(payload): Json<crate::models::memo::UpdateMemoRequest>,
) -> Result<Json<MatchingMemoResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify the matching exists and belongs to the user
    let matching = matching_repo::get_matching_by_id(&pool, matching_id)
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
    let job_posting =
        crate::repositories::job_posting::get_job_posting_by_id(&pool, matching.job_posting_id)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "구인 공고 조회 실패".to_string(),
                    }),
                )
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

    // Verify memo belongs to this matching
    let existing_memo = memo::get_matching_memo_by_id(&pool, memo_id)
        .await
        .map_err(|_| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "메모를 찾을 수 없습니다".to_string(),
                }),
            )
        })?;

    if existing_memo.matching_id != matching_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "이 메모에 접근할 권한이 없습니다".to_string(),
            }),
        ));
    }

    let updated_memo = memo::update_matching_memo(&pool, memo_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 수정 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(MatchingMemoResponse { memo: updated_memo }))
}

/// Delete a matching memo
pub async fn delete_matching_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path((matching_id, memo_id)): Path<(i64, i64)>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Verify the matching exists and belongs to the user
    let matching = matching_repo::get_matching_by_id(&pool, matching_id)
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
    let job_posting =
        crate::repositories::job_posting::get_job_posting_by_id(&pool, matching.job_posting_id)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "구인 공고 조회 실패".to_string(),
                    }),
                )
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

    // Verify memo belongs to this matching
    let existing_memo = memo::get_matching_memo_by_id(&pool, memo_id)
        .await
        .map_err(|_| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "메모를 찾을 수 없습니다".to_string(),
                }),
            )
        })?;

    if existing_memo.matching_id != matching_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "이 메모에 접근할 권한이 없습니다".to_string(),
            }),
        ));
    }

    memo::delete_matching_memo(&pool, memo_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 삭제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}
