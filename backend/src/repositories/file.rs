use crate::models::file::{CustomerFile, FileType, UserFile};
use sqlx::PgPool;

/// Create a new customer file record
pub async fn create_customer_file(
    pool: &PgPool,
    customer_id: i64,
    file_path: String,
    file_type: FileType,
    file_size: Option<i64>,
    original_filename: Option<String>,
    mime_type: Option<String>,
    is_profile: bool,
) -> Result<CustomerFile, sqlx::Error> {
    let file = sqlx::query_as!(
        CustomerFile,
        r#"
        INSERT INTO customer_files (customer_id, file_path, file_type, file_size, original_filename, mime_type, is_profile)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id,
            customer_id,
            file_path,
            file_type AS "file_type: FileType",
            file_size,
            thumbnail_path,
            original_filename,
            mime_type,
            is_profile AS "is_profile!",
            created_at AS "created_at!",
            updated_at AS "updated_at!",
            deleted_at
        "#,
        customer_id,
        file_path,
        file_type as FileType,
        file_size,
        original_filename,
        mime_type,
        is_profile
    )
    .fetch_one(pool)
    .await?;

    Ok(file)
}

/// Get customer file by ID
pub async fn get_customer_file_by_id(
    pool: &PgPool,
    file_id: i64,
) -> Result<CustomerFile, sqlx::Error> {
    let file = sqlx::query_as!(
        CustomerFile,
        r#"
        SELECT
            id,
            customer_id,
            file_path,
            file_type AS "file_type: FileType",
            file_size,
            thumbnail_path,
            original_filename,
            mime_type,
            is_profile AS "is_profile!",
            created_at AS "created_at!",
            updated_at AS "updated_at!",
            deleted_at
        FROM customer_files
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        file_id
    )
    .fetch_one(pool)
    .await?;

    Ok(file)
}

/// List customer files
pub async fn list_customer_files(
    pool: &PgPool,
    customer_id: i64,
) -> Result<Vec<CustomerFile>, sqlx::Error> {
    let files = sqlx::query_as!(
        CustomerFile,
        r#"
        SELECT
            id,
            customer_id,
            file_path,
            file_type AS "file_type: FileType",
            file_size,
            thumbnail_path,
            original_filename,
            mime_type,
            is_profile AS "is_profile!",
            created_at AS "created_at!",
            updated_at AS "updated_at!",
            deleted_at
        FROM customer_files
        WHERE customer_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        "#,
        customer_id
    )
    .fetch_all(pool)
    .await?;

    Ok(files)
}

/// Get customer profile photo
pub async fn get_customer_profile_photo(
    pool: &PgPool,
    customer_id: i64,
) -> Result<Option<CustomerFile>, sqlx::Error> {
    let file = sqlx::query_as!(
        CustomerFile,
        r#"
        SELECT
            id,
            customer_id,
            file_path,
            file_type AS "file_type: FileType",
            file_size,
            thumbnail_path,
            original_filename,
            mime_type,
            is_profile AS "is_profile!",
            created_at AS "created_at!",
            updated_at AS "updated_at!",
            deleted_at
        FROM customer_files
        WHERE customer_id = $1 AND is_profile = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        "#,
        customer_id
    )
    .fetch_optional(pool)
    .await?;

    Ok(file)
}

/// Update customer profile photo (set is_profile flag)
pub async fn set_customer_profile_photo(
    pool: &PgPool,
    customer_id: i64,
    file_id: i64,
) -> Result<(), sqlx::Error> {
    // First, unset all profile photos for this customer
    sqlx::query!(
        r#"
        UPDATE customer_files
        SET is_profile = false, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $1 AND deleted_at IS NULL
        "#,
        customer_id
    )
    .execute(pool)
    .await?;

    // Then set the new profile photo
    sqlx::query!(
        r#"
        UPDATE customer_files
        SET is_profile = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL
        "#,
        file_id,
        customer_id
    )
    .execute(pool)
    .await?;

    // Update customer's profile_photo_id
    sqlx::query!(
        r#"
        UPDATE customers
        SET profile_photo_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND deleted_at IS NULL
        "#,
        file_id,
        customer_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Delete customer file (soft delete)
pub async fn delete_customer_file(pool: &PgPool, file_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE customer_files
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
        "#,
        file_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Create a new user file record
pub async fn create_user_file(
    pool: &PgPool,
    user_id: i64,
    file_path: String,
    file_type: FileType,
    file_size: Option<i64>,
    original_filename: Option<String>,
    mime_type: Option<String>,
) -> Result<UserFile, sqlx::Error> {
    let file = sqlx::query_as!(
        UserFile,
        r#"
        INSERT INTO user_files (user_id, file_path, file_type, file_size, original_filename, mime_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            user_id,
            file_path,
            file_type AS "file_type: FileType",
            file_size,
            thumbnail_path,
            original_filename,
            mime_type,
            created_at AS "created_at!",
            updated_at AS "updated_at!",
            deleted_at
        "#,
        user_id,
        file_path,
        file_type as FileType,
        file_size,
        original_filename,
        mime_type
    )
    .fetch_one(pool)
    .await?;

    Ok(file)
}

/// List user files
pub async fn list_user_files(pool: &PgPool, user_id: i64) -> Result<Vec<UserFile>, sqlx::Error> {
    let files = sqlx::query_as!(
        UserFile,
        r#"
        SELECT
            id,
            user_id,
            file_path,
            file_type AS "file_type: FileType",
            file_size,
            thumbnail_path,
            original_filename,
            mime_type,
            created_at AS "created_at!",
            updated_at AS "updated_at!",
            deleted_at
        FROM user_files
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    Ok(files)
}
