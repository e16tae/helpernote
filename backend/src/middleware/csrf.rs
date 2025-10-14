use axum::{
    extract::State,
    http::{header, Method, Request, StatusCode, Uri},
    middleware::Next,
    response::Response,
};

use crate::config::Config;

pub async fn csrf_protect(
    State(config): State<Config>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    if matches!(
        req.method(),
        &Method::GET | &Method::HEAD | &Method::OPTIONS
    ) {
        return Ok(next.run(req).await);
    }

    let allowed = &config.allowed_origins;
    if allowed.is_empty() {
        return Ok(next.run(req).await);
    }

    if let Some(origin) = req
        .headers()
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok())
    {
        if origin_allowed(origin, allowed) {
            return Ok(next.run(req).await);
        } else {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    if let Some(referer) = req
        .headers()
        .get(header::REFERER)
        .and_then(|value| value.to_str().ok())
    {
        if let Some(origin) = origin_from_url(referer) {
            if origin_allowed(&origin, allowed) {
                return Ok(next.run(req).await);
            } else {
                return Err(StatusCode::FORBIDDEN);
            }
        }
    }

    // Requests without Origin/Referer (e.g., mobile native clients) are allowed.
    Ok(next.run(req).await)
}

fn origin_allowed(origin: &str, allowed: &[String]) -> bool {
    allowed
        .iter()
        .any(|allowed_origin| allowed_origin.eq_ignore_ascii_case(origin))
}

fn origin_from_url(url: &str) -> Option<String> {
    Uri::try_from(url).ok().and_then(|uri| {
        let scheme = uri.scheme_str()?;
        let authority = uri.authority()?;
        Some(format!("{}://{}", scheme, authority))
    })
}
