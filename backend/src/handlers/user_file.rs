use axum::{extract::{Path, State}, http::StatusCode, Json};
use serde::Serialize;
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::file::UserFile;
use crate::repositories::file;

#[derive(Debug, Serialize)]
pub struct UserFileResponse {
    pub file: UserFile,
}

#[derive(Debug, Serialize)]
pub struct UserFilesListResponse {
    pub files: Vec<UserFile>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// List user files
pub async fn list_user_files(
    user: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<UserFilesListResponse>, (StatusCode, Json<ErrorResponse>)> {
    let files = file::list_user_files(&pool, user.user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("파일 목록 조회 실패: {}", e),
                }),
            )
        })?;

    let total = files.len();

    Ok(Json(UserFilesListResponse { files, total }))
}

/// Delete user file
pub async fn delete_user_file(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(file_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Verify file belongs to user
    let file_result = sqlx::query!(
        r#"
        SELECT user_id
        FROM user_files
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        file_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "파일을 찾을 수 없습니다".to_string(),
            }),
        )
    })?;

    if file_result.user_id != user.user_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "이 파일에 접근할 권한이 없습니다".to_string(),
            }),
        ));
    }

    sqlx::query!(
        r#"
        UPDATE user_files
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
        "#,
        file_id
    )
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("파일 삭제 실패: {}", e),
            }),
        )
    })?;

    Ok(StatusCode::NO_CONTENT)
}
