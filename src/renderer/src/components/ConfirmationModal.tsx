import React from "react";
import { Modal } from "antd";
import GlassCard from "./GlassCard";
import GlassButton from "./GlassButton";
import { ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";

interface ConfirmationModalProps {
  open: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  title: string;
  content: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

function ConfirmationModal({
  open,
  onConfirm,
  onCancel,
  title,
  content,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  loading = false,
}: ConfirmationModalProps): JSX.Element {
  const getIcon = () => {
    switch (type) {
      case "danger":
        return <ExclamationCircleOutlined className="text-red-500 text-xl" />;
      case "warning":
        return <WarningOutlined className="text-yellow-500 text-xl" />;
      default:
        return <InfoCircleOutlined className="text-blue-500 text-xl" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case "danger":
        return "danger" as const;
      case "warning":
        return "secondary" as const;
      default:
        return "primary" as const;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={480}
      maskStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
      }}
      style={{
        top: "50%",
        transform: "translateY(-50%)",
      }}
      bodyStyle={{
        padding: 0,
        background: "transparent",
      }}
      className="confirmation-modal"
    >
      <GlassCard padding="lg" className="confirmation-modal-content">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 mt-1">{getIcon()}</div>
          <div className="flex-1">
            <h3 className="text-white text-xl font-semibold mb-4">{title}</h3>
            <div className="text-white/90">{content}</div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <GlassButton
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </GlassButton>
          <GlassButton
            variant={getConfirmButtonVariant()}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </GlassButton>
        </div>
      </GlassCard>
    </Modal>
  );
}

export default ConfirmationModal;