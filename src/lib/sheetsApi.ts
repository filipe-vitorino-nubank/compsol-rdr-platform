import {
  SHEET_HEADERS,
  COLUMN_COUNT,
  STATUS_COL_INDEX,
  type RdrFormState,
} from "../types/form";
import type { Solicitacao } from "../types/dossie";
import { formatDateBR, formatDateInputBR, formatDateTimeSheet } from "../utils/formatDate";
import { fetchWithRetry } from "./fetchWithTimeout";
import { deriveTemplates } from "../utils/deriveRobotTemplates";
import { gasRun, isAppsScriptEnv } from "./gasClient";

const SHEET_TAB = "Sheet1";

/** 57 columns → A through BE. */
const LAST_COL = "BE";

function handleSheetsError(status: number, body: string, operation: string): never {
  if (status === 403 || body.includes("PERMISSION_DENIED")) {
    throw new Error(
      "SHEETS_PERMISSION_DENIED: Você não tem permissão para acessar " +
        "a planilha. Solicite acesso ao administrador da plataforma.",
    );
  }
  if (status === 401 || body.includes("UNAUTHENTICATED")) {
    throw new Error(
      "SHEETS_UNAUTHENTICATED: Sessão expirada. Faça login novamente.",
    );
  }
  throw new Error(
    `SHEETS_ERROR: Erro ao ${operation} (HTTP ${status}). Tente novamente.`,
  );
}

async function sheetsFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
  operation = "acessar planilha",
): Promise<T> {
  const res = await fetchWithRetry(
    `https://sheets.googleapis.com/v4/spreadsheets${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
    { timeoutMs: 15_000, retries: 2 },
  );
  if (!res.ok) {
    const text = await res.text();
    handleSheetsError(res.status, text, operation);
  }
  return res.json() as Promise<T>;
}

/* ── Headers ── */

export async function readHeaderRow(
  accessToken: string,
  spreadsheetId: string,
): Promise<string[] | null> {
  if (isAppsScriptEnv()) {
    const res = await gasRun<{ headers: string[]; error: string | null }>("getSheetHeaders");
    if (res.error) throw new Error(res.error);
    return res.headers.length ? res.headers : null;
  }

  const range = encodeURIComponent(`${SHEET_TAB}!A1:${LAST_COL}1`);
  const data = await sheetsFetch<{ values?: string[][] }>(
    accessToken,
    `/${spreadsheetId}/values/${range}`,
    undefined,
    "ler cabeçalhos",
  );
  return data.values?.[0] ?? null;
}

export async function writeHeaderRow(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  if (isAppsScriptEnv()) {
    const res = await gasRun<{ success: boolean; error: string | null }>(
      "writeSheetHeaders",
      Array.from(SHEET_HEADERS),
    );
    if (!res.success) throw new Error(res.error || "Erro ao gravar cabeçalhos");
    return;
  }

  const range = encodeURIComponent(`${SHEET_TAB}!A1:${LAST_COL}1`);
  await sheetsFetch(
    accessToken,
    `/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [Array.from(SHEET_HEADERS)] }),
    },
    "gravar cabeçalhos",
  );
}

export async function ensureHeaders(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const row = await readHeaderRow(accessToken, spreadsheetId);
  const expected = Array.from(SHEET_HEADERS).join("|");
  const current = row?.join("|") ?? "";
  if (!row?.length || current !== expected) {
    await writeHeaderRow(accessToken, spreadsheetId);
  }
}

/* ── ID generation (RDR-YYYYMMDD-NNNN) ── */

export async function generateId(
  accessToken: string,
  spreadsheetId: string,
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `RDR-${dateStr}-`;

  const rows = await fetchAllRows(accessToken, spreadsheetId);
  const todayCount = rows.filter((r) => r.cells[0]?.startsWith(prefix)).length;
  const seq = String(todayCount + 1).padStart(4, "0");

  return `${prefix}${seq}`;
}

/**
 * Neutraliza formula injection no Google Sheets.
 * Prefixa com apóstrofo strings que começam com =, +, -, @, tab, CR.
 */
function sanitizeSheetValue(value: string): string {
  if (!value || typeof value !== "string") return value;
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}

/* ── Row mapping (57 columns matching SHEET_HEADERS) ── */

export function formStateToRow(
  s: RdrFormState,
  id: string,
): string[] {
  const sv = sanitizeSheetValue;

  const rpDerived = deriveTemplates(s.saldoEmContaRp || 'Sim');
  const bcDerived = deriveTemplates(s.saldoEmContaBc || 'Sim');

  return [
    id,                                            // A  - ID
    formatDateBR(new Date()),                      // B  - Timestamp
    "Pendente",                                    // C  - Status
    "",                                            // D  - Prioridade (hidden)
    s.emailSolicitante,                            // E  - Email Solicitante
    sv(s.cpfDemandante),                           // F  - CPF Demandante
    sv(s.cpfFraudador),                            // G  - CPF Fraudador
    sv(s.ticketZendesk),                           // H  - Ticket Zendesk
    sv(s.protocoloRdr),                            // I  - Protocolo RDR
    s.instituicao,                                 // J  - Instituição
    s.squad,                                       // K  - Squad
    formatDateInputBR(s.dataPrimeiroContato),      // L  - Data Primeiro Contato
    s.reasonCs,                                    // M  - Reason CS
    s.cenarioDeviceAuth,                           // N  - Cenário Device Auth
    s.subreasonCs,                                 // O  - Subreason CS
    s.temContaPj,                                  // P  - Tem Conta PJ
    s.reasonInvOps,                                // Q  - Reason Inv Ops
    s.tipoCliente,                                 // R  - Tipo Cliente
    s.casoMedPix,                                  // S  - Caso MED/PIX
    s.transacaoBoleto,                             // T  - Transação Boleto
    sv(s.contaFavorecidaFraudster),                // U  - Conta Favorecida Fraudster
    s.subreasonVictim,                             // V  - Subreason Victim
    s.statusMed,                                   // W  - Status MED
    s.devolucao,                                   // X  - Devolução
    s.possuiDict,                                  // Y  - Possui DICT
    formatDateInputBR(s.dataDict),                 // Z  - Data Marcação DICT
    formatDateInputBR(s.dataNotificacaoCliente),   // AA - Data Notificação Cliente
    s.subreasonFraudster,                          // AB - Subreason Fraudster
    s.casosMudbray,                                // AC - RP - Casos Mudbray
    s.casosCercadinho,                             // AD - RP - Casos Cercadinho
    s.casosBoleto,                                 // AE - RP - Casos Boleto Cash In
    rpDerived.tfo_concluido,                       // AF - RP - TFO Concluído Nubank
    rpDerived.conta_sem_saldo,                     // AG - RP - Conta Sem Saldo
    rpDerived.tfo_parcial,                         // AH - RP - TFO Parcial Cliente
    rpDerived.template_bacen,                      // AI - Template BACEN (RP)
    rpDerived.template_cliente,                    // AJ - Template Cliente (RP)
    bcDerived.tfo_concluido,                       // AK - BC - TFO Concluído Nubank
    bcDerived.conta_sem_saldo,                     // AL - BC - Conta Sem Saldo
    bcDerived.tfo_parcial,                         // AM - BC - TFO Parcial Cliente
    s.devolucaoOrigemBc,                           // AN - Devolução à Origem (BC)
    s.bcFraudadorPfpj === "Não"
      ? "Não"
      : s.bcFraudadorTipo || "",                   // AO - BC - Fraudador Tipo
    bcDerived.template_bacen,                      // AP - Template BACEN (BC)
    bcDerived.template_cliente,                    // AQ - Template Cliente (BC)
    "",                                            // AR - Link GDrive Cliente (preenchido pelo UiPath)
    "",                                            // AS - Link GDrive BACEN   (preenchido pelo UiPath)
    "",                                            // AT - Nomes Arquivos      (preenchido pelo UiPath)
    "",                                            // AU - Savings Account ID (hidden)
    "",                                            // AV - Dt Notificação Enviada Cliente (hidden)
    formatDateTimeSheet(s.dtContestacaoZendeskInicio),  // AW - Dt Contestação Zendesk Início
    formatDateTimeSheet(s.dtContestacaoZendeskFim),     // AX - Dt Contestação Zendesk Fim
    sv(s.ticketZendeskContestacao.trim()),          // AY - Ticket Zendesk Contestação
    "",                                            // AZ - Dt PIX Enviado Início (hidden)
    "",                                            // BA - Dt PIX Enviado Fim (hidden)
    sv(s.listaPixEnviado.trim()),                  // BB - Lista PIX Enviado
    "",                                            // BC - Dt PIX Recebido Início (hidden)
    "",                                            // BD - Dt PIX Recebido Fim (hidden)
    sv(s.listaPixRecebido.trim()),                 // BE - Lista PIX Recebido
  ];
}

/* ── Map row → Solicitacao ── */

export function mapRowToSolicitacao(row: string[]): Solicitacao {
  return {
    id:                        row[0]  || '',
    timestamp:                 row[1]  || '',
    status:                    (row[2] as Solicitacao['status']) || 'Pendente',
    prioridade:                row[3]  || '',
    emailSolicitante:          row[4]  || '',
    cpfDemandante:             row[5]  || '',
    cpfFraudador:              row[6]  || '',
    ticketZendesk:             row[7]  || '',
    protocoloRdr:              row[8]  || '',
    instituicao:               row[9]  || '',
    squad:                     row[10] || '',
    primeirContatoData:        row[11] || '',
    reasonCs:                  row[12] || '',
    cenarioDeviceAuth:         row[13] || '',
    subreasonCs:               row[14] || '',
    temContaPj:                row[15] || '',
    reasonInvOps:              row[16] || '',
    tipoCliente:               row[17] || '',
    casoMedPix:                row[18] || '',
    transacaoBoleto:           row[19] || '',
    contaFavorecidaFraudster:  row[20] || '',
    subreasonVictim:           row[21] || '',
    statusMed:                 row[22] || '',
    devolucao:                 row[23] || '',
    possuiDict:                row[24] || '',
    dataMarcacaoDict:          row[25] || '',
    dataNotificacaoCliente:    row[26] || '',
    subreasonFraudster:        row[27] || '',
    rpCasosMudbray:            row[28] || '',
    rpCasosCercadinho:         row[29] || '',
    rpCasosBoletoChashIn:      row[30] || '',
    rpTfoConcluido:            row[31] || '',
    rpContaSemSaldo:           row[32] || '',
    rpTfoParcialCliente:       row[33] || '',
    templateBacenRp:           row[34] || '',
    templateClienteRp:         row[35] || '',
    bcTfoConcluido:            row[36] || '',
    bcContaSemSaldo:           row[37] || '',
    bcTfoParcialCliente:       row[38] || '',
    bcDevolucaoOrigem:         row[39] || '',
    bcFraudadorTipo:           row[40] || '',
    templateBacenBc:           row[41] || '',
    templateClienteBc:         row[42] || '',
    linkGdriveCliente:         row[43] || '',
    linkGdriveBacen:           row[44] || '',
    nomesArquivos:             row[45] || '',
    savingsAccountId:          row[46] || '',
    dtNotificacaoEnviadaCliente: row[47] || '',
    dtContestacaoZendeskInicio: row[48] || '',
    dtContestacaoZendeskFim:   row[49] || '',
    ticketZendeskContestacao:  row[50] || '',
    dtPixEnviadoInicio:        row[51] || '',
    dtPixEnviadoFim:           row[52] || '',
    listaPixEnviado:           row[53] || '',
    dtPixRecebidoInicio:       row[54] || '',
    dtPixRecebidoFim:          row[55] || '',
    listaPixRecebido:          row[56] || '',
  };
}

/* ── Append ── */

export async function appendRequestRow(
  accessToken: string,
  spreadsheetId: string,
  row: string[],
): Promise<void> {
  if (isAppsScriptEnv()) {
    const res = await gasRun<{ success: boolean; error: string | null }>(
      "appendSolicitacao",
      row,
    );
    if (!res.success) throw new Error(res.error || "Erro ao gravar solicitação");
    return;
  }

  const range = encodeURIComponent(`${SHEET_TAB}!A:${LAST_COL}`);
  await sheetsFetch(
    accessToken,
    `/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [row] }),
    },
    "gravar solicitação",
  );
}

/* ── Read / update (used by Dashboard) ── */

export async function fetchAllRows(
  accessToken: string,
  spreadsheetId: string,
): Promise<{ rowIndex: number; cells: string[] }[]> {
  if (isAppsScriptEnv()) {
    const res = await gasRun<{ rows: unknown[][]; error: string | null }>("getSolicitacoes");
    if (res.error) throw new Error(res.error);
    const allRows = res.rows;
    const dataRows = allRows.slice(1);
    return dataRows.map((cells, i) => ({
      rowIndex: i + 2,
      cells: padRow(cells.map((c) => String(c ?? ""))),
    }));
  }

  const range = encodeURIComponent(`${SHEET_TAB}!A2:${LAST_COL}5000`);
  const data = await sheetsFetch<{ values?: string[][] }>(
    accessToken,
    `/${spreadsheetId}/values/${range}`,
    undefined,
    "carregar solicitações",
  );
  const rows = data.values ?? [];
  return rows.map((cells, i) => ({
    rowIndex: i + 2,
    cells: padRow(cells),
  }));
}

function padRow(cells: string[]): string[] {
  const out = [...cells];
  while (out.length < COLUMN_COUNT) out.push("");
  return out.slice(0, COLUMN_COUNT);
}

export async function updateCell(
  accessToken: string,
  spreadsheetId: string,
  a1: string,
  value: string,
): Promise<void> {
  if (isAppsScriptEnv()) {
    const match = a1.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Endereço A1 inválido: ${a1}`);
    const colLetters = match[1];
    const rowNum = parseInt(match[2], 10);
    let colNum = 0;
    for (let i = 0; i < colLetters.length; i++) {
      colNum = colNum * 26 + (colLetters.charCodeAt(i) - 64);
    }
    const res = await gasRun<{ success: boolean; error: string | null }>(
      "updateSheetCell",
      rowNum,
      colNum,
      value,
    );
    if (!res.success) throw new Error(res.error || "Erro ao atualizar célula");
    return;
  }

  const range = encodeURIComponent(`${SHEET_TAB}!${a1}`);
  await sheetsFetch(
    accessToken,
    `/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [[value]] }),
    },
    "atualizar status",
  );
}

/** Status column = C (index 2). */
export function rowStatusA1(rowIndex: number): string {
  const colLetter = numberToColumnLetter(STATUS_COL_INDEX);
  return `${colLetter}${rowIndex}`;
}

function numberToColumnLetter(index: number): string {
  let result = "";
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}
