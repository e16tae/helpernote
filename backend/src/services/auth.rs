use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Invalid token")]
    InvalidToken,
    #[error("Token expired")]
    TokenExpired,
    #[error("Token creation failed")]
    TokenCreationFailed,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // Subject (user_id)
    pub username: String,
    pub exp: i64, // Expiration time
    pub iat: i64, // Issued at
    pub token_type: TokenType,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TokenType {
    Access,
    Refresh,
}

pub struct AuthService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    access_token_expiration: i64,
    refresh_token_expiration: i64,
}

impl AuthService {
    pub fn new(secret: &str, access_token_expiration: i64) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
            access_token_expiration,
            refresh_token_expiration: 7 * 24 * 3600, // 7 days in seconds
        }
    }

    pub fn generate_access_token(&self, user_id: i64, username: &str) -> Result<String, AuthError> {
        let now = Utc::now();
        let exp = now + Duration::seconds(self.access_token_expiration);

        let claims = Claims {
            sub: user_id.to_string(),
            username: username.to_string(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            token_type: TokenType::Access,
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|_| AuthError::TokenCreationFailed)
    }

    pub fn generate_refresh_token(
        &self,
        user_id: i64,
        username: &str,
    ) -> Result<String, AuthError> {
        let now = Utc::now();
        let exp = now + Duration::seconds(self.refresh_token_expiration);

        let claims = Claims {
            sub: user_id.to_string(),
            username: username.to_string(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            token_type: TokenType::Refresh,
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|_| AuthError::TokenCreationFailed)
    }

    pub fn validate_token(
        &self,
        token: &str,
        expected_type: TokenType,
    ) -> Result<Claims, AuthError> {
        let token_data = decode::<Claims>(token, &self.decoding_key, &Validation::default())
            .map_err(|_| AuthError::InvalidToken)?;

        if token_data.claims.token_type != expected_type {
            return Err(AuthError::InvalidToken);
        }

        let now = Utc::now().timestamp();
        if token_data.claims.exp < now {
            return Err(AuthError::TokenExpired);
        }

        Ok(token_data.claims)
    }
}

pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
    bcrypt::hash(password, bcrypt::DEFAULT_COST)
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, bcrypt::BcryptError> {
    bcrypt::verify(password, hash)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "test_password123";
        let hash = hash_password(password).unwrap();

        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_token_generation_and_validation() {
        let auth_service = AuthService::new("test_secret", 3600);

        let access_token = auth_service.generate_access_token(1, "testuser").unwrap();
        let claims = auth_service
            .validate_token(&access_token, TokenType::Access)
            .unwrap();

        assert_eq!(claims.sub, "1");
        assert_eq!(claims.username, "testuser");
        assert_eq!(claims.token_type, TokenType::Access);
    }

    #[test]
    fn test_token_type_validation() {
        let auth_service = AuthService::new("test_secret", 3600);

        let access_token = auth_service.generate_access_token(1, "testuser").unwrap();
        let result = auth_service.validate_token(&access_token, TokenType::Refresh);

        assert!(result.is_err());
    }
}
