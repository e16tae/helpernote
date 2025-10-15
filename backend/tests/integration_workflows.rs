use anyhow::Result;
use helpernote_backend::{
    models::matching::{CreateMatchingRequest, MatchingStatus},
    repositories::{matching, user::UserRepository},
    services::auth::{hash_password, AuthService, TokenType},
};
use rust_decimal::Decimal;
use sqlx::{migrate::Migrator, PgPool, Row};

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

async fn setup_pool() -> Option<PgPool> {
    let database_url = match std::env::var("DATABASE_URL") {
        Ok(url) if !url.trim().is_empty() => url,
        _ => return None,
    };

    let pool = match PgPool::connect(&database_url).await {
        Ok(pool) => pool,
        Err(error) => {
            eprintln!("Skipping integration tests: failed to connect to {database_url}: {error}");
            return None;
        }
    };

    if let Err(error) = MIGRATOR.run(&pool).await {
        eprintln!(
            "Skipping integration tests: migration execution failed: {error:?}"
        );
        return None;
    }

    Some(pool)
}

#[tokio::test]
async fn user_repository_round_trip_and_token_validation() -> Result<()> {
    let Some(pool) = setup_pool().await else {
        eprintln!("Skipping user_repository_round_trip_and_token_validation: DATABASE_URL not available");
        return Ok(());
    };

    // Seed prerequisite security question
    let question_id: i64 = sqlx::query(
        r#"
        INSERT INTO security_questions (question_text)
        VALUES ($1)
        RETURNING id
        "#,
    )
    .bind("테스트 보안 질문")
    .fetch_one(&pool)
    .await?
    .get("id");

    let user_repo = UserRepository::new(pool.clone());
    let password_hash = hash_password("Password123!")?;
    let security_answer_hash = hash_password("answer")?;

    let created_user = user_repo
        .create_user(
            "integration_user",
            &password_hash,
            question_id,
            &security_answer_hash,
            Some("010-0000-0000"),
        )
        .await?;

    // Ensure lookup by username succeeds
    let fetched_user = user_repo
        .find_by_username("integration_user")
        .await
        .expect("user should be retrievable by username");
    assert_eq!(created_user.id, fetched_user.id);

    // Validate auth service issues working tokens
    let auth_service = AuthService::new("integration-secret", 3600);
    let access_token = auth_service.generate_access_token(created_user.id, "integration_user")?;
    let refresh_token = auth_service.generate_refresh_token(created_user.id, "integration_user")?;

    let access_claims = auth_service.validate_token(&access_token, TokenType::Access)?;
    assert_eq!(access_claims.sub, created_user.id.to_string());
    let refresh_claims = auth_service.validate_token(&refresh_token, TokenType::Refresh)?;
    assert_eq!(refresh_claims.username, "integration_user");

    // Update last login to confirm repository write succeeds
    user_repo
        .update_last_login(created_user.id)
        .await
        .expect("last_login update should succeed");

    Ok(())
}

#[tokio::test]
async fn matching_repository_calculates_fee_amounts() -> Result<()> {
    let Some(pool) = setup_pool().await else {
        eprintln!("Skipping matching_repository_calculates_fee_amounts: DATABASE_URL not available");
        return Ok(());
    };

    // Seed base data: security question, user, customers, postings
    let question_id: i64 = sqlx::query(
        r#"
        INSERT INTO security_questions (question_text)
        VALUES ($1)
        RETURNING id
        "#,
    )
    .bind("테스트 보안 질문")
    .fetch_one(&pool)
    .await?
    .get("id");

    let user_repo = UserRepository::new(pool.clone());
    let password_hash = hash_password("Password123!")?;
    let security_answer_hash = hash_password("answer")?;
    let user = user_repo
        .create_user(
            "matching_owner",
            &password_hash,
            question_id,
            &security_answer_hash,
            None,
        )
        .await?;

    let employer_customer_id: i64 = sqlx::query(
        r#"
        INSERT INTO customers (user_id, name, phone, customer_type)
        VALUES ($1, $2, $3, 'employer')
        RETURNING id
        "#,
    )
    .bind(user.id)
    .bind("테스트 구인자")
    .bind("010-1111-2222")
    .fetch_one(&pool)
    .await?
    .get("id");

    let employee_customer_id: i64 = sqlx::query(
        r#"
        INSERT INTO customers (user_id, name, phone, customer_type)
        VALUES ($1, $2, $3, 'employee')
        RETURNING id
        "#,
    )
    .bind(user.id)
    .bind("테스트 구직자")
    .bind("010-3333-4444")
    .fetch_one(&pool)
    .await?
    .get("id");

    let job_posting_id: i64 = sqlx::query(
        r#"
        INSERT INTO job_postings (customer_id, salary, description, employer_fee_rate)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
    )
    .bind(employer_customer_id)
    .bind(Decimal::new(5_000_000, 0))
    .bind("테스트 구인 포지션")
    .bind(Decimal::new(1000, 2)) // 10%
    .fetch_one(&pool)
    .await?
    .get("id");

    let job_seeking_posting_id: i64 = sqlx::query(
        r#"
        INSERT INTO job_seeking_postings (customer_id, desired_salary, description, preferred_location, employee_fee_rate)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
    )
    .bind(employee_customer_id)
    .bind(Decimal::new(4_500_000, 0))
    .bind("테스트 구직 설명")
    .bind("서울")
    .bind(Decimal::new(500, 2)) // 5%
    .fetch_one(&pool)
    .await?
    .get("id");

    let request = CreateMatchingRequest {
        job_posting_id,
        job_seeking_posting_id,
        agreed_salary: Decimal::new(4_800_000, 0),
        employer_fee_rate: Decimal::new(1200, 2), // 12%
        employee_fee_rate: Decimal::new(600, 2),  // 6%
    };

    let matching = matching::create_matching(&pool, request).await?;
    let hundred = Decimal::new(100, 0);
    let expected_employer_fee = (matching.agreed_salary * matching.employer_fee_rate) / hundred;
    let expected_employee_fee = (matching.agreed_salary * matching.employee_fee_rate) / hundred;

    assert_eq!(matching.matching_status, MatchingStatus::InProgress);
    assert_eq!(matching.employer_fee_amount.unwrap(), expected_employer_fee);
    assert_eq!(matching.employee_fee_amount.unwrap(), expected_employee_fee);

    Ok(())
}
