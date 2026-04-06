import { ReactNode, CSSProperties } from "react";

interface GlassButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
  loading?: boolean;
}

function GlassButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  icon,
  type = "button",
  loading = false,
}: GlassButtonProps): JSX.Element {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-base gap-2",
    lg: "px-7 py-3.5 text-lg gap-2.5",
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      background: "rgba(116, 74, 161, 0.2)",
      borderColor: "rgb(116, 74, 161)",
    },
    secondary: {
      background: "var(--glass-bg-default)",
      borderColor: "var(--glass-border-default)",
    },
    danger: {
      background: "rgba(143, 15, 34, 0.15)",
      borderColor: "rgb(143, 15, 34)",
    },
    success: {
      background: "rgba(114, 197, 133, 0.15)",
      borderColor: "rgb(114, 197, 133)",
    },
    ghost: {
      background: "transparent",
      borderColor: "transparent",
    },
  };

  const hoverClasses: Record<string, string> = {
    primary:
      "hover:bg-[rgba(116,74,161,0.35)] hover:shadow-[0_0_20px_rgba(116,74,161,0.4)]",
    secondary:
      "hover:bg-[var(--glass-bg-elevated)] hover:border-[var(--glass-border-prominent)]",
    danger:
      "hover:bg-[rgba(143,15,34,0.3)] hover:shadow-[0_0_20px_rgba(143,15,34,0.3)]",
    success:
      "hover:bg-[rgba(114,197,133,0.3)] hover:shadow-[0_0_20px_rgba(114,197,133,0.3)]",
    ghost: "hover:bg-[var(--glass-bg-subtle)]",
  };

  return (
    <button
      type={type}
      className={`
        rounded-xl border font-medium text-white
        backdrop-blur-sm transition-all duration-200
        flex items-center justify-center
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : `cursor-pointer active:scale-[0.97] ${hoverClasses[variant]}`}
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      style={variantStyles[variant]}
    >
      {loading ? (
        <span className="animate-spin mr-2">⟳</span>
      ) : icon && <span className="flex-shrink-0">{icon}</span>}
      {loading ? "Loading..." : children}
    </button>
  );
}

export default GlassButton;
