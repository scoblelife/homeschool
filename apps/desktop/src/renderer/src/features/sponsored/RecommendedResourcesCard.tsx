/**
 * Recommended Resources Card Component
 *
 * Dashboard widget showing personalized sponsored resource recommendations
 * Matches resources to student's grade level
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SponsoredResourceCard } from "./SponsoredResourceCard";
import { Card } from "../../components/ui/Card";
import type { SponsoredResource } from "../../../../shared/types";

interface RecommendedResourcesCardProps {
  studentId: string;
  studentName: string;
  gradeLevel: string;
}

export function RecommendedResourcesCard({
  studentId,
  studentName,
  gradeLevel,
}: RecommendedResourcesCardProps) {
  const [recommendations, setRecommendations] = useState<SponsoredResource[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [studentId, gradeLevel]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Get recommended sponsored resources matched to student's grade level
      const sponsored = await window.api.getSponsoredResources({
        gradeLevels: [gradeLevel],
        location: "dashboard",
        limit: 3,
      });

      setRecommendations(sponsored);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || recommendations.length === 0) return null;

  return (
    <Card className="bg-gradient-to-r from-student-purple-50 to-brand-primaryLight border-brand-primaryLight">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-brand-primary" />
            Recommended for {studentName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resources matched to their learning level
          </p>
        </div>
        <span className="text-xs text-gray-500">Sponsored</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((resource) => (
          <SponsoredResourceCard
            key={resource.id}
            resource={resource}
            location="dashboard"
            compact
          />
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link
          to="/resources"
          className="text-sm text-brand-primary hover:text-brand-primaryDark font-medium"
        >
          View All Resources →
        </Link>
      </div>
    </Card>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
