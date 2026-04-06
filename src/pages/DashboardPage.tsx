import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchAllRows, rowStatusA1, updateCell } from "../lib/sheetsApi";
import { getSpreadsheetId } from "../lib/spreadsheetConfig";
import { COL, type RequestStatus } from "../types/form";
import { buildDriveLink } from "../utils/buildDriveLink";

const STATUSES: RequestStatus[] = ["Pendente", "Em Análise", "Concluído", "Cancelado"];
const SQUAD_OPTIONS = ["Customer Security", "Inv Ops"];
const POLL_INTERVAL_MS = 30_000;

type RowView = { rowIndex: number; cells: string[] };

function formatTimestamp(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return (
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
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
      return "bg-[var(--color-surface-raised)] text-[var(--color-ink-muted)] border-[var(--color-border)]";
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Pendente":
      return "bg-[var(--warning-dim)] text-[var(--warning)] border-[var(--warning)]";
    case "Em Análise":
      return "bg-[var(--purple-dim)] text-[var(--purple-700)] border-[var(--purple-700)]";
    case "Concluído":
      return "bg-[var(--success-dim)] text-[var(--success)] border-[var(--success)]";
    case "Cancelado":
      return "bg-[var(--color-surface-raised)] text-[var(--color-ink-subtle)] border-[var(--color-border)]";
    default:
      return "bg-[var(--color-surface-raised)] text-[var(--color-ink-muted)] border-[var(--color-border)]";
  }
}

function trilhaValue(c: string[]): string {
  if (c[COL.SQUAD] === "Customer Security") return "CS";
  return c[COL.REASON_INVOPS] || "—";
}

function subreasonValue(c: string[]): string {
  return c[COL.SUBREASON_VICTIM] || c[COL.SUBREASON_FRAUDSTER] || "—";
}

/* ── Icons ── */

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

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

function LoaderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-[var(--color-surface-raised)]" />
      ))}
    </div>
  );
}

/* ── Drawer detail sections ── */

type DrawerField = { label: string; value: string; mono?: boolean };
type TFn = (key: string) => string;

function buildDrawerSections(c: string[], t: TFn): { title: string; fields: DrawerField[] }[] {
  const sections: { title: string; fields: DrawerField[] }[] = [];

  sections.push({
    title: t("drawer.dadosGerais"),
    fields: [
      { label: "ID", value: c[COL.ID], mono: true },
      { label: t("drawer.timestamp"), value: formatTimestamp(c[COL.TIMESTAMP]) },
      { label: t("drawer.emailSolicitante"), value: c[COL.EMAIL] },
      { label: t("drawer.cpfDemandante"), value: c[COL.CPF_DEMANDANTE], mono: true },
      { label: t("drawer.cpfFraudador"), value: c[COL.CPF_FRAUDADOR], mono: true },
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
    if (csFields.length) sections.push({ title: t("drawer.trilhaCs"), fields: csFields });
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
    if (invFields.length) sections.push({ title: t("drawer.trilhaInvOps"), fields: invFields });

    const rpFields: DrawerField[] = [
      { label: t("drawer.mudbray"), value: c[COL.MUDBRAY] },
      { label: t("drawer.cercadinho"), value: c[COL.CERCADINHO] },
      { label: t("drawer.boletoCash"), value: c[COL.BOLETO_CASH] },
      { label: t("drawer.tfoRp"), value: c[COL.TFO_RP] },
      { label: t("drawer.saldoRp"), value: c[COL.SALDO_RP] },
      { label: t("drawer.parcialRp"), value: c[COL.TFO_PARCIAL_RP] },
    ].filter((f) => f.value);
    if (rpFields.length) sections.push({ title: t("drawer.regrasPreventivas"), fields: rpFields });

    const bcFields: DrawerField[] = [
      { label: t("drawer.tfoBc"), value: c[COL.TFO_BC] },
      { label: t("drawer.saldoBc"), value: c[COL.SALDO_BC] },
      { label: t("drawer.fraudadorBc"), value: c[COL.FRAUDADOR_TIPO_BC] },
      { label: t("drawer.parcialBc"), value: c[COL.TFO_PARCIAL_BC] },
      { label: t("drawer.devolucaoOrigemBc"), value: c[COL.DEVOLUCAO_ORIGEM_BC] },
    ].filter((f) => f.value);
    if (bcFields.length) sections.push({ title: t("drawer.bloqueioCautelar"), fields: bcFields });

    if (c[COL.TRANSACAO_CONTESTACAO]) {
      const raw = c[COL.TRANSACAO_CONTESTACAO];
      const pipeIdx = raw.indexOf(" | ");
      const txFields: DrawerField[] = pipeIdx !== -1
        ? [
            { label: t("drawer.transacaoCodigo"), value: raw.slice(0, pipeIdx), mono: true },
            { label: t("drawer.transacaoValor"), value: raw.slice(pipeIdx + 3) },
          ]
        : [{ label: t("drawer.transacaoContestacao"), value: raw }];
      sections.push({ title: t("drawer.dadosTransacao"), fields: txFields });
    }
  }

  return sections;
}

/* ── Main dashboard ── */

export function DashboardPage() {
  const { getAccessTokenForSheets, scriptReady } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RowView[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [fStatus, setFStatus] = useState("");
  const [fPrio, setFPrio] = useState("");
  const [fSquad, setFSquad] = useState("");

  const [detail, setDetail] = useState<RowView | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>("Pendente");
  const [savingStatus, setSavingStatus] = useState(false);
  const warnedNoSheet = useRef(false);
  const prevRowsRef = useRef<RowView[]>([]);

  const statusLabel = useCallback((raw: string): string => {
    const map: Record<string, string> = {
      Pendente: t("status.pending"),
      "Em Análise": t("status.inReview"),
      Concluído: t("status.completed"),
      Cancelado: t("status.cancelled"),
    };
    return map[raw] ?? raw ?? "—";
  }, [t]);

  const prioLabel = useCallback((raw: string): string => {
    const map: Record<string, string> = {
      baixa: t("priority.low"),
      media: t("priority.medium"),
      alta: t("priority.high"),
    };
    return map[raw] ?? raw ?? "—";
  }, [t]);

  const fetchRows = useCallback(async (): Promise<RowView[] | null> => {
    const sid = getSpreadsheetId();
    if (!sid) {
      if (!warnedNoSheet.current) {
        warnedNoSheet.current = true;
        showToast(t("dashboard.noSheetId"), "error");
      }
      return null;
    }
    if (!scriptReady) return null;
    const token = await getAccessTokenForSheets({ interactive: false }).catch(() =>
      getAccessTokenForSheets({ interactive: true }),
    );
    return fetchAllRows(token, sid);
  }, [getAccessTokenForSheets, scriptReady, showToast, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRows();
      if (data) {
        setRows(data);
        setPage(1);
      } else {
        setRows([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("dashboard.loadError");
      showToast(msg, "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchRows, showToast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ── Polling every 30s ── */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchRows();
        if (data) setRows(data);
      } catch {
        /* silent — don't toast on poll failures */
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchRows]);

  /* ── Detect new GDrive links from polling ── */
  useEffect(() => {
    const prev = prevRowsRef.current;
    if (prev.length === 0) {
      prevRowsRef.current = rows;
      return;
    }

    rows.forEach((row) => {
      const link = row.cells[COL.LINK_GDRIVE];
      if (!link) return;
      const prevRow = prev.find((p) => p.cells[COL.ID] === row.cells[COL.ID]);
      if (prevRow && !prevRow.cells[COL.LINK_GDRIVE]) {
        showToast(`${t("doc.newToast")} ${row.cells[COL.ID]}`, "success");
      }
    });

    prevRowsRef.current = rows;
  }, [rows, showToast, t]);

  const filtered = useMemo(() => {
    const base = rows.filter((r) => {
      const c = r.cells;
      if (fStatus && c[COL.STATUS] !== fStatus) return false;
      if (fPrio && c[COL.PRIORIDADE] !== fPrio) return false;
      if (fSquad && c[COL.SQUAD] !== fSquad) return false;
      return true;
    });
    return base.sort((a, b) => {
      const ta = a.cells[COL.TIMESTAMP] || "";
      const tb = b.cells[COL.TIMESTAMP] || "";
      return tb.localeCompare(ta);
    });
  }, [rows, fStatus, fPrio, fSquad]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const openDetail = (r: RowView) => {
    setDetail(r);
    const st = (r.cells[COL.STATUS] as RequestStatus) || "Pendente";
    setNewStatus(STATUSES.includes(st) ? st : "Pendente");
  };

  const saveStatus = async () => {
    if (!detail) return;
    const sid = getSpreadsheetId();
    if (!sid) return;
    setSavingStatus(true);
    try {
      const token = await getAccessTokenForSheets({ interactive: true });
      await updateCell(token, sid, rowStatusA1(detail.rowIndex), newStatus);
      setRows((prev) =>
        prev.map((x) =>
          x.rowIndex === detail.rowIndex
            ? { ...x, cells: x.cells.map((v, i) => (i === COL.STATUS ? newStatus : v)) }
            : x,
        ),
      );
      showToast(t("dashboard.statusUpdated"), "success");
      setDetail(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("dashboard.updateFailed");
      showToast(msg, "error");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading} className="gap-2">
          <RefreshIcon />
          {t("dashboard.refresh")}
        </Button>
      </div>

      {/* Filters */}
      <div className="surface-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("dashboard.filters")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select
              className="input-field py-2 text-sm"
              value={fStatus}
              onChange={(e) => { setFStatus(e.target.value); setPage(1); }}
            >
              <option value="">{t("common.all")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("priority.label")}>
            <select
              className="input-field py-2 text-sm"
              value={fPrio}
              onChange={(e) => { setFPrio(e.target.value); setPage(1); }}
            >
              <option value="">{t("common.allFem")}</option>
              {[
                { value: "baixa", label: prioLabel("baixa") },
                { value: "media", label: prioLabel("media") },
                { value: "alta", label: prioLabel("alta") },
              ].map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Squad">
            <select
              className="input-field py-2 text-sm"
              value={fSquad}
              onChange={(e) => { setFSquad(e.target.value); setPage(1); }}
            >
              <option value="">{t("common.all")}</option>
              {SQUAD_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-[1] border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] text-xs uppercase text-[var(--color-ink-subtle)]">
                <tr>
                  <th className="px-3 py-3 font-medium">{t("dashboard.colId")}</th>
                  <th className="px-3 py-3 font-medium">{t("dashboard.colDate")}</th>
                  <th className="px-3 py-3 font-medium">{t("dashboard.colRequester")}</th>
                  <th className="px-3 py-3 font-medium">{t("dashboard.colProtocol")}</th>
                  <th className="px-3 py-3 font-medium">{t("dashboard.colSquad")}</th>
                  <th className="px-3 py-3 font-medium">{t("dashboard.colTrack")}</th>
                  <th className="px-3 py-3 font-medium">{t("priority.label")}</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">{t("doc.column")}</th>
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-ink-muted">
                      {t("dashboard.noResults")}
                    </td>
                  </tr>
                ) : (
                  slice.map((r) => {
                    const c = r.cells;
                    return (
                      <tr
                        key={r.rowIndex}
                        className="cursor-pointer border-b border-[var(--color-border)]/60 transition-colors hover:bg-[var(--color-surface-raised)]"
                        onClick={() => openDetail(r)}
                      >
                        <td className="px-3 py-2.5 font-mono text-xs text-ink">{c[COL.ID] || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-ink-muted">{formatTimestamp(c[COL.TIMESTAMP])}</td>
                        <td className="max-w-[160px] truncate px-3 py-2.5">{c[COL.EMAIL] || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-xs">{c[COL.PROTOCOLO] || "—"}</td>
                        <td className="px-3 py-2.5 text-ink-muted">{c[COL.SQUAD] || "—"}</td>
                        <td className="px-3 py-2.5 text-ink-muted">{trilhaValue(c)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${prioBadgeClass(c[COL.PRIORIDADE])}`}>
                            {prioLabel(c[COL.PRIORIDADE])}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(c[COL.STATUS])}`}>
                            {statusLabel(c[COL.STATUS])}
                          </span>
                        </td>
                        <td className="px-3 py-2.5" onClick={(ev) => ev.stopPropagation()}>
                          {c[COL.LINK_GDRIVE] ? (
                            <a
                              href={buildDriveLink(c[COL.LINK_GDRIVE])}
                              target="_blank"
                              rel="noreferrer"
                              className="doc-link"
                              title={c[COL.NOME_ARQUIVO] || t("doc.defaultName")}
                            >
                              <FileTextIcon />
                              <span>{t("doc.available")}</span>
                            </a>
                          ) : c[COL.STATUS] === "Em Análise" ? (
                            <span className="doc-processing">
                              <LoaderIcon />
                              <span>{t("doc.processing")}</span>
                            </span>
                          ) : (
                            <span className="doc-pending">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-3 py-2 text-xs text-ink-muted">
            <span>
              {t("dashboard.page")} {pageSafe} {t("dashboard.of")} {totalPages} · {filtered.length} {t("dashboard.records")}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="!py-1 !text-xs"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("dashboard.previous")}
              </Button>
              <Button
                variant="secondary"
                className="!py-1 !text-xs"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {detail && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => !savingStatus && setDetail(null)}
          />
          <aside className="drawer" role="dialog" aria-modal="true">
            {/* Drawer header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {t("dashboard.detailsTitle")}
                </h3>
                <p className="mt-1 font-mono text-sm text-[var(--purple-700)]">
                  {detail.cells[COL.ID]}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(detail.cells[COL.STATUS])}`}>
                    {statusLabel(detail.cells[COL.STATUS] || "Pendente")}
                  </span>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${prioBadgeClass(detail.cells[COL.PRIORIDADE])}`}>
                    {prioLabel(detail.cells[COL.PRIORIDADE])}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg p-2 text-ink-muted transition-colors hover:bg-[var(--color-surface-raised)] hover:text-ink"
                onClick={() => setDetail(null)}
                disabled={savingStatus}
                aria-label={t("common.close")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Document banner */}
            {detail.cells[COL.LINK_GDRIVE] && (
              <div className="drawer-doc-banner">
                <div className="drawer-doc-icon">
                  <FileTextIcon size={24} />
                </div>
                <div>
                  <span className="drawer-doc-label">{t("doc.availableLabel")}</span>
                  <span className="drawer-doc-name">
                    {detail.cells[COL.NOME_ARQUIVO] || t("doc.defaultName")}
                  </span>
                </div>
                <a
                  href={buildDriveLink(detail.cells[COL.LINK_GDRIVE])}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}
                >
                  <ExternalLinkIcon />
                  {t("doc.openInDrive")}
                </a>
              </div>
            )}

            {/* Drawer body — field sections */}
            {buildDrawerSections(detail.cells, t).map((section) => (
              <div key={section.title} className="drawer-section">
                <div className="drawer-section-title">{section.title}</div>
                <div className="grid gap-x-6 gap-y-0 sm:grid-cols-2">
                  {section.fields.map((f) => (
                    <div key={f.label} className="drawer-field">
                      <span className="drawer-field-label">{f.label}</span>
                      <span className={`drawer-field-value ${f.mono ? "font-mono" : ""}`}>
                        {f.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Status update */}
            <div className="drawer-section">
              <div className="drawer-section-title">{t("dashboard.changeStatus")}</div>
              <Field label={t("dashboard.newStatus")}>
                <select
                  className="input-field py-2 text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              </Field>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDetail(null)} disabled={savingStatus}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={() => void saveStatus()} disabled={savingStatus}>
                  {savingStatus ? t("dashboard.saving") : t("dashboard.saveToSheet")}
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
