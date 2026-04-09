import { getSpreadsheetId } from "../lib/spreadsheetConfig";

const MEMBERS_RANGE = "Equipe!A2:G100";
const LAST_SYNC_RANGE = "Equipe!H1";

const SYNC_URL = import.meta.env.VITE_SLACK_PROXY_URL as string | undefined;
const SYNC_TOKEN = import.meta.env.VITE_SLACK_PROXY_TOKEN as string | undefined;
const SLACK_TEAM_ID = import.meta.env.VITE_SLACK_TEAM_ID || '';
const SLACK_DOMAIN = import.meta.env.VITE_SLACK_DOMAIN || 'nubank.slack.com';

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
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
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

  const sheetId = getSpreadsheetId();
  if (!sheetId) {
    console.warn("Spreadsheet ID não configurado");
    return [];
  }

  try {
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
  const sheetId = getSpreadsheetId();
  if (!sheetId) return "Nunca sincronizado";

  try {
    const rows = await sheetsGet(accessToken, sheetId, LAST_SYNC_RANGE);
    return rows[0]?.[0] || "Nunca sincronizado";
  } catch {
    return "Nunca sincronizado";
  }
}

export async function syncTeamNow(): Promise<void> {
  if (!SYNC_URL || !SYNC_TOKEN) {
    throw new Error(
      "VITE_SLACK_PROXY_URL ou VITE_SLACK_PROXY_TOKEN não configurados",
    );
  }

  const scriptPath = SYNC_URL.replace("https://script.google.com", "");
  const res = await fetch(`/slack-proxy${scriptPath}?action=sync`, {
    headers: { "X-Proxy-Token": SYNC_TOKEN || "" },
  });
  const data = await res.json();

  if (!data.ok) throw new Error(data.error || "Falha na sincronização");

  _cachedMembers = null;
}

export const buildSlackDMLink = (userId: string): string =>
  `slack://user?team=${SLACK_TEAM_ID}&id=${userId}`;

export const buildSlackWebLink = (userId: string): string =>
  `https://${SLACK_DOMAIN}/team/${userId}`;
