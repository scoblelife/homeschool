use crate::models::LessonPlanForModeration;

/// Result of evaluating a single criterion
#[derive(Debug, Clone)]
pub struct CriterionResult {
    pub criterion_id: String,
    pub criterion_name: String,
    pub passed: bool,
    pub reason: Option<String>,
}

/// Result of evaluating all criteria
#[derive(Debug)]
pub struct EngineResult {
    pub all_passed: bool,
    pub results: Vec<CriterionResult>,
}

/// Trait for individual moderation criteria
pub trait Criterion: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn evaluate(&self, plan: &LessonPlanForModeration) -> CriterionResult;
}

/// Moderation engine that runs all registered criteria against a lesson plan
pub struct ModerationEngine {
    criteria: Vec<Box<dyn Criterion>>,
}

impl ModerationEngine {
    pub fn new() -> Self {
        Self {
            criteria: Vec::new(),
        }
    }

    pub fn register(&mut self, criterion: Box<dyn Criterion>) {
        self.criteria.push(criterion);
    }

    /// Evaluate a lesson plan against all registered criteria.
    /// Returns results for each criterion and whether all passed.
    pub fn evaluate(&self, plan: &LessonPlanForModeration) -> EngineResult {
        let mut results = Vec::with_capacity(self.criteria.len());
        let mut all_passed = true;

        for criterion in &self.criteria {
            let result = criterion.evaluate(plan);
            if !result.passed {
                all_passed = false;
            }
            results.push(result);
        }

        EngineResult {
            all_passed,
            results,
        }
    }

    #[allow(dead_code)]
    pub fn criteria_count(&self) -> usize {
        self.criteria.len()
    }
}

/// Build a default engine with standard criteria
pub fn build_default_engine(active_criteria_ids: &[String]) -> ModerationEngine {
    use crate::moderation::criteria::{
        duplicate_detection::DuplicateDetection,
        profanity_filter::ProfanityFilter,
        required_fields::RequiredFields,
        text_length::TextLength,
    };

    let mut engine = ModerationEngine::new();

    let all_criteria: Vec<Box<dyn Criterion>> = vec![
        Box::new(RequiredFields),
        Box::new(TextLength),
        Box::new(ProfanityFilter::new()),
        Box::new(DuplicateDetection),
    ];

    for criterion in all_criteria {
        if active_criteria_ids.contains(&criterion.id().to_string()) {
            engine.register(criterion);
        }
    }

    engine
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_all_pass() {
        let mut engine = ModerationEngine::new();
        engine.register(Box::new(crate::moderation::criteria::required_fields::RequiredFields));
        engine.register(Box::new(crate::moderation::criteria::text_length::TextLength));

        let plan = LessonPlanForModeration {
            id: "test".to_string(),
            title: "My Great Lesson Plan".to_string(),
            description: "A detailed description of a great lesson plan for students".to_string(),
            instructions: "Step one: do this. Step two: do that. Step three: review and discuss the results together as a class.".to_string(),
            objectives: vec!["Learn math".to_string()],
            materials: vec!["Pencil".to_string()],
        };

        let result = engine.evaluate(&plan);
        assert!(result.all_passed);
        assert_eq!(result.results.len(), 2);
    }

    #[test]
    fn test_engine_some_fail() {
        let mut engine = ModerationEngine::new();
        engine.register(Box::new(crate::moderation::criteria::required_fields::RequiredFields));

        let plan = LessonPlanForModeration {
            id: "test".to_string(),
            title: "Hi".to_string(), // Too short
            description: "Short".to_string(), // Too short
            instructions: "Do stuff".to_string(),
            objectives: vec![],
            materials: vec![],
        };

        let result = engine.evaluate(&plan);
        assert!(!result.all_passed);
    }
}
