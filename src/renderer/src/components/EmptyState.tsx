import React, { ReactNode } from "react";
import {
  HeartOutlined,
  UserOutlined,
  FileOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import GlassButton from "./GlassButton";

type EmptyStateType = "patients" | "recordings" | "files" | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const defaultContent: Record<EmptyStateType, { icon: ReactNode; title: string; description: string }> = {
  patients: {
    icon: <UserOutlined style={{ fontSize: 48 }} />,
    title: "No patients yet",
    description: "Add your first patient to start recording heart sounds and tracking their cardiac health.",
  },
  recordings: {
    icon: <HeartOutlined style={{ fontSize: 48 }} />,
    title: "No recordings found",
    description: "Start a new recording session to capture heart sounds for this patient.",
  },
  files: {
    icon: <FileOutlined style={{ fontSize: 48 }} />,
    title: "No files available",
    description: "Upload or import files to get started.",
  },
  generic: {
    icon: <InboxOutlined style={{ fontSize: 48 }} />,
    title: "Nothing here yet",
    description: "This area is empty. Take an action to add content.",
  },
};

function EmptyState({
  type = "generic",
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps): JSX.Element {
  const defaults = defaultContent[type];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {/* Icon with subtle hover animation */}
      <div className="mb-6 text-white/20 transition-transform duration-300 hover:scale-110 hover:text-white/30">
        {icon || defaults.icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2 text-heading">
        {title || defaults.title}
      </h3>

      {/* Description */}
      <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
        {description || defaults.description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <GlassButton variant="primary" onClick={onAction}>
          {actionLabel}
        </GlassButton>
      )}
    </div>
  );
}

export default EmptyState;

