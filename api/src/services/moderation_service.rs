use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::interceptor;
use crate::models::{
    CountRow, LessonPlanForModeration, LessonPlanRow, ModerationCriterionRow,
    ModerationQueueRow, UserRow,
};
use crate::moderation::engine::build_default_engine;
use crate::proto::moderation_service_server::ModerationService;
use crate::proto::{
    CreateCriterionRequest, CriterionResultMessage, ListCriteriaRequest, ListCriteriaResponse,
    ListQueueRequest, ListQueueResponse, ModerationCriterion as ModerationCriterionProto,
    ModerationQueueItem as ModerationQueueItemProto, ModerationResult as ModerationResultProto,
    RerunModerationRequest, ResolveItemRequest, UpdateCriterionRequest,
};

pub struct ModerationServiceImpl {
    pool: PgPool,
    jwt_secret: String,
}

impl ModerationServiceImpl {
    pub fn new(pool: PgPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }

    fn require_moderator(&self, user: &UserRow) -> Result<(), Status> {
        if !user.is_moderator {
            return Err(Status::permission_denied("moderator access required"));
        }
        Ok(())
    }

    async fn get_user(&self, user_id: &str) -> Result<UserRow, Status> {
        sqlx::query_as(
            "SELECT id, display_name, email, password_hash, is_verified, is_moderator, is_banned, family_id, created_at, updated_at
             FROM users WHERE id = $1"
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] user lookup failed: {}", err)))
    }
}

fn queue_row_to_proto(row: &ModerationQueueRow) -> ModerationQueueItemProto {
    ModerationQueueItemProto {
        id: row.id.clone(),
        content_type: row.content_type.clone(),
        content_id: row.content_id.clone(),
        reported_by: row.reported_by.clone(),
        reason: row.reason.clone(),
        auto_flagged: row.auto_flagged,
        moderator_id: row.moderator_id.clone(),
        resolution: row.resolution.clone(),
        resolved_at: row.resolved_at.map(|t| t.to_rfc3339()),
        created_at: row.created_at.to_rfc3339(),
    }
}

fn criterion_row_to_proto(row: &ModerationCriterionRow) -> ModerationCriterionProto {
    let eval_type = match row.evaluation_type.as_str() {
        "manual" => crate::proto::EvaluationType::EvaluationManual,
        _ => crate::proto::EvaluationType::EvaluationAuto,
    };

    ModerationCriterionProto {
        id: row.id.clone(),
        name: row.name.clone(),
        description: row.description.clone(),
        is_active: row.is_active,
        evaluation_type: eval_type.into(),
        evaluation_order: row.evaluation_order,
        created_at: row.created_at.to_rfc3339(),
        updated_at: row.updated_at.to_rfc3339(),
    }
}

#[tonic::async_trait]
impl ModerationService for ModerationServiceImpl {
    async fn list_queue(
        &self,
        request: Request<ListQueueRequest>,
    ) -> Result<Response<ListQueueResponse>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let user = self.get_user(&user_id).await?;
        self.require_moderator(&user)?;

        let req = request.into_inner();
        let limit = req.limit.min(100).max(1);

        let rows: Vec<ModerationQueueRow> = if let Some(ref status) = req.status {
            if status == "unresolved" {
                sqlx::query_as(
                    "SELECT id, content_type, content_id, reported_by, reason, auto_flagged,
                            moderator_id, resolution, resolved_at, created_at
                     FROM moderation_queue
                     WHERE resolution IS NULL
                     ORDER BY created_at DESC
                     LIMIT $1"
                )
                .bind(limit)
                .fetch_all(&self.pool)
                .await
            } else {
                sqlx::query_as(
                    "SELECT id, content_type, content_id, reported_by, reason, auto_flagged,
                            moderator_id, resolution, resolved_at, created_at
                     FROM moderation_queue
                     WHERE resolution = $1
                     ORDER BY created_at DESC
                     LIMIT $2"
                )
                .bind(status)
                .bind(limit)
                .fetch_all(&self.pool)
                .await
            }
        } else {
            sqlx::query_as(
                "SELECT id, content_type, content_id, reported_by, reason, auto_flagged,
                        moderator_id, resolution, resolved_at, created_at
                 FROM moderation_queue
                 ORDER BY created_at DESC
                 LIMIT $1"
            )
            .bind(limit)
            .fetch_all(&self.pool)
            .await
        }
        .map_err(|err| Status::internal(format!("[ModerationService] queue query failed: {}", err)))?;

        let items: Vec<ModerationQueueItemProto> = rows.iter().map(queue_row_to_proto).collect();

        let count_row: CountRow = sqlx::query_as(
            "SELECT COUNT(*) as count FROM moderation_queue WHERE resolution IS NULL"
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] count query failed: {}", err)))?;

        Ok(Response::new(ListQueueResponse {
            items,
            next_cursor: None,
            total_count: count_row.count as i32,
        }))
    }

    async fn resolve_item(
        &self,
        request: Request<ResolveItemRequest>,
    ) -> Result<Response<ModerationQueueItemProto>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let user = self.get_user(&user_id).await?;
        self.require_moderator(&user)?;

        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        let valid_resolutions = ["approved", "removed", "warning"];
        if !valid_resolutions.contains(&req.resolution.as_str()) {
            return Err(Status::invalid_argument("resolution must be 'approved', 'removed', or 'warning'"));
        }

        let row: ModerationQueueRow = sqlx::query_as(
            "UPDATE moderation_queue SET resolution = $2, moderator_id = $3, resolved_at = NOW()
             WHERE id = $1
             RETURNING id, content_type, content_id, reported_by, reason, auto_flagged,
                       moderator_id, resolution, resolved_at, created_at"
        )
        .bind(&req.id)
        .bind(&req.resolution)
        .bind(&user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] resolve failed: {}", err)))?
        .ok_or_else(|| Status::not_found("queue item not found"))?;

        // If approved, update lesson plan quarantine status
        if req.resolution == "approved" && row.content_type == "lesson_plan" {
            let _ = sqlx::query(
                "UPDATE lesson_plans SET quarantine_status = 'approved', updated_at = NOW()
                 WHERE id = $1"
            )
            .bind(&row.content_id)
            .execute(&self.pool)
            .await;
        }

        // If removed, update lesson plan status
        if req.resolution == "removed" && row.content_type == "lesson_plan" {
            let _ = sqlx::query(
                "UPDATE lesson_plans SET quarantine_status = 'rejected', status = 'removed', updated_at = NOW()
                 WHERE id = $1"
            )
            .bind(&row.content_id)
            .execute(&self.pool)
            .await;
        }

        Ok(Response::new(queue_row_to_proto(&row)))
    }

    async fn list_criteria(
        &self,
        request: Request<ListCriteriaRequest>,
    ) -> Result<Response<ListCriteriaResponse>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let user = self.get_user(&user_id).await?;
        self.require_moderator(&user)?;

        let rows: Vec<ModerationCriterionRow> = sqlx::query_as(
            "SELECT id, name, description, is_active, evaluation_type, evaluation_order, created_at, updated_at
             FROM moderation_criteria
             ORDER BY evaluation_order"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] criteria query failed: {}", err)))?;

        let criteria = rows.iter().map(criterion_row_to_proto).collect();

        Ok(Response::new(ListCriteriaResponse { criteria }))
    }

    async fn create_criterion(
        &self,
        request: Request<CreateCriterionRequest>,
    ) -> Result<Response<ModerationCriterionProto>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let user = self.get_user(&user_id).await?;
        self.require_moderator(&user)?;

        let req = request.into_inner();

        if req.name.is_empty() {
            return Err(Status::invalid_argument("name is required"));
        }

        let eval_type = match crate::proto::EvaluationType::try_from(req.evaluation_type) {
            Ok(crate::proto::EvaluationType::EvaluationManual) => "manual",
            _ => "auto",
        };

        let criterion_id = Uuid::new_v4().to_string();

        let row: ModerationCriterionRow = sqlx::query_as(
            "INSERT INTO moderation_criteria (id, name, description, evaluation_type, evaluation_order)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, description, is_active, evaluation_type, evaluation_order, created_at, updated_at"
        )
        .bind(&criterion_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(eval_type)
        .bind(req.evaluation_order)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] criterion insert failed: {}", err)))?;

        Ok(Response::new(criterion_row_to_proto(&row)))
    }

    async fn update_criterion(
        &self,
        request: Request<UpdateCriterionRequest>,
    ) -> Result<Response<ModerationCriterionProto>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let user = self.get_user(&user_id).await?;
        self.require_moderator(&user)?;

        let req = request.into_inner();

        if req.id.is_empty() {
            return Err(Status::invalid_argument("id is required"));
        }

        let existing: ModerationCriterionRow = sqlx::query_as(
            "SELECT id, name, description, is_active, evaluation_type, evaluation_order, created_at, updated_at
             FROM moderation_criteria WHERE id = $1"
        )
        .bind(&req.id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] query failed: {}", err)))?
        .ok_or_else(|| Status::not_found("criterion not found"))?;

        let name = req.name.unwrap_or(existing.name);
        let description = req.description.unwrap_or(existing.description);
        let is_active = req.is_active.unwrap_or(existing.is_active);
        let evaluation_order = req.evaluation_order.unwrap_or(existing.evaluation_order);

        let row: ModerationCriterionRow = sqlx::query_as(
            "UPDATE moderation_criteria SET name = $2, description = $3, is_active = $4,
                    evaluation_order = $5, updated_at = NOW()
             WHERE id = $1
             RETURNING id, name, description, is_active, evaluation_type, evaluation_order, created_at, updated_at"
        )
        .bind(&req.id)
        .bind(&name)
        .bind(&description)
        .bind(is_active)
        .bind(evaluation_order)
        .fetch_one(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] update failed: {}", err)))?;

        Ok(Response::new(criterion_row_to_proto(&row)))
    }

    async fn rerun_moderation(
        &self,
        request: Request<RerunModerationRequest>,
    ) -> Result<Response<ModerationResultProto>, Status> {
        let user_id = interceptor::require_auth(&request, &self.jwt_secret)?;
        let user = self.get_user(&user_id).await?;
        self.require_moderator(&user)?;

        let req = request.into_inner();

        if req.lesson_plan_id.is_empty() {
            return Err(Status::invalid_argument("lesson_plan_id is required"));
        }

        let plan_row: LessonPlanRow = sqlx::query_as(
            "SELECT id, author_id, title, description, grade_level, subject, activity_type,
                    duration_minutes, materials, instructions, objectives, status, scope,
                    quarantine_status, vote_count, view_count, fork_count, forked_from_id,
                    family_id, published_at, created_at, updated_at
             FROM lesson_plans WHERE id = $1"
        )
        .bind(&req.lesson_plan_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] plan query failed: {}", err)))?
        .ok_or_else(|| Status::not_found("lesson plan not found"))?;

        let plan_for_mod = LessonPlanForModeration::from(&plan_row);

        // Load active auto criteria
        let active_criteria: Vec<(String,)> = sqlx::query_as(
            "SELECT id FROM moderation_criteria WHERE is_active = true AND evaluation_type = 'auto'
             ORDER BY evaluation_order"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|err| Status::internal(format!("[ModerationService] criteria query failed: {}", err)))?;

        let active_ids: Vec<String> = active_criteria.into_iter().map(|r| r.0).collect();
        let engine = build_default_engine(&active_ids);
        let engine_result = engine.evaluate(&plan_for_mod);

        // Save results
        let mut results: Vec<CriterionResultMessage> = Vec::new();
        for result in &engine_result.results {
            let result_id = Uuid::new_v4().to_string();
            let _ = sqlx::query(
                "INSERT INTO moderation_results (id, lesson_plan_id, criterion_id, passed, reason, evaluated_by)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (lesson_plan_id, criterion_id) DO UPDATE SET passed = $4, reason = $5, evaluated_by = $6, evaluated_at = NOW()"
            )
            .bind(&result_id)
            .bind(&req.lesson_plan_id)
            .bind(&result.criterion_id)
            .bind(result.passed)
            .bind(&result.reason)
            .bind(&user_id)
            .execute(&self.pool)
            .await;

            results.push(CriterionResultMessage {
                criterion_id: result.criterion_id.clone(),
                criterion_name: result.criterion_name.clone(),
                passed: result.passed,
                reason: result.reason.clone(),
            });
        }

        Ok(Response::new(ModerationResultProto {
            lesson_plan_id: req.lesson_plan_id,
            all_passed: engine_result.all_passed,
            results,
        }))
    }
}
