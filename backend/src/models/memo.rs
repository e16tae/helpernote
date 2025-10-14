// Allow unused code - these models are used for future features
#![allow(dead_code)]

use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CustomerMemo {
    pub id: i64,
    pub customer_id: i64,
    pub memo_content: String,
    pub created_by: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserMemo {
    pub id: i64,
    pub user_id: i64,
    pub memo_content: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MatchingMemo {
    pub id: i64,
    pub matching_id: i64,
    pub memo_content: String,
    pub created_by: Option<i64>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateCustomerMemoRequest {
    pub customer_id: i64,
    pub memo_content: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateUserMemoRequest {
    pub memo_content: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateMatchingMemoRequest {
    pub matching_id: i64,
    pub memo_content: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateMemoRequest {
    pub memo_content: String,
}
