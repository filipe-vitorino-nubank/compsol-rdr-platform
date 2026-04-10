import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { getSpreadsheetId, setSpreadsheetId } from "../lib/spreadsheetConfig";
import { fetchLastSync, syncTeamNow } from "../services/slackService";
import { env } from "../config/env";
import { useAdminCheck } from "../hooks/useAdminCheck";
import { isAppsScriptEnv } from "../lib/gasClient";
import { LoadingScreen } from "../components/ui/LoadingScreen";

export function ConfigPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [id, setId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("");
  const { isAuthenticated, googleUser, scriptReady, signInWithGoogle, signOut, getAccessTokenForSheets } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    setId(getSpreadsheetId());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const tk = isAppsScriptEnv() ? "" : await getAccessTokenForSheets({ interactive: false });
        const sync = await fetchLastSync(tk);
        setLastSync(sync);
      } catch { /* ignore */ }
    })();
  }, [isAuthenticated, getAccessTokenForSheets]);

  const handleTeamSync = async () => {
    setSyncing(true);
    try {
      await syncTeamNow();
      const tk = isAppsScriptEnv() ? "" : await getAccessTokenForSheets({ interactive: false });
      const updated = await fetchLastSync(tk);
      setLastSync(updated);
      showToast(t("profile.syncSuccess"), "success");
    } catch {
      showToast(t("profile.syncError"), "error");
    } finally {
      setSyncing(false);
    }
  };

  const save = () => {
    setSpreadsheetId(id);
    showToast(t("configPage.savedToast"), "success");
  };

  const clientConfigured = Boolean(env.googleClientId) || env.isAppsScript;

  if (adminLoading) {
    return <LoadingScreen message="Verificando permissões..." fullScreen />;
  }

  if (!isAdmin) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "60vh", gap: 16, textAlign: "center",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(130,10,209,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="var(--purple-700)" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
          Configurações
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-ink-muted)", maxWidth: 320, lineHeight: 1.6, margin: 0 }}>
          Esta área é restrita aos administradores da plataforma.
        </p>
        <p style={{ fontSize: 12, color: "var(--color-ink-subtle)", margin: 0 }}>
          Para solicitar acesso, entre em contato com o time BOAS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">
          {t("configPage.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("configPage.subtitle")}
        </p>
      </div>
      <div className="surface-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t("configPage.sheetsTitle")}</h2>
        <Field label={t("configPage.sheetIdLabel")}>
          <input
            className="input-field font-mono text-sm"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Ex.: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            spellCheck={false}
          />
        </Field>
        <p className="mt-2 text-xs text-ink-subtle">
          {t("configPage.sheetIdHint")}{" "}
          https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={save}>
            {t("configPage.saveId")}
          </Button>
        </div>
      </div>
      {!env.isAppsScript && (
        <div className="surface-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t("configPage.googleTitle")}</h2>
          {!clientConfigured ? (
            <p className="text-sm text-amber-400">
              {t("configPage.missingClientId")}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              {t("configPage.scopeInfo")}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!scriptReady || !clientConfigured}
              onClick={() => signInWithGoogle({ promptConsent: false })}
            >
              {t("auth.signInRenew")}
            </Button>
            <Button type="button" variant="ghost" onClick={signOut} disabled={!isAuthenticated}>
              {t("auth.signOutAccount")}
            </Button>
          </div>
          {isAuthenticated && googleUser ? (
            <p className="mt-3 text-xs text-emerald-400/90">
              {t("auth.connectedAs")} <strong className="text-ink">{googleUser.email}</strong>
              {googleUser.name ? ` (${googleUser.name})` : ""}.
            </p>
          ) : isAuthenticated ? (
            <p className="mt-3 text-xs text-emerald-400/90">{t("auth.activeSession")}</p>
          ) : (
            <p className="mt-3 text-xs text-ink-subtle">{t("auth.noSession")}</p>
          )}
        </div>
      )}

      <div className="surface-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t("configPage.teamSyncTitle")}</h2>
        <p className="mb-4 text-sm text-ink-muted">
          {t("configPage.teamSyncDesc")}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            onClick={handleTeamSync}
            disabled={syncing || !isAuthenticated}
          >
            <span className="inline-flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={syncing ? "spin" : ""}
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {syncing ? t("profile.syncing") : t("configPage.teamSyncBtn")}
            </span>
          </Button>
          {lastSync && (
            <span className="text-[13px] text-ink-subtle">{lastSync}</span>
          )}
        </div>
      </div>
    </div>
  );
}
