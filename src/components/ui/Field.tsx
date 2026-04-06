import type { ReactNode } from "react";
import { useLanguage } from "../../context/LanguageContext";

export function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="group/field flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors group-focus-within/field:text-[var(--purple-700)]">
          {label}
          {required ? (
            <span className="ml-0.5 font-normal text-[var(--danger)]" aria-hidden>
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> {t("common.required")}</span> : null}
        </span>
        {hint && !error ? (
          <p className="text-xs leading-relaxed text-ink-subtle">{hint}</p>
        ) : null}
      </div>
      <div className="contents">{children}</div>
      {error ? (
        <p className="flex gap-1.5 text-xs leading-snug text-[var(--danger)]" role="alert">
          <span className="shrink-0 font-bold" aria-hidden>!</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
