use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::interceptor;
use crate::models::{CollectionWithCountRow, CommentWithAuthorRow, TagRow};
use crate::proto::social_service_server::SocialService;
use crate::proto::{
    AddTagsRequest, AddToCollectionRequest, Collection as CollectionProto,
    Comment as CommentProto, CreateCollectionRequest, CreateCommentRequest,
    DeleteCommentRequest, Empty, ListCollectionsRequest, ListCollectionsResponse,
    ListCommentsRequest, ListCommentsResponse, ListTagsRequest, ListTagsResponse,
    Tag as TagProto, ToggleVoteRequest, VoteResponse,
};

pub struct SocialServiceImpl {
    pool: PgPool,
    jwt_secret: String,
}

impl SocialServiceImpl {
    pub fn new(pool: PgPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }
}

fn comment_row_to_proto(row: &CommentWithAuthorRow) -> CommentProto {
    CommentProto {
        id: row.id.clone(),
        user_id: row.user_id.clone(),
        lesson_plan_id: row.lesson_plan_id.clone(),
        parent_comment_id: row.parent_comment_id.clone(),
        content: row.content.clone(),
        author_display_name: row.author_display_name.clone(),
        created_at: row.created_at.to_rfc3339(),
        updated_at: row.updated_at.to_rfc3339(),
    }
}

fn tag_row_to_proto(row: &TagRow) -> TagProto {
    TagProto {
        id: row.id.clone(),
        name: row.name.clone(),
        slug: row.slug.clone(),
        usage_count: row.usage_count,
        created_at: row.created_at.to_rfc3339(),
    }
}

fn collection_row_to_proto(row: &CollectionWithCountRow) -> CollectionProto {
    CollectionProto {
        id: row.id.clone(),
        user_id: row.user_id.clone(),
        name: row.name.clone(),
        description: row.description.clone(),
        is_public: row.is_public,
        item_count: row.item_count as i32,
        created_at: row.created_at.to_rfc3339(),
        updated_at: row.updated_at.to_rfc3339(),
    }
}

#[tonic::async_trait]
impl SocialService for SocialServiceImpl {
    async fn toggle_vote(
        &self,
        request: Request<ToggleVoteRequest>,
    ) -> Result<Response<VoteResponse>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.lesson_plan_id.is_empty() {
            return Err(Status::invalid_argument("lesson_plan_id is required"));
        }

        // Check if vote exists
        let existing: Option<(String,)> = sqlx::query_as(
            "SELECT id FROM votes WHERE user_id = $1 AND lesson_plan_id = $2"
        )
        .bind(&user_id)
        .bind(&req.lesson_plan_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] vote query failed: {}", err)))?;

        let voted = if let Some((vote_id,)) = existing {
            // Remove vote
            sqlx::query("DELETE FROM votes WHERE id = $1")
                .bind(&vote_id)
                .execute(&self.pool)
                .await
                .map_err(|err| Status::internal(format!("[SocialService] vote delete failed: {}", err)))?;

            sqlx::query("UPDATE lesson_plans SET vote_count = vote_count - 1 WHERE id = $1")
                .bind(&req.lesson_plan_id)
                .execute(&self.pool)
                .await
                .map_err(|err| Status::internal(format!("[SocialService] vote count update failed: {}", err)))?;

            false
        } else {
            // Add vote
            let vote_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO votes (id, user_id, lesson_plan_id) VALUES ($1, $2, $3)"
            )
            .bind(&vote_id)
            .bind(&user_id)
            .bind(&req.lesson_plan_id)
            .execute(&self.pool)
            .await
            .map_err(|err| Status::internal(format!("[SocialService] vote insert failed: {}", err)))?;

            sqlx::query("UPDATE lesson_plans SET vote_count = vote_count + 1 WHERE id = $1")
                .bind(&req.lesson_plan_id)
                .execute(&self.pool)
                .await
                .map_err(|err| Status::internal(format!("[SocialService] vote count update failed: {}", err)))?;

            true
        };

        // Get updated count
        let count: (i32,) = sqlx::query_as(
            "SELECT vote_count FROM lesson_plans WHERE id = $1"
        )
        .bind(&req.lesson_plan_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] vote count query failed: {}", err)))?;

        Ok(Response::new(VoteResponse {
            voted,
            vote_count: count.0,
        }))
    }

    async fn list_comments(
        &self,
        request: Request<ListCommentsRequest>,
    ) -> Result<Response<ListCommentsResponse>, Status> {
        let req = request.into_inner();

        if req.lesson_plan_id.is_empty() {
            return Err(Status::invalid_argument("lesson_plan_id is required"));
        }

        let rows: Vec<CommentWithAuthorRow> = sqlx::query_as(
            "SELECT c.id, c.user_id, c.lesson_plan_id, c.parent_comment_id, c.content,
                    u.display_name as author_display_name, c.created_at, c.updated_at
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.lesson_plan_id = $1
             ORDER BY c.created_at ASC"
        )
        .bind(&req.lesson_plan_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] comments query failed: {}", err)))?;

        let comments: Vec<CommentProto> = rows.iter().map(comment_row_to_proto).collect();

        Ok(Response::new(ListCommentsResponse { comments }))
    }

    async fn create_comment(
        &self,
        request: Request<CreateCommentRequest>,
    ) -> Result<Response<CommentProto>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.lesson_plan_id.is_empty() {
            return Err(Status::invalid_argument("lesson_plan_id is required"));
        }
        if req.content.is_empty() {
            return Err(Status::invalid_argument("content is required"));
        }

        let comment_id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO comments (id, user_id, lesson_plan_id, parent_comment_id, content)
             VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(&comment_id)
        .bind(&user_id)
        .bind(&req.lesson_plan_id)
        .bind(&req.parent_comment_id)
        .bind(&req.content)
        .execute(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] comment insert failed: {}", err)))?;

        let row: CommentWithAuthorRow = sqlx::query_as(
            "SELECT c.id, c.user_id, c.lesson_plan_id, c.parent_comment_id, c.content,
                    u.display_name as author_display_name, c.created_at, c.updated_at
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = $1"
        )
        .bind(&comment_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] comment fetch failed: {}", err)))?;

        Ok(Response::new(comment_row_to_proto(&row)))
    }

    async fn delete_comment(
        &self,
        request: Request<DeleteCommentRequest>,
    ) -> Result<Response<Empty>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        let result = sqlx::query(
            "DELETE FROM comments WHERE id = $1 AND user_id = $2"
        )
        .bind(&req.id)
        .bind(&user_id)
        .execute(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] comment delete failed: {}", err)))?;

        if result.rows_affected() == 0 {
            return Err(Status::not_found("comment not found or not owned by you"));
        }

        Ok(Response::new(Empty {}))
    }

    async fn list_tags(
        &self,
        request: Request<ListTagsRequest>,
    ) -> Result<Response<ListTagsResponse>, Status> {
        let req = request.into_inner();

        let rows: Vec<TagRow> = if let Some(ref query) = req.query {
            let pattern = format!("%{}%", query.to_lowercase());
            sqlx::query_as(
                "SELECT id, name, slug, usage_count, created_at
                 FROM tags WHERE LOWER(name) LIKE $1
                 ORDER BY usage_count DESC
                 LIMIT 50"
            )
            .bind(&pattern)
            .fetch_all(&self.pool)
            .await
        } else {
            sqlx::query_as(
                "SELECT id, name, slug, usage_count, created_at
                 FROM tags
                 ORDER BY usage_count DESC
                 LIMIT 50"
            )
            .fetch_all(&self.pool)
            .await
        }
        .map_err(|err| Status::internal(format!("[SocialService] tags query failed: {}", err)))?;

        let tags: Vec<TagProto> = rows.iter().map(tag_row_to_proto).collect();

        Ok(Response::new(ListTagsResponse { tags }))
    }

    async fn add_tags(
        &self,
        request: Request<AddTagsRequest>,
    ) -> Result<Response<Empty>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.lesson_plan_id.is_empty() {
            return Err(Status::invalid_argument("lesson_plan_id is required"));
        }

        // Verify ownership
        let owner: Option<(String,)> = sqlx::query_as(
            "SELECT author_id FROM lesson_plans WHERE id = $1"
        )
        .bind(&req.lesson_plan_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] plan query failed: {}", err)))?;

        let (author_id,) = owner.ok_or_else(|| Status::not_found("lesson plan not found"))?;
        if author_id != user_id {
            return Err(Status::permission_denied("you can only tag your own plans"));
        }

        for tag_name in &req.tag_names {
            let slug = tag_name.to_lowercase().replace(' ', "-");
            let tag_id = Uuid::new_v4().to_string();

            // Upsert tag
            let tag_row: (String,) = sqlx::query_as(
                "INSERT INTO tags (id, name, slug) VALUES ($1, $2, $3)
                 ON CONFLICT (name) DO UPDATE SET usage_count = tags.usage_count
                 RETURNING id"
            )
            .bind(&tag_id)
            .bind(tag_name)
            .bind(&slug)
            .fetch_one(&self.pool)
            .await
            .map_err(|err| Status::internal(format!("[SocialService] tag upsert failed: {}", err)))?;

            // Link tag to plan
            let link_result = sqlx::query(
                "INSERT INTO lesson_plan_tags (lesson_plan_id, tag_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING"
            )
            .bind(&req.lesson_plan_id)
            .bind(&tag_row.0)
            .execute(&self.pool)
            .await
            .map_err(|err| Status::internal(format!("[SocialService] tag link failed: {}", err)))?;

            // Increment usage count if new link
            if link_result.rows_affected() > 0 {
                let _ = sqlx::query("UPDATE tags SET usage_count = usage_count + 1 WHERE id = $1")
                    .bind(&tag_row.0)
                    .execute(&self.pool)
                    .await;
            }
        }

        Ok(Response::new(Empty {}))
    }

    async fn list_collections(
        &self,
        request: Request<ListCollectionsRequest>,
    ) -> Result<Response<ListCollectionsResponse>, Status> {
        let req = request.into_inner();

        let rows: Vec<CollectionWithCountRow> = if let Some(ref target_user_id) = req.user_id {
            sqlx::query_as(
                "SELECT c.id, c.user_id, c.name, c.description, c.is_public,
                        COUNT(ci.id) as item_count, c.created_at, c.updated_at
                 FROM collections c
                 LEFT JOIN collection_items ci ON c.id = ci.collection_id
                 WHERE c.user_id = $1 AND c.is_public = true
                 GROUP BY c.id
                 ORDER BY c.created_at DESC"
            )
            .bind(target_user_id)
            .fetch_all(&self.pool)
            .await
        } else {
            // Public collections
            sqlx::query_as(
                "SELECT c.id, c.user_id, c.name, c.description, c.is_public,
                        COUNT(ci.id) as item_count, c.created_at, c.updated_at
                 FROM collections c
                 LEFT JOIN collection_items ci ON c.id = ci.collection_id
                 WHERE c.is_public = true
                 GROUP BY c.id
                 ORDER BY c.created_at DESC
                 LIMIT 50"
            )
            .fetch_all(&self.pool)
            .await
        }
        .map_err(|err| Status::internal(format!("[SocialService] collections query failed: {}", err)))?;

        let collections: Vec<CollectionProto> = rows.iter().map(collection_row_to_proto).collect();

        Ok(Response::new(ListCollectionsResponse { collections }))
    }

    async fn create_collection(
        &self,
        request: Request<CreateCollectionRequest>,
    ) -> Result<Response<CollectionProto>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.name.is_empty() {
            return Err(Status::invalid_argument("name is required"));
        }

        let collection_id = Uuid::new_v4().to_string();

        let row: CollectionWithCountRow = sqlx::query_as(
            "WITH new_collection AS (
                INSERT INTO collections (id, user_id, name, description, is_public)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, user_id, name, description, is_public, created_at, updated_at
            )
            SELECT nc.id, nc.user_id, nc.name, nc.description, nc.is_public,
                   0::bigint as item_count, nc.created_at, nc.updated_at
            FROM new_collection nc"
        )
        .bind(&collection_id)
        .bind(&user_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(req.is_public)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] collection insert failed: {}", err)))?;

        Ok(Response::new(collection_row_to_proto(&row)))
    }

    async fn add_to_collection(
        &self,
        request: Request<AddToCollectionRequest>,
    ) -> Result<Response<Empty>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.collection_id.is_empty() {
            return Err(Status::invalid_argument("collection_id is required"));
        }
        if req.lesson_plan_id.is_empty() {
            return Err(Status::invalid_argument("lesson_plan_id is required"));
        }

        // Verify collection ownership
        let owner: Option<(String,)> = sqlx::query_as(
            "SELECT user_id FROM collections WHERE id = $1"
        )
        .bind(&req.collection_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] collection query failed: {}", err)))?;

        let (collection_owner,) = owner.ok_or_else(|| Status::not_found("collection not found"))?;
        if collection_owner != user_id {
            return Err(Status::permission_denied("you can only add to your own collections"));
        }

        let item_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO collection_items (id, collection_id, lesson_plan_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (collection_id, lesson_plan_id) DO NOTHING"
        )
        .bind(&item_id)
        .bind(&req.collection_id)
        .bind(&req.lesson_plan_id)
        .execute(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[SocialService] collection item insert failed: {}", err)))?;

        Ok(Response::new(Empty {}))
    }
}
