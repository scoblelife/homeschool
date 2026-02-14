use crate::models::LessonPlanForModeration;
use crate::moderation::engine::{Criterion, CriterionResult};

/// Basic keyword-based profanity filter.
/// In production, replace with a real profanity detection service.
pub struct ProfanityFilter {
    blocklist: Vec<String>,
}

impl ProfanityFilter {
    pub fn new() -> Self {
        // Minimal example blocklist — expand as needed
        let blocklist = vec![
            "damn".to_string(),
            "hell".to_string(),
            "crap".to_string(),
        ];
        Self { blocklist }
    }
}

impl Criterion for ProfanityFilter {
    fn id(&self) -> &str {
        "crit_profanity"
    }

    fn name(&self) -> &str {
        "Profanity Filter"
    }

    fn evaluate(&self, plan: &LessonPlanForModeration) -> CriterionResult {
        let text_combined = format!(
            "{} {} {}",
            plan.title.to_lowercase(),
            plan.description.to_lowercase(),
            plan.instructions.to_lowercase()
        );

        let mut found_words: Vec<String> = Vec::new();
        for word in &self.blocklist {
            if text_combined.contains(word.as_str()) {
                found_words.push(word.clone());
            }
        }

        let passed = found_words.is_empty();
        let reason = if passed {
            None
        } else {
            Some(format!("contains blocked words: {}", found_words.join(", ")))
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

    fn make_plan(title: &str, description: &str, instructions: &str) -> LessonPlanForModeration {
        LessonPlanForModeration {
            id: "test".to_string(),
            title: title.to_string(),
            description: description.to_string(),
            instructions: instructions.to_string(),
            objectives: vec![],
            materials: vec![],
        }
    }

    #[test]
    fn test_passes_clean_content() {
        let plan = make_plan("Math Lesson", "A great lesson about math", "Practice addition");
        let result = ProfanityFilter::new().evaluate(&plan);
        assert!(result.passed);
    }

    #[test]
    fn test_fails_profanity_in_title() {
        let plan = make_plan("What the hell", "A great lesson", "Practice things");
        let result = ProfanityFilter::new().evaluate(&plan);
        assert!(!result.passed);
        assert!(result.reason.unwrap().contains("hell"));
    }
}
