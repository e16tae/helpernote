use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::middleware::auth::AuthUser;
use crate::models::customer::{
    CreateCustomerRequest, Customer, CustomerType, UpdateCustomerRequest,
};
use crate::repositories::customer;

#[derive(Debug, Deserialize)]
pub struct ListCustomersQuery {
    pub customer_type: Option<CustomerType>,
    pub tag_ids: Option<String>, // comma-separated tag IDs: "1,2,3"
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct SearchCustomersQuery {
    pub q: String,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct CustomerResponse {
    pub customer: Customer,
}

#[derive(Debug, Serialize)]
pub struct CustomersListResponse {
    pub customers: Vec<Customer>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Create a new customer
pub async fn create_customer(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateCustomerRequest>,
) -> Result<(StatusCode, Json<CustomerResponse>), (StatusCode, Json<ErrorResponse>)> {
    let customer = customer::create_customer(&pool, user.user_id, payload)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("고객 생성 실패: {}", e),
                }),
            )
        })?;

    Ok((StatusCode::CREATED, Json(CustomerResponse { customer })))
}

/// List customers with optional filters
pub async fn list_customers(
    user: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<ListCustomersQuery>,
) -> Result<Json<CustomersListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Parse tag_ids if provided
    let tag_ids: Option<Vec<i64>> = params.tag_ids.as_ref().and_then(|ids_str| {
        let ids: Result<Vec<i64>, _> = ids_str
            .split(',')
            .filter(|s| !s.trim().is_empty())
            .map(|s| s.trim().parse())
            .collect();
        ids.ok()
    });

    let customers = customer::list_customers_by_user(
        &pool,
        user.user_id,
        params.customer_type,
        tag_ids,
        params.limit,
        params.offset,
    )
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("고객 목록 조회 실패: {}", e),
            }),
        )
    })?;

    let total = customers.len();

    Ok(Json(CustomersListResponse { customers, total }))
}

/// Get customer by ID
pub async fn get_customer(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
) -> Result<Json<CustomerResponse>, (StatusCode, Json<ErrorResponse>)> {
    let customer = customer::get_customer_by_id(&pool, customer_id, user.user_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "고객을 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("고객 조회 실패: {}", e),
                }),
            ),
        })?;

    Ok(Json(CustomerResponse { customer }))
}

/// Update customer
pub async fn update_customer(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
    Json(payload): Json<UpdateCustomerRequest>,
) -> Result<Json<CustomerResponse>, (StatusCode, Json<ErrorResponse>)> {
    let customer = customer::update_customer(&pool, customer_id, user.user_id, payload)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "고객을 찾을 수 없습니다".to_string(),
                }),
            ),
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("고객 수정 실패: {}", e),
                }),
            ),
        })?;

    Ok(Json(CustomerResponse { customer }))
}

/// Delete customer (soft delete)
pub async fn delete_customer(
    user: AuthUser,
    State(pool): State<PgPool>,
    Path(customer_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    customer::soft_delete_customer(&pool, customer_id, user.user_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("고객 삭제 실패: {}", e),
                }),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

/// Search customers by name or phone
pub async fn search_customers(
    user: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<SearchCustomersQuery>,
) -> Result<Json<CustomersListResponse>, (StatusCode, Json<ErrorResponse>)> {
    if params.q.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "검색어를 입력해주세요".to_string(),
            }),
        ));
    }

    let customers =
        customer::search_customers(&pool, user.user_id, &params.q, params.limit, params.offset)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: format!("고객 검색 실패: {}", e),
                    }),
                )
            })?;

    let total = customers.len();

    Ok(Json(CustomersListResponse { customers, total }))
}
