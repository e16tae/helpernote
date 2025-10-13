use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::tag::{CreateTagRequest, Tag, UpdateTagRequest};
use crate::repositories::{customer, tag};

#[derive(Debug, Deserialize)]
pub struct ListTagsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AttachTagsRequest {
    pub tag_ids: Vec<i64>,
}

#[derive(Debug, Serialize)]
pub struct TagResponse {
    pub tag: Tag,
}

#[derive(Debug, Serialize)]
pub struct TagsListResponse {
    pub tags: Vec<Tag>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct SuccessResponse {
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

// ========================================
// Tag Management
// ========================================

/// Create a new tag
pub async fn create_tag(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateTagRequest>,
) -> Result<(StatusCode, Json<TagResponse>), (StatusCode, Json<ErrorResponse>)> {
    let tag = tag::create_tag(&pool, user.user_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(TagResponse { tag })))
}

/// List user's tags
pub async fn list_tags(
    user: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<ListTagsQuery>,
) -> Result<Json<TagsListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let tags = tag::list_user_tags(&pool, user.user_id, params.limit, params.offset)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 목록 조회 실패: {}", e),
                }),
            )
        })?;

    let total = tags.len();

    Ok(Json(TagsListResponse { tags, total }))
}

/// Get tag by ID
pub async fn get_tag(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(tag_id): Path<i64>,
) -> Result<Json<TagResponse>, (StatusCode, Json<ErrorResponse>)> {
    let tag = tag::get_tag_by_id(&pool, tag_id, user.user_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "태그를 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 조회 실패: {}", e),
                }),
            ),
        })?;

    Ok(Json(TagResponse { tag }))
}

/// Update tag
pub async fn update_tag(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(tag_id): Path<i64>,
    Json(payload): Json<UpdateTagRequest>,
) -> Result<Json<TagResponse>, (StatusCode, Json<ErrorResponse>)> {
    let tag = tag::update_tag(&pool, tag_id, user.user_id, payload)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "태그를 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 수정 실패: {}", e),
                }),
            ),
        })?;

    Ok(Json(TagResponse { tag }))
}

/// Delete tag
pub async fn delete_tag(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(tag_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    tag::delete_tag(&pool, tag_id, user.user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 삭제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

// ========================================
// Customer Tags
// ========================================

/// Attach tags to customer
pub async fn attach_customer_tags(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
    Json(payload): Json<AttachTagsRequest>,
) -> Result<Json<SuccessResponse>, (StatusCode, Json<ErrorResponse>)> {
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

    // Verify all tags belong to the user
    for tag_id in &payload.tag_ids {
        tag::get_tag_by_id(&pool, *tag_id, user.user_id)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => (
                    StatusCode::NOT_FOUND,
                    Json(ErrorResponse {
                        error: format!("태그 ID {}를 찾을 수 없습니다", tag_id),
                    }),
                ),
                _ => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: format!("태그 확인 실패: {}", e),
                    }),
                ),
            })?;
    }

    // Attach tags
    tag::batch_attach_tags_to_customer(&pool, customer_id, &payload.tag_ids)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 연결 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(SuccessResponse {
        message: "태그가 성공적으로 연결되었습니다".to_string(),
    }))
}

/// Detach tag from customer
pub async fn detach_customer_tag(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path((customer_id, tag_id)): Path<(i64, i64)>,
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

    // Verify the tag belongs to the user
    tag::get_tag_by_id(&pool, tag_id, user.user_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "태그를 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 확인 실패: {}", e),
                }),
            ),
        })?;

    tag::detach_tag_from_customer(&pool, customer_id, tag_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 연결 해제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

/// List customer tags
pub async fn list_customer_tags(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
) -> Result<Json<TagsListResponse>, (StatusCode, Json<ErrorResponse>)> {
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

    let tags = tag::list_customer_tags(&pool, customer_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 목록 조회 실패: {}", e),
                }),
            )
        })?;

    let total = tags.len();

    Ok(Json(TagsListResponse { tags, total }))
}

// ========================================
// Job Posting Tags  
// ========================================

/// Attach tags to job posting
pub async fn attach_job_posting_tags(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_posting_id): Path<i64>,
    Json(payload): Json<AttachTagsRequest>,
) -> Result<Json<SuccessResponse>, (StatusCode, Json<ErrorResponse>)> {
    use crate::repositories::job_posting;

    // Verify the job posting belongs to the user (via customer ownership)
    let posting = job_posting::get_job_posting_by_id(&pool, job_posting_id)
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
                    error: format!("구인 공고 확인 실패: {}", e),
                }),
            ),
        })?;

    // Verify customer ownership
    customer::get_customer_by_id(&pool, posting.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    // Verify all tags belong to the user
    for tag_id in &payload.tag_ids {
        tag::get_tag_by_id(&pool, *tag_id, user.user_id)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => (
                    StatusCode::NOT_FOUND,
                    Json(ErrorResponse {
                        error: format!("태그 ID {}를 찾을 수 없습니다", tag_id),
                    }),
                ),
                _ => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: format!("태그 확인 실패: {}", e),
                    }),
                ),
            })?;
    }

    // Attach tags
    tag::batch_attach_tags_to_job_posting(&pool, job_posting_id, &payload.tag_ids)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 연결 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(SuccessResponse {
        message: "태그가 성공적으로 연결되었습니다".to_string(),
    }))
}

/// Detach tag from job posting
pub async fn detach_job_posting_tag(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path((job_posting_id, tag_id)): Path<(i64, i64)>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    use crate::repositories::job_posting;

    // Verify the job posting belongs to the user (via customer ownership)
    let posting = job_posting::get_job_posting_by_id(&pool, job_posting_id)
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
                    error: format!("구인 공고 확인 실패: {}", e),
                }),
            ),
        })?;

    // Verify customer ownership
    customer::get_customer_by_id(&pool, posting.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    // Verify the tag belongs to the user
    tag::get_tag_by_id(&pool, tag_id, user.user_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "태그를 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 확인 실패: {}", e),
                }),
            ),
        })?;

    tag::detach_tag_from_job_posting(&pool, job_posting_id, tag_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 연결 해제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

/// List job posting tags
pub async fn list_job_posting_tags(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_posting_id): Path<i64>,
) -> Result<Json<TagsListResponse>, (StatusCode, Json<ErrorResponse>)> {
    use crate::repositories::job_posting;

    // Verify the job posting belongs to the user (via customer ownership)
    let posting = job_posting::get_job_posting_by_id(&pool, job_posting_id)
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
                    error: format!("구인 공고 확인 실패: {}", e),
                }),
            ),
        })?;

    // Verify customer ownership
    customer::get_customer_by_id(&pool, posting.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    let tags = tag::list_job_posting_tags(&pool, job_posting_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 목록 조회 실패: {}", e),
                }),
            )
        })?;

    let total = tags.len();

    Ok(Json(TagsListResponse { tags, total }))
}

// ========================================
// Job Seeking Tags
// ========================================

/// Attach tags to job seeking posting
pub async fn attach_job_seeking_tags(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_seeking_id): Path<i64>,
    Json(payload): Json<AttachTagsRequest>,
) -> Result<Json<SuccessResponse>, (StatusCode, Json<ErrorResponse>)> {
    use crate::repositories::job_seeking;

    // Verify the job seeking posting belongs to the user (via customer ownership)
    let seeking = job_seeking::get_job_seeking_posting_by_id(&pool, job_seeking_id)
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
                    error: format!("구직 공고 확인 실패: {}", e),
                }),
            ),
        })?;

    // Verify customer ownership
    customer::get_customer_by_id(&pool, seeking.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    // Verify all tags belong to the user
    for tag_id in &payload.tag_ids {
        tag::get_tag_by_id(&pool, *tag_id, user.user_id)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => (
                    StatusCode::NOT_FOUND,
                    Json(ErrorResponse {
                        error: format!("태그 ID {}를 찾을 수 없습니다", tag_id),
                    }),
                ),
                _ => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: format!("태그 확인 실패: {}", e),
                    }),
                ),
            })?;
    }

    // Attach tags
    tag::batch_attach_tags_to_job_seeking_posting(&pool, job_seeking_id, &payload.tag_ids)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 연결 실패: {}", e),
                }),
            )
        })?;

    Ok(Json(SuccessResponse {
        message: "태그가 성공적으로 연결되었습니다".to_string(),
    }))
}

/// Detach tag from job seeking posting
pub async fn detach_job_seeking_tag(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path((job_seeking_id, tag_id)): Path<(i64, i64)>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    use crate::repositories::job_seeking;

    // Verify the job seeking posting belongs to the user (via customer ownership)
    let seeking = job_seeking::get_job_seeking_posting_by_id(&pool, job_seeking_id)
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
                    error: format!("구직 공고 확인 실패: {}", e),
                }),
            ),
        })?;

    // Verify customer ownership
    customer::get_customer_by_id(&pool, seeking.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    // Verify the tag belongs to the user
    tag::get_tag_by_id(&pool, tag_id, user.user_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "태그를 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 확인 실패: {}", e),
                }),
            ),
        })?;

    tag::detach_tag_from_job_seeking_posting(&pool, job_seeking_id, tag_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 연결 해제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

/// List job seeking posting tags
pub async fn list_job_seeking_tags(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(job_seeking_id): Path<i64>,
) -> Result<Json<TagsListResponse>, (StatusCode, Json<ErrorResponse>)> {
    use crate::repositories::job_seeking;

    // Verify the job seeking posting belongs to the user (via customer ownership)
    let seeking = job_seeking::get_job_seeking_posting_by_id(&pool, job_seeking_id)
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
                    error: format!("구직 공고 확인 실패: {}", e),
                }),
            ),
        })?;

    // Verify customer ownership
    customer::get_customer_by_id(&pool, seeking.customer_id, user.user_id)
        .await
        .map_err(|_| {
            (
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "접근 권한이 없습니다".to_string(),
                }),
            )
        })?;

    let tags = tag::list_job_seeking_posting_tags(&pool, job_seeking_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("태그 목록 조회 실패: {}", e),
                }),
            )
        })?;

    let total = tags.len();

    Ok(Json(TagsListResponse { tags, total }))
}
