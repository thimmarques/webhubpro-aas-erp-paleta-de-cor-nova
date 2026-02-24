export type LancamentoStatus = 'pendente' | 'pago' | 'vencido' | 'parcelado';

export type LancamentoTipo = 'honorario' | 'despesa' | 'repasse' | 'custas';

export interface Lancamento {
  id: string;
  processo_id: string;
  numero_cnj: string;
  cliente_nome: string;
  responsible_id: string;
  practice_area: 'trabalhista' | 'civil' | 'criminal' | 'previdenciario';
  tipo: LancamentoTipo;
  descricao: string;
  valor: number;
  vencimento: string;
  status: LancamentoStatus;
  data_pagamento: string;
  parcelas_total: number;
  parcelas_pagas: number;
  created_at: string;
}

export const lancamentoStatusLabels: Record<LancamentoStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  parcelado: 'Parcelado',
};

export const lancamentoStatusColors: Record<LancamentoStatus, string> = {
  pago: 'bg-green-100 text-green-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  vencido: 'bg-red-100 text-red-700',
  parcelado: 'bg-blue-100 text-blue-700',
};

export const lancamentoTipoLabels: Record<LancamentoTipo, string> = {
  honorario: 'Honorário',
  despesa: 'Despesa',
  repasse: 'Repasse',
  custas: 'Custas',
};

export const lancamentoTipoColors: Record<LancamentoTipo, string> = {
  honorario: 'bg-blue-100 text-blue-700',
  despesa: 'bg-orange-100 text-orange-700',
  repasse: 'bg-purple-100 text-purple-700',
  custas: 'bg-slate-100 text-slate-600',
};

export const tipoDescricaoSuggestion: Record<LancamentoTipo, string> = {
  honorario: 'Honorários advocatícios — ',
  despesa: 'Despesas processuais — ',
  repasse: 'Repasse — ',
  custas: 'Custas processuais — ',
};
