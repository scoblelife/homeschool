import {
  CurriculumRecommendations,
  useRecommendationsStore,
} from "../features/recommendations";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";

export default function Recommendations() {
  const { savedRecommendations } = useRecommendationsStore();

  return (
    <PageContainer>
      <PageHeader
        title="Curriculum Recommendations"
        subtitle={
          <>
            Discover popular homeschool curricula organized by subject, grade
            level, teaching style, and price.
            {savedRecommendations.length > 0 && (
              <span className="ml-2 text-brand-primary">
                {savedRecommendations.length} saved
              </span>
            )}
          </>
        }
      />

      {/* Quick Help */}
      <div
        className={`mb-6 p-4 bg-student-blue-50 border border-student-blue-200 rounded-lg`}
      >
        <h3 className="font-medium text-student-blue-900 mb-2">
          Finding the Right Curriculum
        </h3>
        <ul className="text-sm text-student-blue-700 space-y-1">
          <li>
            • <strong>Complete Curriculum</strong> - All-in-one packages
            covering multiple subjects
          </li>
          <li>
            • <strong>Single Subject</strong> - Focused programs for specific
            areas like math or reading
          </li>
          <li>
            • <strong>Supplement</strong> - Materials to enhance your main
            curriculum
          </li>
          <li>
            • Click "Details" on any card to see pros, cons, and who it's best
            for
          </li>
        </ul>
      </div>

      <CurriculumRecommendations />

      {/* Footer info */}
      <div className="mt-8 pt-6 border-t border-neutral-border">
        <p className="text-sm text-neutral-textSecondary text-center">
          These are independent recommendations. We are not affiliated with any
          curriculum publishers. Always research thoroughly before making a
          purchase decision.
        </p>
      </div>
    </PageContainer>
  );
}
