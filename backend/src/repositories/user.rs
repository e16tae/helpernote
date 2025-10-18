use crate::models::user::User;
use bcrypt::verify;
use chrono::Local;
use rust_decimal::Decimal;
use sqlx::PgPool;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum UserRepositoryError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("User not found")]
    UserNotFound,
    #[error("Username already exists")]
    UsernameExists,
}

pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_user(
        &self,
        username: &str,
        password_hash: &str,
        security_question_id: i64,
        security_answer: &str,
        phone: Option<&str>,
    ) -> Result<User, UserRepositoryError> {
        // Check if username already exists
        let existing: Option<(i64,)> =
            sqlx::query_as("SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL")
                .bind(username)
                .fetch_optional(&self.pool)
                .await?;

        if existing.is_some() {
            return Err(UserRepositoryError::UsernameExists);
        }

        // Default fee rates (stored as whole-number percentages)
        let default_employer_fee = Decimal::from(15);
        let default_employee_fee = Decimal::from(10);

        // Create new user
        let now = Local::now().naive_local();
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (
                username,
                password_hash,
                security_question_id,
                security_answer,
                phone,
                default_employer_fee_rate,
                default_employee_fee_rate,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING
                id,
                username,
                password_hash,
                security_question_id,
                security_answer,
                phone,
                default_employer_fee_rate,
                default_employee_fee_rate,
                last_login_at,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(username)
        .bind(password_hash)
        .bind(security_question_id)
        .bind(security_answer)
        .bind(phone)
        .bind(default_employer_fee)
        .bind(default_employee_fee)
        .bind(now)
        .bind(now)
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_username(&self, username: &str) -> Result<User, UserRepositoryError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT
                id,
                username,
                password_hash,
                security_question_id,
                security_answer,
                phone,
                default_employer_fee_rate,
                default_employee_fee_rate,
                last_login_at,
                created_at,
                updated_at,
                deleted_at
            FROM users
            WHERE username = $1 AND deleted_at IS NULL
            "#,
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(UserRepositoryError::UserNotFound)?;

        Ok(user)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<User, UserRepositoryError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT
                id,
                username,
                password_hash,
                security_question_id,
                security_answer,
                phone,
                default_employer_fee_rate,
                default_employee_fee_rate,
                last_login_at,
                created_at,
                updated_at,
                deleted_at
            FROM users
            WHERE id = $1 AND deleted_at IS NULL
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(UserRepositoryError::UserNotFound)?;

        Ok(user)
    }

    pub async fn update_last_login(&self, user_id: i64) -> Result<(), UserRepositoryError> {
        let now = Local::now().naive_local();
        sqlx::query("UPDATE users SET last_login_at = $1, updated_at = $2 WHERE id = $3")
            .bind(now)
            .bind(now)
            .bind(user_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn update_password(
        &self,
        user_id: i64,
        new_password_hash: &str,
    ) -> Result<(), UserRepositoryError> {
        let now = Local::now().naive_local();
        let result = sqlx::query(
            "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3 AND deleted_at IS NULL",
        )
        .bind(new_password_hash)
        .bind(now)
        .bind(user_id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(UserRepositoryError::UserNotFound);
        }

        Ok(())
    }

    pub async fn verify_security_answer(
        &self,
        username: &str,
        security_question_id: i64,
        security_answer: &str,
    ) -> Result<i64, UserRepositoryError> {
        let user = self.find_by_username(username).await?;

        if user.security_question_id != security_question_id {
            return Err(UserRepositoryError::UserNotFound);
        }

        let normalized = security_answer.trim().to_lowercase();
        let stored_answer = user.security_answer.trim();

        if stored_answer.starts_with("$2") {
            let is_valid = verify(&normalized, stored_answer)
                .map_err(|_| UserRepositoryError::UserNotFound)?;
            if is_valid {
                Ok(user.id)
            } else {
                Err(UserRepositoryError::UserNotFound)
            }
        } else if stored_answer.eq_ignore_ascii_case(security_answer.trim()) {
            Ok(user.id)
        } else {
            Err(UserRepositoryError::UserNotFound)
        }
    }
}
