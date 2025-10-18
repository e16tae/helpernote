use axum::http::StatusCode;
use axum::Json;
use sqlx::Error;

use super::tag::ErrorResponse;

pub fn map_sqlx_error(e: Error, context: &str) -> (StatusCode, Json<ErrorResponse>) {
    if let Error::Database(db_err) = &e {
        if db_err.code().as_deref() == Some("23505") {
            return (
                StatusCode::CONFLICT,
                Json(ErrorResponse {
                    error: format!("{}: 이미 존재하는 데이터입니다", context),
                }),
            );
        }
    }

    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ErrorResponse {
            error: format!("{}: {}", context, e),
        }),
    )
}
