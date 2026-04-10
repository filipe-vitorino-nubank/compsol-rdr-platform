import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ModalConfig, ModalType } from "../types/modal";

interface ModalContextValue {
  showModal: (config: ModalConfig) => void;
  closeModal: () => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string, onConfirm?: () => void) => void;
  success: (title: string, message: string, onConfirm?: () => void) => void;
  info: (title: string, message: string) => void;
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

const MODAL_THEME: Record<
  ModalType,
  {
    iconBg: string;
    iconColor: string;
    titleColor: string;
    btnBg: string;
    icon: ReactNode;
  }
> = {
  error: {
    iconBg: "rgba(220,38,38,0.1)",
    iconColor: "var(--danger)",
    titleColor: "var(--danger)",
    btnBg: "var(--danger)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  warning: {
    iconBg: "rgba(220,38,38,0.1)",
    iconColor: "var(--danger)",
    titleColor: "var(--danger)",
    btnBg: "var(--danger)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  success: {
    iconBg: "rgba(0,168,104,0.1)",
    iconColor: "var(--success)",
    titleColor: "var(--color-ink)",
    btnBg: "var(--success)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  info: {
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple-600)",
    titleColor: "var(--color-ink)",
    btnBg: "var(--purple-600)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  confirm: {
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple-600)",
    titleColor: "var(--color-ink)",
    btnBg: "var(--purple-600)",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
};

function FeedbackModal({
  config,
  setModal,
}: {
  config: ModalConfig;
  setModal: React.Dispatch<React.SetStateAction<ModalConfig | null>>;
}) {
  const theme = MODAL_THEME[config.type];

  const dismiss = () => setModal(null);

  return (
    <div
      className="feedback-overlay"
      onClick={() => { config.onCancel?.(); dismiss(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-icon" style={{ background: theme.iconBg, color: theme.iconColor }}>
          {theme.icon}
        </div>

        <h3 className="feedback-title" style={{ color: theme.titleColor }}>
          {config.title}
        </h3>

        <p className="feedback-message">{config.message}</p>

        <div className="feedback-actions">
          <button
            type="button"
            className="feedback-btn-primary"
            style={{ background: theme.btnBg }}
            onClick={() => { config.onConfirm?.(); dismiss(); }}
          >
            {config.confirmLabel || "OK"}
          </button>

          {config.cancelLabel && (
            <button
              type="button"
              className="feedback-btn-cancel"
              onClick={() => { config.onCancel?.(); dismiss(); }}
            >
              {config.cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalConfig | null>(null);

  const closeModal = useCallback(() => setModal(null), []);

  const showModal = useCallback((config: ModalConfig) => setModal(config), []);

  const error = useCallback(
    (title: string, message: string) =>
      showModal({ type: "error", title, message, confirmLabel: "Entendido" }),
    [showModal],
  );

  const warning = useCallback(
    (title: string, message: string, onConfirm?: () => void) =>
      showModal({ type: "warning", title, message, confirmLabel: "OK, vou corrigir", onConfirm }),
    [showModal],
  );

  const success = useCallback(
    (title: string, message: string, onConfirm?: () => void) =>
      showModal({ type: "success", title, message, confirmLabel: "Continuar", onConfirm }),
    [showModal],
  );

  const info = useCallback(
    (title: string, message: string) =>
      showModal({ type: "info", title, message, confirmLabel: "Entendido" }),
    [showModal],
  );

  const confirm = useCallback(
    (title: string, message: string, onConfirm: () => void, onCancel?: () => void) =>
      showModal({
        type: "confirm",
        title,
        message,
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        onConfirm,
        onCancel,
      }),
    [showModal],
  );

  return (
    <ModalContext.Provider value={{ showModal, closeModal, error, warning, success, info, confirm }}>
      {children}
      {modal && <FeedbackModal config={modal} setModal={setModal} />}
    </ModalContext.Provider>
  );
}
