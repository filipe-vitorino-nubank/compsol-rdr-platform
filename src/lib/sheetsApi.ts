import {
  SHEET_HEADERS,
  COLUMN_COUNT,
  STATUS_COL_INDEX,
  type RdrFormState,
} from "../types/form";
import type { Solicitacao } from "../types/dossie";
import { formatDateBR, formatDateInputBR } from "../utils/formatDate";

const SHEET_TAB = "Sheet1";

/** 42 columns → A through AP. */
const LAST_COL = "AP";

async function sheetsFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API ${res.status}: ${text || res.statusText}`);
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

/* ── Row mapping (41 columns matching SHEET_HEADERS) ── */

export function formStateToRow(
  s: RdrFormState,
  id: string,
): string[] {
  return [
    id,                                            // A  - ID
    formatDateBR(new Date()),                      // B  - Timestamp
    "Pendente",                                    // C  - Status
    s.prioridade,                                  // D  - Prioridade
    s.emailSolicitante,                            // E  - Email Solicitante
    s.cpfDemandante,                               // F  - CPF Demandante
    s.cpfFraudador,                                // G  - CPF Fraudador
    s.ticketZendesk,                               // H  - Ticket Zendesk
    s.protocoloRdr,                                // I  - Protocolo RDR
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
    s.contaFavorecidaFraudster,                    // U  - Conta Favorecida Fraudster
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
    [s.transacaoCodigo.trim(), s.transacaoValor.trim()].every(Boolean)
      ? `${s.transacaoCodigo.trim()} | R$ ${s.transacaoValor.trim()}`
      : "",                                        // AN - Transação e Data Contestação
    "",                                            // AO - Link GDrive (preenchido pelo UiPath)
    "",                                            // AP - Nome Arquivo (preenchido pelo UiPath)
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
    transacaoEDataContestacao: row[39] || '',
    linkGdrive:                row[40] || '',
    nomeArquivo:               row[41] || '',
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
    `/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [[value]] }),
    },
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
