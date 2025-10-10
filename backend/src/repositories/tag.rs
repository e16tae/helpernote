use crate::models::tag::{CreateTagRequest, Tag, UpdateTagRequest};
use sqlx::PgPool;

// ========================================
// Tag Management
// ========================================

/// Create a new tag
pub async fn create_tag(
    pool: &PgPool,
    user_id: i64,
    req: CreateTagRequest,
) -> Result<Tag, sqlx::Error> {
    let tag = sqlx::query_as!(
        Tag,
        r#"
        INSERT INTO tags (user_id, tag_name, tag_color, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, tag_name as "tag_name!", tag_color as "tag_color!", description, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        user_id,
        req.tag_name,
        req.tag_color.unwrap_or_else(|| "#6B7280".to_string()),
        req.description
    )
    .fetch_one(pool)
    .await?;

    Ok(tag)
}

/// List tags by user
pub async fn list_user_tags(
    pool: &PgPool,
    user_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Tag>, sqlx::Error> {
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    let tags = sqlx::query_as!(
        Tag,
        r#"
        SELECT id, user_id, tag_name as "tag_name!", tag_color as "tag_color!", description, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM tags
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY tag_name ASC
        LIMIT $2 OFFSET $3
        "#,
        user_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(tags)
}

/// Get tag by ID
pub async fn get_tag_by_id(pool: &PgPool, tag_id: i64, user_id: i64) -> Result<Tag, sqlx::Error> {
    let tag = sqlx::query_as!(
        Tag,
        r#"
        SELECT id, user_id, tag_name as "tag_name!", tag_color as "tag_color!", description, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM tags
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
        tag_id,
        user_id
    )
    .fetch_one(pool)
    .await?;

    Ok(tag)
}

/// Update tag
pub async fn update_tag(
    pool: &PgPool,
    tag_id: i64,
    user_id: i64,
    req: UpdateTagRequest,
) -> Result<Tag, sqlx::Error> {
    // Get current tag for default values
    let current = get_tag_by_id(pool, tag_id, user_id).await?;

    let tag = sqlx::query_as!(
        Tag,
        r#"
        UPDATE tags
        SET
            tag_name = $1,
            tag_color = $2,
            description = $3
        WHERE id = $4 AND user_id = $5 AND deleted_at IS NULL
        RETURNING id, user_id, tag_name as "tag_name!", tag_color as "tag_color!", description, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.tag_name.unwrap_or(current.tag_name),
        req.tag_color.unwrap_or(current.tag_color),
        req.description.or(current.description),
        tag_id,
        user_id
    )
    .fetch_one(pool)
    .await?;

    Ok(tag)
}

/// Delete tag (soft delete)
pub async fn delete_tag(pool: &PgPool, tag_id: i64, user_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE tags
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
        tag_id,
        user_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// Customer Tags
// ========================================

/// Attach tag to customer
pub async fn attach_tag_to_customer(
    pool: &PgPool,
    customer_id: i64,
    tag_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO customer_tags (customer_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (customer_id, tag_id) DO NOTHING
        "#,
        customer_id,
        tag_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Detach tag from customer
pub async fn detach_tag_from_customer(
    pool: &PgPool,
    customer_id: i64,
    tag_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM customer_tags
        WHERE customer_id = $1 AND tag_id = $2
        "#,
        customer_id,
        tag_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// List tags for customer
pub async fn list_customer_tags(pool: &PgPool, customer_id: i64) -> Result<Vec<Tag>, sqlx::Error> {
    let tags = sqlx::query_as!(
        Tag,
        r#"
        SELECT t.id, t.user_id, t.tag_name as "tag_name!", t.tag_color as "tag_color!", t.description, t.created_at as "created_at!", t.updated_at as "updated_at!", t.deleted_at
        FROM tags t
        INNER JOIN customer_tags ct ON t.id = ct.tag_id
        WHERE ct.customer_id = $1 AND t.deleted_at IS NULL
        ORDER BY t.tag_name ASC
        "#,
        customer_id
    )
    .fetch_all(pool)
    .await?;

    Ok(tags)
}

// ========================================
// Job Posting Tags
// ========================================

/// Attach tag to job posting
pub async fn attach_tag_to_job_posting(
    pool: &PgPool,
    job_posting_id: i64,
    tag_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO job_posting_tags (job_posting_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (job_posting_id, tag_id) DO NOTHING
        "#,
        job_posting_id,
        tag_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Detach tag from job posting
pub async fn detach_tag_from_job_posting(
    pool: &PgPool,
    job_posting_id: i64,
    tag_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM job_posting_tags
        WHERE job_posting_id = $1 AND tag_id = $2
        "#,
        job_posting_id,
        tag_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// List tags for job posting
pub async fn list_job_posting_tags(
    pool: &PgPool,
    job_posting_id: i64,
) -> Result<Vec<Tag>, sqlx::Error> {
    let tags = sqlx::query_as!(
        Tag,
        r#"
        SELECT t.id, t.user_id, t.tag_name as "tag_name!", t.tag_color as "tag_color!", t.description, t.created_at as "created_at!", t.updated_at as "updated_at!", t.deleted_at
        FROM tags t
        INNER JOIN job_posting_tags jpt ON t.id = jpt.tag_id
        WHERE jpt.job_posting_id = $1 AND t.deleted_at IS NULL
        ORDER BY t.tag_name ASC
        "#,
        job_posting_id
    )
    .fetch_all(pool)
    .await?;

    Ok(tags)
}

// ========================================
// Job Seeking Posting Tags
// ========================================

/// Attach tag to job seeking posting
pub async fn attach_tag_to_job_seeking_posting(
    pool: &PgPool,
    job_seeking_posting_id: i64,
    tag_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO job_seeking_posting_tags (job_seeking_posting_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (job_seeking_posting_id, tag_id) DO NOTHING
        "#,
        job_seeking_posting_id,
        tag_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Detach tag from job seeking posting
pub async fn detach_tag_from_job_seeking_posting(
    pool: &PgPool,
    job_seeking_posting_id: i64,
    tag_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM job_seeking_posting_tags
        WHERE job_seeking_posting_id = $1 AND tag_id = $2
        "#,
        job_seeking_posting_id,
        tag_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// List tags for job seeking posting
pub async fn list_job_seeking_posting_tags(
    pool: &PgPool,
    job_seeking_posting_id: i64,
) -> Result<Vec<Tag>, sqlx::Error> {
    let tags = sqlx::query_as!(
        Tag,
        r#"
        SELECT t.id, t.user_id, t.tag_name as "tag_name!", t.tag_color as "tag_color!", t.description, t.created_at as "created_at!", t.updated_at as "updated_at!", t.deleted_at
        FROM tags t
        INNER JOIN job_seeking_posting_tags jspt ON t.id = jspt.tag_id
        WHERE jspt.job_seeking_posting_id = $1 AND t.deleted_at IS NULL
        ORDER BY t.tag_name ASC
        "#,
        job_seeking_posting_id
    )
    .fetch_all(pool)
    .await?;

    Ok(tags)
}

/// Batch attach multiple tags to customer
pub async fn batch_attach_tags_to_customer(
    pool: &PgPool,
    customer_id: i64,
    tag_ids: &[i64],
) -> Result<(), sqlx::Error> {
    for tag_id in tag_ids {
        attach_tag_to_customer(pool, customer_id, *tag_id).await?;
    }
    Ok(())
}

/// Batch attach multiple tags to job posting
pub async fn batch_attach_tags_to_job_posting(
    pool: &PgPool,
    job_posting_id: i64,
    tag_ids: &[i64],
) -> Result<(), sqlx::Error> {
    for tag_id in tag_ids {
        attach_tag_to_job_posting(pool, job_posting_id, *tag_id).await?;
    }
    Ok(())
}

/// Batch attach multiple tags to job seeking posting
pub async fn batch_attach_tags_to_job_seeking_posting(
    pool: &PgPool,
    job_seeking_posting_id: i64,
    tag_ids: &[i64],
) -> Result<(), sqlx::Error> {
    for tag_id in tag_ids {
        attach_tag_to_job_seeking_posting(pool, job_seeking_posting_id, *tag_id).await?;
    }
    Ok(())
}
