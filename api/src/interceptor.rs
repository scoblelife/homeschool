use tonic::{Request, Status};

use crate::auth;

const BEARER_PREFIX: &str = "Bearer ";

/// Extract user ID from a typed gRPC request with metadata.
pub fn require_auth<T>(request: &Request<T>, jwt_secret: &str) -> Result<String, Status> {
    let metadata = request.metadata();

    let auth_header = metadata
        .get("authorization")
        .ok_or_else(|| Status::unauthenticated("missing authorization header"))?
        .to_str()
        .map_err(|_| Status::unauthenticated("invalid authorization header encoding"))?;

    if !auth_header.starts_with(BEARER_PREFIX) {
        return Err(Status::unauthenticated("authorization header must start with 'Bearer '"));
    }

    let token = &auth_header[BEARER_PREFIX.len()..];

    let claims = auth::validate_token(token, jwt_secret)
        .map_err(|err| Status::unauthenticated(format!("invalid token: {}", err)))?;

    Ok(claims.sub)
}
