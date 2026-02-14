use crate::models::LessonPlanForModeration;
use crate::moderation::engine::{Criterion, CriterionResult};

/// Duplicate detection based on title similarity.
/// In production, this would query the database using pg_trgm similarity.
/// For now, it always passes — actual duplicate checking happens in the
/// service layer via SQL queries.
pub struct DuplicateDetection;

impl Criterion for DuplicateDetection {
    fn id(&self) -> &str {
        "crit_duplicate"
    }

    fn name(&self) -> &str {
        "Duplicate Detection"
    }

    fn evaluate(&self, _plan: &LessonPlanForModeration) -> CriterionResult {
        // Duplicate detection requires database access.
        // The actual check runs in lesson_plan_service.rs via SQL:
        //   SELECT id, title, similarity(title, $1) AS sim
        //   FROM lesson_plans WHERE similarity(title, $1) > 0.5
        //
        // This criterion passes by default; the service layer handles
        // the database-dependent duplicate check separately.
        CriterionResult {
            criterion_id: self.id().to_string(),
            criterion_name: self.name().to_string(),
            passed: true,
            reason: None,
        }
    }
}
