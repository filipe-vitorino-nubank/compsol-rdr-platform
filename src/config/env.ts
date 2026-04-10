interface AppConfig {
  isAppsScript: boolean;
  userEmail: string;
  accessToken: string;
  tokenExp: number;
  googleClientId: string;
  googleApiKey: string;
  sheetId: string;
  slackProxyUrl: string;
  slackProxyToken: string;
  gcpProjectId: string;
  gcpLocation: string;
  geminiModel: string;
  slackTeamId: string;
  slackDomain: string;
  gleanUrl: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string | undefined>;
  }
}

const gc = window.__APP_CONFIG__;
const isGAS = !!gc?.ACCESS_TOKEN;

function r(gasKey: string, viteKey: string, fallback = ""): string {
  return gc?.[gasKey] || import.meta.env[viteKey] || fallback;
}

export const env: AppConfig = {
  isAppsScript: isGAS,
  userEmail: gc?.USER_EMAIL || "",
  accessToken: gc?.ACCESS_TOKEN || "",
  tokenExp: Number(gc?.TOKEN_EXP || "0"),
  googleClientId: r("GOOGLE_CLIENT_ID", "VITE_GOOGLE_CLIENT_ID"),
  googleApiKey: r("GOOGLE_API_KEY", "VITE_GOOGLE_API_KEY"),
  sheetId: r("SHEET_ID", "VITE_SHEET_ID"),
  slackProxyUrl: r("SLACK_PROXY_URL", "VITE_SLACK_PROXY_URL"),
  slackProxyToken: r("SLACK_PROXY_TOKEN", "VITE_SLACK_PROXY_TOKEN"),
  gcpProjectId: r("GCP_PROJECT_ID", "VITE_GCP_PROJECT_ID"),
  gcpLocation: r("GCP_LOCATION", "VITE_GCP_LOCATION", "us-central1"),
  geminiModel: r("GEMINI_MODEL", "VITE_GEMINI_MODEL", "gemini-2.0-flash-001"),
  slackTeamId: r("SLACK_TEAM_ID", "VITE_SLACK_TEAM_ID"),
  slackDomain: r("SLACK_DOMAIN", "VITE_SLACK_DOMAIN", "nubank.slack.com"),
  gleanUrl: r("GLEAN_URL", "VITE_GLEAN_URL", "https://nubank-prod-be.glean.com/chat"),
};

const requiredKeys: (keyof AppConfig)[] = [
  "sheetId",
  "slackProxyUrl",
  "slackProxyToken",
  "gcpProjectId",
];

export const validateEnv = () => {
  const missing = requiredKeys.filter((k) => !env[k]);
  if (missing.length > 0) {
    console.error("[COMPSOL] Configurações ausentes:", missing.join(", "));
  }
};

export const isMissingCredentials = (): boolean => {
  if (env.isAppsScript) return false;
  const { googleClientId, googleApiKey } = env;
  return (
    !googleClientId ||
    !googleApiKey ||
    googleClientId.includes("your_") ||
    googleApiKey.includes("your_")
  );
};
