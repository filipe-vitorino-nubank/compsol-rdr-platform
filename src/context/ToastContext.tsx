import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLanguage } from "./LanguageContext";

export type ToastKind = "success" | "error" | "info";

export type Toast = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<
  ToastKind,
  string
> = {
  success:
    "border-emerald-500/45 bg-emerald-950/92 text-emerald-50 shadow-[0_0_32px_-12px_rgba(34,197,94,0.35)]",
  error:
    "border-red-500/45 bg-red-950/92 text-red-50 shadow-[0_0_32px_-12px_rgba(248,113,113,0.35)]",
  info: "border-nu-purple/40 bg-[var(--color-surface-raised)]/95 text-ink shadow-glow",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 7200);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toasts, showToast, dismiss }),
    [toasts, showToast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-[min(100vw-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-input border px-4 py-3 text-sm leading-snug backdrop-blur-md ${styles[toast.kind]}`}
            role="status"
          >
            <p className="min-w-0 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md p-1 text-xs font-semibold opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label={t("toast.close")}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast outside ToastProvider");
  return ctx;
}
