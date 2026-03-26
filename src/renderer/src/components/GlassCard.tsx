import { ReactNode, CSSProperties } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "subtle" | "default" | "elevated" | "prominent";
  style?: CSSProperties;
}

function GlassCard({
  children,
  className = "",
  onClick,
  padding = "md",
  variant = "default",
  style,
}: GlassCardProps): JSX.Element {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const variantStyles: Record<string, CSSProperties> = {
    subtle: {
      background: "var(--glass-bg-subtle)",
      borderColor: "var(--glass-border-subtle)",
      boxShadow: "var(--glass-shadow-sm)",
      backdropFilter: "blur(var(--glass-blur-sm))",
      WebkitBackdropFilter: "blur(var(--glass-blur-sm))",
    },
    default: {
      background: "var(--glass-bg-default)",
      borderColor: "var(--glass-border-default)",
      boxShadow: "var(--glass-shadow-md)",
      backdropFilter: "blur(var(--glass-blur-md))",
      WebkitBackdropFilter: "blur(var(--glass-blur-md))",
    },
    elevated: {
      background: "var(--glass-bg-elevated)",
      borderColor: "var(--glass-border-default)",
      boxShadow: "var(--glass-shadow-lg)",
      backdropFilter: "blur(var(--glass-blur-lg))",
      WebkitBackdropFilter: "blur(var(--glass-blur-lg))",
    },
    prominent: {
      background: "var(--glass-bg-prominent)",
      borderColor: "var(--glass-border-prominent)",
      boxShadow: "var(--glass-shadow-lg), var(--glass-shadow-glow)",
      backdropFilter: "blur(var(--glass-blur-xl))",
      WebkitBackdropFilter: "blur(var(--glass-blur-xl))",
    },
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${onClick ? "cursor-pointer hover:scale-[1.02]" : ""} ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
      style={{
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default GlassCard;
