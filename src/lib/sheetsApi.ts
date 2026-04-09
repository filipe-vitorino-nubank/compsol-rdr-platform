import {
  SHEET_HEADERS,
  COLUMN_COUNT,
  STATUS_COL_INDEX,
  type RdrFormState,
} from "../types/form";
import type { Solicitacao } from "../types/dossie";
import { formatDateBR, formatDateInputBR, formatDateTimeSheet } from "../utils/formatDate";
import { fetchWithRetry } from "./fetchWithTimeout";

const SHEET_TAB = "Sheet1";

/** 53 columns → A through BA. */
const LAST_COL = "BA";

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

/* ── Row mapping (41 columns matching SHEET_HEADERS) ── */

export function formStateToRow(
  s: RdrFormState,
  id: string,
): string[] {
  const sv = sanitizeSheetValue;
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
    s.tfoConcluidoRp,                              // AF - RP - TFO Concluído Nubank
    s.contaSemSaldoRp,                             // AG - RP - Conta Sem Saldo
    s.tfoParcialRp,                                // AH - RP - TFO Parcial Cliente
    s.tfoConcluidoBc,                              // AI - BC - TFO Concluído Nubank
    s.contaSemSaldoBc,                             // AJ - BC - Conta Sem Saldo
    s.tfoParcialBc,                                // AK - BC - TFO Parcial Cliente
    s.devolucaoOrigemBc,                           // AL - Devolução à Origem (BC)
    s.bcFraudadorPfpj === "Não"
      ? "Não"
      : s.bcFraudadorTipo || "",                   // AM - BC - Fraudador Tipo
    "",                                            // AN - Link GDrive Cliente (preenchido pelo UiPath)
    "",                                            // AO - Link GDrive BACEN   (preenchido pelo UiPath)
    "",                                            // AP - Nomes Arquivos      (preenchido pelo UiPath)
    "",                                            // AQ - Savings Account ID (hidden)
    "",                                            // AR - Dt Notificação Enviada Cliente (hidden)
    formatDateTimeSheet(s.dtContestacaoZendeskInicio),  // AS - Dt Contestação Zendesk Início
    formatDateTimeSheet(s.dtContestacaoZendeskFim),     // AT - Dt Contestação Zendesk Fim
    sv(s.ticketZendeskContestacao.trim()),          // AU - Ticket Zendesk Contestação
    "",                                            // AV - Dt PIX Enviado Início (hidden)
    "",                                            // AW - Dt PIX Enviado Fim (hidden)
    sv(s.listaPixEnviado.trim()),                  // AX - Lista PIX Enviado
    "",                                            // AY - Dt PIX Recebido Início (hidden)
    "",                                            // AZ - Dt PIX Recebido Fim (hidden)
    sv(s.listaPixRecebido.trim()),                 // BA - Lista PIX Recebido
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
    bcTfoConcluido:            row[34] || '',
    bcContaSemSaldo:           row[35] || '',
    bcFraudadorTipo:           row[38] || '',
    bcTfoParcialCliente:       row[36] || '',
    bcDevolucaoOrigem:         row[37] || '',
    linkGdriveCliente:         row[39] || '',
    linkGdriveBacen:           row[40] || '',
    nomesArquivos:             row[41] || '',
    savingsAccountId:          row[42] || '',
    dtNotificacaoEnviadaCliente: row[43] || '',
    dtContestacaoZendeskInicio: row[44] || '',
    dtContestacaoZendeskFim:   row[45] || '',
    ticketZendeskContestacao:  row[46] || '',
    dtPixEnviadoInicio:        row[47] || '',
    dtPixEnviadoFim:           row[48] || '',
    listaPixEnviado:           row[49] || '',
    dtPixRecebidoInicio:       row[50] || '',
    dtPixRecebidoFim:          row[51] || '',
    listaPixRecebido:          row[52] || '',
  };
}

/* ── Append ── */

export async function appendRequestRow(
  accessToken: string,
  spreadsheetId: string,
  row: string[],
): Promise<void> {
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
