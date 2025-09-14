import { ReactNode } from "react";

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

function GlassButton({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "md", 
  disabled = false, 
  className = "",
  icon 
}: GlassButtonProps): JSX.Element {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base", 
    lg: "px-8 py-4 text-lg"
  };

  const variantStyles = {
    primary: {
      background: "rgba(140, 125, 209, 0.1)",
      borderColor: "#8C7DD1",
      color: "white"
    },
    secondary: {
      background: "var(--glass-bg)",
      borderColor: "var(--glass-border)", 
      color: "white"
    },
    danger: {
      background: "rgba(239, 68, 68, 0.1)",
      borderColor: "#ef4444",
      color: "white"
    },
    success: {
      background: "rgba(16, 185, 129, 0.1)",
      borderColor: "#10b981",
      color: "white"
    }
  };

  return (
    <button
      className={`
        backdrop-blur-sm rounded-xl border font-medium
        transition-all duration-300 hover:backdrop-blur-md
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:scale-105'} 
        ${sizeClasses[size]} 
        ${className}
        flex items-center justify-center gap-2
      `}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: variantStyles[variant].background,
        borderColor: variantStyles[variant].borderColor,
        color: variantStyles[variant].color,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 30px rgba(255, 255, 255, 0.03) inset, 0 2px 16px rgba(140, 125, 209, 0.08)'
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

export default GlassButton;