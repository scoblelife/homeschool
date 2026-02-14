use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::auth;
use crate::interceptor;
use crate::models::UserRow;
use crate::proto::auth_service_server::AuthService;
use crate::proto::{
    AuthResponse, GetMeRequest, LoginRequest, RefreshRequest, RegisterRequest, UserProfile,
};

pub struct AuthServiceImpl {
    pool: PgPool,
    jwt_secret: String,
}

impl AuthServiceImpl {
    pub fn new(pool: PgPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }

    fn user_row_to_profile(row: &UserRow) -> UserProfile {
        UserProfile {
            id: row.id.clone(),
            display_name: row.display_name.clone(),
            email: row.email.clone(),
            is_verified: row.is_verified,
            is_moderator: row.is_moderator,
            is_banned: row.is_banned,
            family_id: row.family_id.clone(),
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }

    async fn issue_tokens(&self, user: &UserRow) -> Result<AuthResponse, Status> {
        let access_token = auth::create_access_token(&user.id, &self.jwt_secret)
            .map_err(|err| Status::internal(format!("[AuthService] token creation failed: {}", err)))?;

        let refresh_value = auth::create_refresh_token_value();
        let refresh_hash = auth::hash_refresh_token(&refresh_value);
        let refresh_expiry = auth::refresh_token_expiry();
        let token_id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)"
        )
        .bind(&token_id)
        .bind(&user.id)
        .bind(&refresh_hash)
        .bind(refresh_expiry)
        .execute(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[AuthService] refresh token save failed: {}", err)))?;

        Ok(AuthResponse {
            access_token,
            refresh_token: refresh_value,
            user: Some(Self::user_row_to_profile(user)),
        })
    }
}

#[tonic::async_trait]
impl AuthService for AuthServiceImpl {
    async fn register(&self, request: Request<RegisterRequest>) -> Result<Response<AuthResponse>, Status> {
        let req = request.into_inner();

        if req.email.is_empty() {
            return Err(Status::invalid_argument("email is required"));
        }
        if req.password.len() < 8 {
            return Err(Status::invalid_argument("password must be at least 8 characters"));
        }
        if req.display_name.is_empty() {
            return Err(Status::invalid_argument("display_name is required"));
        }

        // Check if email already exists
        let existing: Option<(String,)> = sqlx::query_as(
            "SELECT id FROM users WHERE email = $1"
        )
        .bind(&req.email)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[AuthService] db query failed: {}", err)))?;

        if existing.is_some() {
            return Err(Status::already_exists("email already registered"));
        }

        let password_hash = auth::hash_password(&req.password)
            .map_err(|err| Status::internal(format!("[AuthService] password hash failed: {}", err)))?;

        let user_id = Uuid::new_v4().to_string();

        let user: UserRow = sqlx::query_as(
            "INSERT INTO users (id, display_name, email, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING id, display_name, email, password_hash, is_verified, is_moderator, is_banned, family_id, created_at, updated_at"
        )
        .bind(&user_id)
        .bind(&req.display_name)
        .bind(&req.email)
        .bind(&password_hash)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[AuthService] user insert failed: {}", err)))?;

        let response = self.issue_tokens(&user).await?;
        Ok(Response::new(response))
    }

    async fn login(&self, request: Request<LoginRequest>) -> Result<Response<AuthResponse>, Status> {
        let req = request.into_inner();

        if req.email.is_empty() {
            return Err(Status::invalid_argument("email is required"));
        }
        if req.password.is_empty() {
            return Err(Status::invalid_argument("password is required"));
        }

        let user: UserRow = sqlx::query_as(
            "SELECT id, display_name, email, password_hash, is_verified, is_moderator, is_banned, family_id, created_at, updated_at
             FROM users WHERE email = $1"
        )
        .bind(&req.email)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[AuthService] db query failed: {}", err)))?
        .ok_or_else(|| Status::not_found("invalid email or password"))?;

        if user.is_banned {
            return Err(Status::permission_denied("account is banned"));
        }

        let valid = auth::verify_password(&req.password, &user.password_hash)
            .map_err(|err| Status::internal(format!("[AuthService] password verify failed: {}", err)))?;

        if !valid {
            return Err(Status::not_found("invalid email or password"));
        }

        let response = self.issue_tokens(&user).await?;
        Ok(Response::new(response))
    }

    async fn refresh_token(&self, request: Request<RefreshRequest>) -> Result<Response<AuthResponse>, Status> {
        let req = request.into_inner();

        if req.refresh_token.is_empty() {
            return Err(Status::invalid_argument("refresh_token is required"));
        }

        let token_hash = auth::hash_refresh_token(&req.refresh_token);

        let token_row: Option<crate::models::RefreshTokenRow> = sqlx::query_as(
            "SELECT id, user_id, token_hash, expires_at, created_at
             FROM refresh_tokens WHERE token_hash = $1"
        )
        .bind(&token_hash)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[AuthService] db query failed: {}", err)))?;

        let token_row = token_row.ok_or_else(|| Status::unauthenticated("invalid refresh token"))?;

        if token_row.expires_at < chrono::Utc::now() {
            // Delete expired token
            let _ = sqlx::query("DELETE FROM refresh_tokens WHERE id = $1")
                .bind(&token_row.id)
                .execute(&self.pool)
                .await;
            return Err(Status::unauthenticated("refresh token expired"));
        }

        // Delete old token (rotation)
        let _ = sqlx::query("DELETE FROM refresh_tokens WHERE id = $1")
            .bind(&token_row.id)
            .execute(&self.pool)
            .await;

        let user: UserRow = sqlx::query_as(
            "SELECT id, display_name, email, password_hash, is_verified, is_moderator, is_banned, family_id, created_at, updated_at
             FROM users WHERE id = $1"
        )
        .bind(&token_row.user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[AuthService] user lookup failed: {}", err)))?;

        if user.is_banned {
            return Err(Status::permission_denied("account is banned"));
        }

        let response = self.issue_tokens(&user).await?;
        Ok(Response::new(response))
    }

    async fn get_me(&self, request: Request<GetMeRequest>) -> Result<Response<UserProfile>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;

        let user: UserRow = sqlx::query_as(
            "SELECT id, display_name, email, password_hash, is_verified, is_moderator, is_banned, family_id, created_at, updated_at
             FROM users WHERE id = $1"
        )
        .bind(&user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[AuthService] user lookup failed: {}", err)))?;

        Ok(Response::new(Self::user_row_to_profile(&user)))
    }
}
