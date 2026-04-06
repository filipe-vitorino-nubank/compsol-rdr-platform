/* ── Squad / Reason / Subreason enums ── */

export type Squad = "Customer Security" | "Inv Ops";

export type Instituicao =
  | "NU PAGAMENTOS S.A. - INSTITUIÇÃO DE PAGAMENTO"
  | "NU FINANCEIRA S.A. - SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO"
  | "NU DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA."
  | "NU INVEST CORRETORA DE VALORES S.A."
  | "NUPAY FOR BUSINESS INSTITUIÇÃO DE PAGAMENTO LTDA";

export const INSTITUICAO_OPTIONS: Instituicao[] = [
  "NU PAGAMENTOS S.A. - INSTITUIÇÃO DE PAGAMENTO",
  "NU FINANCEIRA S.A. - SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO",
  "NU DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA.",
  "NU INVEST CORRETORA DE VALORES S.A.",
  "NUPAY FOR BUSINESS INSTITUIÇÃO DE PAGAMENTO LTDA",
];

export type SimNao = "Sim" | "Não";

export type RdrPrioridade = "baixa" | "media" | "alta";

export type ReasonCs = "Device Authorization";
export const REASON_CS_OPTIONS: ReasonCs[] = ["Device Authorization"];

export type SubreasonCs =
  | "Autorização Concluída"
  | "Fallback Email"
  | "Fallback App"
  | "Device Revogado";
export const SUBREASON_CS_OPTIONS: SubreasonCs[] = [
  "Autorização Concluída",
  "Fallback Email",
  "Fallback App",
  "Device Revogado",
];

export type ReasonInvOps = "Victim" | "Fraudster";
export type TipoCliente = "Cliente OK" | "Cliente Fraudster";

export type SubreasonVictim =
  | "Infração Pix"
  | "Infração tipo Fraud"
  | "Com Contestação"
  | "Sem Contestação"
  | "Sem dados para Contestação";
export const SUBREASON_VICTIM_OPTIONS: SubreasonVictim[] = [
  "Infração Pix",
  "Infração tipo Fraud",
  "Com Contestação",
  "Sem Contestação",
  "Sem dados para Contestação",
];

export type StatusMed =
  | "ACATADO"
  | "NEGADO"
  | "NEGADO PELA POLÍTICA DE AUTO ARQUIVAMENTO";
export const STATUS_MED_OPTIONS: StatusMed[] = [
  "ACATADO",
  "NEGADO",
  "NEGADO PELA POLÍTICA DE AUTO ARQUIVAMENTO",
];

export type Devolucao =
  | "Devolução Manual Concluída"
  | "Devolução Automática Concluída"
  | "Sem saldo"
  | "Com saldo";
export const DEVOLUCAO_OPTIONS: Devolucao[] = [
  "Devolução Manual Concluída",
  "Devolução Automática Concluída",
  "Sem saldo",
  "Com saldo",
];

export type SubreasonFraudster =
  | "Regras Preventivas"
  | "Bloqueio Cautelar"
  | "Desinteresse Comercial"
  | "JiggluPuff Externo"
  | "JiggluPuff Interno";
export const SUBREASON_FRAUDSTER_OPTIONS: SubreasonFraudster[] = [
  "Regras Preventivas",
  "Bloqueio Cautelar",
  "Desinteresse Comercial",
  "JiggluPuff Externo",
  "JiggluPuff Interno",
];

/* ── Form state ── */

export interface RdrFormState {
  emailSolicitante: string;
  cpfDemandante: string;
  cpfFraudador: string;
  ticketZendesk: string;
  protocoloRdr: string;
  instituicao: Instituicao | "";
  squad: Squad | "";
  prioridade: RdrPrioridade | "";
  dataPrimeiroContato: string;

  reasonCs: ReasonCs | "";
  cenarioDeviceAuth: string;
  subreasonCs: SubreasonCs | "";

  temContaPj: SimNao | "";
  reasonInvOps: ReasonInvOps | "";

  tipoCliente: TipoCliente | "";
  casoMedPix: SimNao | "";
  transacaoBoleto: SimNao | "";
  contaFavorecidaFraudster: SimNao | "";
  subreasonVictim: SubreasonVictim | "";
  statusMed: StatusMed | "";
  devolucao: Devolucao | "";

  possuiDict: SimNao | "";
  dataDict: string;
  dataNotificacaoCliente: string;
  subreasonFraudster: SubreasonFraudster | "";

  casosMudbray: SimNao | "";
  casosCercadinho: SimNao | "";
  casosBoleto: SimNao | "";
  tfoConcluidoRp: SimNao | "";
  contaSemSaldoRp: SimNao | "";
  tfoParcialRp: SimNao | "";

  tfoConcluidoBc: SimNao | "";
  contaSemSaldoBc: SimNao | "";
  bcFraudadorPfpj: SimNao | "";
  bcFraudadorTipo: string;
  tfoParcialBc: SimNao | "";
  devolucaoOrigemBc: SimNao | "";

  transacaoCodigo: string;
  transacaoValor: string;

  fieldErrors: Partial<Record<string, string>>;
}

export const initialFormState: RdrFormState = {
  emailSolicitante: "",
  cpfDemandante: "",
  cpfFraudador: "",
  ticketZendesk: "",
  protocoloRdr: "",
  instituicao: "",
  squad: "",
  prioridade: "",
  dataPrimeiroContato: "",
  reasonCs: "",
  cenarioDeviceAuth: "",
  subreasonCs: "",
  temContaPj: "",
  reasonInvOps: "",
  tipoCliente: "",
  casoMedPix: "",
  transacaoBoleto: "",
  contaFavorecidaFraudster: "",
  subreasonVictim: "",
  statusMed: "",
  devolucao: "",
  possuiDict: "",
  dataDict: "",
  dataNotificacaoCliente: "",
  subreasonFraudster: "",
  casosMudbray: "",
  casosCercadinho: "",
  casosBoleto: "",
  tfoConcluidoRp: "",
  contaSemSaldoRp: "",
  tfoParcialRp: "",
  tfoConcluidoBc: "",
  contaSemSaldoBc: "",
  bcFraudadorPfpj: "",
  bcFraudadorTipo: "",
  tfoParcialBc: "",
  devolucaoOrigemBc: "",
  transacaoCodigo: "",
  transacaoValor: "",
  fieldErrors: {},
};

/* ── Sheet headers (42 columns: A → AP) ── */

export const SHEET_HEADERS = [
  "ID",
  "Timestamp",
  "Status",
  "Prioridade",
  "Email Solicitante",
  "CPF Demandante",
  "CPF Fraudador",
  "Ticket Zendesk",
  "Protocolo RDR",
  "Instituição",
  "Squad",
  "Data Primeiro Contato",
  "Reason CS",
  "Cenário Device Auth",
  "Subreason CS",
  "Tem Conta PJ",
  "Reason Inv Ops",
  "Tipo Cliente",
  "Caso MED/PIX",
  "Transação Boleto",
  "Conta Favorecida Fraudster",
  "Subreason Victim",
  "Status MED",
  "Devolução",
  "Possui DICT",
  "Data Marcação DICT",
  "Data Notificação Cliente",
  "Subreason Fraudster",
  "RP - Casos Mudbray",
  "RP - Casos Cercadinho",
  "RP - Casos Boleto Cash In",
  "RP - TFO Concluído Nubank",
  "RP - Conta Sem Saldo",
  "RP - TFO Parcial Cliente",
  "BC - TFO Concluído Nubank",
  "BC - Conta Sem Saldo",
  "BC - TFO Parcial Cliente",
  "Devolução à Origem (BC)",
  "BC - Fraudador Tipo",
  "Transação e Data Contestação",
  "Link GDrive",
  "Nome Arquivo",
] as const;

export const COLUMN_COUNT = SHEET_HEADERS.length; // 42

/** Index of the "Status" column (0-based). */
export const STATUS_COL_INDEX = SHEET_HEADERS.indexOf("Status"); // 2

/** Column index constants for reading rows. */
export const COL = {
  ID: 0,
  TIMESTAMP: 1,
  STATUS: 2,
  PRIORIDADE: 3,
  EMAIL: 4,
  CPF_DEMANDANTE: 5,
  CPF_FRAUDADOR: 6,
  TICKET: 7,
  PROTOCOLO: 8,
  INSTITUICAO: 9,
  SQUAD: 10,
  DATA_CONTATO: 11,
  REASON_CS: 12,
  CENARIO_DEVICE: 13,
  SUBREASON_CS: 14,
  TEM_CONTA_PJ: 15,
  REASON_INVOPS: 16,
  TIPO_CLIENTE: 17,
  CASO_MED: 18,
  TRANSACAO_BOLETO: 19,
  CONTA_FAV: 20,
  SUBREASON_VICTIM: 21,
  STATUS_MED: 22,
  DEVOLUCAO: 23,
  POSSUI_DICT: 24,
  DATA_DICT: 25,
  DATA_NOTIF: 26,
  SUBREASON_FRAUDSTER: 27,
  MUDBRAY: 28,
  CERCADINHO: 29,
  BOLETO_CASH: 30,
  TFO_RP: 31,
  SALDO_RP: 32,
  TFO_PARCIAL_RP: 33,
  TFO_BC: 34,
  SALDO_BC: 35,
  TFO_PARCIAL_BC: 36,
  DEVOLUCAO_ORIGEM_BC: 37,
  FRAUDADOR_TIPO_BC: 38,
  TRANSACAO_CONTESTACAO: 39,
  LINK_GDRIVE: 40,
  NOME_ARQUIVO: 41,
} as const;

/* ── Legacy types kept so DashboardPage.tsx compiles without changes ── */

export type RequestStatus =
  | "Pendente"
  | "Em Análise"
  | "Concluído"
  | "Cancelado";

export type Priority = "Alta" | "Média" | "Baixa";

export type DossierType =
  | "KYC Completo"
  | "PEP"
  | "Sanções"
  | "AML"
  | "Fraude"
  | "Outro";

export type SheetRow = {
  rowIndex: number;
  values: string[];
};
