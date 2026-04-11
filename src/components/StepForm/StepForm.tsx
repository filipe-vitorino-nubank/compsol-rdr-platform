import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { formatDateDisplay } from "../../utils/formatDate";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
import { useFormContext } from "../../context/FormContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { useChat } from "../../context/ChatContext";
import { validateStep1, validateStep2 } from "../../lib/validation";
import {
  appendRequestRow,
  ensureHeaders,
  generateId,
  formStateToRow,
} from "../../lib/sheetsApi";
import { getSpreadsheetId } from "../../lib/spreadsheetConfig";
import { isMissingCredentials } from "../../config/env";
import { isAppsScriptEnv } from "../../lib/gasClient";
import { FieldTooltip } from "./FieldTooltip";
import {
  INSTITUICAO_OPTIONS,
  REASON_CS_OPTIONS,
  SUBREASON_CS_OPTIONS,
  SUBREASON_VICTIM_OPTIONS,
  STATUS_MED_OPTIONS,
  DEVOLUCAO_OPTIONS,
  SUBREASON_FRAUDSTER_OPTIONS,
  type Squad,
  type Instituicao,
  type ReasonCs,
  type SubreasonCs,
  type ReasonInvOps,
  type TipoCliente,
  type SubreasonVictim,
  type StatusMed,
  type Devolucao,
  type SubreasonFraudster,
  type SimNao,
  type RdrFormState,
} from "../../types/form";
import { deriveTemplates } from "../../utils/deriveRobotTemplates";

/* ════════════════════════════════════════════
   Shared helpers
   ════════════════════════════════════════════ */

function ConditionalBlock({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`conditional-block ${visible ? "conditional-block--visible" : ""}`}>
      <div className="conditional-block-inner">{children}</div>
    </div>
  );
}

function BlockHeader({
  title,
  variant,
}: {
  title: string;
  variant: "cs" | "invops" | "victim" | "fraudster" | "sub" | "info";
}) {
  return (
    <div className={`form-block-header form-block-${variant} form-block-enter`}>
      {title}
    </div>
  );
}

function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  labels,
}: {
  name: string;
  options: readonly T[];
  value: string;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={name}>
      {options.map((opt) => (
        <label
          key={opt}
          className={`choice-tile ${value === opt ? "choice-tile--selected" : ""}`}
        >
          <input
            type="radio"
            name={name}
            className="h-4 w-4 shrink-0 accent-[var(--purple-600)]"
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          <span>{labels?.[opt] ?? opt}</span>
        </label>
      ))}
    </div>
  );
}

function cpfDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 11);
}

/* ════════════════════════════════════════════
   Stepper
   ════════════════════════════════════════════ */

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useLanguage();
  const labels = [t("stepper.generalData"), t("stepper.track"), t("stepper.confirmation")];

  return (
    <div className="stepper">
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={num} className={`step-item ${done ? "done" : ""}`}>
            <div className={`step-circle ${done ? "done" : active ? "active" : ""}`}>
              {done ? <CheckIcon /> : num}
            </div>
            <span className={`step-label ${done ? "done" : active ? "active" : ""}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   Step 1 — Dados Gerais
   ════════════════════════════════════════════ */

function Step1DadosGerais() {
  const { state, setField, handleSquadChange } = useFormContext();
  const { googleUser } = useAuth();
  const { t } = useLanguage();
  const e = state.fieldErrors;

  useEffect(() => {
    if (googleUser?.email && !state.emailSolicitante) {
      setField("emailSolicitante", googleUser.email);
    }
  }, [googleUser?.email]);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2" data-field="emailSolicitante">
        <Field label={t("step1.email")} error={e.emailSolicitante} required>
          <div className="input-field" style={{ opacity: 0.7, cursor: "default" }}>
            {state.emailSolicitante || "—"}
          </div>
        </Field>
      </div>

      <div className="sm:col-span-2" data-field="emailConfirmado">
        <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors hover:bg-[var(--bg-card-hover)]">
          <input
            type="checkbox"
            checked={state.emailConfirmado}
            onChange={(ev) => setField("emailConfirmado", ev.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--purple-600)]"
          />
          <span className="text-sm leading-relaxed text-[var(--ink)]">
            Registrar <strong>{state.emailSolicitante}</strong> como o e-mail vinculado a esta solicitação
          </span>
        </label>
        {e.emailConfirmado && (
          <p className="mt-1 text-xs text-red-500">{e.emailConfirmado}</p>
        )}
      </div>

      <div data-field="cpfDemandante">
        <Field label={<>{t("step1.cpfDemandante")}<FieldTooltip text={t("tooltip.cpfDemandante")} /></>} error={e.cpfDemandante} required>
          <input
            className={`input-field font-mono ${e.cpfDemandante ? "input-field--error" : ""}`}
            value={state.cpfDemandante}
            inputMode="numeric"
            maxLength={11}
            autoComplete="off"
            placeholder="00000000000"
            onChange={(ev) => setField("cpfDemandante", cpfDigitsOnly(ev.target.value))}
          />
        </Field>
      </div>

      <div data-field="cpfFraudador">
        <Field label={<>{t("step1.cpfFraudador")}<FieldTooltip text={t("tooltip.cpfFraudador")} /></>} error={e.cpfFraudador}>
          <input
            className={`input-field font-mono ${e.cpfFraudador ? "input-field--error" : ""}`}
            value={state.cpfFraudador}
            inputMode="numeric"
            maxLength={11}
            autoComplete="off"
            placeholder="00000000000"
            onChange={(ev) => setField("cpfFraudador", cpfDigitsOnly(ev.target.value))}
          />
        </Field>
      </div>

      <div data-field="ticketZendesk">
        <Field label={<>{t("step1.ticketZendesk")}<FieldTooltip text={t("tooltip.ticketZendesk")} /></>}>
          <input
            className="input-field font-mono"
            value={state.ticketZendesk}
            onChange={(ev) => setField("ticketZendesk", ev.target.value)}
            maxLength={50}
          />
        </Field>
      </div>

      <div data-field="protocoloRdr">
        <Field label={<>{t("step1.protocoloRdr")}<FieldTooltip text={t("tooltip.protocoloRdr")} /></>} error={e.protocoloRdr} required>
          <input
            className={`input-field font-mono ${e.protocoloRdr ? "input-field--error" : ""}`}
            value={state.protocoloRdr}
            onChange={(ev) => setField("protocoloRdr", ev.target.value)}
            maxLength={50}
          />
        </Field>
      </div>

      <div className="sm:col-span-2" data-field="instituicao">
        <Field label={<>{t("step1.instituicao")}<FieldTooltip text={t("tooltip.instituicao")} /></>} error={e.instituicao} required>
          <select
            className={`input-field ${e.instituicao ? "input-field--error" : ""}`}
            value={state.instituicao}
            onChange={(ev) => setField("instituicao", ev.target.value as Instituicao)}
          >
            <option value="">{t("common.select")}</option>
            {INSTITUICAO_OPTIONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </Field>
      </div>

      <div data-field="squad">
        <Field label={<>{t("step1.squad")}<FieldTooltip text={t("tooltip.squad")} /></>} error={e.squad} required>
          <select
            className={`input-field ${e.squad ? "input-field--error" : ""}`}
            value={state.squad}
            onChange={(ev) => handleSquadChange(ev.target.value as Squad | "")}
          >
            <option value="">{t("common.select")}</option>
            <option value="Customer Security">Customer Security</option>
            <option value="Inv Ops">Inv Ops</option>
          </select>
        </Field>
      </div>

      <div data-field="dataPrimeiroContato">
        <Field label={<>{t("step1.dataPrimeiroContato")}<FieldTooltip text={t("tooltip.dataPrimeiroContato")} /></>} error={e.dataPrimeiroContato} required>
          <input
            type="date"
            className={`input-field ${e.dataPrimeiroContato ? "input-field--error" : ""}`}
            value={state.dataPrimeiroContato}
            onChange={(ev) => setField("dataPrimeiroContato", ev.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Step 2 — Trilha
   ════════════════════════════════════════════ */

function Step2Trilha() {
  const {
    state,
    setField,
    handleReasonCsChange,
    handleReasonInvOpsChange,
    handleSubreasonFraudsterChange,
    handlePossuiDictChange,
  } = useFormContext();
  const { t } = useLanguage();
  const e = state.fieldErrors;

  const simNaoLabels = { Sim: t("common.yes"), Não: t("common.no") } as const;
  const tipoClienteLabels = { "Cliente OK": t("step2.clienteOk"), "Cliente Fraudster": t("step2.clienteFraudster") } as const;

  const showCs = state.squad === "Customer Security";
  const showInvOps = state.squad === "Inv Ops";
  const showDeviceAuthSub = showCs && state.reasonCs === "Device Authorization";
  const showVictim = showInvOps && state.reasonInvOps === "Victim";
  const showFraudster = showInvOps && state.reasonInvOps === "Fraudster";
  const showDictDate = showFraudster && state.possuiDict === "Sim";
  const showRp = showFraudster && state.subreasonFraudster === "Regras Preventivas";
  const showBc = showFraudster && state.subreasonFraudster === "Bloqueio Cautelar";

  const maskCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (!v) { setField("transacaoValor", ""); return; }
    const num = parseInt(v, 10) / 100;
    setField("transacaoValor",
      num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  };

  const csContent = () => (
      <>
        <BlockHeader title="Customer Security" variant="cs" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div data-field="reasonCs">
            <Field label={<>{t("step2.reasonCs")}<FieldTooltip text={t("tooltip.reasonCs")} /></>}>
              <select
                className="input-field"
                value={state.reasonCs}
                onChange={(ev) => handleReasonCsChange(ev.target.value as ReasonCs | "")}
              >
                <option value="">{t("common.select")}</option>
                {REASON_CS_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
          <ConditionalBlock visible={showDeviceAuthSub}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div data-field="cenarioDeviceAuth">
                <Field label={<>{t("step2.cenarioDeviceAuth")}<FieldTooltip text={t("tooltip.cenarioDeviceAuth")} /></>}>
                  <input
                    className="input-field"
                    value={state.cenarioDeviceAuth}
                    onChange={(ev) => setField("cenarioDeviceAuth", ev.target.value)}
                  />
                </Field>
              </div>
              <div data-field="subreasonCs">
                <Field label={<>{t("step2.subreasonCs")}<FieldTooltip text={t("tooltip.subreasonCs")} /></>}>
                  <select
                    className="input-field"
                    value={state.subreasonCs}
                    onChange={(ev) => setField("subreasonCs", ev.target.value as SubreasonCs)}
                  >
                    <option value="">{t("common.select")}</option>
                    {SUBREASON_CS_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </ConditionalBlock>
        </div>
      </>
  );

  const invOpsContent = () => (
      <>
        <BlockHeader title="Inv Ops" variant="invops" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div data-field="temContaPj">
            <Field label={<>{t("step2.temContaPj")}<FieldTooltip text={t("tooltip.temContaPj")} /></>}>
              <RadioGroup
                name="temContaPj"
                options={["Sim", "Não"] as const}
                value={state.temContaPj}
                onChange={(v) => setField("temContaPj", v as SimNao)}
                labels={simNaoLabels}
              />
            </Field>
          </div>
          <div data-field="reasonInvOps">
            <Field label={<>{t("step2.reasonInvOps")}<FieldTooltip text={t("tooltip.reasonInvOps")} /></>}>
              <RadioGroup
                name="reasonInvOps"
                options={["Victim", "Fraudster"] as const}
                value={state.reasonInvOps}
                onChange={(v) => handleReasonInvOpsChange(v as ReasonInvOps)}
              />
            </Field>
          </div>
        </div>

        {/* Victim sub-block */}
        <ConditionalBlock visible={showVictim}>
          <BlockHeader title="Trilha Victim" variant="victim" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div data-field="tipoCliente">
              <Field label={<>{t("step2.tipoCliente")}<FieldTooltip text={t("tooltip.tipoCliente")} /></>}>
                <RadioGroup
                  name="tipoCliente"
                  options={["Cliente OK", "Cliente Fraudster"] as const}
                  value={state.tipoCliente}
                  onChange={(v) => setField("tipoCliente", v as TipoCliente)}
                  labels={tipoClienteLabels}
                />
              </Field>
            </div>
            <div data-field="casoMedPix">
              <Field label={<>{t("step2.casoMedPix")}<FieldTooltip text={t("tooltip.casoMedPix")} /></>}>
                <RadioGroup name="casoMedPix" options={["Sim", "Não"] as const} value={state.casoMedPix} onChange={(v) => setField("casoMedPix", v as SimNao)} labels={simNaoLabels} />
              </Field>
            </div>
            <div data-field="transacaoBoleto">
              <Field label={<>{t("step2.transacaoBoleto")}<FieldTooltip text={t("tooltip.transacaoBoleto")} /></>}>
                <RadioGroup name="transacaoBoleto" options={["Sim", "Não"] as const} value={state.transacaoBoleto} onChange={(v) => setField("transacaoBoleto", v as SimNao)} labels={simNaoLabels} />
              </Field>
            </div>
            <div data-field="contaFavorecidaFraudster">
              <Field label={<>{t("step2.contaFavorecida")}<FieldTooltip text={t("tooltip.contaFavorecida")} /></>}>
                <RadioGroup name="contaFavorecidaFraudster" options={["Sim", "Não"] as const} value={state.contaFavorecidaFraudster} onChange={(v) => setField("contaFavorecidaFraudster", v as SimNao)} labels={simNaoLabels} />
              </Field>
            </div>
            <div data-field="subreasonVictim">
              <Field label={<>{t("step2.subreasonVictim")}<FieldTooltip text={t("tooltip.subreasonVictim")} /></>} error={e.subreasonVictim} required>
                <select className={`input-field ${e.subreasonVictim ? "input-field--error" : ""}`} value={state.subreasonVictim} onChange={(ev) => setField("subreasonVictim", ev.target.value as SubreasonVictim)}>
                  <option value="">{t("common.select")}</option>
                  {SUBREASON_VICTIM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <div data-field="statusMed">
              <Field label={<>{t("step2.statusMed")}<FieldTooltip text={t("tooltip.statusMed")} /></>} error={e.statusMed} required>
                <select className={`input-field ${e.statusMed ? "input-field--error" : ""}`} value={state.statusMed} onChange={(ev) => setField("statusMed", ev.target.value as StatusMed)}>
                  <option value="">{t("common.select")}</option>
                  {STATUS_MED_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-2" data-field="devolucao">
              <Field label={<>{t("step2.devolucao")}<FieldTooltip text={t("tooltip.devolucao")} /></>} error={e.devolucao} required>
                <select className={`input-field ${e.devolucao ? "input-field--error" : ""}`} value={state.devolucao} onChange={(ev) => setField("devolucao", ev.target.value as Devolucao)}>
                  <option value="">{t("common.select")}</option>
                  {DEVOLUCAO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </ConditionalBlock>

        {/* Fraudster sub-block */}
        <ConditionalBlock visible={showFraudster}>
          <BlockHeader title="Trilha Fraudster" variant="fraudster" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div data-field="possuiDict">
              <Field label={<>{t("step2.possuiDict")}<FieldTooltip text={t("tooltip.possuiDict")} /></>} hint="Databricks">
                <RadioGroup name="possuiDict" options={["Sim", "Não"] as const} value={state.possuiDict} onChange={(v) => handlePossuiDictChange(v as SimNao)} labels={simNaoLabels} />
              </Field>
            </div>
            <ConditionalBlock visible={showDictDate}>
              <div data-field="dataDict">
                <Field label={<>{t("step2.dataDict")}<FieldTooltip text={t("tooltip.dataDict")} /></>}>
                  <input type="date" className="input-field" value={state.dataDict} onChange={(ev) => setField("dataDict", ev.target.value)} />
                </Field>
              </div>
            </ConditionalBlock>
            <div data-field="subreasonFraudster">
              <Field label={<>{t("step2.subreasonFraudster")}<FieldTooltip text={t("tooltip.subreasonFraudster")} /></>} error={e.subreasonFraudster} required>
                <select className={`input-field ${e.subreasonFraudster ? "input-field--error" : ""}`} value={state.subreasonFraudster} onChange={(ev) => handleSubreasonFraudsterChange(ev.target.value as SubreasonFraudster | "")}>
                  <option value="">{t("common.select")}</option>
                  {SUBREASON_FRAUDSTER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Regras Preventivas */}
          <ConditionalBlock visible={showRp}>
            <BlockHeader title="Regras Preventivas" variant="sub" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2" data-field="casosMudbray">
                <Field label={<>{t("step2.casosMudbray")}<FieldTooltip text={t("tooltip.casosMudbray")} /></>} error={e.casosMudbray} required>
                  <RadioGroup name="casosMudbray" options={["Sim", "Não"] as const} value={state.casosMudbray} onChange={(v) => setField("casosMudbray", v as SimNao)} labels={simNaoLabels} />
                </Field>
              </div>
              <div data-field="casosCercadinho">
                <Field label={<>{t("step2.casosCercadinho")}<FieldTooltip text={t("tooltip.casosCercadinho")} /></>} error={e.casosCercadinho} required>
                  <RadioGroup name="casosCercadinho" options={["Sim", "Não"] as const} value={state.casosCercadinho} onChange={(v) => setField("casosCercadinho", v as SimNao)} labels={simNaoLabels} />
                </Field>
              </div>
              <div data-field="casosBoleto">
                <Field label={<>{t("step2.casosBoleto")}<FieldTooltip text={t("tooltip.casosBoleto")} /></>} error={e.casosBoleto} required>
                  <RadioGroup name="casosBoleto" options={["Sim", "Não"] as const} value={state.casosBoleto} onChange={(v) => setField("casosBoleto", v as SimNao)} labels={simNaoLabels} />
                </Field>
              </div>
              <div className="sm:col-span-2" data-field="saldoEmContaRp">
                <Field label={<>Saldo em Conta<FieldTooltip text="O cliente ainda possui saldo disponível na conta?" /></>} error={e.saldoEmContaRp} required>
                  <RadioGroup name="saldoEmContaRp" options={["Sim", "Não"] as const} value={state.saldoEmContaRp} onChange={(v) => { setField("saldoEmContaRp", v as SimNao); setField("tipoTfoRp", ""); }} labels={simNaoLabels} />
                </Field>
              </div>
              {state.saldoEmContaRp === "Sim" && (
                <div className="sm:col-span-2" data-field="tipoTfoRp">
                  <Field label={<>Tipo de TFO<FieldTooltip text="Selecione o tipo de transferência de fundos realizada" /></>} error={e.tipoTfoRp} required>
                    <select className={`input-field ${e.tipoTfoRp ? "input-field--error" : ""}`} value={state.tipoTfoRp} onChange={(ev) => setField("tipoTfoRp", ev.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="TFO_TOTAL_CLIENTE">TFO TOTAL REALIZADO PELO CLIENTE</option>
                      <option value="TFO_TOTAL_NUBANK">TFO TOTAL REALIZADO PELO NUBANK</option>
                      <option value="TFO_PARCIAL">TFO PARCIAL (CLIENTE/NUBANK)</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
            {(state.saldoEmContaRp === "Não" || (state.saldoEmContaRp === "Sim" && state.tipoTfoRp)) && (() => {
              const d = deriveTemplates(state.saldoEmContaRp, state.tipoTfoRp);
              return (
                <div className="template-preview">
                  <div className="template-preview-label">Robô vai usar:</div>
                  <div className="template-preview-row">
                    <span className="template-tag tag-bacen">BACEN</span>
                    <span className="template-value">{d.template_bacen}</span>
                  </div>
                  <div className="template-preview-row">
                    <span className="template-tag tag-cliente">Cliente</span>
                    <span className="template-value">{d.template_cliente}</span>
                  </div>
                </div>
              );
            })()}
          </ConditionalBlock>

          {/* Bloqueio Cautelar */}
          <ConditionalBlock visible={showBc}>
            <BlockHeader title="Bloqueio Cautelar" variant="sub" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2" data-field="saldoEmContaBc">
                <Field label={<>Saldo em Conta<FieldTooltip text="O cliente ainda possui saldo disponível na conta?" /></>} error={e.saldoEmContaBc} required>
                  <RadioGroup name="saldoEmContaBc" options={["Sim", "Não"] as const} value={state.saldoEmContaBc} onChange={(v) => { setField("saldoEmContaBc", v as SimNao); setField("tipoTfoBc", ""); }} labels={simNaoLabels} />
                </Field>
              </div>
              {state.saldoEmContaBc === "Sim" && (
                <div className="sm:col-span-2" data-field="tipoTfoBc">
                  <Field label={<>Tipo de TFO<FieldTooltip text="Selecione o tipo de transferência de fundos realizada" /></>} error={e.tipoTfoBc} required>
                    <select className={`input-field ${e.tipoTfoBc ? "input-field--error" : ""}`} value={state.tipoTfoBc} onChange={(ev) => setField("tipoTfoBc", ev.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="TFO_TOTAL_CLIENTE">TFO TOTAL REALIZADO PELO CLIENTE</option>
                      <option value="TFO_TOTAL_NUBANK">TFO TOTAL REALIZADO PELO NUBANK</option>
                      <option value="TFO_PARCIAL">TFO PARCIAL (CLIENTE/NUBANK)</option>
                    </select>
                  </Field>
                </div>
              )}
              <div data-field="bcFraudadorPfpj">
                <Field label={<>{t("step2.fraudadorPfpj")}<FieldTooltip text={t("tooltip.fraudadorPfpj")} /></>} error={e.bcFraudadorPfpj} required>
                  <RadioGroup name="bcFraudadorPfpj" options={["Sim", "Não"] as const} value={state.bcFraudadorPfpj} onChange={(v) => { setField("bcFraudadorPfpj", v as SimNao); if (v === "Não") setField("bcFraudadorTipo", ""); }} labels={simNaoLabels} />
                </Field>
              </div>
              {state.bcFraudadorPfpj === "Sim" && (
                <div data-field="bcFraudadorTipo">
                  <Field label={<>{t("step2.fraudadorTipo")}<FieldTooltip text={t("tooltip.fraudadorTipo")} /></>} error={e.bcFraudadorTipo} required>
                    <RadioGroup name="bcFraudadorTipo" options={["PF", "PJ"] as const} value={state.bcFraudadorTipo} onChange={(v) => setField("bcFraudadorTipo", v)} />
                  </Field>
                </div>
              )}
              <div data-field="devolucaoOrigemBc">
                <Field label={<>{t("step2.devolucaoOrigem")}<FieldTooltip text={t("tooltip.devolucaoOrigem")} /></>} error={e.devolucaoOrigemBc} required>
                  <RadioGroup name="devolucaoOrigemBc" options={["Sim", "Não"] as const} value={state.devolucaoOrigemBc} onChange={(v) => setField("devolucaoOrigemBc", v as SimNao)} labels={simNaoLabels} />
                </Field>
              </div>
              <div data-field="transacaoCodigo">
                <Field label={<>{t("step2.transacaoCodigo")}<FieldTooltip text={t("tooltip.transacaoCodigo")} /></>} error={e.transacaoCodigo} required>
                  <input
                    className={`input-field font-mono ${e.transacaoCodigo ? "input-field--error" : ""}`}
                    value={state.transacaoCodigo}
                    onChange={(ev) => setField("transacaoCodigo", ev.target.value)}
                    placeholder="Ex: 6986710a"
                  />
                </Field>
              </div>
              <div data-field="transacaoValor">
                <Field label={<>{t("step2.transacaoValor")}<FieldTooltip text={t("tooltip.transacaoValor")} /></>} error={e.transacaoValor} required>
                  <input
                    className={`input-field font-mono ${e.transacaoValor ? "input-field--error" : ""}`}
                    value={state.transacaoValor}
                    onChange={maskCurrency}
                    inputMode="numeric"
                    placeholder="Ex: 1.250,00"
                  />
                </Field>
              </div>
            </div>
            {(state.saldoEmContaBc === "Não" || (state.saldoEmContaBc === "Sim" && state.tipoTfoBc)) && (() => {
              const d = deriveTemplates(state.saldoEmContaBc, state.tipoTfoBc);
              return (
                <div className="template-preview">
                  <div className="template-preview-label">Robô vai usar:</div>
                  <div className="template-preview-row">
                    <span className="template-tag tag-bacen">BACEN</span>
                    <span className="template-value">{d.template_bacen}</span>
                  </div>
                  <div className="template-preview-row">
                    <span className="template-tag tag-cliente">Cliente</span>
                    <span className="template-value">{d.template_cliente}</span>
                  </div>
                </div>
              );
            })()}
          </ConditionalBlock>
        </ConditionalBlock>
      </>
  );

  const squadContent = showCs ? csContent() : showInvOps ? invOpsContent() : null;

  return (
    <>
      {squadContent}

      {/* Informações Complementares — always visible */}
      <BlockHeader title={t("step2.infoComplementares")} variant="info" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div data-field="ticketZendeskContestacao">
          <Field label={<>{t("step2.ticketZdContestacao")}<FieldTooltip text={t("tooltip.ticketZdContestacao")} /></>}>
            <input
              className="input-field font-mono"
              value={state.ticketZendeskContestacao}
              onChange={(ev) => {
                const v = ev.target.value;
                setField("ticketZendeskContestacao", v);
                if (!v.trim()) {
                  setField("dtContestacaoZendeskInicio", "");
                  setField("dtContestacaoZendeskFim", "");
                }
              }}
              placeholder="Ex: 117867560"
              maxLength={50}
            />
          </Field>
        </div>

        {state.ticketZendeskContestacao?.trim() && (
          <>
            <div data-field="dtContestacaoZendeskInicio">
              <Field label={<>{t("step2.dtContestZdInicio")}<FieldTooltip text={t("tooltip.dtContestZdInicio")} /></>}>
                <input type="date" className="input-field" value={state.dtContestacaoZendeskInicio} onChange={(ev) => setField("dtContestacaoZendeskInicio", ev.target.value)} />
              </Field>
            </div>
            <div data-field="dtContestacaoZendeskFim">
              <Field label={<>{t("step2.dtContestZdFim")}<FieldTooltip text={t("tooltip.dtContestZdFim")} /></>}>
                <input type="date" className="input-field" value={state.dtContestacaoZendeskFim} onChange={(ev) => setField("dtContestacaoZendeskFim", ev.target.value)} />
              </Field>
            </div>
          </>
        )}

        <div className="sm:col-span-2" data-field="listaPixEnviado">
          <Field label={<>{t("step2.listaPixEnviado")}<FieldTooltip text={t("step2.listaPixEnviadoTooltip")} /></>} hint={t("step2.listaPixHint")}>
            <textarea className="input-field" rows={2} value={state.listaPixEnviado} onChange={(ev) => setField("listaPixEnviado", ev.target.value)} placeholder="Ex: id1, id2, id3" maxLength={5000} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", float: "right", marginTop: 2 }}>
              {(state.listaPixEnviado || "").length}/5000
            </span>
          </Field>
        </div>

        <div className="sm:col-span-2" data-field="listaPixRecebido">
          <Field label={<>{t("step2.listaPixRecebido")}<FieldTooltip text={t("step2.listaPixRecebidoTooltip")} /></>} hint={t("step2.listaPixHint")}>
            <textarea className="input-field" rows={2} value={state.listaPixRecebido} onChange={(ev) => setField("listaPixRecebido", ev.target.value)} placeholder="Ex: id1, id2, id3" maxLength={5000} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", float: "right", marginTop: 2 }}>
              {(state.listaPixRecebido || "").length}/5000
            </span>
          </Field>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   Step 3 — Confirmação (review)
   ════════════════════════════════════════════ */

type ReviewEntry = { label: string; value: string; mono?: boolean };

function ReviewItem({ label, value, mono }: ReviewEntry) {
  return (
    <div className="review-item">
      <span className="review-item-label">{label}</span>
      <span className={`review-item-value ${!value ? "empty" : ""} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

function buildDadosGeraisItems(s: RdrFormState, t: (k: string) => string): ReviewEntry[] {
  return [
    { label: t("step1.email"), value: s.emailSolicitante },
    { label: t("drawer.cpfDemandante"), value: s.cpfDemandante, mono: true },
    { label: t("drawer.cpfFraudador"), value: s.cpfFraudador, mono: true },
    { label: t("step1.ticketZendesk"), value: s.ticketZendesk, mono: true },
    { label: t("step1.protocoloRdr"), value: s.protocoloRdr, mono: true },
    { label: t("step1.instituicao"), value: s.instituicao },
    { label: "Squad", value: s.squad },
    { label: t("step3.reviewDatePrimeiroContato"), value: s.dataPrimeiroContato },
  ];
}

function buildTrilhaItems(s: RdrFormState, t: (k: string) => string): ReviewEntry[] {
  const items: ReviewEntry[] = [];

  if (s.squad === "Customer Security") {
    if (s.reasonCs) items.push({ label: t("step2.reasonCs"), value: s.reasonCs });
    if (s.cenarioDeviceAuth) items.push({ label: t("step3.reviewCenarioDeviceAuth"), value: s.cenarioDeviceAuth });
    if (s.subreasonCs) items.push({ label: t("step2.subreasonCs"), value: s.subreasonCs });
  }

  if (s.squad === "Inv Ops") {
    if (s.temContaPj) items.push({ label: t("step2.temContaPj"), value: s.temContaPj });
    if (s.reasonInvOps) items.push({ label: t("step2.reasonInvOps"), value: s.reasonInvOps });

    if (s.reasonInvOps === "Victim") {
      if (s.tipoCliente) items.push({ label: t("step2.tipoCliente"), value: s.tipoCliente });
      if (s.casoMedPix) items.push({ label: t("step2.casoMedPix"), value: s.casoMedPix });
      if (s.transacaoBoleto) items.push({ label: t("step3.reviewTransacaoBoleto"), value: s.transacaoBoleto });
      if (s.contaFavorecidaFraudster) items.push({ label: t("step2.contaFavorecida"), value: s.contaFavorecidaFraudster });
      if (s.subreasonVictim) items.push({ label: t("step2.subreasonVictim"), value: s.subreasonVictim });
      if (s.statusMed) items.push({ label: t("step2.statusMed"), value: s.statusMed });
      if (s.devolucao) items.push({ label: t("step2.devolucao"), value: s.devolucao });
    }

    if (s.reasonInvOps === "Fraudster") {
      if (s.possuiDict) items.push({ label: t("step3.reviewPossuiDict"), value: s.possuiDict });
      if (s.possuiDict === "Sim" && s.dataDict) items.push({ label: t("step2.dataDict"), value: s.dataDict });
      if (s.dataNotificacaoCliente) items.push({ label: t("step3.reviewDataNotificacao"), value: s.dataNotificacaoCliente });
      if (s.subreasonFraudster) items.push({ label: t("step2.subreasonFraudster"), value: s.subreasonFraudster });

      if (s.subreasonFraudster === "Regras Preventivas") {
        if (s.casosMudbray) items.push({ label: t("step3.reviewCasosMudbray"), value: s.casosMudbray });
        if (s.casosCercadinho) items.push({ label: t("step3.reviewCasosCercadinho"), value: s.casosCercadinho });
        if (s.casosBoleto) items.push({ label: t("step3.reviewCasosBoleto"), value: s.casosBoleto });
        if (s.saldoEmContaRp) {
          const rpDerived = deriveTemplates(s.saldoEmContaRp, s.tipoTfoRp);
          items.push({ label: "Saldo em Conta", value: s.saldoEmContaRp });
          if (s.tipoTfoRp) items.push({ label: "Tipo TFO", value: s.tipoTfoRp });
          items.push({ label: "→ BACEN", value: rpDerived.template_bacen });
          items.push({ label: "→ Cliente", value: rpDerived.template_cliente });
        }
      }

      if (s.subreasonFraudster === "Bloqueio Cautelar") {
        if (s.saldoEmContaBc) {
          const bcDerived = deriveTemplates(s.saldoEmContaBc, s.tipoTfoBc);
          items.push({ label: "Saldo em Conta", value: s.saldoEmContaBc });
          if (s.tipoTfoBc) items.push({ label: "Tipo TFO", value: s.tipoTfoBc });
          items.push({ label: "→ BACEN", value: bcDerived.template_bacen });
          items.push({ label: "→ Cliente", value: bcDerived.template_cliente });
        }
        if (s.bcFraudadorPfpj) {
          const fraudadorDisplay = s.bcFraudadorPfpj === "Não" ? "Não" : s.bcFraudadorTipo || "";
          if (fraudadorDisplay) items.push({ label: t("step3.reviewFraudadorBc"), value: fraudadorDisplay });
        }
        if (s.devolucaoOrigemBc) items.push({ label: t("step3.reviewDevolucaoBc"), value: s.devolucaoOrigemBc });
        if (s.transacaoCodigo) {
          items.push({ label: t("step3.reviewTransacaoCodigo"), value: s.transacaoCodigo.trim() });
        }
        if (s.transacaoValor) {
          items.push({ label: t("step3.reviewTransacaoValor"), value: `R$ ${s.transacaoValor.trim()}` });
        }
      }
    }
  }

  return items;
}

function buildInfoComplementaresItems(s: RdrFormState, t: (k: string) => string): ReviewEntry[] {
  const items: ReviewEntry[] = [];

  if (s.ticketZendeskContestacao) {
    items.push({ label: t("step2.ticketZdContestacao"), value: s.ticketZendeskContestacao, mono: true });
    if (s.dtContestacaoZendeskInicio) items.push({ label: t("step2.dtContestZdInicio"), value: formatDateDisplay(s.dtContestacaoZendeskInicio) });
    if (s.dtContestacaoZendeskFim) items.push({ label: t("step2.dtContestZdFim"), value: formatDateDisplay(s.dtContestacaoZendeskFim) });
  }
  if (s.listaPixEnviado.trim()) items.push({ label: t("step2.listaPixEnviado"), value: s.listaPixEnviado.trim() });
  if (s.listaPixRecebido.trim()) items.push({ label: t("step2.listaPixRecebido"), value: s.listaPixRecebido.trim() });

  return items;
}

function Step3Confirmacao({
  confirmed,
  onConfirmChange,
}: {
  confirmed: boolean;
  onConfirmChange: (v: boolean) => void;
}) {
  const { state } = useFormContext();
  const { t } = useLanguage();
  const dadosGerais = buildDadosGeraisItems(state, t);
  const trilha = buildTrilhaItems(state, t);
  const infoComp = buildInfoComplementaresItems(state, t);

  return (
    <div className="space-y-6">
      <div className="review-card">
        <div className="review-card-header">{t("step3.dadosGerais")}</div>
        <div className="review-grid">
          {dadosGerais.map((item) => (
            <ReviewItem key={item.label} {...item} />
          ))}
        </div>
      </div>

      <div className="review-card">
        <div className="review-card-header">
          {t("step3.trilha")} {state.squad ? `— ${state.squad}` : ""}
        </div>
        <div className="review-grid">
          {trilha.length > 0 ? (
            trilha.map((item) => (
              <ReviewItem key={item.label} {...item} />
            ))
          ) : (
            <div className="review-item">
              <span className="review-item-value empty">
                {t("step3.noFields")}
              </span>
            </div>
          )}
        </div>
      </div>

      {infoComp.length > 0 && (
        <div className="review-card">
          <div className="review-card-header">{t("step2.infoComplementares")}</div>
          <div className="review-grid">
            {infoComp.map((item) => (
              <ReviewItem key={item.label} {...item} />
            ))}
          </div>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors hover:bg-[var(--bg-card-hover)]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(ev) => onConfirmChange(ev.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--purple-600)]"
        />
        <span className="text-sm leading-relaxed text-ink">
          {t("step3.confirmText")}
        </span>
      </label>
    </div>
  );
}

/* ════════════════════════════════════════════
   Main wizard
   ════════════════════════════════════════════ */

function SettingsIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--purple-600)" }}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--success)" }}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* ── Right-column wizard panels ── */

const STEP_NAMES = ["Dados Gerais", "Trilha", "Confirmação"];

const DICAS: Record<string, { highlight: string; text: string }[]> = {
  "1": [
    { highlight: "Protocolo RDR", text: "é obrigatório para o robô localizar o caso no sistema" },
    { highlight: "CPF Demandante", text: "deve ser o CPF do cliente que realizou a reclamação" },
  ],
  "2": [
    { highlight: "Saldo em Conta", text: "determina qual template o robô vai usar para BACEN e Cliente" },
    { highlight: "Regras Preventivas", text: "verifique no Databricks se há marcação DICT antes de prosseguir" },
    { highlight: "Ticket Zendesk", text: "se houver contestação externa, os campos de data serão habilitados" },
  ],
  "3": [
    { highlight: "Revise os dados", text: "antes de confirmar — após o envio o robô inicia automaticamente" },
    { highlight: "Documentos", text: "serão gerados em .docx e salvos no Drive em até 30 minutos" },
  ],
};

function ProgressPanel({ step, validated }: { step: number; validated: number[] }) {
  const pct = Math.round(((step - 1) / (STEP_NAMES.length - 1)) * 100);

  return (
    <div className="right-panel">
      <div className="right-panel-title">Progresso</div>
      {STEP_NAMES.map((s, i) => {
        const num = i + 1;
        const isDone = validated.includes(num);
        const isActive = step === num;
        return (
          <div key={i} className="progress-step">
            <div className={`progress-step-dot ${isDone ? "dot-done" : isActive ? "dot-active" : "dot-idle"}`} />
            <span className={`progress-step-label ${isDone ? "label-done" : isActive ? "label-active" : "label-idle"}`}>
              {s}
            </span>
            {isDone && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isActive && <div className="dot-pulse" />}
          </div>
        );
      })}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-pct">{pct}% concluído</div>
    </div>
  );
}

function DicasPanel({ step }: { step: number }) {
  const dicas = DICAS[String(step)] || [];
  return (
    <div className="right-panel">
      <div className="right-panel-title">Dicas do processo</div>
      {dicas.map((d, i) => (
        <div key={i} className="dica-item">
          <div className="dica-icon">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--purple-600)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="dica-text">
            <span className="dica-highlight">{d.highlight}</span>
            {" — "}{d.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function AtalhosPanel() {
  return (
    <div className="right-panel">
      <div className="right-panel-title">Atalhos</div>
      <div className="shortcut-row">
        <span className="shortcut-desc">Avançar etapa</span>
        <kbd className="shortcut-key">Enter ↵</kbd>
      </div>
      <div className="shortcut-row">
        <span className="shortcut-desc">Voltar etapa</span>
        <kbd className="shortcut-key">Esc</kbd>
      </div>
      <div className="shortcut-row">
        <span className="shortcut-desc">Abrir assistente</span>
        <kbd className="shortcut-key">⌘ K</kbd>
      </div>
    </div>
  );
}

function AssistenteMiniPanel() {
  const { openChat } = useChat();
  return (
    <div className="right-panel" style={{ padding: "10px 12px" }}>
      <div className="bot-mini">
        <div className="bot-mini-icon">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--purple-600)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="bot-mini-text">
          Dúvida sobre o processo?{" "}
          <span className="bot-mini-link" onClick={openChat} style={{ cursor: "pointer" }}>
            Pergunte ao assistente IA
          </span>
        </div>
      </div>
    </div>
  );
}

export function RdrRequestForm() {
  const { state, setErrors, reset } = useFormContext();
  const { isAuthenticated, getAccessTokenForSheets, scriptReady, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const modal = useModal();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [validatedSteps, setValidatedSteps] = useState<number[]>([]);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [confirmed, setConfirmed] = useState(false);
  const [overlay, setOverlay] = useState<"hidden" | "loading" | "success">("hidden");
  const [generatedId, setGeneratedId] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (waitingForAuth && isAuthenticated) {
      setWaitingForAuth(false);
      setSlideDir("right");
      setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [waitingForAuth, isAuthenticated]);

  const goNext = () => {
    const validator = step === 1 ? validateStep1 : validateStep2;
    const errors = validator(state, t);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      modal.warning(
        "Campos obrigatórios",
        "Alguns campos obrigatórios não foram preenchidos corretamente. Verifique os campos destacados em vermelho antes de continuar.",
        () => {
          setTimeout(() => {
            const firstKey = Object.keys(errors)[0];
            const el = firstKey ? document.querySelector(`[data-field="${firstKey}"]`) : null;
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        },
      );
      return;
    }
    setErrors({});

    if (step === 1 && !isAuthenticated) {
      setWaitingForAuth(true);
      modal.showModal({
        type: "info",
        title: "Autenticação necessária",
        message: "Para continuar com a solicitação, faça login com sua conta Google Nubank.",
        confirmLabel: "Entrar com Google",
        cancelLabel: "Cancelar",
        onConfirm: () => signInWithGoogle(),
        onCancel: () => setWaitingForAuth(false),
      });
      return;
    }

    setValidatedSteps((prev) => prev.includes(step) ? prev : [...prev, step]);
    setSlideDir("right");
    setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setErrors({});
    modal.closeModal();
    setSlideDir("left");
    setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current || !confirmed || overlay !== "hidden") return;
    if (isMissingCredentials()) {
      setShowConfigModal(true);
      return;
    }
    if (!scriptReady) {
      showToast(t("auth.waitScript"), "error");
      return;
    }
    isSubmittingRef.current = true;
    setOverlay("loading");
    try {
      const accessToken = isAppsScriptEnv()
        ? ""
        : await getAccessTokenForSheets({ interactive: false }).catch(() =>
            getAccessTokenForSheets({ interactive: true }),
          );
      const spreadsheetId = getSpreadsheetId();
      await ensureHeaders(accessToken, spreadsheetId);
      const id = await generateId(accessToken, spreadsheetId);
      const row = formStateToRow(state, id);
      await appendRequestRow(accessToken, spreadsheetId, row);
      setGeneratedId(id);
      setOverlay("success");
    } catch (err) {
      setOverlay("hidden");
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("SHEETS_PERMISSION_DENIED")) {
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
        showToast(msg || t("submit.genericError"), "error");
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleNewRequest = () => {
    reset();
    setStep(1);
    setConfirmed(false);
    setOverlay("hidden");
    setGeneratedId("");
  };

  const handleGoToDashboard = () => {
    reset();
    setOverlay("hidden");
    navigate("/painel");
  };

  const handleClearClick = () => {
    modal.showModal({
      type: "warning",
      title: "Limpar formulário",
      message: "Todos os dados preenchidos serão perdidos. Tem certeza que deseja limpar o formulário?",
      confirmLabel: "Sim, limpar",
      cancelLabel: "Cancelar",
      onConfirm: () => {
        reset();
        setStep(1);
        setSlideDir("left");
        setConfirmed(false);
        setValidatedSteps([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });
  };

  return (
    <>
      <div className="wizard-grid">
      <div className="wizard-left">
      <article className="surface-card overflow-hidden">
        {/* Header */}
        <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-5 py-5 sm:px-8 sm:py-6">
          <h1 className="text-balance text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {t("form.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {t("form.subtitle")}
          </p>
        </div>

        {/* Stepper + content */}
        <div className="px-5 py-6 sm:px-8">
          <Stepper current={step} />

          <div className="wizard-container">
            <div key={`step-${step}`} className={`wizard-step--enter-${slideDir}`}>
              {step === 1 && <Step1DadosGerais />}
              {step === 2 && <Step2Trilha />}
              {step === 3 && (
                <Step3Confirmacao
                  confirmed={confirmed}
                  onConfirmChange={setConfirmed}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer / navigation */}
        <div className="border-t border-[var(--border)] px-5 py-4 sm:px-8 sm:pb-8 sm:pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <Button variant="ghost" onClick={goPrev}>
                  {t("common.back")}
                </Button>
              )}
              <button type="button" className="btn-clear-form" onClick={handleClearClick}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.36" />
                </svg>
                Limpar formulário
              </button>
            </div>
            <div>
              {step < 3 ? (
                <Button onClick={goNext}>{t("common.next")}</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!confirmed || overlay !== "hidden"}>
                  {overlay === "loading" ? t("submit.sending") : t("submit.sendRequest")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </article>
      </div>{/* end wizard-left */}

      <div className="wizard-right">
        <ProgressPanel step={step} validated={validatedSteps} />
        <DicasPanel step={step} />
        <AtalhosPanel />
        <AssistenteMiniPanel />
      </div>
      </div>{/* end wizard-grid */}

      {/* Submit overlay */}
      {overlay !== "hidden" && (
        <div className="submit-overlay" role="dialog" aria-modal="true">
          {overlay === "loading" && (
            <>
              <div className="submit-spinner" />
              <span className="submit-overlay-text">{t("submit.loadingText")}</span>
            </>
          )}

          {overlay === "success" && (
            <div className="success-card">
              <CheckCircleIcon />
              <h2 className="mt-4 text-xl font-bold text-ink">
                {t("submit.successTitle")}
              </h2>
              <div className="success-card-id">{generatedId}</div>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                {t("submit.successBody")}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button onClick={handleGoToDashboard}>
                  {t("submit.goToDashboard")}
                </Button>
                <Button variant="ghost" onClick={handleNewRequest}>
                  {t("submit.newRequest")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config modal — missing credentials */}
      {showConfigModal && (
        <div className="submit-overlay" role="dialog" aria-modal="true">
          <div className="config-modal">
            <div className="config-modal-icon">
              <SettingsIcon />
            </div>
            <h3>{t("configModal.title")}</h3>
            <p>
              {t("configModal.body")}
            </p>
            <ol className="config-steps">
              <li>
                {t("configModal.step1")}{" "}
                <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">
                  console.cloud.google.com
                </a>
              </li>
              <li>{t("configModal.step2")}</li>
              <li>
                {t("configModal.step3a")}{" "}
                <strong>{t("configModal.step3b")}</strong>{" "}
                {t("configModal.step3c")}
              </li>
              <li>{t("configModal.step4")}</li>
              <li>{t("configModal.step5")}</li>
              <li>
                {t("configModal.step6")}
                <pre>{`VITE_GOOGLE_CLIENT_ID=seu_client_id\nVITE_GOOGLE_API_KEY=sua_api_key`}</pre>
              </li>
              <li>
                {t("configModal.step7a")} <code>npm run dev</code>
              </li>
            </ol>
            <Button onClick={() => setShowConfigModal(false)}>{t("configModal.gotIt")}</Button>
          </div>
        </div>
      )}
    </>
  );
}
