export interface DerivedFields {
  tfo_concluido:    string;
  tfo_parcial:      string;
  conta_sem_saldo:  string;
  template_bacen:   string;
  template_cliente: string;
}

export const deriveTemplates = (
  saldoEmConta: string,
): DerivedFields => {

  if (saldoEmConta === 'Sim') {
    return {
      tfo_concluido:    'Não',
      tfo_parcial:      'Não',
      conta_sem_saldo:  'Não',
      template_bacen:
        'SE SELECIONADO CONTA COM SALDO / TFO TOTAL REALIZADO PELO CLIENTE',
      template_cliente:
        'SE SELECIONADO CONTA COM SALDO / TFO TOTAL REALIZADO PELO CLIENTE',
    };
  }

  return {
    tfo_concluido:    'Sim',
    tfo_parcial:      'Não',
    conta_sem_saldo:  'Sim',
    template_bacen:   'CONTA SEM SALDO',
    template_cliente: 'CONTA SEM SALDO',
  };
};
