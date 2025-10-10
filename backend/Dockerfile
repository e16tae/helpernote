# ============================================
# Stage 1: Build application
# ============================================
FROM rust:1.83-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies (required for sqlx, rust-s3, etc.)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (cached layer)
RUN cargo build --release
RUN rm -rf src

# Copy actual source code
COPY src ./src
COPY migrations ./migrations

# Set SQLx to offline mode to allow building without database connection
# Note: SQLx queries will be validated at runtime instead of compile-time
# To enable compile-time verification, run: cargo sqlx prepare
ENV SQLX_OFFLINE=true

# Build application (touch to force rebuild)
RUN touch src/main.rs && cargo build --release

# ============================================
# Stage 2: Runtime image
# ============================================
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app

# Copy binary from builder
COPY --from=builder /app/target/release/helpernote-backend /app/helpernote-backend

# Copy migrations for runtime
COPY --from=builder /app/migrations /app/migrations

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set default environment variables
ENV RUST_LOG=info
ENV PORT=8000

# Run the application
CMD ["/app/helpernote-backend"]
