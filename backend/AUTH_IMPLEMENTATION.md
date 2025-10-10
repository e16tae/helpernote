# JWT Authentication Implementation

This document describes the complete JWT authentication system implemented for the Helpernote backend.

## Overview

The authentication system provides:
- User registration with bcrypt password hashing
- Login with JWT access and refresh tokens
- Token refresh mechanism
- Password reset via security questions
- JWT middleware for protecting routes

## File Structure

```
backend/src/
├── services/
│   ├── mod.rs              # Exports auth module
│   └── auth.rs             # JWT token generation and validation
├── repositories/
│   ├── mod.rs              # Exports user module
│   └── user.rs             # User database operations
├── handlers/
│   └── auth.rs             # Authentication endpoints
├── middleware/
│   └── auth.rs             # JWT authentication middleware
└── models/
    └── user.rs             # User model
```

## Implemented Features

### 1. JWT Service (`backend/src/services/auth.rs`)

**Functions:**
- `AuthService::new(secret, expiration)` - Create auth service instance
- `generate_access_token(user_id, username)` - Generate access token
- `generate_refresh_token(user_id, username)` - Generate refresh token (7 days)
- `validate_token(token, token_type)` - Validate and decode token
- `hash_password(password)` - Hash password using bcrypt
- `verify_password(password, hash)` - Verify password against hash

**Token Types:**
- Access Token: Expires based on JWT_EXPIRATION config
- Refresh Token: Expires in 7 days

### 2. User Repository (`backend/src/repositories/user.rs`)

**Methods:**
- `create_user()` - Create new user with password hash
- `find_by_username()` - Find user by username
- `find_by_id()` - Find user by ID
- `update_last_login()` - Update last login timestamp
- `update_password()` - Update user password
- `verify_security_answer()` - Verify security question answer

### 3. Authentication Handlers (`backend/src/handlers/auth.rs`)

**Endpoints:**

#### POST `/api/auth/register`
Register a new user.

**Request:**
```json
{
  "username": "john_doe",
  "password": "password123",
  "security_question_id": 1,
  "security_answer": "fluffy",
  "phone": "010-1234-5678"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and receive tokens.

**Request:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

#### POST `/api/auth/refresh`
Get new access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

#### POST `/api/auth/forgot-password`
Reset password using security question.

**Request:**
```json
{
  "username": "john_doe",
  "security_question_id": 1,
  "security_answer": "fluffy",
  "new_password": "newpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password successfully reset"
}
```

### 4. JWT Middleware (`backend/src/middleware/auth.rs`)

The middleware extracts and validates JWT tokens from the Authorization header.

**Usage in routes:**

```rust
use axum::{
    routing::get,
    Router,
    middleware,
};
use crate::middleware::auth::auth_middleware;

// Apply middleware to protected routes
let protected_routes = Router::new()
    .route("/api/users/me", get(get_current_user))
    .route("/api/customers", get(list_customers))
    .layer(middleware::from_fn_with_state(db_pool.clone(), auth_middleware))
    .with_state(db_pool.clone());
```

**Accessing authenticated user in handlers:**

```rust
use crate::middleware::auth::AuthUser;

async fn get_current_user(
    user: AuthUser,  // Automatically extracted from JWT
) -> Json<UserResponse> {
    Json(UserResponse {
        id: user.user_id,
        username: user.username,
    })
}
```

## Configuration

The system uses the following environment variables (from `.env`):

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600  # Access token expiration in seconds (1 hour)
DATABASE_URL=postgresql://user:password@localhost/helpernote
```

## Security Features

1. **Password Hashing**: Uses bcrypt with default cost (12 rounds)
2. **Token Validation**: Verifies token signature, expiration, and type
3. **User Verification**: Checks if user exists on token validation
4. **Security Questions**: Case-insensitive security answer comparison
5. **Soft Deletes**: Respects deleted_at column in queries

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
- 400 Bad Request - Validation errors
- 401 Unauthorized - Invalid credentials or token
- 409 Conflict - Username already exists
- 500 Internal Server Error - Server errors

## Example: Protecting Routes

```rust
// In main.rs
use axum::{
    routing::{get, post},
    Router,
    middleware,
};

let app = Router::new()
    // Public routes
    .route("/api/auth/register", post(handlers::auth::register))
    .route("/api/auth/login", post(handlers::auth::login))
    .route("/api/auth/refresh", post(handlers::auth::refresh_token))
    .route("/api/auth/forgot-password", post(handlers::auth::forgot_password))

    // Protected routes (require authentication)
    .route("/api/users/me", get(handlers::users::get_current_user))
    .route("/api/customers", get(handlers::customers::list))
    .route("/api/customers", post(handlers::customers::create))
    .layer(middleware::from_fn_with_state(
        db_pool.clone(),
        middleware::auth::auth_middleware
    ))

    .with_state(db_pool);
```

## Testing

### Register a new user
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "security_question_id": 1,
    "security_answer": "answer",
    "phone": "010-1234-5678"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Access protected route
```bash
curl -X GET http://localhost:8000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh token
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## Notes

1. **Database Schema**: The implementation uses `TIMESTAMP` (NaiveDateTime in Rust) instead of `TIMESTAMP WITH TIME ZONE`
2. **Refresh Token Storage**: Refresh tokens are currently stateless. For production, consider storing them in the database for revocation
3. **Token Expiration**: Access tokens expire based on JWT_EXPIRATION config, refresh tokens expire in 7 days
4. **Password Requirements**: Minimum 8 characters (enforced by validation)
5. **Username Requirements**: 3-50 characters (enforced by validation)

## Production Recommendations

1. Use a strong JWT_SECRET (at least 32 random characters)
2. Consider implementing token revocation/blacklisting
3. Add rate limiting to authentication endpoints
4. Implement HTTPS in production
5. Consider adding 2FA for enhanced security
6. Store refresh tokens in database for better control
7. Implement token rotation on refresh
8. Add audit logging for authentication events
