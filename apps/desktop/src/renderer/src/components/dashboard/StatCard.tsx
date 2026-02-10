/**
 * StatCard - Quick stat display with icon
 */

import { Card } from "../ui/Card";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBgColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  iconBgColor = "bg-student-blue-100",
}: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center text-xl`}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </Card>
  );
}
