// Allow unused code - these functions are used for future features
#![allow(dead_code)]

use crate::models::job_posting::{
    CreateJobPostingRequest, JobPosting, PostingStatus, SettlementStatus, UpdateJobPostingRequest,
};
use sqlx::PgPool;

/// Create a new job posting
pub async fn create_job_posting(
    pool: &PgPool,
    req: CreateJobPostingRequest,
) -> Result<JobPosting, sqlx::Error> {
    let job_posting = sqlx::query_as!(
        JobPosting,
        r#"
        INSERT INTO job_postings (customer_id, salary, description, employer_fee_rate)
        VALUES ($1, $2, $3, $4)
        RETURNING
            id, customer_id, salary, description, employer_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.customer_id,
        req.salary,
        req.description,
        req.employer_fee_rate
    )
    .fetch_one(pool)
    .await?;

    Ok(job_posting)
}

/// Get job posting by ID
pub async fn get_job_posting_by_id(
    pool: &PgPool,
    job_posting_id: i64,
) -> Result<JobPosting, sqlx::Error> {
    let job_posting = sqlx::query_as!(
        JobPosting,
        r#"
        SELECT
            id, customer_id, salary, description, employer_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM job_postings
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        job_posting_id
    )
    .fetch_one(pool)
    .await?;

    Ok(job_posting)
}

/// List job postings with optional filters
pub async fn list_job_postings(
    pool: &PgPool,
    user_id: i64,
    status: Option<PostingStatus>,
    settlement_status: Option<SettlementStatus>,
    is_favorite: Option<bool>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<JobPosting>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    // Build query based on filters
    let job_postings = match (status, settlement_status, is_favorite) {
        (Some(st), Some(ss), Some(fav)) => {
            sqlx::query_as!(
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.posting_status = $2
                    AND jp.settlement_status = $3
                    AND jp.is_favorite = $4
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
                LIMIT $5 OFFSET $6
                "#,
                user_id,
                st as PostingStatus,
                ss as SettlementStatus,
                fav,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (Some(st), Some(ss), None) => {
            sqlx::query_as!(
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.posting_status = $2
                    AND jp.settlement_status = $3
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
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
        (Some(st), None, Some(fav)) => {
            sqlx::query_as!(
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.posting_status = $2
                    AND jp.is_favorite = $3
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
                LIMIT $4 OFFSET $5
                "#,
                user_id,
                st as PostingStatus,
                fav,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (None, Some(ss), Some(fav)) => {
            sqlx::query_as!(
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.settlement_status = $2
                    AND jp.is_favorite = $3
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
                LIMIT $4 OFFSET $5
                "#,
                user_id,
                ss as SettlementStatus,
                fav,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (Some(st), None, None) => {
            sqlx::query_as!(
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.posting_status = $2
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
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
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.settlement_status = $2
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
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
        (None, None, Some(fav)) => {
            sqlx::query_as!(
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.is_favorite = $2
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
                LIMIT $3 OFFSET $4
                "#,
                user_id,
                fav,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        (None, None, None) => {
            sqlx::query_as!(
                JobPosting,
                r#"
                SELECT
                    jp.id, jp.customer_id, jp.salary, jp.description, jp.employer_fee_rate,
                    jp.settlement_status as "settlement_status!: SettlementStatus",
                    jp.settlement_amount, jp.settlement_memo,
                    jp.posting_status as "posting_status!: PostingStatus",
                    jp.is_favorite as "is_favorite!", jp.created_at as "created_at!", jp.updated_at as "updated_at!", jp.deleted_at
                FROM job_postings jp
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND jp.deleted_at IS NULL
                ORDER BY jp.is_favorite DESC, jp.created_at DESC
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

    Ok(job_postings)
}

/// Update job posting
pub async fn update_job_posting(
    pool: &PgPool,
    job_posting_id: i64,
    req: UpdateJobPostingRequest,
) -> Result<JobPosting, sqlx::Error> {
    // Get current posting for default values
    let current = get_job_posting_by_id(pool, job_posting_id).await?;

    let job_posting = sqlx::query_as!(
        JobPosting,
        r#"
        UPDATE job_postings
        SET
            salary = $1,
            description = $2,
            employer_fee_rate = $3,
            settlement_status = $4,
            settlement_amount = $5,
            settlement_memo = $6,
            posting_status = $7,
            is_favorite = $8
        WHERE id = $9 AND deleted_at IS NULL
        RETURNING
            id, customer_id, salary, description, employer_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.salary.unwrap_or(current.salary),
        req.description.unwrap_or(current.description),
        req.employer_fee_rate.or(current.employer_fee_rate),
        req.settlement_status.unwrap_or(current.settlement_status) as SettlementStatus,
        req.settlement_amount.or(current.settlement_amount),
        req.settlement_memo.or(current.settlement_memo),
        req.posting_status.unwrap_or(current.posting_status) as PostingStatus,
        req.is_favorite.unwrap_or(current.is_favorite),
        job_posting_id
    )
    .fetch_one(pool)
    .await?;

    Ok(job_posting)
}

/// Delete job posting (soft delete)
pub async fn delete_job_posting(pool: &PgPool, job_posting_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE job_postings
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        job_posting_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// List job postings by customer
pub async fn list_job_postings_by_customer(
    pool: &PgPool,
    customer_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<JobPosting>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let job_postings = sqlx::query_as!(
        JobPosting,
        r#"
        SELECT
            id, customer_id, salary, description, employer_fee_rate,
            settlement_status as "settlement_status!: SettlementStatus",
            settlement_amount, settlement_memo,
            posting_status as "posting_status!: PostingStatus",
            is_favorite as "is_favorite!", created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM job_postings
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

    Ok(job_postings)
}
