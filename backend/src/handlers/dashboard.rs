use axum::{extract::State, http::StatusCode, Json};
use rust_decimal::Decimal;
use serde::Serialize;
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;

#[derive(Debug, Serialize)]
pub struct DashboardStatsResponse {
    pub total_customers: i64,
    pub job_postings_count: i64,
    pub job_seekings_count: i64,
    pub matchings_count: i64,
    pub pending_amount: Decimal,
    pub total_revenue: Decimal,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Get dashboard statistics
pub async fn get_dashboard_stats(
    user: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<DashboardStatsResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get customer count
    let customer_count = sqlx::query_scalar!(
        r#"
        SELECT COUNT(*)
        FROM customers
        WHERE user_id = $1 AND deleted_at IS NULL
        "#,
        user.user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("고객 수 조회 실패: {}", e),
            }),
        )
    })?
    .unwrap_or(0);

    // Get job postings count
    let job_postings_count = sqlx::query_scalar!(
        r#"
        SELECT COUNT(*)
        FROM job_postings jp
        INNER JOIN customers c ON jp.customer_id = c.id
        WHERE c.user_id = $1 AND jp.deleted_at IS NULL AND c.deleted_at IS NULL
        "#,
        user.user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("구인 공고 수 조회 실패: {}", e),
            }),
        )
    })?
    .unwrap_or(0);

    // Get job seekings count
    let job_seekings_count = sqlx::query_scalar!(
        r#"
        SELECT COUNT(*)
        FROM job_seeking_postings jsp
        INNER JOIN customers c ON jsp.customer_id = c.id
        WHERE c.user_id = $1 AND jsp.deleted_at IS NULL AND c.deleted_at IS NULL
        "#,
        user.user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("구직 공고 수 조회 실패: {}", e),
            }),
        )
    })?
    .unwrap_or(0);

    // Get matchings count and revenue statistics
    let stats = sqlx::query!(
        r#"
        SELECT
            COUNT(*) as "count!",
            COALESCE(SUM(
                COALESCE(m.employer_fee_amount, 0) + COALESCE(m.employee_fee_amount, 0)
            ), 0) as "total_revenue!",
            COALESCE(SUM(
                CASE
                    WHEN jp.settlement_status = 'unsettled' THEN COALESCE(m.employer_fee_amount, 0)
                    ELSE 0
                END +
                CASE
                    WHEN jsp.settlement_status = 'unsettled' THEN COALESCE(m.employee_fee_amount, 0)
                    ELSE 0
                END
            ), 0) as "pending_amount!"
        FROM matchings m
        INNER JOIN job_postings jp ON m.job_posting_id = jp.id
        INNER JOIN job_seeking_postings jsp ON m.job_seeking_posting_id = jsp.id
        INNER JOIN customers c1 ON jp.customer_id = c1.id
        WHERE c1.user_id = $1
            AND m.deleted_at IS NULL
            AND jp.deleted_at IS NULL
            AND jsp.deleted_at IS NULL
            AND c1.deleted_at IS NULL
        "#,
        user.user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("매칭 통계 조회 실패: {}", e),
            }),
        )
    })?;

    Ok(Json(DashboardStatsResponse {
        total_customers: customer_count,
        job_postings_count,
        job_seekings_count,
        matchings_count: stats.count,
        pending_amount: stats.pending_amount,
        total_revenue: stats.total_revenue,
    }))
}
