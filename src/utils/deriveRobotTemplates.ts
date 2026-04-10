export interface DerivedFields {
  tfo_concluido:    string;
  tfo_parcial:      string;
  conta_sem_saldo:  string;
  template_bacen:   string;
  template_cliente: string;
}

export type TipoTfo =
  | "TFO_TOTAL_CLIENTE"
  | "TFO_TOTAL_NUBANK"
  | "TFO_PARCIAL"
  | "";

export const deriveTemplates = (
  saldoEmConta: string,
  tipoTfo: string = "",
): DerivedFields => {

  if (saldoEmConta === "Não") {
    return {
      tfo_concluido:    "Não",
      tfo_parcial:      "Não",
      conta_sem_saldo:  "Sim",
      template_bacen:   "CONTA SEM SALDO",
      template_cliente: "CONTA SEM SALDO",
    };
  }

  if (tipoTfo === "TFO_TOTAL_CLIENTE") {
    return {
      tfo_concluido:    "Sim",
      tfo_parcial:      "Não",
      conta_sem_saldo:  "Não",
      template_bacen:
        "SE SELECIONADO CONTA COM SALDO / TFO TOTAL REALIZADO PELO CLIENTE",
      template_cliente:
        "SE SELECIONADO CONTA COM SALDO / TFO TOTAL REALIZADO PELO CLIENTE",
    };
  }

  if (tipoTfo === "TFO_TOTAL_NUBANK") {
    return {
      tfo_concluido:    "Sim",
      tfo_parcial:      "Não",
      conta_sem_saldo:  "Não",
      template_bacen:
        "SE SELECIONADO TFO CONCLUÍDO PELO NUBANK / TFO TOTAL REALIZADO PELO DEMANDANTE",
      template_cliente:
        "SE SELECIONADO TFO CONCLUÍDO PELO NUBANK / TFO TOTAL REALIZADO PELO DEMANDANTE",
    };
  }

  if (tipoTfo === "TFO_PARCIAL") {
    return {
      tfo_concluido:    "Não",
      tfo_parcial:      "Sim",
      conta_sem_saldo:  "Não",
      template_bacen:
        "SE SELECIONADO CONTA COM SALDO / TFO PARCIAL REALIZADO PELO CLIENTE",
      template_cliente:
        "SE SELECIONADO CONTA AINDA COM SALDO / TFO PARCIAL REALIZADO PELO DEMANDANTE",
    };
  }

  return {
    tfo_concluido:    "Não",
    tfo_parcial:      "Não",
    conta_sem_saldo:  "Não",
    template_bacen:   "",
    template_cliente: "",
  };
};
