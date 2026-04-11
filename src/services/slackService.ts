import { getSpreadsheetId } from "../lib/spreadsheetConfig";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { env } from "../config/env";
import { gasRun, isAppsScriptEnv } from "../lib/gasClient";

const MEMBERS_RANGE = "Equipe!A2:G100";
const LAST_SYNC_RANGE = "Equipe!H1";

export interface SlackMember {
  id: string;
  name: string;
  display_name: string;
  title: string;
  avatar: string;
  is_admin: boolean;
  email: string;
}

let _cachedMembers: SlackMember[] | null = null;

async function sheetsGet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 10_000);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  return (data.values as string[][]) || [];
}

export async function fetchChannelMembers(
  accessToken: string,
): Promise<SlackMember[]> {
  if (_cachedMembers !== null) return _cachedMembers;

  try {
    if (isAppsScriptEnv()) {
      const res = await gasRun<{ members: SlackMember[]; error: string | null }>("getEquipeMembers");
      if (res.error) throw new Error(res.error);
      _cachedMembers = res.members.filter((m) => m.name || m.email);
      return _cachedMembers;
    }

    const sheetId = getSpreadsheetId();
    if (!sheetId) {
      console.warn("Spreadsheet ID não configurado");
      return [];
    }

    const rows = await sheetsGet(accessToken, sheetId, MEMBERS_RANGE);

    _cachedMembers = rows
      .map((row) => ({
        id: row[0] || "",
        name: row[1] || "",
        display_name: row[2] || "",
        title: row[3] || "",
        avatar: row[4] || "",
        is_admin: row[5] === "TRUE" || row[5] === "true",
        email: row[6] || "",
      }))
      .filter((m) => m.id && m.name);

    return _cachedMembers;
  } catch (err) {
    console.error("[SlackService] Erro ao buscar equipe:", (err as Error).message);
    _cachedMembers = null;
    return [];
  }
}

export async function fetchLastSync(accessToken: string): Promise<string> {
  try {
    if (isAppsScriptEnv()) {
      const res = await gasRun<{ timestamp: string | null; error: string | null }>("getEquipeSyncTimestamp");
      if (res.error) throw new Error(res.error);
      return res.timestamp || "Nunca sincronizado";
    }

    const sheetId = getSpreadsheetId();
    if (!sheetId) return "Nunca sincronizado";

    const rows = await sheetsGet(accessToken, sheetId, LAST_SYNC_RANGE);
    return rows[0]?.[0] || "Nunca sincronizado";
  } catch {
    return "Nunca sincronizado";
  }
}

export async function syncTeamNow(): Promise<void> {
  if (isAppsScriptEnv()) {
    const data = await gasRun<{ ok: boolean; error?: string }>("syncEquipeAgora");
    if (!data.ok) throw new Error(data.error || "Falha na sincronização");
    _cachedMembers = null;
    return;
  }

  if (!env.slackProxyUrl || !env.slackProxyToken) {
    throw new Error("SLACK_PROXY_URL ou SLACK_PROXY_TOKEN não configurados");
  }

  const url = env.slackProxyUrl.startsWith("http")
    ? `${env.slackProxyUrl}?action=sync`
    : `/slack-proxy${env.slackProxyUrl}?action=sync`;

  const res = await fetchWithTimeout(url, {
    headers: { "X-Proxy-Token": env.slackProxyToken },
  }, 10_000);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Falha na sincronização");
  _cachedMembers = null;
}

export const buildSlackDMLink = (userId: string): string =>
  `slack://user?team=${env.slackTeamId}&id=${userId}`;

export const buildSlackWebLink = (userId: string): string =>
  `https://${env.slackDomain}/team/${userId}`;
