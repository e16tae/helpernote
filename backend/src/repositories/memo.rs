use crate::models::memo::{
    CreateCustomerMemoRequest, CreateMatchingMemoRequest, CreateUserMemoRequest, CustomerMemo,
    MatchingMemo, UpdateMemoRequest, UserMemo,
};
use sqlx::PgPool;

// ========================================
// Customer Memos
// ========================================

/// Create a customer memo
pub async fn create_customer_memo(
    pool: &PgPool,
    req: CreateCustomerMemoRequest,
    created_by: i64,
) -> Result<CustomerMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        CustomerMemo,
        r#"
        INSERT INTO customer_memos (customer_id, memo_content, created_by)
        VALUES ($1, $2, $3)
        RETURNING id, customer_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.customer_id,
        req.memo_content,
        created_by
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// List customer memos by customer
pub async fn list_customer_memos_by_customer(
    pool: &PgPool,
    customer_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<CustomerMemo>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let memos = sqlx::query_as!(
        CustomerMemo,
        r#"
        SELECT id, customer_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM customer_memos
        WHERE customer_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        customer_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(memos)
}

/// Get customer memo by ID
pub async fn get_customer_memo_by_id(
    pool: &PgPool,
    memo_id: i64,
) -> Result<CustomerMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        CustomerMemo,
        r#"
        SELECT id, customer_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM customer_memos
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        memo_id
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// Update customer memo
pub async fn update_customer_memo(
    pool: &PgPool,
    memo_id: i64,
    req: UpdateMemoRequest,
) -> Result<CustomerMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        CustomerMemo,
        r#"
        UPDATE customer_memos
        SET memo_content = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING id, customer_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.memo_content,
        memo_id
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// Delete customer memo (soft delete)
pub async fn delete_customer_memo(pool: &PgPool, memo_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE customer_memos
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        memo_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// User Memos
// ========================================

/// Create a user memo
pub async fn create_user_memo(
    pool: &PgPool,
    user_id: i64,
    req: CreateUserMemoRequest,
) -> Result<UserMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        UserMemo,
        r#"
        INSERT INTO user_memos (user_id, memo_content)
        VALUES ($1, $2)
        RETURNING id, user_id, memo_content, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        user_id,
        req.memo_content
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// List user memos by user
pub async fn list_user_memos_by_user(
    pool: &PgPool,
    user_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<UserMemo>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let memos = sqlx::query_as!(
        UserMemo,
        r#"
        SELECT id, user_id, memo_content, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM user_memos
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        user_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(memos)
}

/// Get user memo by ID
pub async fn get_user_memo_by_id(pool: &PgPool, memo_id: i64) -> Result<UserMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        UserMemo,
        r#"
        SELECT id, user_id, memo_content, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM user_memos
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        memo_id
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// Update user memo
pub async fn update_user_memo(
    pool: &PgPool,
    memo_id: i64,
    req: UpdateMemoRequest,
) -> Result<UserMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        UserMemo,
        r#"
        UPDATE user_memos
        SET memo_content = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING id, user_id, memo_content, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.memo_content,
        memo_id
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// Delete user memo (soft delete)
pub async fn delete_user_memo(pool: &PgPool, memo_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE user_memos
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        memo_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

// ========================================
// Matching Memos
// ========================================

/// Create a matching memo
pub async fn create_matching_memo(
    pool: &PgPool,
    req: CreateMatchingMemoRequest,
    created_by: i64,
) -> Result<MatchingMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        MatchingMemo,
        r#"
        INSERT INTO matching_memos (matching_id, memo_content, created_by)
        VALUES ($1, $2, $3)
        RETURNING id, matching_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.matching_id,
        req.memo_content,
        created_by
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// List matching memos by matching
pub async fn list_matching_memos_by_matching(
    pool: &PgPool,
    matching_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<MatchingMemo>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let memos = sqlx::query_as!(
        MatchingMemo,
        r#"
        SELECT id, matching_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM matching_memos
        WHERE matching_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        matching_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(memos)
}

/// Get matching memo by ID
pub async fn get_matching_memo_by_id(
    pool: &PgPool,
    memo_id: i64,
) -> Result<MatchingMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        MatchingMemo,
        r#"
        SELECT id, matching_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM matching_memos
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        memo_id
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// Update matching memo
pub async fn update_matching_memo(
    pool: &PgPool,
    memo_id: i64,
    req: UpdateMemoRequest,
) -> Result<MatchingMemo, sqlx::Error> {
    let memo = sqlx::query_as!(
        MatchingMemo,
        r#"
        UPDATE matching_memos
        SET memo_content = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING id, matching_id, memo_content, created_by, created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.memo_content,
        memo_id
    )
    .fetch_one(pool)
    .await?;

    Ok(memo)
}

/// Delete matching memo (soft delete)
pub async fn delete_matching_memo(pool: &PgPool, memo_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE matching_memos
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        memo_id
    )
    .execute(pool)
    .await?;

    Ok(())
}
