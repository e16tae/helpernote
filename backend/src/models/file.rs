// Allow unused code - these models are used for future features
#![allow(dead_code)]

use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum FileType {
    #[sqlx(rename = "image")]
    Image,
    #[sqlx(rename = "document")]
    Document,
    #[sqlx(rename = "video")]
    Video,
    #[sqlx(rename = "other")]
    Other,
}

impl FileType {
    pub fn from_mime_type(mime: &str) -> Self {
        if mime.starts_with("image/") {
            FileType::Image
        } else if mime.starts_with("video/") {
            FileType::Video
        } else if mime == "application/pdf"
            || mime.starts_with("application/vnd.")
            || mime.starts_with("application/msword")
        {
            FileType::Document
        } else {
            FileType::Other
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CustomerFile {
    pub id: i64,
    pub customer_id: i64,
    pub file_path: String,
    pub file_type: FileType,
    pub file_size: Option<i64>,
    pub thumbnail_path: Option<String>,
    pub original_filename: Option<String>,
    pub mime_type: Option<String>,
    pub is_profile: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserFile {
    pub id: i64,
    pub user_id: i64,
    pub file_path: String,
    pub file_type: FileType,
    pub file_size: Option<i64>,
    pub thumbnail_path: Option<String>,
    pub original_filename: Option<String>,
    pub mime_type: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadFileResponse {
    pub file_id: i64,
    pub file_path: String,
    pub file_url: String,
}
