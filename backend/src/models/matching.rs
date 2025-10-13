use chrono::NaiveDateTime;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "PascalCase")]
pub enum MatchingStatus {
    #[sqlx(rename = "in_progress")]
    #[serde(rename = "InProgress")]
    InProgress,
    #[sqlx(rename = "completed")]
    Completed,
    #[sqlx(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Matching {
    pub id: i64,
    pub job_posting_id: i64,
    pub job_seeking_posting_id: i64,
    pub matched_at: NaiveDateTime,
    pub agreed_salary: Decimal,
    pub employer_fee_rate: Decimal,
    pub employee_fee_rate: Decimal,
    pub employer_fee_amount: Option<Decimal>,
    pub employee_fee_amount: Option<Decimal>,
    pub matching_status: MatchingStatus,
    pub cancellation_reason: Option<String>,
    pub cancelled_at: Option<NaiveDateTime>,
    pub cancelled_by: Option<i64>,
    pub completed_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateMatchingRequest {
    pub job_posting_id: i64,
    pub job_seeking_posting_id: i64,
    pub agreed_salary: Decimal,
    pub employer_fee_rate: Decimal,
    pub employee_fee_rate: Decimal,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateMatchingRequest {
    pub agreed_salary: Option<Decimal>,
    pub employer_fee_rate: Option<Decimal>,
    pub employee_fee_rate: Option<Decimal>,
    pub matching_status: Option<MatchingStatus>,
    pub cancellation_reason: Option<String>,
}
