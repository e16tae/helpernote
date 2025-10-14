// Allow unused code - these functions are used for future features
#![allow(dead_code)]

use crate::models::job_posting::{
    CreateJobSeekingPostingRequest, JobSeekingPosting, PostingStatus, SettlementStatus,
    UpdateJobSeekingPostingRequest,
};
use sqlx::PgPool;

/// Create a new job seeking posting
pub async fn create_job_seeking_posting(
    pool: &PgPool,
    req: CreateJobSeekingPostingRequest,
) -> Result<JobSeekingPosting, sqlx::Error> {
    let job_seeking = sqlx::query_as!(
        JobSeekingPosting,
        r#"
        INSERT INTO job_seeking_postings
            (customer_id, desired_salary, description, preferred_location, employee_fee_rate)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id, customer_id, desired_salary, description, preferred_location, employee_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.customer_id,
        req.desired_salary,
        req.description,
        req.preferred_location,
        req.employee_fee_rate
    )
    .fetch_one(pool)
    .await?;

    Ok(job_seeking)
}

/// Get job seeking posting by ID
pub async fn get_job_seeking_posting_by_id(
    pool: &PgPool,
    job_seeking_id: i64,
) -> Result<JobSeekingPosting, sqlx::Error> {
    let job_seeking = sqlx::query_as!(
        JobSeekingPosting,
        r#"
        SELECT
            id, customer_id, desired_salary, description, preferred_location, employee_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM job_seeking_postings
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        job_seeking_id
    )
    .fetch_one(pool)
    .await?;

    Ok(job_seeking)
}

/// List job seeking postings with optional filters
pub async fn list_job_seeking_postings(
    pool: &PgPool,
    user_id: i64,
    status: Option<PostingStatus>,
    settlement_status: Option<SettlementStatus>,
    preferred_location: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<JobSeekingPosting>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    // Build query based on filters
    let job_seekings = match (status, settlement_status, preferred_location) {
        (Some(st), Some(ss), Some(loc)) => {
            let location_pattern = format!("%{}%", loc);
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.posting_status = $2
                    AND jsp.settlement_status = $3
                    AND jsp.preferred_location ILIKE $4
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $5 OFFSET $6
                "#,
                user_id,
                st as PostingStatus,
                ss as SettlementStatus,
                location_pattern,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (Some(st), Some(ss), None) => {
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.posting_status = $2
                    AND jsp.settlement_status = $3
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $4 OFFSET $5
                "#,
                user_id,
                st as PostingStatus,
                ss as SettlementStatus,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (Some(st), None, Some(loc)) => {
            let location_pattern = format!("%{}%", loc);
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.posting_status = $2
                    AND jsp.preferred_location ILIKE $3
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $4 OFFSET $5
                "#,
                user_id,
                st as PostingStatus,
                location_pattern,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (None, Some(ss), Some(loc)) => {
            let location_pattern = format!("%{}%", loc);
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.settlement_status = $2
                    AND jsp.preferred_location ILIKE $3
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $4 OFFSET $5
                "#,
                user_id,
                ss as SettlementStatus,
                location_pattern,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (Some(st), None, None) => {
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.posting_status = $2
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $3 OFFSET $4
                "#,
                user_id,
                st as PostingStatus,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (None, Some(ss), None) => {
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.settlement_status = $2
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $3 OFFSET $4
                "#,
                user_id,
                ss as SettlementStatus,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (None, None, Some(loc)) => {
            let location_pattern = format!("%{}%", loc);
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.preferred_location ILIKE $2
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $3 OFFSET $4
                "#,
                user_id,
                location_pattern,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (None, None, None) => {
            sqlx::query_as!(
                JobSeekingPosting,
                r#"
                SELECT
                    jsp.id, jsp.customer_id, jsp.desired_salary, jsp.description,
                    jsp.preferred_location, jsp.employee_fee_rate,
                    jsp.settlement_status as "settlement_status!: SettlementStatus",
                    jsp.settlement_amount, jsp.settlement_memo,
                    jsp.posting_status as "posting_status!: PostingStatus",
                    jsp.is_favorite as "is_favorite!", jsp.created_at as "created_at!", jsp.updated_at as "updated_at!", jsp.deleted_at
                FROM job_seeking_postings jsp
                INNER JOIN customers c ON jsp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jsp.deleted_at IS NULL
                ORDER BY jsp.is_favorite DESC, jsp.created_at DESC
                LIMIT $2 OFFSET $3
                "#,
                user_id,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
    };

    Ok(job_seekings)
}

/// Update job seeking posting
pub async fn update_job_seeking_posting(
    pool: &PgPool,
    job_seeking_id: i64,
    req: UpdateJobSeekingPostingRequest,
) -> Result<JobSeekingPosting, sqlx::Error> {
    // Get current posting for default values
    let current = get_job_seeking_posting_by_id(pool, job_seeking_id).await?;

    let job_seeking = sqlx::query_as!(
        JobSeekingPosting,
        r#"
        UPDATE job_seeking_postings
        SET
            desired_salary = $1,
            description = $2,
            preferred_location = $3,
            employee_fee_rate = $4,
            settlement_status = $5,
            settlement_amount = $6,
            settlement_memo = $7,
            posting_status = $8,
            is_favorite = $9
        WHERE id = $10 AND deleted_at IS NULL
        RETURNING
            id, customer_id, desired_salary, description, preferred_location, employee_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.desired_salary.unwrap_or(current.desired_salary),
        req.description.unwrap_or(current.description),
        req.preferred_location.unwrap_or(current.preferred_location),
        req.employee_fee_rate.or(current.employee_fee_rate),
        req.settlement_status.unwrap_or(current.settlement_status) as SettlementStatus,
        req.settlement_amount.or(current.settlement_amount),
        req.settlement_memo.or(current.settlement_memo),
        req.posting_status.unwrap_or(current.posting_status) as PostingStatus,
        req.is_favorite.unwrap_or(current.is_favorite),
        job_seeking_id
    )
    .fetch_one(pool)
    .await?;

    Ok(job_seeking)
}

/// Delete job seeking posting (soft delete)
pub async fn delete_job_seeking_posting(
    pool: &PgPool,
    job_seeking_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE job_seeking_postings
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        job_seeking_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// List job seeking postings by customer
pub async fn list_job_seeking_postings_by_customer(
    pool: &PgPool,
    customer_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<JobSeekingPosting>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let job_seekings = sqlx::query_as!(
        JobSeekingPosting,
        r#"
        SELECT
            id, customer_id, desired_salary, description, preferred_location, employee_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM job_seeking_postings
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

    Ok(job_seekings)
}
