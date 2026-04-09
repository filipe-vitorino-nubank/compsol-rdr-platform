const requiredEnvVars = [
  "VITE_GOOGLE_CLIENT_ID",
  "VITE_GOOGLE_API_KEY",
  "VITE_SHEET_ID",
  "VITE_SLACK_PROXY_URL",
  "VITE_SLACK_PROXY_TOKEN",
  "VITE_GCP_PROJECT_ID",
] as const;

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (key) => !import.meta.env[key],
  );
  if (missing.length > 0) {
    console.error(
      "[COMPSOL] Variáveis de ambiente ausentes:",
      missing.join(", "),
    );
  }
};

export const env = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || "",
  sheetId: import.meta.env.VITE_SHEET_ID || "",
  slackProxyUrl: import.meta.env.VITE_SLACK_PROXY_URL || "",
  slackProxyToken: import.meta.env.VITE_SLACK_PROXY_TOKEN || "",
  gcpProjectId: import.meta.env.VITE_GCP_PROJECT_ID || "",
  gcpLocation: import.meta.env.VITE_GCP_LOCATION || "us-central1",
  geminiModel: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash-001",
  slackTeamId: import.meta.env.VITE_SLACK_TEAM_ID || "",
  slackDomain: import.meta.env.VITE_SLACK_DOMAIN || "nubank.slack.com",
  gleanUrl:
    import.meta.env.VITE_GLEAN_URL ||
    "https://nubank-prod-be.glean.com/chat",
};

export const isMissingCredentials = (): boolean => {
  const { googleClientId, googleApiKey } = env;
  return (
    !googleClientId ||
    !googleApiKey ||
    googleClientId.includes("your_") ||
    googleApiKey.includes("your_")
  );
};
