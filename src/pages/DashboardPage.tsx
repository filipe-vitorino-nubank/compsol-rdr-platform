import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useModal } from "../context/ModalContext";
import { useLanguage } from "../context/LanguageContext";
import { useChat } from "../context/ChatContext";
import { fetchAllRows, mapRowToSolicitacao, rowStatusA1, updateCell } from "../lib/sheetsApi";
import { getSpreadsheetId } from "../lib/spreadsheetConfig";
import { isAppsScriptEnv } from "../lib/gasClient";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { COL, type RequestStatus } from "../types/form";
import type { Solicitacao } from "../types/dossie";
import { buildDriveLink } from "../utils/buildDriveLink";

const STATUSES: RequestStatus[] = ["Pendente", "Em Análise", "Concluído", "Cancelado"];
const POLL_INTERVAL_MS = 30_000;

const FILTERS = [
  "Todos",
  "Pendente",
  "Em Análise",
  "Concluído",
  "Cancelado",
  "Alta prioridade",
  "Customer Security",
  "Inv Ops",
];

const PRIO_ORDER: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

type RowView = { rowIndex: number; cells: string[] };

/* ── Helpers ── */

function maskCPF(cpf: string): string {
  if (!cpf || cpf.length < 11) return cpf;
  return `${cpf.slice(0, 3)}${"•".repeat(5)}${cpf.slice(8)}`;
}

function timeAgo(timestamp: string): string {
  if (!timestamp) return "—";
  try {
    let date: Date;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(timestamp)) {
      const [datePart, timePart] = timestamp.split(" ");
      const [dd, mm, yyyy] = datePart.split("/");
      date = new Date(`${yyyy}-${mm}-${dd}T${timePart || "00:00:00"}`);
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return "—";
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `há ${diffDays}d`;
    return `há ${Math.floor(diffDays / 7)}sem`;
  } catch {
    return "—";
  }
}

function detectSearchType(value: string): string {
  const v = value.trim();
  if (/^RDR-/i.test(v)) return "Buscando por ID da solicitação";
  const digits = v.replace(/\D/g, "");
  if (digits.length === 11)
    return "CPF detectado (11 dígitos) — buscando demandante e fraudador";
  if (digits.length === 14)
    return "CNPJ detectado (14 dígitos) — buscando nos registros";
  if (digits.length >= 4 && digits.length <= 10)
    return "Buscando por Protocolo RDR";
  if (v.length > 0) return "Buscando em todos os campos...";
  return "";
}

function filterSolicitacoes(
  list: Solicitacao[],
  term: string,
): Solicitacao[] {
  if (!term.trim()) return list;
  const v = term.trim().toLowerCase();
  const digits = v.replace(/\D/g, "");
  return list.filter(
    (s) =>
      s.id.toLowerCase().includes(v) ||
      s.protocoloRdr.includes(v) ||
      s.cpfDemandante.includes(digits) ||
      s.cpfFraudador.includes(digits),
  );
}

function formatTimestamp(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return (
      d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return iso;
  }
}

function prioBadgeClass(prio: string): string {
  switch (prio) {
    case "baixa":
      return "bg-[var(--success-dim)] text-[var(--success)] border-[var(--success)]";
    case "media":
      return "bg-[var(--warning-dim)] text-[var(--warning)] border-[var(--warning)]";
    case "alta":
      return "bg-[var(--danger-dim)] text-[var(--danger)] border-[var(--danger)]";
    default:
      return "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]";
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Pendente":
      return "bg-[var(--warning-dim)] text-[var(--warning)] border-[var(--warning)]";
    case "Em Análise":
      return "bg-[var(--purple-dim)] text-[var(--purple-600)] border-[var(--purple-600)]";
    case "Concluído":
      return "bg-[var(--success-dim)] text-[var(--success)] border-[var(--success)]";
    case "Cancelado":
      return "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)]";
    default:
      return "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]";
  }
}

/* ── Icons ── */

function FileTextIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 13H8" />
      <path d="M16 17H8" />
      <path d="M16 13h-2" />
    </svg>
  );
}

function ExternalLinkIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/* ── Document state logic ── */

type DocState = "available" | "processing" | "error" | "warn";

function getDocState(status: string, link: string): DocState {
  if (link) return "available";
  if (status === "Concluído") return "error";
  if (status === "Pendente" || status === "Em Análise") return "processing";
  return "error";
}

function getCombinedDocState(
  status: string,
  linkCliente: string,
  linkBacen: string,
): "all-error" | "partial-warn" | "ok" {
  if (status === "Concluído" && !linkCliente && !linkBacen) return "all-error";
  if (status === "Concluído" && (!linkCliente || !linkBacen)) return "partial-warn";
  return "ok";
}

function DocBadge({
  type,
  state,
  link,
  label,
}: {
  type: "cliente" | "bacen";
  state: DocState;
  link: string;
  label: string;
}) {
  if (state === "available") {
    return (
      <a
        href={buildDriveLink(link)}
        target="_blank"
        rel="noreferrer"
        className={`doc-btn doc-btn-${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <FileTextIcon size={12} /> {label} <ExternalLinkIcon size={10} />
      </a>
    );
  }
  if (state === "processing") {
    return (
      <span className="doc-btn doc-btn-processing">
        <ClockIcon /> {label} — processando
      </span>
    );
  }
  if (state === "warn") {
    return (
      <span className="doc-btn doc-btn-warn">
        <AlertTriangleIcon /> {label} — não gerado
      </span>
    );
  }
  return (
    <span className="doc-btn doc-btn-error">
      <InfoCircleIcon /> {label} — não gerado
    </span>
  );
}

function DocCell({ s }: { s: Solicitacao }) {
  const clienteState = getDocState(s.status, s.linkGdriveCliente);
  const bacenState = getDocState(s.status, s.linkGdriveBacen);
  const combined = getCombinedDocState(s.status, s.linkGdriveCliente, s.linkGdriveBacen);

  if (combined === "ok" && !s.linkGdriveCliente && !s.linkGdriveBacen) {
    return <span className="doc-pending">—</span>;
  }

  return (
    <div className="doc-cell-badges">
      <DocBadge type="cliente" state={clienteState} link={s.linkGdriveCliente} label="Cliente" />
      <DocBadge type="bacen" state={bacenState} link={s.linkGdriveBacen} label="BACEN" />
    </div>
  );
}

/* ── Drawer detail sections ── */

type DrawerField = { label: string; value: string; mono?: boolean };
type TFn = (key: string) => string;

function buildDrawerSections(
  c: string[],
  t: TFn,
): { title: string; fields: DrawerField[] }[] {
  const sections: { title: string; fields: DrawerField[] }[] = [];

  sections.push({
    title: t("drawer.dadosGerais"),
    fields: [
      { label: "ID", value: c[COL.ID], mono: true },
      { label: t("drawer.timestamp"), value: formatTimestamp(c[COL.TIMESTAMP]) },
      { label: t("drawer.emailSolicitante"), value: c[COL.EMAIL] },
      { label: t("drawer.cpfDemandante"), value: maskCPF(c[COL.CPF_DEMANDANTE]), mono: true },
      { label: t("drawer.cpfFraudador"), value: maskCPF(c[COL.CPF_FRAUDADOR]), mono: true },
      { label: t("drawer.ticketZendesk"), value: c[COL.TICKET], mono: true },
      { label: t("drawer.protocoloRdr"), value: c[COL.PROTOCOLO], mono: true },
      { label: t("drawer.instituicao"), value: c[COL.INSTITUICAO] },
      { label: t("drawer.squad"), value: c[COL.SQUAD] },
      { label: t("drawer.dataContato"), value: c[COL.DATA_CONTATO] },
    ].filter((f) => f.value),
  });

  if (c[COL.SQUAD] === "Customer Security") {
    const csFields: DrawerField[] = [
      { label: t("drawer.reasonCs"), value: c[COL.REASON_CS] },
      { label: t("drawer.cenarioDevice"), value: c[COL.CENARIO_DEVICE] },
      { label: t("drawer.subreasonCs"), value: c[COL.SUBREASON_CS] },
    ].filter((f) => f.value);
    if (csFields.length)
      sections.push({ title: t("drawer.trilhaCs"), fields: csFields });
  }

  if (c[COL.SQUAD] === "Inv Ops") {
    const invFields: DrawerField[] = [
      { label: t("drawer.temContaPj"), value: c[COL.TEM_CONTA_PJ] },
      { label: t("drawer.reasonInvOps"), value: c[COL.REASON_INVOPS] },
      { label: t("drawer.tipoCliente"), value: c[COL.TIPO_CLIENTE] },
      { label: t("drawer.casoMed"), value: c[COL.CASO_MED] },
      { label: t("drawer.transacaoBoleto"), value: c[COL.TRANSACAO_BOLETO] },
      { label: t("drawer.contaFav"), value: c[COL.CONTA_FAV] },
      { label: t("drawer.subreasonVictim"), value: c[COL.SUBREASON_VICTIM] },
      { label: t("drawer.statusMed"), value: c[COL.STATUS_MED] },
      { label: t("drawer.devolucao"), value: c[COL.DEVOLUCAO] },
      { label: t("drawer.possuiDict"), value: c[COL.POSSUI_DICT] },
      { label: t("drawer.dataDict"), value: c[COL.DATA_DICT] },
      { label: t("drawer.dataNotif"), value: c[COL.DATA_NOTIF] },
      { label: t("drawer.subreasonFraudster"), value: c[COL.SUBREASON_FRAUDSTER] },
    ].filter((f) => f.value);
    if (invFields.length)
      sections.push({ title: t("drawer.trilhaInvOps"), fields: invFields });

    const rpFields: DrawerField[] = [
      { label: t("drawer.mudbray"), value: c[COL.MUDBRAY] },
      { label: t("drawer.cercadinho"), value: c[COL.CERCADINHO] },
      { label: t("drawer.boletoCash"), value: c[COL.BOLETO_CASH] },
      { label: t("drawer.tfoRp"), value: c[COL.TFO_RP] },
      { label: t("drawer.saldoRp"), value: c[COL.SALDO_RP] },
      { label: t("drawer.parcialRp"), value: c[COL.TFO_PARCIAL_RP] },
    ].filter((f) => f.value);
    if (rpFields.length)
      sections.push({ title: t("drawer.regrasPreventivas"), fields: rpFields });

    const bcFields: DrawerField[] = [
      { label: t("drawer.tfoBc"), value: c[COL.TFO_BC] },
      { label: t("drawer.saldoBc"), value: c[COL.SALDO_BC] },
      { label: t("drawer.fraudadorBc"), value: c[COL.FRAUDADOR_TIPO_BC] },
      { label: t("drawer.parcialBc"), value: c[COL.TFO_PARCIAL_BC] },
      { label: t("drawer.devolucaoOrigemBc"), value: c[COL.DEVOLUCAO_ORIGEM_BC] },
    ].filter((f) => f.value);
    if (bcFields.length)
      sections.push({ title: t("drawer.bloqueioCautelar"), fields: bcFields });
  }

  return sections;
}

/* ── Donut SVG chart ── */

function DonutChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="42" fill="none" stroke="var(--border)" strokeWidth="14" />
        <text x="60" y="64" textAnchor="middle" fontSize="14" fill="var(--text-secondary)">0</text>
      </svg>
    );
  }

  const colors: Record<string, string> = {
    Pendente: "var(--warning)",
    "Em Análise": "var(--purple-600)",
    Concluído: "var(--success)",
    Cancelado: "var(--text-muted)",
  };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;
  const segments = Object.entries(data).filter(([, count]) => count > 0);

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {segments.map(([status, count]) => {
        const percent = count / total;
        const strokeDasharray = `${percent * circumference} ${circumference}`;
        const rotation = cumulativePercent * 360 - 90;
        cumulativePercent += percent;
        return (
          <circle
            key={status}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={colors[status] || "#ccc"}
            strokeWidth="14"
            strokeDasharray={strokeDasharray}
            transform={`rotate(${rotation} 60 60)`}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        );
      })}
      <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-primary)">
        {total}
      </text>
      <text x="60" y="72" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">
        total
      </text>
    </svg>
  );
}

/* ── Right-column panels ── */

function AssistentePanel({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  const { openChat } = useChat();
  const pendentes = solicitacoes
    .filter((s) => s.status === "Pendente")
    .sort((a, b) => {
      const ta = new Date(a.timestamp).getTime() || 0;
      const tb = new Date(b.timestamp).getTime() || 0;
      return ta - tb;
    });
  const maisAntiga = pendentes[0];

  return (
    <div className="right-panel">
      <div className="right-panel-title">Assistente IA</div>
      {maisAntiga ? (
        <div className="bot-alert">
          <div className="bot-alert-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--purple-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="bot-alert-text">
            <strong>{pendentes.length} solicitaç{pendentes.length > 1 ? "ões pendentes" : "ão pendente"}</strong>.{" "}
            A mais antiga ({maisAntiga.id}) aguarda {timeAgo(maisAntiga.timestamp)}.
          </div>
        </div>
      ) : (
        <div className="bot-alert">
          <div className="bot-alert-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="bot-alert-text" style={{ color: "var(--success)" }}>
            Nenhuma solicitação pendente — tudo em dia!
          </div>
        </div>
      )}
      <div className="bot-cta" onClick={openChat} style={{ cursor: "pointer" }}>Pergunte ao assistente sobre qualquer solicitação ou processo RDR...</div>
    </div>
  );
}

function AtividadePanel({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  const recentes = [...solicitacoes]
    .sort((a, b) => {
      const ta = new Date(a.timestamp).getTime() || 0;
      const tb = new Date(b.timestamp).getTime() || 0;
      return tb - ta;
    })
    .slice(0, 5);

  const dotColor = (status: string) => {
    if (status === "Concluído") return "var(--success)";
    if (status === "Pendente") return "var(--warning)";
    if (status === "Em Análise") return "var(--purple-600)";
    return "var(--text-secondary)";
  };

  const activityLabel = (s: Solicitacao) => {
    if (s.status === "Concluído") return "dossiê gerado com sucesso";
    if (s.status === "Pendente") return "nova solicitação criada";
    if (s.status === "Em Análise") return "em processamento pelo UiPath";
    return s.status;
  };

  return (
    <div className="right-panel">
      <div className="right-panel-title">Atividade Recente</div>
      {recentes.length === 0 ? (
        <p className="activity-empty">Nenhuma atividade ainda</p>
      ) : (
        recentes.map((s) => (
          <div key={s.id} className="activity-item">
            <div className="activity-dot" style={{ background: dotColor(s.status) }} />
            <div className="activity-text">
              <span className="activity-id">{s.id}</span>
              {" — "}
              {activityLabel(s)}
            </div>
            <div className="activity-time">{timeAgo(s.timestamp)}</div>
          </div>
        ))
      )}
    </div>
  );
}

function StatusSistemasPanel() {
  return (
    <div className="right-panel">
      <div className="right-panel-title">Status dos Sistemas</div>
      <div className="status-item">
        <div className="status-dot" style={{ background: "var(--success)" }} />
        <span className="status-name">UiPath Orchestrator</span>
        <span className="status-badge badge-success">Operacional</span>
      </div>
      <div className="status-item">
        <div className="status-dot" style={{ background: "var(--purple-600)" }} />
        <span className="status-name">Google Drive</span>
        <span className="status-badge badge-purple">Automático</span>
      </div>
      <div className="status-item">
        <div className="status-dot" style={{ background: "var(--warning)" }} />
        <span className="status-name">Shuffle API</span>
        <span className="status-badge badge-warning">Monitorar</span>
      </div>
    </div>
  );
}

/* ── Main dashboard ── */

export function DashboardPage() {
  const { getAccessTokenForSheets, scriptReady } = useAuth();
  const { showToast } = useToast();
  const modal = useModal();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RowView[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [showAll, setShowAll] = useState(false);

  const [detail, setDetail] = useState<RowView | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>("Pendente");
  const [savingStatus, setSavingStatus] = useState(false);
  const warnedNoSheet = useRef(false);
  const prevRowsRef = useRef<RowView[]>([]);
  const permissionErrorRef = useRef(false);

  const statusLabel = useCallback(
    (raw: string): string => {
      const map: Record<string, string> = {
        Pendente: t("status.pending"),
        "Em Análise": t("status.inReview"),
        Concluído: t("status.completed"),
        Cancelado: t("status.cancelled"),
      };
      return map[raw] ?? raw ?? "—";
    },
    [t],
  );

  const prioLabel = useCallback(
    (raw: string): string => {
      const map: Record<string, string> = {
        baixa: t("priority.low"),
        media: t("priority.medium"),
        alta: t("priority.high"),
      };
      return map[raw] ?? raw ?? "—";
    },
    [t],
  );

  const fetchRows = useCallback(async (): Promise<RowView[] | null> => {
    const sid = getSpreadsheetId();

    if (isAppsScriptEnv()) {
      return fetchAllRows("", sid);
    }

    if (!sid) {
      if (!warnedNoSheet.current) {
        warnedNoSheet.current = true;
        showToast(t("dashboard.noSheetId"), "error");
      }
      return null;
    }
    if (!scriptReady) return null;
    const token = await getAccessTokenForSheets({ interactive: false }).catch(
      () => getAccessTokenForSheets({ interactive: true }),
    );
    return fetchAllRows(token, sid);
  }, [getAccessTokenForSheets, scriptReady, showToast, t]);

  const load = useCallback(async () => {
    if (permissionErrorRef.current) return;
    setLoading(true);
    try {
      const data = await fetchRows();
      if (data) {
        setRows(data);
      } else {
        setRows([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (
        msg.includes("SHEETS_PERMISSION_DENIED") ||
        msg.includes("403") ||
        msg.includes("Forbidden") ||
        msg.includes("PERMISSION_DENIED")
      ) {
        permissionErrorRef.current = true;
        modal.error(
          "Sem permissão",
          "Você não tem acesso à planilha de solicitações. " +
            "Entre em contato com o administrador para solicitar acesso.",
        );
      } else if (msg.includes("SHEETS_UNAUTHENTICATED")) {
        modal.warning(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente para continuar.",
        );
      } else {
        showToast(msg || t("dashboard.loadError"), "error");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchRows, showToast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (permissionErrorRef.current) return;
      try {
        const data = await fetchRows();
        if (data) setRows(data);
      } catch {
        /* silent */
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchRows]);

  useEffect(() => {
    const prev = prevRowsRef.current;
    if (prev.length === 0) {
      prevRowsRef.current = rows;
      return;
    }
    rows.forEach((row) => {
      const link = row.cells[COL.LINK_GDRIVE_CLIENTE];
      if (!link) return;
      const prevRow = prev.find((p) => p.cells[COL.ID] === row.cells[COL.ID]);
      if (prevRow && !prevRow.cells[COL.LINK_GDRIVE_CLIENTE]) {
        showToast(`${t("doc.newToast")} ${row.cells[COL.ID]}`, "success");
      }
    });
    prevRowsRef.current = rows;
  }, [rows, showToast, t]);

  /* ── Derived data ── */

  const solicitacoes: Solicitacao[] = useMemo(
    () => rows.map((r) => mapRowToSolicitacao(r.cells)),
    [rows],
  );

  const searchFiltered = useMemo(
    () => filterSolicitacoes(solicitacoes, searchTerm),
    [solicitacoes, searchTerm],
  );

  const chipFiltered = useMemo(() => {
    if (activeFilter === "Todos") return searchFiltered;
    if (activeFilter === "Alta prioridade")
      return searchFiltered.filter((s) => s.prioridade === "alta");
    if (activeFilter === "Customer Security" || activeFilter === "Inv Ops")
      return searchFiltered.filter((s) => s.squad === activeFilter);
    return searchFiltered.filter((s) => s.status === activeFilter);
  }, [searchFiltered, activeFilter]);

  const kpis = useMemo(
    () => ({
      pendentes: chipFiltered.filter((s) => s.status === "Pendente").length,
      emAnalise: chipFiltered.filter((s) => s.status === "Em Análise").length,
      concluidos: chipFiltered.filter((s) => s.status === "Concluído").length,
      altaPrioridade: chipFiltered.filter(
        (s) =>
          s.prioridade === "alta" &&
          ["Pendente", "Em Análise"].includes(s.status),
      ).length,
      total: chipFiltered.length,
    }),
    [chipFiltered],
  );

  const pendentes = useMemo(() => {
    return chipFiltered
      .filter((s) => s.status === "Pendente" || s.status === "Em Análise")
      .sort((a, b) => {
        const pa = PRIO_ORDER[a.prioridade] ?? 9;
        const pb = PRIO_ORDER[b.prioridade] ?? 9;
        if (pa !== pb) return pa - pb;
        return (b.timestamp || "").localeCompare(a.timestamp || "");
      });
  }, [chipFiltered]);

  const displayList = useMemo(() => {
    if (showAll) {
      return chipFiltered.sort((a, b) => {
        const pa = PRIO_ORDER[a.prioridade] ?? 9;
        const pb = PRIO_ORDER[b.prioridade] ?? 9;
        if (pa !== pb) return pa - pb;
        return (b.timestamp || "").localeCompare(a.timestamp || "");
      });
    }
    return pendentes.slice(0, 8);
  }, [showAll, pendentes, chipFiltered]);

  const chartData = useMemo(() => {
    const bySquad = chipFiltered.reduce(
      (acc, s) => {
        if (s.squad) acc[s.squad] = (acc[s.squad] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = {
      Pendente: chipFiltered.filter((s) => s.status === "Pendente").length,
      "Em Análise": chipFiltered.filter((s) => s.status === "Em Análise").length,
      Concluído: chipFiltered.filter((s) => s.status === "Concluído").length,
      Cancelado: chipFiltered.filter((s) => s.status === "Cancelado").length,
    };

    const last7days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString("pt-BR", { weekday: "short" });
      const dayStr = d.toDateString();
      const count = chipFiltered.filter((s) => {
        if (!s.timestamp) return false;
        let created: Date;
        if (/^\d{2}\/\d{2}\/\d{4}/.test(s.timestamp)) {
          const [datePart, timePart] = s.timestamp.split(" ");
          const [dd, mm, yyyy] = datePart.split("/");
          created = new Date(`${yyyy}-${mm}-${dd}T${timePart || "00:00:00"}`);
        } else {
          created = new Date(s.timestamp);
        }
        return !isNaN(created.getTime()) && created.toDateString() === dayStr;
      }).length;
      return { label: dateStr, count, isToday: i === 6 };
    });

    const bySubreason = chipFiltered.reduce(
      (acc, s) => {
        const sub =
          s.subreasonFraudster || s.subreasonVictim || s.subreasonCs;
        if (sub) acc[sub] = (acc[sub] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { bySquad, byStatus, last7days, bySubreason };
  }, [chipFiltered]);

  /* ── Drawer ── */

  const openDetail = (solicitacao: Solicitacao) => {
    const row = rows.find((r) => r.cells[COL.ID] === solicitacao.id);
    if (!row) return;
    setDetail(row);
    const st = (row.cells[COL.STATUS] as RequestStatus) || "Pendente";
    setNewStatus(STATUSES.includes(st) ? st : "Pendente");
  };

  const saveStatus = async () => {
    if (!detail) return;
    const sid = getSpreadsheetId();
    if (!sid) return;
    setSavingStatus(true);
    try {
      const token = isAppsScriptEnv()
        ? ""
        : await getAccessTokenForSheets({ interactive: true });
      await updateCell(token, sid, rowStatusA1(detail.rowIndex), newStatus);
      setRows((prev) =>
        prev.map((x) =>
          x.rowIndex === detail.rowIndex
            ? {
                ...x,
                cells: x.cells.map((v, i) =>
                  i === COL.STATUS ? newStatus : v,
                ),
              }
            : x,
        ),
      );
      showToast(t("dashboard.statusUpdated"), "success");
      setDetail(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("SHEETS_PERMISSION_DENIED")) {
        modal.error(
          "Sem permissão",
          "Você não tem permissão para alterar o status nesta planilha.",
        );
      } else if (msg.includes("SHEETS_UNAUTHENTICATED")) {
        modal.warning("Sessão expirada", "Faça login novamente.");
      } else {
        showToast(msg || t("dashboard.updateFailed"), "error");
      }
    } finally {
      setSavingStatus(false);
    }
  };

  const detectedType = detectSearchType(searchTerm);

  /* ── Chart helpers ── */

  const maxSquad = Math.max(...Object.values(chartData.bySquad), 1);
  const maxWeek = Math.max(...chartData.last7days.map((d) => d.count), 1);
  const topSubreasons = Object.entries(chartData.bySubreason)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxSub = topSubreasons.length > 0 ? topSubreasons[0][1] : 1;

  /* ── Skeleton ── */

  if (loading) {
    return <LoadingScreen message="Carregando solicitações..." fullScreen />;
  }

  return (
    <div className="painel-wrap">
      {/* ── Topbar ── */}
      <div className="painel-topbar" style={{ padding: "20px 24px 0" }}>
        <h1 className="painel-title">Painel de Acompanhamento</h1>
        <div className="search-wrap">
          <div className="search-bar">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por ID, CPF, protocolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
          </div>
          {searchFocused && (
            <div className="search-tooltip">
              <div className="tooltip-title">Como buscar</div>
              <div className="tooltip-row">
                <span className="tooltip-tag">ID</span>
                <span>
                  Ex: RDR-20260406-0001 — número único da solicitação
                </span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-tag">Protocolo</span>
                <span>
                  Ex: 987654 — protocolo RDR informado no formulário
                </span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-tag">CPF</span>
                <span>
                  Ex: 00000000000 — 11 dígitos, sem pontos (demandante ou
                  fraudador)
                </span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-tag">CNPJ</span>
                <span>
                  Ex: 00000000000000 — 14 dígitos, sem pontos ou barras
                </span>
              </div>
              {detectedType && (
                <div className="tooltip-detected">{detectedType}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="filter-row" style={{ padding: "0 24px" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-chip ${activeFilter === f ? "active" : ""}`}
            onClick={() => {
              setActiveFilter(f);
              setShowAll(false);
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
      <div className="dashboard-left">

      {/* ── Search results ── */}
      {searchTerm.trim() && (
        <div className="search-results-section">
          <div className="search-results-header">
            {detectedType && (
              <span className="search-results-hint">{detectedType}</span>
            )}
            <span className="search-results-count">
              {searchFiltered.length} resultado{searchFiltered.length !== 1 ? "s" : ""} para &ldquo;{searchTerm.trim()}&rdquo;
            </span>
            <span className="search-results-tip">
              Clique em Ver detalhes para abrir o drawer completo
            </span>
          </div>
          {searchFiltered.length === 0 ? (
            <div className="result-card" style={{ justifyContent: "center", cursor: "default" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", padding: "8px 0" }}>
                Nenhum resultado encontrado
              </span>
            </div>
          ) : (
            searchFiltered.slice(0, 20).map((s) => {
              const combined = getCombinedDocState(s.status, s.linkGdriveCliente, s.linkGdriveBacen);
              const cardBorderClass =
                combined === "all-error"
                  ? "result-card-error"
                  : combined === "partial-warn"
                    ? "result-card-partial"
                    : "";
              return (
                <div key={s.id} className={`result-card ${cardBorderClass}`}>
                  <div className="result-card-top">
                    <span className="pendente-id">{s.id}</span>
                    <div className="pendente-info">
                      <span className="pendente-meta">
                        {s.squad}
                        {(s.subreasonFraudster || s.subreasonVictim || s.subreasonCs) &&
                          ` · ${s.subreasonFraudster || s.subreasonVictim || s.subreasonCs}`}
                      </span>
                      <span className="pendente-meta-mono">{s.protocoloRdr}</span>
                      <span className="pendente-meta-mono">{maskCPF(s.cpfDemandante)}</span>
                      <span className="pendente-meta">{timeAgo(s.timestamp)}</span>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${prioBadgeClass(s.prioridade)}`}>
                      {prioLabel(s.prioridade)}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                  </div>
                  <div className="result-card-actions">
                    <DocCell s={s} />
                    <button
                      type="button"
                      className="result-detail-btn"
                      onClick={() => openDetail(s)}
                    >
                      Ver detalhes →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Pendentes</div>
          <div className="kpi-value" style={{ color: "var(--warning)" }}>
            {kpis.pendentes}
          </div>
          <div className="kpi-sub" style={{ color: "var(--text-secondary)" }}>
            aguardando processamento
          </div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-fill"
              style={{
                width: kpis.total
                  ? `${(kpis.pendentes / kpis.total) * 100}%`
                  : "0%",
                background: "var(--warning)",
              }}
            />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Em análise</div>
          <div className="kpi-value" style={{ color: "var(--purple-600)" }}>
            {kpis.emAnalise}
          </div>
          <div className="kpi-sub" style={{ color: "var(--text-secondary)" }}>
            UiPath processando
          </div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-fill"
              style={{
                width: kpis.total
                  ? `${(kpis.emAnalise / kpis.total) * 100}%`
                  : "0%",
                background: "var(--purple-600)",
              }}
            />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Concluídos</div>
          <div className="kpi-value" style={{ color: "var(--success)" }}>
            {kpis.concluidos}
          </div>
          <div className="kpi-sub" style={{ color: "var(--text-secondary)" }}>
            dossiês finalizados
          </div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-fill"
              style={{
                width: kpis.total
                  ? `${(kpis.concluidos / kpis.total) * 100}%`
                  : "0%",
                background: "var(--success)",
              }}
            />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Alta prioridade</div>
          <div className="kpi-value" style={{ color: "var(--danger)" }}>
            {kpis.altaPrioridade}
          </div>
          <div className="kpi-sub" style={{ color: "var(--text-secondary)" }}>
            pendentes urgentes
          </div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-fill"
              style={{
                width: kpis.total
                  ? `${(kpis.altaPrioridade / kpis.total) * 100}%`
                  : "0%",
                background: "var(--danger)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Lista de pendentes ── */}
      <div className="pendentes-section">
        <div className="pendentes-header">
          <span className="pendentes-title">
            {showAll
              ? `Todas as solicitações (${chipFiltered.length})`
              : `Pendentes e em análise (${pendentes.length})`}
          </span>
          <span
            className="pendentes-link"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? "← Mostrar apenas pendentes"
              : "Ver todas as solicitações →"}
          </span>
        </div>

        {displayList.length === 0 ? (
          <div
            className="pendente-row"
            style={{ justifyContent: "center", cursor: "default" }}
          >
            <span
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                padding: "8px 0",
              }}
            >
              Nenhuma solicitação encontrada
            </span>
          </div>
        ) : (
          displayList.map((s) => {
            const combined = getCombinedDocState(s.status, s.linkGdriveCliente, s.linkGdriveBacen);
            const rowBorderClass =
              combined === "all-error"
                ? "result-card-error"
                : combined === "partial-warn"
                  ? "result-card-partial"
                  : "";
            return (
              <div
                key={s.id}
                className={`pendente-row ${rowBorderClass}`}
                onClick={() => openDetail(s)}
              >
                <span className="pendente-id">{s.id}</span>
                <div className="pendente-info">
                  <span className="pendente-meta">
                    {s.squad}
                    {(s.subreasonFraudster ||
                      s.subreasonVictim ||
                      s.subreasonCs) &&
                      ` · ${s.subreasonFraudster || s.subreasonVictim || s.subreasonCs}`}
                  </span>
                  <span className="pendente-meta-mono">{s.protocoloRdr}</span>
                  <span className="pendente-meta-mono">
                    {maskCPF(s.cpfDemandante)}
                  </span>
                  <span className="pendente-meta">{timeAgo(s.timestamp)}</span>
                </div>
                <DocCell s={s} />
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${prioBadgeClass(s.prioridade)}`}
                >
                  {prioLabel(s.prioridade)}
                </span>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(s.status)}`}
                >
                  {statusLabel(s.status)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid">
        {/* Left: by squad + volume semanal */}
        <div className="chart-card">
          <div className="chart-title">Solicitações por squad</div>
          {Object.entries(chartData.bySquad).map(([squad, count]) => (
            <div key={squad} className="bar-row">
              <span className="bar-label">{squad}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / maxSquad) * 100}%` }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}

          <div
            className="chart-title"
            style={{ marginTop: 20, marginBottom: 8 }}
          >
            Volume semanal
          </div>
          <div className="time-bars">
            {chartData.last7days.map((d, i) => (
              <div
                key={i}
                className={`time-bar ${d.isToday ? "today" : ""}`}
                style={{ height: `${(d.count / maxWeek) * 100}%` }}
                title={`${d.label}: ${d.count}`}
              />
            ))}
          </div>
          <div className="time-labels">
            {chartData.last7days.map((d, i) => (
              <span key={i} className="time-label">
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: donut + subreason */}
        <div className="chart-card">
          <div className="chart-title">Distribuição por status</div>
          <div className="donut-wrap">
            <DonutChart data={chartData.byStatus} />
            <div className="donut-legend">
              {Object.entries(chartData.byStatus).map(([status, count]) => {
                const colors: Record<string, string> = {
                  Pendente: "var(--warning)",
                  "Em Análise": "var(--purple-600)",
                  Concluído: "var(--success)",
                  Cancelado: "var(--text-muted)",
                };
                return (
                  <div key={status} className="donut-legend-item">
                    <div
                      className="donut-legend-dot"
                      style={{ background: colors[status] }}
                    />
                    <span>
                      {status} ({count})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {topSubreasons.length > 0 && (
            <>
              <div
                className="chart-title"
                style={{ marginTop: 20, marginBottom: 8 }}
              >
                Top subreasons
              </div>
              {topSubreasons.map(([sub, count]) => (
                <div key={sub} className="bar-row">
                  <span className="bar-label">{sub}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(count / maxSub) * 100}%` }}
                    />
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      </div>{/* end dashboard-left */}

      <div className="dashboard-right">
        <AssistentePanel solicitacoes={solicitacoes} />
        <AtividadePanel solicitacoes={solicitacoes} />
        <StatusSistemasPanel />
      </div>

      </div>{/* end dashboard-grid */}

      {/* ── Drawer ── */}
      {detail && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => !savingStatus && setDetail(null)}
          />
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div>
                <h3 className="drawer-header-title">
                  {t("dashboard.detailsTitle")}
                </h3>
                <p className="drawer-header-id">
                  {detail.cells[COL.ID]}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(detail.cells[COL.STATUS])}`}
                  >
                    {statusLabel(detail.cells[COL.STATUS] || "Pendente")}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${prioBadgeClass(detail.cells[COL.PRIORIDADE])}`}
                  >
                    {prioLabel(detail.cells[COL.PRIORIDADE])}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setDetail(null)}
                disabled={savingStatus}
                aria-label={t("common.close")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {(() => {
              const nomes = (detail.cells[COL.NOMES_ARQUIVOS] || "").split(
                " | ",
              );
              const nomeCliente = nomes[0] || t("doc.defaultNameCliente");
              const nomeBacen = nomes[1] || t("doc.defaultNameBacen");
              const linkCliente = detail.cells[COL.LINK_GDRIVE_CLIENTE];
              const linkBacen = detail.cells[COL.LINK_GDRIVE_BACEN];
              if (!linkCliente && !linkBacen) return null;
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {linkCliente && (
                    <div className="drawer-doc-banner">
                      <div className="drawer-doc-icon">
                        <FileTextIcon size={24} />
                      </div>
                      <div>
                        <span className="drawer-doc-label">
                          {t("doc.availableLabel")}
                        </span>
                        <span className="drawer-doc-name">{nomeCliente}</span>
                      </div>
                      <a
                        href={buildDriveLink(linkCliente)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          marginLeft: "auto",
                          flexShrink: 0,
                        }}
                      >
                        <ExternalLinkIcon />
                        {t("doc.openInDrive")}
                      </a>
                    </div>
                  )}
                  {linkBacen && (
                    <div className="drawer-doc-banner">
                      <div className="drawer-doc-icon">
                        <FileTextIcon size={24} />
                      </div>
                      <div>
                        <span className="drawer-doc-label">
                          {t("doc.availableLabel")}
                        </span>
                        <span className="drawer-doc-name">{nomeBacen}</span>
                      </div>
                      <a
                        href={buildDriveLink(linkBacen)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          marginLeft: "auto",
                          flexShrink: 0,
                        }}
                      >
                        <ExternalLinkIcon />
                        {t("doc.openInDrive")}
                      </a>
                    </div>
                  )}
                </div>
              );
            })()}

            {buildDrawerSections(detail.cells, t).map((section) => (
              <div key={section.title} className="drawer-section">
                <div className="drawer-section-title">{section.title}</div>
                <div className="grid gap-x-6 gap-y-0 sm:grid-cols-2">
                  {section.fields.map((f) => (
                    <div key={f.label} className="drawer-field">
                      <span className="drawer-field-label">{f.label}</span>
                      <span
                        className={`drawer-field-value ${f.mono ? "font-mono" : ""}`}
                      >
                        {f.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="drawer-section">
              <div className="drawer-section-title">
                {t("dashboard.changeStatus")}
              </div>
              <Field label={t("dashboard.newStatus")}>
                <select
                  className="input-field py-2 text-sm"
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as RequestStatus)
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setDetail(null)}
                  disabled={savingStatus}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() => void saveStatus()}
                  disabled={savingStatus}
                >
                  {savingStatus
                    ? t("dashboard.saving")
                    : t("dashboard.saveToSheet")}
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
