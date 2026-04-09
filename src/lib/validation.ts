import type { RdrFormState } from "../types/form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TFn = (key: string) => string;

export function validateStep1(s: RdrFormState, t?: TFn): Record<string, string> {
  const e: Record<string, string> = {};
  const req = t?.("validation.required") ?? "Obrigatório";
  const badEmail = t?.("validation.invalidEmail") ?? "E-mail inválido";
  const badCpf = t?.("validation.invalidCpf") ?? "Não é um CPF válido";

  if (!s.emailSolicitante || !EMAIL_RE.test(s.emailSolicitante))
    e.emailSolicitante = badEmail;

  if (!s.cpfDemandante || s.cpfDemandante.length !== 11)
    e.cpfDemandante = badCpf;

  if (s.cpfFraudador && s.cpfFraudador.length !== 11)
    e.cpfFraudador = badCpf;

  if (!s.protocoloRdr) e.protocoloRdr = req;
  if (!s.instituicao) e.instituicao = req;
  if (!s.squad) e.squad = req;
  if (!s.dataPrimeiroContato) e.dataPrimeiroContato = req;

  return e;
}

export function validateStep2(s: RdrFormState, t?: TFn): Record<string, string> {
  const e: Record<string, string> = {};
  const req = t?.("validation.required") ?? "Obrigatório";
  const badValor = t?.("validation.invalidValor") ?? "Informe apenas o valor em reais. Ex: 1.250,00";

  if (s.squad !== "Inv Ops") return e;

  if (s.reasonInvOps === "Victim") {
    if (!s.subreasonVictim) e.subreasonVictim = req;
    if (!s.statusMed) e.statusMed = req;
    if (!s.devolucao) e.devolucao = req;
  }

  if (s.reasonInvOps === "Fraudster") {
    if (!s.dataNotificacaoCliente)
      e.dataNotificacaoCliente = req;
    if (!s.subreasonFraudster)
      e.subreasonFraudster = req;

    if (s.subreasonFraudster === "Regras Preventivas") {
      const rp = [
        "casosMudbray",
        "casosCercadinho",
        "casosBoleto",
      ] as const;
      rp.forEach((f) => {
        if (!s[f]) e[f] = req;
      });
      if (!s.saldoEmContaRp) e.saldoEmContaRp = req;
    }

    if (s.subreasonFraudster === "Bloqueio Cautelar") {
      if (!s.saldoEmContaBc) e.saldoEmContaBc = req;
      const bc = [
        "bcFraudadorPfpj",
        "devolucaoOrigemBc",
      ] as const;
      bc.forEach((f) => {
        if (!s[f]) e[f] = req;
      });
      if (s.bcFraudadorPfpj === "Sim" && !s.bcFraudadorTipo) {
        e.bcFraudadorTipo = req;
      }
      if (!s.transacaoCodigo.trim()) e.transacaoCodigo = req;
      if (!s.transacaoValor.trim()) e.transacaoValor = badValor;
    }
  }

  return e;
}
