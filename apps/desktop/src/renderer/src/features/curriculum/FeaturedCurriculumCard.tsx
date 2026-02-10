/**
 * Featured Curriculum Card Component
 *
 * Display card for featured curriculum sponsors with "Learn More" and "Quick Add" actions
 * Tracks clicks when user interacts with sponsored curriculum
 */

import { sponsoredTracking } from "../../services/sponsoredTracking";
import type { SponsoredResource } from "../../../../shared/types";
import { Button } from "../../components/ui/Button";

interface FeaturedCurriculumCardProps {
  curriculum: SponsoredResource;
  onQuickAdd: (curriculum: SponsoredResource) => void;
  onLearnMore: (curriculum: SponsoredResource) => void;
}

export function FeaturedCurriculumCard({
  curriculum,
  onQuickAdd,
  onLearnMore,
}: FeaturedCurriculumCardProps) {
  const handleLearnMore = async () => {
    // Track click and open sponsor website
    await sponsoredTracking.trackClick(curriculum.id, "curriculum_page");
    onLearnMore(curriculum);
  };

  const handleQuickAdd = async () => {
    // Track click when adding to curriculum list
    await sponsoredTracking.trackClick(curriculum.id, "curriculum_page");
    onQuickAdd(curriculum);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Curriculum logo/icon */}
      <div className="flex items-center gap-3 mb-3">
        {curriculum.icon && (
          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-2xl">
            {curriculum.icon}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{curriculum.name}</h4>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {curriculum.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {curriculum.subjects.slice(0, 3).map((subject) => (
          <span
            key={subject}
            className="text-xs bg-brand-primaryLight text-brand-primaryDark px-2 py-0.5 rounded"
          >
            {subject}
          </span>
        ))}
        {curriculum.gradeLevels.length > 0 && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {curriculum.gradeLevels[0]}-
            {curriculum.gradeLevels[curriculum.gradeLevels.length - 1]}
          </span>
        )}
      </div>

      {/* Pricing */}
      {curriculum.pricingInfo && (
        <p className="text-sm font-medium text-brand-primary mb-3">
          {curriculum.pricingInfo}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleLearnMore} className="flex-1" size="sm">
          Learn More
        </Button>
        <Button
          onClick={handleQuickAdd}
          variant="outline"
          size="sm"
          title="Add to your curriculum list"
        >
          + Add
        </Button>
      </div>
    </div>
  );
}
