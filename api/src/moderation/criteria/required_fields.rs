use crate::models::LessonPlanForModeration;
use crate::moderation::engine::{Criterion, CriterionResult};

const TITLE_LENGTH_MIN: usize = 5;
const DESCRIPTION_LENGTH_MIN: usize = 20;
const OBJECTIVES_COUNT_MIN: usize = 1;

pub struct RequiredFields;

impl Criterion for RequiredFields {
    fn id(&self) -> &str {
        "crit_required_fields"
    }

    fn name(&self) -> &str {
        "Required Fields"
    }

    fn evaluate(&self, plan: &LessonPlanForModeration) -> CriterionResult {
        let mut failures: Vec<String> = Vec::new();

        if plan.title.len() < TITLE_LENGTH_MIN {
            failures.push(format!(
                "title must be at least {} characters (got {})",
                TITLE_LENGTH_MIN,
                plan.title.len()
            ));
        }

        if plan.description.len() < DESCRIPTION_LENGTH_MIN {
            failures.push(format!(
                "description must be at least {} characters (got {})",
                DESCRIPTION_LENGTH_MIN,
                plan.description.len()
            ));
        }

        if plan.objectives.len() < OBJECTIVES_COUNT_MIN {
            failures.push("at least 1 objective is required".to_string());
        }

        let passed = failures.is_empty();
        let reason = if passed {
            None
        } else {
            Some(failures.join("; "))
        };

        CriterionResult {
            criterion_id: self.id().to_string(),
            criterion_name: self.name().to_string(),
            passed,
            reason,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_plan(title: &str, description: &str, objectives: Vec<String>) -> LessonPlanForModeration {
        LessonPlanForModeration {
            id: "test".to_string(),
            title: title.to_string(),
            description: description.to_string(),
            instructions: "Some instructions here".to_string(),
            objectives,
            materials: vec![],
        }
    }

    #[test]
    fn test_passes_valid_plan() {
        let plan = make_plan(
            "Great Lesson",
            "A sufficiently long description for testing",
            vec!["Learn something".to_string()],
        );
        let result = RequiredFields.evaluate(&plan);
        assert!(result.passed);
        assert!(result.reason.is_none());
    }

    #[test]
    fn test_fails_short_title() {
        let plan = make_plan(
            "Hi",
            "A sufficiently long description for testing",
            vec!["Learn something".to_string()],
        );
        let result = RequiredFields.evaluate(&plan);
        assert!(!result.passed);
        assert!(result.reason.unwrap().contains("title"));
    }

    #[test]
    fn test_fails_no_objectives() {
        let plan = make_plan(
            "Great Lesson",
            "A sufficiently long description for testing",
            vec![],
        );
        let result = RequiredFields.evaluate(&plan);
        assert!(!result.passed);
        assert!(result.reason.unwrap().contains("objective"));
    }
}
