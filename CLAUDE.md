# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Helpernote** is a job matching intermediary service for employment agencies. It enables brokers to manage employers (구인자) and job seekers (구직자), handle job postings, perform matching, and manage commission settlements.

The service emphasizes advanced memo functionality to enhance workflow efficiency for intermediaries.

## Architecture

### Technology Stack

- **Backend**: Rust + Axum + SQLx
- **Frontend**: Next.js 15 + shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL
- **Object Storage**: MinIO
- **Authentication**: JWT (not session-based)
- **Development**: Docker Compose

### Project Structure

```
helpernote/
├── backend/           # Rust/Axum API server
│   ├── src/
│   │   ├── handlers/  # HTTP request handlers
│   │   ├── middleware/# JWT auth & other middleware
│   │   ├── models/    # Database models
│   │   ├── repositories/ # Data access layer
│   │   ├── services/  # Business logic
│   │   ├── config.rs  # Configuration management
│   │   └── main.rs    # Application entry point
│   ├── migrations/    # SQLx database migrations
│   └── Cargo.toml     # Rust dependencies
│
├── frontend/          # Next.js 15 application
│   ├── src/
│   │   ├── app/       # Next.js app directory (routes)
│   │   ├── components/# React components
│   │   ├── lib/       # Utilities (cn, etc.)
│   │   └── types/     # TypeScript types
│   └── package.json
│
├── database/          # Database schemas
│   └── schema.sql     # PostgreSQL schema with sample data
│
├── .docker/           # Docker volumes (gitignored)
│   ├── postgres-data/
│   └── minio-data/
│
├── docker-compose.yml      # Production compose config
├── docker-compose.dev.yml  # Dev compose (DB + MinIO only)
└── Makefile           # Development commands
```

### Backend Architecture (Rust/Axum)

The backend follows a layered architecture:

1. **Handlers** (`src/handlers/`): HTTP request/response handling
2. **Services** (`src/services/`): Business logic and orchestration
3. **Repositories** (`src/repositories/`): Database queries using SQLx
4. **Models** (`src/models/`): Database entity structs
5. **Middleware** (`src/middleware/`): JWT authentication and request processing

**Key Implementation Details**:
- Uses SQLx for compile-time checked SQL queries
- JWT tokens for stateless authentication
- Database connection pool managed by SQLx
- MinIO client (rust-s3) for file storage
- Migrations automatically run on startup via `sqlx::migrate!()`

### Frontend Architecture (Next.js 15)

The frontend uses Next.js 15 App Router with:

- **shadcn/ui**: Pre-built accessible components
- **Tailwind CSS**: Utility-first styling with custom OKLCH color system
- **React Hook Form + Zod**: Form handling and validation
- **Axios**: HTTP client for API communication

**Theme Configuration**: The project uses a custom OKLCH-based color system defined in `frontend/src/app/globals.css` with both light and dark mode support.

### Database Schema

The PostgreSQL schema (`database/schema.sql`) includes:

**Core Entities**:
- `users` - Intermediaries/brokers who use the system
- `customers` - Employers and job seekers managed by intermediaries
- `job_postings` - Job offers from employers
- `job_seeking_postings` - Job applications from job seekers
- `matchings` - Connections between employers and job seekers

**Supporting Features**:
- Memo tables for each entity (user_memos, customer_memos, matching_memos)
- File management (user_files, customer_files) linked to MinIO
- Tag system for categorization (tags, customer_tags, job_posting_tags, etc.)
- Security questions for password recovery
- Soft deletes via `deleted_at` timestamp on all tables
- Automatic `updated_at` triggers on all tables

**Fee Structure**:
- Users have default commission rates (`default_employer_fee_rate`, `default_employee_fee_rate`)
- Individual postings can override these rates
- Matchings record final agreed rates and calculate commission amounts
- Settlement tracking via `settlement_status` and `settlement_amount` fields

## Development Workflow

### Starting Development Environment

**Option 1: Full Docker** (all services containerized)
```bash
make build    # Build images
make up       # Start all services
make logs     # View logs
```

**Option 2: Local Development** (recommended for active development)
```bash
# Terminal 1: Start infrastructure (PostgreSQL + MinIO)
make dev-up

# Terminal 2: Run backend locally
make backend-dev
# or: cd backend && cargo run

# Terminal 3: Run frontend locally
cd frontend
npm install
npm run dev
```

### Common Commands

```bash
# Development environment (DB + MinIO only)
make dev          # Start in foreground
make dev-up       # Start in background
make dev-down     # Stop services

# Backend
make backend-dev    # Run with cargo run
make backend-build  # Build release binary
make backend-test   # Run tests

# Frontend
make frontend-dev   # Run dev server
make frontend-build # Production build
make frontend-lint  # Run linter

# Full stack (Docker)
make build        # Build all images
make up           # Start all services
make down         # Stop all services
make logs         # View logs
make clean        # Remove all data and builds
```

### Testing

For local development with Chrome DevTools testing:

1. Start infrastructure: `make dev-up`
2. Run backend: `make backend-dev`
3. Run frontend: `make frontend-dev`
4. Open Chrome DevTools and navigate to http://localhost:3000

### Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRATION` - Token expiration in seconds
- `PORT` - Backend server port (default: 8000)
- `MINIO_ENDPOINT` - MinIO server URL
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` - MinIO credentials
- `MINIO_BUCKET` - Default bucket name

**Frontend** (`frontend/.env`):
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

### Database Migrations

SQLx migrations are stored in `backend/migrations/`:

```bash
# Create new migration
cd backend
sqlx migrate add <migration_name>

# Run migrations (automatic on app startup)
# Manual: sqlx migrate run
```

## Key Features and Business Logic

### Menu Structure

1. **Dashboard** - Overview of all activities
2. **Customer Management** - Manage employers and job seekers
3. **Job Postings Management** - Employer job offers
4. **Job Seeking Management** - Job seeker applications
5. **Matching Management** - Match employers with job seekers
6. **Settlement Management** - Commission tracking and payment
7. **Account Settings** - User preferences and default rates

### Memo System

Every major entity supports rich memo functionality:
- User memos for personal notes
- Customer memos for client information
- Matching memos for process tracking
- All memos support soft delete and timestamp tracking

### Commission/Fee System

- Users set default commission rates for employers and employees
- Individual postings can override default rates (NULL = use default)
- Matchings record agreed rates and auto-calculate commission amounts
- Settlement status tracked separately for employers and employees
- Settlement memos for payment tracking

### Tag System

- User-specific tags with custom colors
- Applicable to customers, job postings, and job seeking postings
- Many-to-many relationships via junction tables

### File Management

- Files stored in MinIO object storage
- Metadata stored in PostgreSQL (file_path, file_type, file_size, mime_type)
- Support for images, documents, videos
- Customer profile photos specially tracked via `is_profile` flag

## Code Conventions

### Backend (Rust)

- Use `sqlx::query_as!` macro for type-safe queries
- All database models implement `sqlx::FromRow`
- Error handling via `anyhow` and `thiserror`
- Logging with `tracing` crate
- Password hashing with `bcrypt`
- JWT tokens via `jsonwebtoken` crate

### Frontend (Next.js)

- Use App Router (not Pages Router)
- Server Components by default, Client Components when needed
- shadcn/ui components in `src/components/`
- Utilities in `src/lib/`
- TypeScript strict mode enabled
- Use `cn()` utility for className merging

### Database

- All tables have soft delete (`deleted_at`)
- All tables have timestamps (`created_at`, `updated_at`)
- Use partial indexes on `deleted_at IS NULL` for active records
- Foreign keys with appropriate CASCADE/SET NULL
- Use DECIMAL for money (never FLOAT)

## Important Notes

- Authentication is JWT-based, NOT session-based
- All monetary values use DECIMAL(12, 2) for precision
- Korean language support in UI and data
- Sample data included in schema.sql for testing (username: `admin`, password: `password123`)
- Database initialized automatically via docker-entrypoint-initdb.d
- MinIO bucket must be created before file upload operations
