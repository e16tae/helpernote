use crate::models::customer::{CreateCustomerRequest, Customer, CustomerType, UpdateCustomerRequest};
use sqlx::PgPool;

/// Create a new customer
pub async fn create_customer(
    pool: &PgPool,
    user_id: i64,
    req: CreateCustomerRequest,
) -> Result<Customer, sqlx::Error> {
    let customer = sqlx::query_as!(
        Customer,
        r#"
        INSERT INTO customers (user_id, name, birth_date, phone, address, customer_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id, user_id, name, birth_date, phone, address, profile_photo_id,
            customer_type as "customer_type: CustomerType",
            created_at as "created_at!",
            updated_at as "updated_at!",
            deleted_at
        "#,
        user_id,
        req.name,
        req.birth_date,
        req.phone,
        req.address,
        req.customer_type as CustomerType
    )
    .fetch_one(pool)
    .await?;

    Ok(customer)
}

/// Get customer by ID
pub async fn get_customer_by_id(
    pool: &PgPool,
    customer_id: i64,
    user_id: i64,
) -> Result<Customer, sqlx::Error> {
    let customer = sqlx::query_as!(
        Customer,
        r#"
        SELECT
            id, user_id, name, birth_date, phone, address, profile_photo_id,
            customer_type as "customer_type: CustomerType",
            created_at as "created_at!",
            updated_at as "updated_at!",
            deleted_at
        FROM customers
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
        customer_id,
        user_id
    )
    .fetch_one(pool)
    .await?;

    Ok(customer)
}

/// List customers by user with optional filtering
pub async fn list_customers_by_user(
    pool: &PgPool,
    user_id: i64,
    customer_type: Option<CustomerType>,
    tag_ids: Option<Vec<i64>>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Customer>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    // If tag_ids filter is provided, use JOIN with customer_tags
    if let Some(ref tags) = tag_ids {
        if !tags.is_empty() {
            let customers = match customer_type {
                Some(ct) => {
                    sqlx::query_as!(
                        Customer,
                        r#"
                        SELECT DISTINCT
                            c.id, c.user_id, c.name, c.birth_date, c.phone, c.address, c.profile_photo_id,
                            c.customer_type as "customer_type: CustomerType",
                            c.created_at as "created_at!",
                            c.updated_at as "updated_at!",
                            c.deleted_at
                        FROM customers c
                        INNER JOIN customer_tags ct ON c.id = ct.customer_id
                        WHERE c.user_id = $1 AND c.customer_type = $2 AND c.deleted_at IS NULL
                            AND ct.tag_id = ANY($3)
                        ORDER BY c.created_at DESC
                        LIMIT $4 OFFSET $5
                        "#,
                        user_id,
                        ct as CustomerType,
                        &tags[..],
                        limit,
                        offset
                    )
                    .fetch_all(pool)
                    .await?
                }
                None => {
                    sqlx::query_as!(
                        Customer,
                        r#"
                        SELECT DISTINCT
                            c.id, c.user_id, c.name, c.birth_date, c.phone, c.address, c.profile_photo_id,
                            c.customer_type as "customer_type: CustomerType",
                            c.created_at as "created_at!",
                            c.updated_at as "updated_at!",
                            c.deleted_at
                        FROM customers c
                        INNER JOIN customer_tags ct ON c.id = ct.customer_id
                        WHERE c.user_id = $1 AND c.deleted_at IS NULL
                            AND ct.tag_id = ANY($2)
                        ORDER BY c.created_at DESC
                        LIMIT $3 OFFSET $4
                        "#,
                        user_id,
                        &tags[..],
                        limit,
                        offset
                    )
                    .fetch_all(pool)
                    .await?
                }
            };
            return Ok(customers);
        }
    }

    // No tag filter, use original logic
    let customers = match customer_type {
        Some(ct) => {
            sqlx::query_as!(
                Customer,
                r#"
                SELECT
                    id, user_id, name, birth_date, phone, address, profile_photo_id,
                    customer_type as "customer_type: CustomerType",
                    created_at as "created_at!",
                    updated_at as "updated_at!",
                    deleted_at
                FROM customers
                WHERE user_id = $1 AND customer_type = $2 AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
                "#,
                user_id,
                ct as CustomerType,
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        }
        None => {
            sqlx::query_as!(
                Customer,
                r#"
                SELECT
                    id, user_id, name, birth_date, phone, address, profile_photo_id,
                    customer_type as "customer_type: CustomerType",
                    created_at as "created_at!",
                    updated_at as "updated_at!",
                    deleted_at
                FROM customers
                WHERE user_id = $1 AND deleted_at IS NULL
                ORDER BY created_at DESC
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

    Ok(customers)
}

/// Update customer
pub async fn update_customer(
    pool: &PgPool,
    customer_id: i64,
    user_id: i64,
    req: UpdateCustomerRequest,
) -> Result<Customer, sqlx::Error> {
    // First, get the current customer to use existing values for None fields
    let current = get_customer_by_id(pool, customer_id, user_id).await?;

    let customer = sqlx::query_as!(
        Customer,
        r#"
        UPDATE customers
        SET
            name = $1,
            birth_date = $2,
            phone = $3,
            address = $4,
            profile_photo_id = $5,
            customer_type = $6
        WHERE id = $7 AND user_id = $8 AND deleted_at IS NULL
        RETURNING
            id, user_id, name, birth_date, phone, address, profile_photo_id,
            customer_type as "customer_type: CustomerType",
            created_at as "created_at!",
            updated_at as "updated_at!",
            deleted_at
        "#,
        req.name.unwrap_or(current.name),
        req.birth_date.or(current.birth_date),
        req.phone.unwrap_or(current.phone),
        req.address.or(current.address),
        req.profile_photo_id.or(current.profile_photo_id),
        req.customer_type.unwrap_or(current.customer_type) as CustomerType,
        customer_id,
        user_id
    )
    .fetch_one(pool)
    .await?;

    Ok(customer)
}

/// Soft delete customer
pub async fn soft_delete_customer(
    pool: &PgPool,
    customer_id: i64,
    user_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE customers
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        "#,
        customer_id,
        user_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Search customers by name or phone
pub async fn search_customers(
    pool: &PgPool,
    user_id: i64,
    search_term: &str,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Customer>, sqlx::Error> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);
    let search_pattern = format!("%{}%", search_term);

    let customers = sqlx::query_as!(
        Customer,
        r#"
        SELECT
            id, user_id, name, birth_date, phone, address, profile_photo_id,
            customer_type as "customer_type: CustomerType",
            created_at as "created_at!",
            updated_at as "updated_at!",
            deleted_at
        FROM customers
        WHERE user_id = $1
            AND (name ILIKE $2 OR phone ILIKE $2)
            AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#,
        user_id,
        search_pattern,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;

    Ok(customers)
}
