/**
 * ProgressBar - Animated progress bar with gradient
 */

interface ProgressBarProps {
  percentage: number;
  variant?: "primary" | "success" | "warning";
}

export function ProgressBar({
  percentage,
  variant = "primary",
}: ProgressBarProps) {
  const variantClasses = {
    primary: "bg-gradient-to-r from-brand-primary to-student-purple-500",
    success: "bg-gradient-to-r from-status-success to-status-successLight",
    warning: "bg-gradient-to-r from-status-warning to-status-warningLight",
  };

  return (
    <div className="w-full bg-white/50 rounded-full h-3">
      <div
        className={`h-3 rounded-full transition-all duration-500 ${variantClasses[variant]}`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
}
