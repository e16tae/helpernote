use chrono::NaiveDateTime;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "PascalCase")]
pub enum PostingStatus {
    #[sqlx(rename = "published")]
    Published,
    #[sqlx(rename = "in_progress")]
    #[serde(rename = "InProgress")]
    InProgress,
    #[sqlx(rename = "closed")]
    Closed,
    #[sqlx(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "PascalCase")]
pub enum SettlementStatus {
    #[sqlx(rename = "unsettled")]
    Unsettled,
    #[sqlx(rename = "settled")]
    Settled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JobPosting {
    pub id: i64,
    pub customer_id: i64,
    pub salary: Decimal,
    pub description: String,
    pub employer_fee_rate: Option<Decimal>,
    pub settlement_status: SettlementStatus,
    pub settlement_amount: Option<Decimal>,
    pub settlement_memo: Option<String>,
    pub posting_status: PostingStatus,
    pub is_favorite: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateJobPostingRequest {
    pub customer_id: i64,
    pub salary: Decimal,
    pub description: String,
    pub employer_fee_rate: Option<Decimal>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateJobPostingRequest {
    pub salary: Option<Decimal>,
    pub description: Option<String>,
    pub employer_fee_rate: Option<Decimal>,
    pub settlement_status: Option<SettlementStatus>,
    pub settlement_amount: Option<Decimal>,
    pub settlement_memo: Option<String>,
    pub posting_status: Option<PostingStatus>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JobSeekingPosting {
    pub id: i64,
    pub customer_id: i64,
    pub desired_salary: Decimal,
    pub description: String,
    pub preferred_location: String,
    pub employee_fee_rate: Option<Decimal>,
    pub settlement_status: SettlementStatus,
    pub settlement_amount: Option<Decimal>,
    pub settlement_memo: Option<String>,
    pub posting_status: PostingStatus,
    pub is_favorite: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateJobSeekingPostingRequest {
    pub customer_id: i64,
    pub desired_salary: Decimal,
    pub description: String,
    pub preferred_location: String,
    pub employee_fee_rate: Option<Decimal>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateJobSeekingPostingRequest {
    pub desired_salary: Option<Decimal>,
    pub description: Option<String>,
    pub preferred_location: Option<String>,
    pub employee_fee_rate: Option<Decimal>,
    pub settlement_status: Option<SettlementStatus>,
    pub settlement_amount: Option<Decimal>,
    pub settlement_memo: Option<String>,
    pub posting_status: Option<PostingStatus>,
    pub is_favorite: Option<bool>,
}
