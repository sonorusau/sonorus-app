import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "sm" | "md" | "lg";
}

function GlassCard({
  children,
  className = "",
  onClick,
  padding = "md",
}: GlassCardProps): JSX.Element {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`backdrop-blur-md rounded-2xl border transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--glass-border)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 255, 255, 0.02) inset, 0 2px 16px rgba(140, 125, 209, 0.1)",
      }}
    >
      {children}
    </div>
  );
}

export default GlassCard;
