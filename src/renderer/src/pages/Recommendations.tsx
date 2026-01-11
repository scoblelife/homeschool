import { CurriculumRecommendations, useRecommendationsStore } from '../features/recommendations'

export default function Recommendations() {
  const { savedRecommendations } = useRecommendationsStore()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Curriculum Recommendations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Discover popular homeschool curricula organized by subject, grade level, teaching style, and price.
          {savedRecommendations.length > 0 && (
            <span className="ml-2 text-indigo-600 dark:text-indigo-400">
              {savedRecommendations.length} saved
            </span>
          )}
        </p>
      </div>

      {/* Quick Help */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Finding the Right Curriculum
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>Complete Curriculum</strong> - All-in-one packages covering multiple subjects</li>
          <li>• <strong>Single Subject</strong> - Focused programs for specific areas like math or reading</li>
          <li>• <strong>Supplement</strong> - Materials to enhance your main curriculum</li>
          <li>• Click "Details" on any card to see pros, cons, and who it's best for</li>
        </ul>
      </div>

      <CurriculumRecommendations />

      {/* Footer info */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          These are independent recommendations. We are not affiliated with any curriculum publishers.
          Always research thoroughly before making a purchase decision.
        </p>
      </div>
    </div>
  )
}
