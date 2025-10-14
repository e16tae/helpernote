use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub security_question_id: i64,
    #[serde(skip_serializing)]
    pub security_answer: String,
    pub phone: Option<String>,
    pub default_employer_fee_rate: rust_decimal::Decimal,
    pub default_employee_fee_rate: rust_decimal::Decimal,
    pub last_login_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}
