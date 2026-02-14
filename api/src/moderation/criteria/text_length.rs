use crate::models::LessonPlanForModeration;
use crate::moderation::engine::{Criterion, CriterionResult};

const INSTRUCTIONS_LENGTH_MIN: usize = 50;

pub struct TextLength;

impl Criterion for TextLength {
    fn id(&self) -> &str {
        "crit_text_length"
    }

    fn name(&self) -> &str {
        "Text Length"
    }

    fn evaluate(&self, plan: &LessonPlanForModeration) -> CriterionResult {
        let passed = plan.instructions.len() >= INSTRUCTIONS_LENGTH_MIN;
        let reason = if passed {
            None
        } else {
            Some(format!(
                "instructions must be at least {} characters (got {})",
                INSTRUCTIONS_LENGTH_MIN,
                plan.instructions.len()
            ))
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

    fn make_plan(instructions: &str) -> LessonPlanForModeration {
        LessonPlanForModeration {
            id: "test".to_string(),
            title: "Test Plan".to_string(),
            description: "Test description".to_string(),
            instructions: instructions.to_string(),
            objectives: vec!["Learn".to_string()],
            materials: vec![],
        }
    }

    #[test]
    fn test_passes_long_instructions() {
        let plan = make_plan("This is a sufficiently long set of instructions for a lesson plan that meets the minimum.");
        let result = TextLength.evaluate(&plan);
        assert!(result.passed);
    }

    #[test]
    fn test_fails_short_instructions() {
        let plan = make_plan("Too short");
        let result = TextLength.evaluate(&plan);
        assert!(!result.passed);
        assert!(result.reason.unwrap().contains("instructions"));
    }
}
