use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SecurityQuestion {
    pub id: i64,
    pub question_text: String,
}

#[derive(Debug, Serialize)]
pub struct SecurityQuestionsResponse {
    pub questions: Vec<SecurityQuestion>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Get all security questions (public endpoint for registration)
pub async fn list_security_questions(
    State(pool): State<PgPool>,
) -> Result<Json<SecurityQuestionsResponse>, (StatusCode, Json<ErrorResponse>)> {
    let questions = sqlx::query_as::<_, SecurityQuestion>(
        r#"
        SELECT id, question_text
        FROM security_questions
        WHERE deleted_at IS NULL
        ORDER BY id
        "#,
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("보안 질문 조회 실패: {}", e),
            }),
        )
    })?;

    Ok(Json(SecurityQuestionsResponse { questions }))
}
