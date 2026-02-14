use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::interceptor;
use crate::models::{CountRow, LessonPlanForModeration, LessonPlanRow, UserRow};
use crate::moderation::engine::build_default_engine;
use crate::proto::lesson_plan_service_server::LessonPlanService;
use crate::proto::{
    CreatePlanRequest, DeletePlanRequest, Empty, FlagPlanRequest, ForkPlanRequest,
    GetPlanRequest, LessonPlan, ListFamilyPlansRequest, ListPlansRequest, ListPlansResponse,
    PlanScope, PlanStatus, PublishPlanRequest, PublishPlanResponse, QuarantineStatus,
    UpdatePlanRequest,
};

pub struct LessonPlanServiceImpl {
    pool: PgPool,
    jwt_secret: String,
}

impl LessonPlanServiceImpl {
    pub fn new(pool: PgPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }
}

fn row_to_proto(row: &LessonPlanRow) -> LessonPlan {
    let status = match row.status.as_str() {
        "draft" => PlanStatus::PlanDraft,
        "published" => PlanStatus::PlanPublished,
        "archived" => PlanStatus::PlanArchived,
        "flagged" => PlanStatus::PlanFlagged,
        "removed" => PlanStatus::PlanRemoved,
        _ => PlanStatus::PlanDraft,
    };

    let scope = match row.scope.as_str() {
        "family" => PlanScope::Family,
        _ => PlanScope::Community,
    };

    let quarantine = match row.quarantine_status.as_str() {
        "approved" => QuarantineStatus::QuarantineApproved,
        "rejected" => QuarantineStatus::QuarantineRejected,
        _ => QuarantineStatus::QuarantinePending,
    };

    LessonPlan {
        id: row.id.clone(),
        author_id: row.author_id.clone(),
        title: row.title.clone(),
        description: row.description.clone(),
        grade_level: row.grade_level.clone(),
        subject: row.subject.clone(),
        activity_type: row.activity_type.clone(),
        duration_minutes: row.duration_minutes,
        materials: row.materials.clone(),
        instructions: row.instructions.clone(),
        objectives: row.objectives.clone(),
        status: status.into(),
        scope: scope.into(),
        quarantine_status: quarantine.into(),
        vote_count: row.vote_count,
        view_count: row.view_count,
        fork_count: row.fork_count,
        forked_from_id: row.forked_from_id.clone(),
        family_id: row.family_id.clone(),
        created_at: row.created_at.to_rfc3339(),
        updated_at: row.updated_at.to_rfc3339(),
    }
}

fn scope_to_string(scope: i32) -> &'static str {
    match PlanScope::try_from(scope) {
        Ok(PlanScope::Family) => "family",
        _ => "community",
    }
}

#[tonic::async_trait]
impl LessonPlanService for LessonPlanServiceImpl {
    async fn list_plans(
        &self,
        request: Request<ListPlansRequest>,
    ) -> Result<Response<ListPlansResponse>, Status> {
        let req = request.into_inner();
        let limit = req.limit.min(100).max(1);

        // Only show published + approved community plans
        let mut query = String::from(
            "SELECT id, author_id, title, description, grade_level, subject, activity_type,
                    duration_minutes, materials, instructions, objectives, status, scope,
                    quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                    family_id, published_at, created_at, updated_at
             FROM lesson_plans
             WHERE status = 'published' AND scope = 'community' AND quarantine_status = 'approved'"
        );
        let mut param_index = 1u32;
        let mut params: Vec<String> = Vec::new();

        if let Some(ref subject) = req.subject {
            query.push_str(&format!(" AND subject = ${}", param_index));
            params.push(subject.clone());
            param_index += 1;
        }

        if let Some(ref grade_level) = req.grade_level {
            query.push_str(&format!(" AND grade_level = ${}", param_index));
            params.push(grade_level.clone());
            param_index += 1;
        }

        if let Some(ref activity_type) = req.activity_type {
            query.push_str(&format!(" AND activity_type = ${}", param_index));
            params.push(activity_type.clone());
            param_index += 1;
        }

        if let Some(ref cursor) = req.cursor {
            query.push_str(&format!(" AND created_at < ${}", param_index));
            params.push(cursor.clone());
            param_index += 1;
        }

        let sort = req.sort_by.as_deref().unwrap_or("newest");
        match sort {
            "votes" => query.push_str(" ORDER BY vote_count DESC, created_at DESC"),
            "views" => query.push_str(" ORDER BY view_count DESC, created_at DESC"),
            _ => query.push_str(" ORDER BY created_at DESC"),
        }

        query.push_str(&format!(" LIMIT ${}", param_index));

        // Build the dynamic query
        let mut sqlx_query = sqlx::query_as::<_, LessonPlanRow>(&query);
        for param in &params {
            sqlx_query = sqlx_query.bind(param);
        }
        sqlx_query = sqlx_query.bind(limit);

        let rows = sqlx_query
            .fetch_all(&self.pool)
            .await
            .map_err(|err| Status::internal(format!("[LessonPlanService] list query failed: {}", err)))?;

        let plans: Vec<LessonPlan> = rows.iter().map(row_to_proto).collect();

        let next_cursor = rows.last().map(|r| r.created_at.to_rfc3339());

        // Count total
        let count_row: CountRow = sqlx::query_as(
            "SELECT COUNT(*) as count FROM lesson_plans
             WHERE status = 'published' AND scope = 'community' AND quarantine_status = 'approved'"
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] count query failed: {}", err)))?;

        Ok(Response::new(ListPlansResponse {
            plans,
            next_cursor,
            total_count: count_row.count as i32,
        }))
    }

    async fn get_plan(
        &self,
        request: Request<GetPlanRequest>,
    ) -> Result<Response<LessonPlan>, Status> {
        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        let row: LessonPlanRow = sqlx::query_as(
            "UPDATE lesson_plans SET view_count = view_count + 1
             WHERE id = $1
             RETURNING id, author_id, title, description, grade_level, subject, activity_type,
                       duration_minutes, materials, instructions, objectives, status, scope,
                       quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                       family_id, published_at, created_at, updated_at"
        )
        .bind(&req.id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] get query failed: {}", err)))?
        .ok_or_else(|| Status::not_found("lesson plan not found"))?;

        Ok(Response::new(row_to_proto(&row)))
    }

    async fn create_plan(
        &self,
        request: Request<CreatePlanRequest>,
    ) -> Result<Response<LessonPlan>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.title.is_empty() {
            return Err(Status::invalid_argument("title is required"));
        }
        if req.description.is_empty() {
            return Err(Status::invalid_argument("description is required"));
        }

        let plan_id = Uuid::new_v4().to_string();
        let scope = scope_to_string(req.scope);

        // For family scope, look up user's family_id
        let family_id: Option<String> = if scope == "family" {
            let user: UserRow = sqlx::query_as(
                "SELECT id, display_name, email, password_hash, is_verified, is_moderator, is_banned, family_id, created_at, updated_at
                 FROM users WHERE id = $1"
            )
            .bind(&user_id)
            .fetch_one(&self.pool)
            .await
            .map_err(|err| Status::internal(format!("[LessonPlanService] user lookup failed: {}", err)))?;

            let fid = user.family_id.ok_or_else(|| {
                Status::failed_precondition("user must belong to a family to create family plans")
            })?;
            Some(fid)
        } else {
            None
        };

        let row: LessonPlanRow = sqlx::query_as(
            "INSERT INTO lesson_plans (id, author_id, title, description, grade_level, subject,
                    activity_type, duration_minutes, materials, instructions, objectives,
                    status, scope, quarantine_status, family_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12, 'pending', $13)
             RETURNING id, author_id, title, description, grade_level, subject, activity_type,
                       duration_minutes, materials, instructions, objectives, status, scope,
                       quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                       family_id, published_at, created_at, updated_at"
        )
        .bind(&plan_id)
        .bind(&user_id)
        .bind(&req.title)
        .bind(&req.description)
        .bind(&req.grade_level)
        .bind(&req.subject)
        .bind(&req.activity_type)
        .bind(req.duration_minutes)
        .bind(&req.materials)
        .bind(&req.instructions)
        .bind(&req.objectives)
        .bind(scope)
        .bind(&family_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] insert failed: {}", err)))?;

        Ok(Response::new(row_to_proto(&row)))
    }

    async fn update_plan(
        &self,
        request: Request<UpdatePlanRequest>,
    ) -> Result<Response<LessonPlan>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        // Verify ownership and draft status
        let existing: LessonPlanRow = sqlx::query_as(
            "SELECT id, author_id, title, description, grade_level, subject, activity_type,
                    duration_minutes, materials, instructions, objectives, status, scope,
                    quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                    family_id, published_at, created_at, updated_at
             FROM lesson_plans WHERE id = $1"
        )
        .bind(&req.id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] query failed: {}", err)))?
        .ok_or_else(|| Status::not_found("lesson plan not found"))?;

        if existing.author_id != user_id {
            return Err(Status::permission_denied("you can only edit your own plans"));
        }

        if existing.status != "draft" {
            return Err(Status::failed_precondition("only draft plans can be edited"));
        }

        let title = req.title.unwrap_or(existing.title);
        let description = req.description.unwrap_or(existing.description);
        let grade_level = req.grade_level.unwrap_or(existing.grade_level);
        let subject = req.subject.unwrap_or(existing.subject);
        let activity_type = req.activity_type.unwrap_or(existing.activity_type);
        let duration_minutes = req.duration_minutes.unwrap_or(existing.duration_minutes);
        let instructions = req.instructions.unwrap_or(existing.instructions);

        let materials = if req.materials.is_empty() {
            existing.materials
        } else {
            req.materials
        };
        let objectives = if req.objectives.is_empty() {
            existing.objectives
        } else {
            req.objectives
        };

        let row: LessonPlanRow = sqlx::query_as(
            "UPDATE lesson_plans SET title = $2, description = $3, grade_level = $4,
                    subject = $5, activity_type = $6, duration_minutes = $7,
                    materials = $8, instructions = $9, objectives = $10,
                    updated_at = NOW()
             WHERE id = $1
             RETURNING id, author_id, title, description, grade_level, subject, activity_type,
                       duration_minutes, materials, instructions, objectives, status, scope,
                       quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                       family_id, published_at, created_at, updated_at"
        )
        .bind(&req.id)
        .bind(&title)
        .bind(&description)
        .bind(&grade_level)
        .bind(&subject)
        .bind(&activity_type)
        .bind(duration_minutes)
        .bind(&materials)
        .bind(&instructions)
        .bind(&objectives)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] update failed: {}", err)))?;

        Ok(Response::new(row_to_proto(&row)))
    }

    async fn delete_plan(
        &self,
        request: Request<DeletePlanRequest>,
    ) -> Result<Response<Empty>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        // Soft-delete: set status to removed
        let result = sqlx::query(
            "UPDATE lesson_plans SET status = 'removed', updated_at = NOW()
             WHERE id = $1 AND author_id = $2"
        )
        .bind(&req.id)
        .bind(&user_id)
        .execute(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] delete failed: {}", err)))?;

        if result.rows_affected() == 0 {
            return Err(Status::not_found("plan not found or not owned by you"));
        }

        Ok(Response::new(Empty {}))
    }

    async fn publish_plan(
        &self,
        request: Request<PublishPlanRequest>,
    ) -> Result<Response<PublishPlanResponse>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        let existing: LessonPlanRow = sqlx::query_as(
            "SELECT id, author_id, title, description, grade_level, subject, activity_type,
                    duration_minutes, materials, instructions, objectives, status, scope,
                    quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                    family_id, published_at, created_at, updated_at
             FROM lesson_plans WHERE id = $1 AND author_id = $2"
        )
        .bind(&req.id)
        .bind(&user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] query failed: {}", err)))?
        .ok_or_else(|| Status::not_found("plan not found or not owned by you"))?;

        if existing.status != "draft" {
            return Err(Status::failed_precondition("only draft plans can be published"));
        }

        // Family scope: direct publish, no moderation
        if existing.scope == "family" {
            let row: LessonPlanRow = sqlx::query_as(
                "UPDATE lesson_plans SET status = 'published', quarantine_status = 'approved',
                        published_at = NOW(), updated_at = NOW()
                 WHERE id = $1
                 RETURNING id, author_id, title, description, grade_level, subject, activity_type,
                           duration_minutes, materials, instructions, objectives, status, scope,
                           quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                           family_id, published_at, created_at, updated_at"
            )
            .bind(&req.id)
            .fetch_one(&self.pool)
            .await
            .map_err(|err| Status::internal(format!("[LessonPlanService] publish failed: {}", err)))?;

            return Ok(Response::new(PublishPlanResponse {
                plan: Some(row_to_proto(&row)),
                quarantine_status: QuarantineStatus::QuarantineApproved.into(),
                message: "Published to family".to_string(),
            }));
        }

        // Community scope: run moderation engine
        let plan_for_mod = LessonPlanForModeration::from(&existing);

        // Load active criteria IDs from DB
        let active_criteria: Vec<(String,)> = sqlx::query_as(
            "SELECT id FROM moderation_criteria WHERE is_active = true AND evaluation_type = 'auto'
             ORDER BY evaluation_order"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] criteria query failed: {}", err)))?;

        let active_ids: Vec<String> = active_criteria.into_iter().map(|r| r.0).collect();
        let engine = build_default_engine(&active_ids);
        let engine_result = engine.evaluate(&plan_for_mod);

        // Save moderation results
        for result in &engine_result.results {
            let result_id = Uuid::new_v4().to_string();
            let _ = sqlx::query(
                "INSERT INTO moderation_results (id, lesson_plan_id, criterion_id, passed, reason)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (lesson_plan_id, criterion_id) DO UPDATE SET passed = $4, reason = $5, evaluated_at = NOW()"
            )
            .bind(&result_id)
            .bind(&req.id)
            .bind(&result.criterion_id)
            .bind(result.passed)
            .bind(&result.reason)
            .execute(&self.pool)
            .await;
        }

        // Check for manual criteria
        let manual_count: CountRow = sqlx::query_as(
            "SELECT COUNT(*) as count FROM moderation_criteria
             WHERE is_active = true AND evaluation_type = 'manual'"
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] manual criteria query failed: {}", err)))?;

        let has_manual_criteria = manual_count.count > 0;

        let (new_status, new_quarantine, message) = if engine_result.all_passed && !has_manual_criteria {
            ("published", "approved", "Published to community")
        } else {
            // Create moderation queue entry
            let queue_id = Uuid::new_v4().to_string();
            let reason = engine_result
                .results
                .iter()
                .filter(|r| !r.passed)
                .map(|r| format!("{}: {}", r.criterion_name, r.reason.as_deref().unwrap_or("failed")))
                .collect::<Vec<_>>()
                .join("; ");

            let _ = sqlx::query(
                "INSERT INTO moderation_queue (id, content_type, content_id, reason, auto_flagged)
                 VALUES ($1, 'lesson_plan', $2, $3, true)"
            )
            .bind(&queue_id)
            .bind(&req.id)
            .bind(&reason)
            .execute(&self.pool)
            .await;

            ("published", "pending", "Submitted for moderation review")
        };

        let row: LessonPlanRow = sqlx::query_as(
            "UPDATE lesson_plans SET status = $2, quarantine_status = $3,
                    published_at = NOW(), updated_at = NOW()
             WHERE id = $1
             RETURNING id, author_id, title, description, grade_level, subject, activity_type,
                       duration_minutes, materials, instructions, objectives, status, scope,
                       quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                       family_id, published_at, created_at, updated_at"
        )
        .bind(&req.id)
        .bind(new_status)
        .bind(new_quarantine)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] publish update failed: {}", err)))?;

        let quarantine_status_proto = match new_quarantine {
            "approved" => QuarantineStatus::QuarantineApproved,
            _ => QuarantineStatus::QuarantinePending,
        };

        Ok(Response::new(PublishPlanResponse {
            plan: Some(row_to_proto(&row)),
            quarantine_status: quarantine_status_proto.into(),
            message: message.to_string(),
        }))
    }

    async fn fork_plan(
        &self,
        request: Request<ForkPlanRequest>,
    ) -> Result<Response<LessonPlan>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        let source: LessonPlanRow = sqlx::query_as(
            "SELECT id, author_id, title, description, grade_level, subject, activity_type,
                    duration_minutes, materials, instructions, objectives, status, scope,
                    quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                    family_id, published_at, created_at, updated_at
             FROM lesson_plans WHERE id = $1"
        )
        .bind(&req.id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] query failed: {}", err)))?
        .ok_or_else(|| Status::not_found("source plan not found"))?;

        let new_id = Uuid::new_v4().to_string();

        // Increment fork count on source
        let _ = sqlx::query("UPDATE lesson_plans SET fork_count = fork_count + 1 WHERE id = $1")
            .bind(&req.id)
            .execute(&self.pool)
            .await;

        let row: LessonPlanRow = sqlx::query_as(
            "INSERT INTO lesson_plans (id, author_id, title, description, grade_level, subject,
                    activity_type, duration_minutes, materials, instructions, objectives,
                    status, scope, quarantine_status, forked_from_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', 'community', 'pending', $12)
             RETURNING id, author_id, title, description, grade_level, subject, activity_type,
                       duration_minutes, materials, instructions, objectives, status, scope,
                       quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                       family_id, published_at, created_at, updated_at"
        )
        .bind(&new_id)
        .bind(&user_id)
        .bind(&source.title)
        .bind(&source.description)
        .bind(&source.grade_level)
        .bind(&source.subject)
        .bind(&source.activity_type)
        .bind(source.duration_minutes)
        .bind(&source.materials)
        .bind(&source.instructions)
        .bind(&source.objectives)
        .bind(&req.id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] fork insert failed: {}", err)))?;

        Ok(Response::new(row_to_proto(&row)))
    }

    async fn list_family_plans(
        &self,
        request: Request<ListFamilyPlansRequest>,
    ) -> Result<Response<ListPlansResponse>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();
        let limit = req.limit.min(100).max(1);

        // Look up user's family_id
        let user: UserRow = sqlx::query_as(
            "SELECT id, display_name, email, password_hash, is_verified, is_moderator, is_banned, family_id, created_at, updated_at
             FROM users WHERE id = $1"
        )
        .bind(&user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] user lookup failed: {}", err)))?;

        let family_id = user.family_id.ok_or_else(|| {
            Status::failed_precondition("user must belong to a family")
        })?;

        let mut query = String::from(
            "SELECT id, author_id, title, description, grade_level, subject, activity_type,
                    duration_minutes, materials, instructions, objectives, status, scope,
                    quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                    family_id, published_at, created_at, updated_at
             FROM lesson_plans
             WHERE scope = 'family' AND family_id = $1 AND status != 'removed'"
        );

        if let Some(ref cursor) = req.cursor {
            query.push_str(" AND created_at < $3 ORDER BY created_at DESC LIMIT $2");
            let rows: Vec<LessonPlanRow> = sqlx::query_as(&query)
                .bind(&family_id)
                .bind(limit)
                .bind(cursor)
                .fetch_all(&self.pool)
                .await
                .map_err(|err| Status::internal(format!("[LessonPlanService] family query failed: {}", err)))?;

            let plans: Vec<LessonPlan> = rows.iter().map(row_to_proto).collect();
            let next_cursor = rows.last().map(|r| r.created_at.to_rfc3339());

            return Ok(Response::new(ListPlansResponse {
                plans,
                next_cursor,
                total_count: 0,
            }));
        }

        query.push_str(" ORDER BY created_at DESC LIMIT $2");
        let rows: Vec<LessonPlanRow> = sqlx::query_as(&query)
            .bind(&family_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await
            .map_err(|err| Status::internal(format!("[LessonPlanService] family query failed: {}", err)))?;

        let plans: Vec<LessonPlan> = rows.iter().map(row_to_proto).collect();
        let next_cursor = rows.last().map(|r| r.created_at.to_rfc3339());

        Ok(Response::new(ListPlansResponse {
            plans,
            next_cursor,
            total_count: 0,
        }))
    }

    async fn flag_plan(
        &self,
        request: Request<FlagPlanRequest>,
    ) -> Result<Response<Empty>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }
        if req.reason.is_empty() {
            return Err(Status::invalid_argument("reason is required"));
        }

        // Verify plan exists
        let exists: Option<(String,)> = sqlx::query_as(
            "SELECT id FROM lesson_plans WHERE id = $1"
        )
        .bind(&req.id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] query failed: {}", err)))?;

        if exists.is_none() {
            return Err(Status::not_found("lesson plan not found"));
        }

        let queue_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO moderation_queue (id, content_type, content_id, reported_by, reason)
             VALUES ($1, 'lesson_plan', $2, $3, $4)"
        )
        .bind(&queue_id)
        .bind(&req.id)
        .bind(&user_id)
        .bind(&req.reason)
        .execute(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[LessonPlanService] flag insert failed: {}", err)))?;

        Ok(Response::new(Empty {}))
    }
}
