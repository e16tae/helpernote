#![allow(clippy::uninlined_format_args)]

use axum::extract::FromRef;
use sqlx::PgPool;

pub mod config;
pub mod handlers;
pub mod middleware;
pub mod models;
pub mod repositories;
pub mod services;

#[derive(Clone, FromRef)]
pub struct AppState {
    pub pool: PgPool,
    pub config: config::Config,
}
