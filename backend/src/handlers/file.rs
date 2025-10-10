use axum::{
    body::Bytes,
    extract::{Multipart, Path, State},
    http::StatusCode,
    Json,
};
use s3::creds::Credentials;
use s3::{Bucket, Region};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::config::Config;
use crate::middleware::auth::AuthUser;
use crate::models::file::{FileType, UploadFileResponse};
use crate::repositories::file;

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Upload a file for a customer (e.g., profile photo)
pub async fn upload_customer_file(
    AuthUser { user_id, .. }: AuthUser,
    State(pool): State<PgPool>,
    State(config): State<Config>,
    Path(customer_id): Path<i64>,
    mut multipart: Multipart,
) -> Result<Json<UploadFileResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify customer ownership
    let _customer = crate::repositories::customer::get_customer_by_id(&pool, customer_id, user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get customer: {:?}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "Customer not found".to_string(),
                }),
            )
        })?;

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
    let file_path = format!("customers/{}/{}", customer_id, file_name);

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
    let file_record = file::create_customer_file(
        &pool,
        customer_id,
        file_path.clone(),
        file_type,
        Some(data.len() as i64),
        original_filename,
        content_type,
        false, // Not profile by default
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

    Ok(Json(UploadFileResponse {
        file_id: file_record.id,
        file_path,
        file_url,
    }))
}

/// Upload a customer profile photo
pub async fn upload_customer_profile_photo(
    AuthUser { user_id, .. }: AuthUser,
    State(pool): State<PgPool>,
    State(config): State<Config>,
    Path(customer_id): Path<i64>,
    mut multipart: Multipart,
) -> Result<Json<UploadFileResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify customer ownership
    let _customer = crate::repositories::customer::get_customer_by_id(&pool, customer_id, user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get customer: {:?}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "Customer not found".to_string(),
                }),
            )
        })?;

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

    // Validate it's an image
    if let Some(ref ct) = content_type {
        if !ct.starts_with("image/") {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Only image files are allowed for profile photos".to_string(),
                }),
            ));
        }
    }

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

    // Generate unique file path
    let file_extension = original_filename
        .as_ref()
        .and_then(|name| name.rsplit('.').next())
        .unwrap_or("jpg");
    let file_name = format!("profile-{}.{}", Uuid::new_v4(), file_extension);
    let file_path = format!("customers/{}/{}", customer_id, file_name);

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

    // Save metadata to database with is_profile = true
    let file_record = file::create_customer_file(
        &pool,
        customer_id,
        file_path.clone(),
        FileType::Image,
        Some(data.len() as i64),
        original_filename,
        content_type,
        true, // Mark as profile photo
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

    // Set as profile photo (unsets previous profile photos)
    file::set_customer_profile_photo(&pool, customer_id, file_record.id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to set profile photo: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Failed to set profile photo".to_string(),
                }),
            )
        })?;

    let file_url = format!(
        "{}/{}/{}",
        config.minio_endpoint, config.minio_bucket, file_path
    );

    Ok(Json(UploadFileResponse {
        file_id: file_record.id,
        file_path,
        file_url,
    }))
}

/// List customer files
pub async fn list_customer_files(
    AuthUser { user_id, .. }: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    // Verify customer ownership
    let _customer = crate::repositories::customer::get_customer_by_id(&pool, customer_id, user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get customer: {:?}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "Customer not found".to_string(),
                }),
            )
        })?;

    let files = file::list_customer_files(&pool, customer_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to list files: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Failed to list files".to_string(),
                }),
            )
        })?;

    Ok(Json(serde_json::json!({ "files": files })))
}

/// Delete customer file
pub async fn delete_customer_file(
    AuthUser { user_id, .. }: AuthUser,
    State(pool): State<PgPool>,
    State(config): State<Config>,
    Path((customer_id, file_id)): Path<(i64, i64)>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    // Verify customer ownership
    let _customer = crate::repositories::customer::get_customer_by_id(&pool, customer_id, user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get customer: {:?}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "Customer not found".to_string(),
                }),
            )
        })?;

    // Get file record
    let file_record = file::get_customer_file_by_id(&pool, file_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get file: {:?}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "File not found".to_string(),
                }),
            )
        })?;

    // Verify file belongs to customer
    if file_record.customer_id != customer_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "Access denied".to_string(),
            }),
        ));
    }

    // Delete from MinIO
    delete_from_minio(&config, &file_record.file_path)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete from MinIO: {:?}", e);
            // Continue anyway - soft delete in DB is more important
        })
        .ok();

    // Soft delete in database
    file::delete_customer_file(&pool, file_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete file: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Failed to delete file".to_string(),
                }),
            )
        })?;

    Ok(Json(
        serde_json::json!({ "message": "File deleted successfully" }),
    ))
}

/// Helper function to upload to MinIO
async fn upload_to_minio(config: &Config, path: &str, data: Bytes) -> Result<(), String> {
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

/// Helper function to delete from MinIO
async fn delete_from_minio(config: &Config, path: &str) -> Result<(), String> {
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
        .delete_object(path)
        .await
        .map_err(|e| format!("Failed to delete object: {}", e))?;

    Ok(())
}
