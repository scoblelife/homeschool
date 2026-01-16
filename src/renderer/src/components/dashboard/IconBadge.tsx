/**
 * IconBadge - Circular icon container for dashboard widgets
 */

interface IconBadgeProps {
  icon: React.ReactNode;
  variant?: "blue" | "purple" | "success" | "warning" | "primary";
  size?: "sm" | "md" | "lg";
}

export function IconBadge({
  icon,
  variant = "primary",
  size = "md",
}: IconBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-10 h-10 text-xl",
    lg: "w-12 h-12 text-2xl",
  };

  const variantClasses = {
    blue: "bg-student-blue-100",
    purple: "bg-student-purple-100",
    success: "bg-status-successLight",
    warning: "bg-status-warningLight",
    primary: "bg-brand-primaryLight",
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {icon}
    </div>
  );
}
