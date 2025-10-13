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

/// Upload a file for a user
pub async fn upload_user_file(
    user: AuthUser,
    State(pool): State<PgPool>,
    State(config): State<crate::config::Config>,
    mut multipart: axum::extract::Multipart,
) -> Result<Json<crate::models::file::UploadFileResponse>, (StatusCode, Json<ErrorResponse>)> {
    use axum::body::Bytes;
    use s3::creds::Credentials;
    use s3::{Bucket, Region};
    use uuid::Uuid;
    use crate::models::file::FileType;

    // Get multipart field
    let field = multipart
        .next_field()
        .await
        .map_err(|e| {
            tracing::error!("Failed to read multipart field: {:?}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Failed to read file".to_string(),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "No file provided".to_string(),
                }),
            )
        })?;

    let original_filename = field.file_name().map(|s| s.to_string());
    let content_type = field.content_type().map(|s| s.to_string());

    // Read file data
    let data = field.bytes().await.map_err(|e| {
        tracing::error!("Failed to read file bytes: {:?}", e);
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Failed to read file data".to_string(),
            }),
        )
    })?;

    // Determine file type
    let file_type = content_type
        .as_ref()
        .map(|ct| FileType::from_mime_type(ct))
        .unwrap_or(FileType::Other);

    // Generate unique file path
    let file_extension = original_filename
        .as_ref()
        .and_then(|name| name.rsplit('.').next())
        .unwrap_or("bin");
    let file_name = format!("{}.{}", Uuid::new_v4(), file_extension);
    let file_path = format!("users/{}/{}", user.user_id, file_name);

    // Upload to MinIO
    upload_to_minio(&config, &file_path, data.clone())
        .await
        .map_err(|e| {
            tracing::error!("Failed to upload to MinIO: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Failed to upload file".to_string(),
                }),
            )
        })?;

    // Save metadata to database
    let file_record = file::create_user_file(
        &pool,
        user.user_id,
        file_path.clone(),
        file_type,
        Some(data.len() as i64),
        original_filename,
        content_type,
    )
    .await
    .map_err(|e| {
        tracing::error!("Failed to save file metadata: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to save file metadata".to_string(),
            }),
        )
    })?;

    let file_url = format!(
        "{}/{}/{}",
        config.minio_endpoint, config.minio_bucket, file_path
    );

    Ok(Json(crate::models::file::UploadFileResponse {
        file_id: file_record.id,
        file_path,
        file_url,
    }))
}

/// Helper function to upload to MinIO
async fn upload_to_minio(config: &crate::config::Config, path: &str, data: axum::body::Bytes) -> Result<(), String> {
    use s3::creds::Credentials;
    use s3::{Bucket, Region};

    let credentials = Credentials::new(
        Some(&config.minio_access_key),
        Some(&config.minio_secret_key),
        None,
        None,
        None,
    )
    .map_err(|e| format!("Failed to create credentials: {}", e))?;

    let region = Region::Custom {
        region: "us-east-1".to_string(),
        endpoint: config.minio_endpoint.clone(),
    };

    let bucket = Bucket::new(&config.minio_bucket, region, credentials)
        .map_err(|e| format!("Failed to create bucket: {}", e))?
        .with_path_style();

    bucket
        .put_object(path, &data)
        .await
        .map_err(|e| format!("Failed to put object: {}", e))?;

    Ok(())
}
