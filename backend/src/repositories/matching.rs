// Allow unused code - these functions are used for future features
#![allow(dead_code)]

use crate::models::matching::{
    CreateMatchingRequest, Matching, MatchingStatus, UpdateMatchingRequest,
};
use rust_decimal::Decimal;
use sqlx::PgPool;

/// Create a new matching with automatic fee calculation
pub async fn create_matching(
    pool: &PgPool,
    req: CreateMatchingRequest,
) -> Result<Matching, sqlx::Error> {
    // Calculate fees
    let employer_fee = (req.agreed_salary * req.employer_fee_rate) / Decimal::from(100);
    let employee_fee = (req.agreed_salary * req.employee_fee_rate) / Decimal::from(100);

    let matching = sqlx::query_as!(
        Matching,
        r#"
        INSERT INTO matchings
            (job_posting_id, job_seeking_posting_id, agreed_salary,
             employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id, job_posting_id, job_seeking_posting_id, matched_at as "matched_at!", agreed_salary,
            employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount,
            matching_status as "matching_status!: MatchingStatus",
            cancellation_reason, cancelled_at, cancelled_by, completed_at,
            created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        req.job_posting_id,
        req.job_seeking_posting_id,
        req.agreed_salary,
        req.employer_fee_rate,
        req.employee_fee_rate,
        employer_fee,
        employee_fee
    )
    .fetch_one(pool)
    .await?;

    Ok(matching)
}

/// Get matching by ID
pub async fn get_matching_by_id(pool: &PgPool, matching_id: i64) -> Result<Matching, sqlx::Error> {
    let matching = sqlx::query_as!(
        Matching,
        r#"
        SELECT
            id, job_posting_id, job_seeking_posting_id, matched_at as "matched_at!", agreed_salary,
            employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount,
            matching_status as "matching_status!: MatchingStatus",
            cancellation_reason, cancelled_at, cancelled_by, completed_at,
            created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM matchings
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        matching_id
    )
    .fetch_one(pool)
    .await?;

    Ok(matching)
}

/// List matchings with optional status filter
pub async fn list_matchings(
    pool: &PgPool,
    user_id: i64,
    status: Option<MatchingStatus>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Matching>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let matchings = match status {
        Some(st) => {
            sqlx::query_as!(
                Matching,
                r#"
                SELECT
                    m.id, m.job_posting_id, m.job_seeking_posting_id, m.matched_at as "matched_at!", m.agreed_salary,
                    m.employer_fee_rate, m.employee_fee_rate, m.employer_fee_amount, m.employee_fee_amount,
                    m.matching_status as "matching_status!: MatchingStatus",
                    m.cancellation_reason, m.cancelled_at, m.cancelled_by, m.completed_at,
                    m.created_at as "created_at!", m.updated_at as "updated_at!", m.deleted_at
                FROM matchings m
                INNER JOIN job_postings jp ON m.job_posting_id = jp.id
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND m.matching_status = $2
                    AND m.deleted_at IS NULL
                ORDER BY m.matched_at DESC
                LIMIT $3 OFFSET $4
                "#,
                user_id,
                st as MatchingStatus,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        None => {
            sqlx::query_as!(
                Matching,
                r#"
                SELECT
                    m.id, m.job_posting_id, m.job_seeking_posting_id, m.matched_at as "matched_at!", m.agreed_salary,
                    m.employer_fee_rate, m.employee_fee_rate, m.employer_fee_amount, m.employee_fee_amount,
                    m.matching_status as "matching_status!: MatchingStatus",
                    m.cancellation_reason, m.cancelled_at, m.cancelled_by, m.completed_at,
                    m.created_at as "created_at!", m.updated_at as "updated_at!", m.deleted_at
                FROM matchings m
                INNER JOIN job_postings jp ON m.job_posting_id = jp.id
                INNER JOIN customers c ON jp.customer_id = c.id
                WHERE c.user_id = $1
                    AND m.deleted_at IS NULL
                ORDER BY m.matched_at DESC
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

    Ok(matchings)
}

/// Update matching status with recalculation of fees if salary or rates change
pub async fn update_matching_status(
    pool: &PgPool,
    matching_id: i64,
    req: UpdateMatchingRequest,
) -> Result<Matching, sqlx::Error> {
    // Get current matching for default values
    let current = get_matching_by_id(pool, matching_id).await?;

    // Determine final values
    let final_salary = req.agreed_salary.unwrap_or(current.agreed_salary);
    let final_employer_rate = req.employer_fee_rate.unwrap_or(current.employer_fee_rate);
    let final_employee_rate = req.employee_fee_rate.unwrap_or(current.employee_fee_rate);

    // Recalculate fees if any of the values changed
    let employer_fee = (final_salary * final_employer_rate) / Decimal::from(100);
    let employee_fee = (final_salary * final_employee_rate) / Decimal::from(100);

    let matching = sqlx::query_as!(
        Matching,
        r#"
        UPDATE matchings
        SET
            agreed_salary = $1,
            employer_fee_rate = $2,
            employee_fee_rate = $3,
            employer_fee_amount = $4,
            employee_fee_amount = $5,
            matching_status = $6,
            cancellation_reason = $7
        WHERE id = $8 AND deleted_at IS NULL
        RETURNING
            id, job_posting_id, job_seeking_posting_id, matched_at as "matched_at!", agreed_salary,
            employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount,
            matching_status as "matching_status!: MatchingStatus",
            cancellation_reason, cancelled_at, cancelled_by, completed_at,
            created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        final_salary,
        final_employer_rate,
        final_employee_rate,
        employer_fee,
        employee_fee,
        req.matching_status.unwrap_or(current.matching_status) as MatchingStatus,
        req.cancellation_reason.or(current.cancellation_reason),
        matching_id
    )
    .fetch_one(pool)
    .await?;

    Ok(matching)
}

/// Complete a matching
pub async fn complete_matching(pool: &PgPool, matching_id: i64) -> Result<Matching, sqlx::Error> {
    let matching = sqlx::query_as!(
        Matching,
        r#"
        UPDATE matchings
        SET
            matching_status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING
            id, job_posting_id, job_seeking_posting_id, matched_at as "matched_at!", agreed_salary,
            employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount,
            matching_status as "matching_status!: MatchingStatus",
            cancellation_reason, cancelled_at, cancelled_by, completed_at,
            created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        matching_id
    )
    .fetch_one(pool)
    .await?;

    Ok(matching)
}

/// Cancel a matching
pub async fn cancel_matching(
    pool: &PgPool,
    matching_id: i64,
    cancelled_by: i64,
    reason: Option<String>,
) -> Result<Matching, sqlx::Error> {
    let matching = sqlx::query_as!(
        Matching,
        r#"
        UPDATE matchings
        SET
            matching_status = 'cancelled',
            cancelled_at = CURRENT_TIMESTAMP,
            cancelled_by = $2,
            cancellation_reason = $3
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING
            id, job_posting_id, job_seeking_posting_id, matched_at as "matched_at!", agreed_salary,
            employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount,
            matching_status as "matching_status!: MatchingStatus",
            cancellation_reason, cancelled_at, cancelled_by, completed_at,
            created_at as "created_at!", updated_at as "updated_at!", deleted_at
        "#,
        matching_id,
        cancelled_by,
        reason
    )
    .fetch_one(pool)
    .await?;

    Ok(matching)
}

/// Calculate total fees for a matching
pub async fn calculate_fees(
    pool: &PgPool,
    matching_id: i64,
) -> Result<(Decimal, Decimal, Decimal), sqlx::Error> {
    let matching = get_matching_by_id(pool, matching_id).await?;

    let employer_fee = matching.employer_fee_amount.unwrap_or(Decimal::ZERO);
    let employee_fee = matching.employee_fee_amount.unwrap_or(Decimal::ZERO);
    let total_fee = employer_fee + employee_fee;

    Ok((employer_fee, employee_fee, total_fee))
}

/// List matchings by job posting
pub async fn list_matchings_by_job_posting(
    pool: &PgPool,
    job_posting_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Matching>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let matchings = sqlx::query_as!(
        Matching,
        r#"
        SELECT
            id, job_posting_id, job_seeking_posting_id, matched_at as "matched_at!", agreed_salary,
            employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount,
            matching_status as "matching_status!: MatchingStatus",
            cancellation_reason, cancelled_at, cancelled_by, completed_at,
            created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM matchings
        WHERE job_posting_id = $1 AND deleted_at IS NULL
        ORDER BY matched_at DESC
        LIMIT $2 OFFSET $3
        "#,
        job_posting_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(matchings)
}

/// List matchings by job seeking posting
pub async fn list_matchings_by_job_seeking(
    pool: &PgPool,
    job_seeking_posting_id: i64,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Matching>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let matchings = sqlx::query_as!(
        Matching,
        r#"
        SELECT
            id, job_posting_id, job_seeking_posting_id, matched_at as "matched_at!", agreed_salary,
            employer_fee_rate, employee_fee_rate, employer_fee_amount, employee_fee_amount,
            matching_status as "matching_status!: MatchingStatus",
            cancellation_reason, cancelled_at, cancelled_by, completed_at,
            created_at as "created_at!", updated_at as "updated_at!", deleted_at
        FROM matchings
        WHERE job_seeking_posting_id = $1 AND deleted_at IS NULL
        ORDER BY matched_at DESC
        LIMIT $2 OFFSET $3
        "#,
        job_seeking_posting_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(matchings)
}
