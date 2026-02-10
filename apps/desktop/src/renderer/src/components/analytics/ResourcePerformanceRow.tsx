/**
 * ResourcePerformanceRow - Display row for resource click performance
 */

interface ResourcePerformanceRowProps {
  resourceName: string;
  clicks: number;
  totalClicks: number;
}

export function ResourcePerformanceRow({
  resourceName,
  clicks,
  totalClicks,
}: ResourcePerformanceRowProps) {
  const percentage = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0;

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{resourceName}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">{clicks} clicks</div>
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div
            className="bg-brand-primary h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-sm font-medium text-gray-900 w-12 text-right">
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
