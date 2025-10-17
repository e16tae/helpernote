use helpernote_backend::repositories::user::{UserRepository, UserRepositoryError};
use sqlx::PgPool;

#[sqlx::test]
async fn test_create_user_success(pool: PgPool) {
    let repo = UserRepository::new(pool.clone());
    let timestamp = chrono::Utc::now().timestamp();
    let username = format!("testuser_{}", timestamp);

    let user = repo
        .create_user(
            &username,
            "hashed_password",
            1, // security_question_id
            "hashed_answer",
            Some("010-1234-5678"),
        )
        .await
        .unwrap();

    assert_eq!(user.username, username);
    assert!(user.id > 0);
}

#[sqlx::test]
async fn test_create_duplicate_user_fails(pool: PgPool) {
    let repo = UserRepository::new(pool.clone());
    let timestamp = chrono::Utc::now().timestamp();
    let username = format!("testuser_{}", timestamp);

    // Create first user
    repo.create_user(
        &username,
        "hashed_password",
        1,
        "hashed_answer",
        None,
    )
    .await
    .unwrap();

    // Attempt to create duplicate
    let result = repo
        .create_user(
            &username,
            "different_password",
            1,
            "different_answer",
            None,
        )
        .await;

    assert!(matches!(result, Err(UserRepositoryError::UsernameExists)));
}

#[sqlx::test]
async fn test_find_user_by_username(pool: PgPool) {
    let repo = UserRepository::new(pool.clone());
    let timestamp = chrono::Utc::now().timestamp();
    let username = format!("testuser_{}", timestamp);

    // Create user
    repo.create_user(
        &username,
        "hashed_password",
        1,
        "hashed_answer",
        None,
    )
    .await
    .unwrap();

    // Find user
    let found_user = repo.find_by_username(&username).await.unwrap();

    assert_eq!(found_user.username, username);
}

#[sqlx::test]
async fn test_find_nonexistent_user_fails(pool: PgPool) {
    let repo = UserRepository::new(pool.clone());

    let result = repo.find_by_username("nonexistent_user_12345").await;

    assert!(result.is_err());
}

#[sqlx::test]
async fn test_update_last_login(pool: PgPool) {
    let repo = UserRepository::new(pool.clone());
    let timestamp = chrono::Utc::now().timestamp();
    let username = format!("testuser_{}", timestamp);

    // Create user
    let user = repo
        .create_user(
            &username,
            "hashed_password",
            1,
            "hashed_answer",
            None,
        )
        .await
        .unwrap();

    // Update last login
    let result = repo.update_last_login(user.id).await;

    assert!(result.is_ok());

    // Verify last_login_at was updated
    let updated_user = repo.find_by_id(user.id).await.unwrap();
    assert!(updated_user.last_login_at.is_some());
}

#[sqlx::test]
async fn test_verify_security_answer_success(pool: PgPool) {
    let repo = UserRepository::new(pool.clone());
    let timestamp = chrono::Utc::now().timestamp();
    let username = format!("testuser_{}", timestamp);
    let security_answer = "my answer";

    // Hash the security answer
    let hashed_answer = helpernote_backend::services::auth::hash_password(security_answer).unwrap();

    // Create user
    repo.create_user(
        &username,
        "hashed_password",
        1,
        &hashed_answer,
        None,
    )
    .await
    .unwrap();

    // Verify security answer
    let result = repo
        .verify_security_answer(&username, 1, security_answer)
        .await;

    assert!(result.is_ok());
}

#[sqlx::test]
async fn test_verify_wrong_security_answer_fails(pool: PgPool) {
    let repo = UserRepository::new(pool.clone());
    let timestamp = chrono::Utc::now().timestamp();
    let username = format!("testuser_{}", timestamp);
    let security_answer = "my answer";

    let hashed_answer = helpernote_backend::services::auth::hash_password(security_answer).unwrap();

    repo.create_user(
        &username,
        "hashed_password",
        1,
        &hashed_answer,
        None,
    )
    .await
    .unwrap();

    // Try with wrong answer
    let result = repo
        .verify_security_answer(&username, 1, "wrong answer")
        .await;

    assert!(result.is_err());
}
