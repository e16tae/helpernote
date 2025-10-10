# JWT Authentication Setup Guide

## Quick Start

The JWT authentication system has been successfully implemented. Follow these steps to use it:

## 1. Environment Configuration

Ensure your `.env` file has these variables:

```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRATION=3600
DATABASE_URL=postgresql://username:password@localhost:5432/helpernote
```

## 2. Database Setup

The authentication system uses the existing `users` table from your schema. Make sure the database is initialized:

```bash
cd backend
cargo run  # This will run migrations automatically
```

## 3. Files Created/Modified

### New Files:
- ✅ `backend/src/services/auth.rs` - JWT token generation and password hashing
- ✅ `backend/src/repositories/user.rs` - User database operations
- ✅ `backend/src/handlers/auth.rs` - Complete auth endpoints (register, login, refresh, forgot-password)
- ✅ `backend/src/middleware/auth.rs` - JWT authentication middleware
- ✅ `backend/AUTH_IMPLEMENTATION.md` - Detailed documentation
- ✅ `backend/AUTH_SETUP_GUIDE.md` - This file

### Modified Files:
- ✅ `backend/src/services/mod.rs` - Exports auth module
- ✅ `backend/src/repositories/mod.rs` - Exports user module
- ✅ `backend/src/main.rs` - Added forgot-password route
- ✅ `backend/src/models/user.rs` - Updated to use NaiveDateTime

## 4. Available Endpoints

### Public Endpoints (No Auth Required):

1. **Register** - `POST /api/auth/register`
2. **Login** - `POST /api/auth/login`
3. **Refresh Token** - `POST /api/auth/refresh`
4. **Forgot Password** - `POST /api/auth/forgot-password`

### How to Protect Routes:

Add the middleware to any routes that require authentication:

```rust
use axum::middleware;
use crate::middleware::auth::auth_middleware;

// In your Router setup:
Router::new()
    .route("/api/protected", get(handler))
    .layer(middleware::from_fn_with_state(
        db_pool.clone(),
        auth_middleware
    ))
```

## 5. Authentication Flow

### Registration:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepass123",
    "security_question_id": 1,
    "security_answer": "fluffy",
    "phone": "010-1234-5678"
  }'
```

### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepass123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

### Using Protected Routes:
```bash
curl -X GET http://localhost:8000/api/protected \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Access Authenticated User in Handler:
```rust
use crate::middleware::auth::AuthUser;

async fn my_handler(
    user: AuthUser,  // Automatically injected by middleware
) -> impl IntoResponse {
    format!("Hello, {}! Your ID is {}", user.username, user.user_id)
}
```

## 6. Token Expiration

- **Access Token**: Expires based on `JWT_EXPIRATION` env var (default: 3600 seconds = 1 hour)
- **Refresh Token**: Expires in 7 days

When access token expires, use the refresh endpoint to get a new one.

## 7. Password Reset Flow

1. User provides username, security question ID, answer, and new password
2. System verifies security answer
3. Password is updated if verification succeeds

```bash
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "security_question_id": 1,
    "security_answer": "fluffy",
    "new_password": "newsecurepass123"
  }'
```

## 8. Security Features

✅ **Password Hashing**: bcrypt with default cost (12 rounds)
✅ **JWT Validation**: Signature, expiration, and token type verification
✅ **User Verification**: Checks user exists on each request
✅ **Input Validation**: Using validator crate
✅ **Error Handling**: Consistent error responses with proper HTTP status codes

## 9. Important Notes

⚠️ **Database Schema**: The implementation uses `TIMESTAMP` (NaiveDateTime) as per your schema
⚠️ **Compilation**: Some existing repository files have type mismatches (DateTime<Utc> vs NaiveDateTime) that need to be fixed separately
⚠️ **Production**: Consider implementing token revocation/blacklisting for refresh tokens

## 10. Next Steps

1. **Test the endpoints** using the curl commands above
2. **Protect your routes** by adding the auth middleware
3. **Handle errors** appropriately in your frontend
4. **Consider** implementing token refresh logic in your client

For detailed information, see `AUTH_IMPLEMENTATION.md`.
