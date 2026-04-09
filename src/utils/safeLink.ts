const ALLOWED_DOMAINS = [
  "drive.google.com",
  "docs.google.com",
  "nubank.atlassian.net",
  "nubank.enterprise.slack.com",
  "nubank.slack.com",
  "github.com",
  "nubank-prod-be.glean.com",
];

export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_DOMAINS.some(
        (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d),
      )
    );
  } catch {
    return false;
  }
};

export const safeOpen = (url: string): void => {
  if (isSafeUrl(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    console.warn("[safeOpen] URL bloqueada por não estar na whitelist:", url);
  }
};
