use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "PascalCase")]
pub enum CustomerType {
    #[sqlx(rename = "employer")]
    Employer,
    #[sqlx(rename = "employee")]
    Employee,
    #[sqlx(rename = "both")]
    Both,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub birth_date: Option<NaiveDate>,
    pub phone: String,
    pub address: Option<String>,
    pub profile_photo_id: Option<i64>,
    pub customer_type: CustomerType,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateCustomerRequest {
    pub name: String,
    pub birth_date: Option<NaiveDate>,
    pub phone: String,
    pub address: Option<String>,
    pub customer_type: CustomerType,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateCustomerRequest {
    pub name: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub profile_photo_id: Option<i64>,
    pub customer_type: Option<CustomerType>,
}
