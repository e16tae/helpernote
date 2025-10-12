use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

/// Standard error response format
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: ErrorDetail,
}

#[derive(Debug, Serialize)]
pub struct ErrorDetail {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl ErrorResponse {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            error: ErrorDetail {
                code: code.into(),
                message: message.into(),
                details: None,
            },
        }
    }

    pub fn with_details(
        code: impl Into<String>,
        message: impl Into<String>,
        details: serde_json::Value,
    ) -> Self {
        Self {
            error: ErrorDetail {
                code: code.into(),
                message: message.into(),
                details: Some(details),
            },
        }
    }
}

/// Application error types
#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    NotFound(String),
    Conflict(String),
    UnprocessableEntity(String),
    InternalServerError(String),
    DatabaseError(sqlx::Error),
    ValidationError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_response) = match self {
            AppError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                ErrorResponse::new("BAD_REQUEST", msg),
            ),
            AppError::Unauthorized(msg) => (
                StatusCode::UNAUTHORIZED,
                ErrorResponse::new("UNAUTHORIZED", msg),
            ),
            AppError::Forbidden(msg) => {
                (StatusCode::FORBIDDEN, ErrorResponse::new("FORBIDDEN", msg))
            }
            AppError::NotFound(msg) => {
                (StatusCode::NOT_FOUND, ErrorResponse::new("NOT_FOUND", msg))
            }
            AppError::Conflict(msg) => (StatusCode::CONFLICT, ErrorResponse::new("CONFLICT", msg)),
            AppError::UnprocessableEntity(msg) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                ErrorResponse::new("UNPROCESSABLE_ENTITY", msg),
            ),
            AppError::InternalServerError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorResponse::new("INTERNAL_SERVER_ERROR", msg),
            ),
            AppError::DatabaseError(err) => {
                tracing::error!("Database error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    ErrorResponse::new(
                        "DATABASE_ERROR",
                        "A database error occurred. Please try again later.",
                    ),
                )
            }
            AppError::ValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                ErrorResponse::new("VALIDATION_ERROR", msg),
            ),
        };

        (status, Json(error_response)).into_response()
    }
}

// Convert sqlx::Error to AppError
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err)
    }
}

// Convert anyhow::Error to AppError
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalServerError(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_response_creation() {
        let error = ErrorResponse::new("TEST_ERROR", "Test error message");

        assert_eq!(error.error.code, "TEST_ERROR");
        assert_eq!(error.error.message, "Test error message");
        assert!(error.error.details.is_none());
    }

    #[test]
    fn test_error_response_with_details() {
        let details = serde_json::json!({
            "field": "email",
            "reason": "invalid format"
        });

        let error =
            ErrorResponse::with_details("VALIDATION_ERROR", "Invalid input", details.clone());

        assert_eq!(error.error.code, "VALIDATION_ERROR");
        assert_eq!(error.error.message, "Invalid input");
        assert_eq!(error.error.details, Some(details));
    }

    #[test]
    fn test_app_error_bad_request() {
        let error = AppError::BadRequest("Invalid request".to_string());
        let response = error.into_response();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn test_app_error_unauthorized() {
        let error = AppError::Unauthorized("Not authenticated".to_string());
        let response = error.into_response();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn test_app_error_not_found() {
        let error = AppError::NotFound("Resource not found".to_string());
        let response = error.into_response();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn test_error_response_serialization() {
        let error = ErrorResponse::new("TEST", "Test message");
        let json = serde_json::to_string(&error).unwrap();

        assert!(json.contains("TEST"));
        assert!(json.contains("Test message"));
    }
}
