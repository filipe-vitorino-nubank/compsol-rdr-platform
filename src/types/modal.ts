export type ModalType = "error" | "warning" | "success" | "info" | "confirm";

export interface ModalConfig {
  type: ModalType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
