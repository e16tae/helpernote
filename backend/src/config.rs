use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration: i64,
    pub port: u16,
    pub minio_endpoint: String,
    pub minio_access_key: String,
    pub minio_secret_key: String,
    pub minio_bucket: String,
    pub cookie_domain: Option<String>,
    pub allowed_origins: Vec<String>,
    pub database_max_connections: u32,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        let allowed_origins = env::var("ALLOWED_ORIGINS")
            .unwrap_or_else(|_| {
                "http://localhost:3000,https://helpernote.my,https://www.helpernote.my,https://api.helpernote.my".to_string()
            })
            .split(',')
            .filter_map(|origin| {
                let trimmed = origin.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_string())
                }
            })
            .collect();

        Ok(Config {
            database_url: env::var("DATABASE_URL")?,
            jwt_secret: env::var("JWT_SECRET")?,
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "3600".to_string())
                .parse()
                .unwrap_or(3600),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .unwrap_or(8000),
            minio_endpoint: env::var("MINIO_ENDPOINT")?,
            minio_access_key: env::var("MINIO_ACCESS_KEY")?,
            minio_secret_key: env::var("MINIO_SECRET_KEY")?,
            minio_bucket: env::var("MINIO_BUCKET").unwrap_or_else(|_| "helpernote".to_string()),
            cookie_domain: env::var("COOKIE_DOMAIN").ok(),
            allowed_origins,
            database_max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                .ok()
                .and_then(|value| value.parse().ok())
                .filter(|value| *value > 0)
                .unwrap_or(5),
        })
    }
}
