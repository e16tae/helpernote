use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Tag {
    pub id: i64,
    pub user_id: i64,
    pub tag_name: String,
    pub tag_color: String,
    pub description: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateTagRequest {
    pub tag_name: String,
    pub tag_color: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTagRequest {
    pub tag_name: Option<String>,
    pub tag_color: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CustomerTag {
    pub id: i64,
    pub customer_id: i64,
    pub tag_id: i64,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JobPostingTag {
    pub id: i64,
    pub job_posting_id: i64,
    pub tag_id: i64,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct JobSeekingPostingTag {
    pub id: i64,
    pub job_seeking_posting_id: i64,
    pub tag_id: i64,
    pub created_at: NaiveDateTime,
}
