#[cfg(test)]
mod auth_middleware_tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use axum_test::TestServer;
    use helpernote_backend::{middleware, services::auth::AuthService, AppState};
    use sqlx::PgPool;

    #[sqlx::test]
    async fn test_auth_middleware_rejects_missing_token(pool: PgPool) {
        let config = helpernote_backend::config::Config::from_env().unwrap();
        let app_state = AppState {
            pool: pool.clone(),
            config: config.clone(),
        };

        let app = Router::new()
            .route(
                "/protected",
                axum::routing::get(|| async { "Protected content" }),
            )
            .layer(axum::middleware::from_fn_with_state(
                app_state.clone(),
                middleware::auth::auth_middleware,
            ))
            .with_state(app_state);

        let server = TestServer::new(app).unwrap();

        let response = server.get("/protected").await;

        assert_eq!(response.status_code(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test]
    async fn test_auth_middleware_rejects_invalid_token(pool: PgPool) {
        let config = helpernote_backend::config::Config::from_env().unwrap();
        let app_state = AppState {
            pool: pool.clone(),
            config: config.clone(),
        };

        let app = Router::new()
            .route(
                "/protected",
                axum::routing::get(|| async { "Protected content" }),
            )
            .layer(axum::middleware::from_fn_with_state(
                app_state.clone(),
                middleware::auth::auth_middleware,
            ))
            .with_state(app_state);

        let server = TestServer::new(app).unwrap();

        let response = server
            .get("/protected")
            .add_header("Cookie".parse().unwrap(), "token=invalid_token".parse().unwrap())
            .await;

        assert_eq!(response.status_code(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test]
    async fn test_auth_middleware_accepts_valid_token(pool: PgPool) {
        let config = helpernote_backend::config::Config::from_env().unwrap();

        // Generate valid token
        let auth_service = AuthService::new(&config.jwt_secret, config.jwt_expiration);
        let token = auth_service.generate_access_token(1, "testuser").unwrap();

        let app_state = AppState {
            pool: pool.clone(),
            config: config.clone(),
        };

        let app = Router::new()
            .route(
                "/protected",
                axum::routing::get(|| async { "Protected content" }),
            )
            .layer(axum::middleware::from_fn_with_state(
                app_state.clone(),
                middleware::auth::auth_middleware,
            ))
            .with_state(app_state);

        let server = TestServer::new(app).unwrap();

        let response = server
            .get("/protected")
            .add_header("Cookie".parse().unwrap(), format!("token={}", token).parse().unwrap())
            .await;

        assert_eq!(response.status_code(), StatusCode::OK);
    }
}

#[cfg(test)]
mod rate_limit_tests {
    use axum::{http::StatusCode, Router};
    use axum_test::TestServer;

    #[tokio::test]
    async fn test_rate_limit_allows_normal_requests() {
        let app = Router::new()
            .route("/test", axum::routing::get(|| async { "OK" }))
            .layer(axum::middleware::from_fn(
                helpernote_backend::middleware::rate_limit::rate_limit_middleware,
            ));

        let server = TestServer::new(app).unwrap();

        // Make a few requests - should all succeed
        for _ in 0..5 {
            let response = server.get("/test").await;
            assert_eq!(response.status_code(), StatusCode::OK);
        }
    }
}
