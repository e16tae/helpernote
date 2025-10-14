use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::memo::{CreateUserMemoRequest, UpdateMemoRequest, UserMemo};
use crate::repositories::memo;

#[derive(Debug, Deserialize)]
pub struct ListMemosQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct UserMemoResponse {
    pub memo: UserMemo,
}

#[derive(Debug, Serialize)]
pub struct UserMemosListResponse {
    pub memos: Vec<UserMemo>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Create a user memo
pub async fn create_user_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateUserMemoRequest>,
) -> Result<(StatusCode, Json<UserMemoResponse>), (StatusCode, Json<ErrorResponse>)> {
    let memo = memo::create_user_memo(&pool, user.user_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(UserMemoResponse { memo })))
}

/// List user memos
pub async fn list_user_memos(
    user: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<ListMemosQuery>,
) -> Result<Json<UserMemosListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let memos = memo::list_user_memos_by_user(&pool, user.user_id, params.limit, params.offset)
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

    Ok(Json(UserMemosListResponse { memos, total }))
}

/// Update a user memo
pub async fn update_user_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(memo_id): Path<i64>,
    Json(payload): Json<UpdateMemoRequest>,
) -> Result<Json<UserMemoResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify memo belongs to this user
    let existing_memo = memo::get_user_memo_by_id(&pool, memo_id)
        .await
        .map_err(|_| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "메모를 찾을 수 없습니다".to_string(),
                }),
            )
        })?;

    if existing_memo.user_id != user.user_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "이 메모에 접근할 권한이 없습니다".to_string(),
            }),
        ));
    }

    let updated_memo = memo::update_user_memo(&pool, memo_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("메모 수정 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(UserMemoResponse { memo: updated_memo }))
}

/// Delete a user memo
pub async fn delete_user_memo(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(memo_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Verify memo belongs to this user
    let existing_memo = memo::get_user_memo_by_id(&pool, memo_id)
        .await
        .map_err(|_| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "메모를 찾을 수 없습니다".to_string(),
                }),
            )
        })?;

    if existing_memo.user_id != user.user_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "이 메모에 접근할 권한이 없습니다".to_string(),
            }),
        ));
    }

    memo::delete_user_memo(&pool, memo_id).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("메모 삭제 실패: {}", e),
            }),
        )
    })?;

    Ok(StatusCode::NO_CONTENT)
}
