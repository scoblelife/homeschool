#![allow(dead_code)]

use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, FromRow)]
pub struct UserRow {
    pub id: String,
    pub display_name: String,
    pub email: String,
    pub password_hash: String,
    pub is_verified: bool,
    pub is_moderator: bool,
    pub is_banned: bool,
    pub family_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct LessonPlanRow {
    pub id: String,
    pub author_id: String,
    pub title: String,
    pub description: String,
    pub grade_level: String,
    pub subject: String,
    pub activity_type: String,
    pub duration_minutes: i32,
    pub materials: Vec<String>,
    pub instructions: String,
    pub objectives: Vec<String>,
    pub status: String,
    pub scope: String,
    pub quarantine_status: String,
    pub vote_count: i32,
    pub view_count: i32,
    pub fork_count: i32,
    pub forked_from_id: Option<String>,
    pub family_id: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct TagRow {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub usage_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct CommentWithAuthorRow {
    pub id: String,
    pub user_id: String,
    pub lesson_plan_id: String,
    pub parent_comment_id: Option<String>,
    pub content: String,
    pub author_display_name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct ModerationQueueRow {
    pub id: String,
    pub content_type: String,
    pub content_id: String,
    pub reported_by: Option<String>,
    pub reason: Option<String>,
    pub auto_flagged: bool,
    pub moderator_id: Option<String>,
    pub resolution: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct ModerationCriterionRow {
    pub id: String,
    pub name: String,
    pub description: String,
    pub is_active: bool,
    pub evaluation_type: String,
    pub evaluation_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct CollectionWithCountRow {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub item_count: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct RefreshTokenRow {
    pub id: String,
    pub user_id: String,
    pub token_hash: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct CountRow {
    pub count: i64,
}

/// Data passed to the moderation engine for evaluation
#[derive(Debug, Clone)]
pub struct LessonPlanForModeration {
    pub id: String,
    pub title: String,
    pub description: String,
    pub instructions: String,
    pub objectives: Vec<String>,
    pub materials: Vec<String>,
}

impl From<&LessonPlanRow> for LessonPlanForModeration {
    fn from(row: &LessonPlanRow) -> Self {
        Self {
            id: row.id.clone(),
            title: row.title.clone(),
            description: row.description.clone(),
            instructions: row.instructions.clone(),
            objectives: row.objectives.clone(),
            materials: row.materials.clone(),
        }
    }
}
