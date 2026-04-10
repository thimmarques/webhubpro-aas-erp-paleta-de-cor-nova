export type ProcessoStatus =
  | 'ativo'
  | 'audiencia'
  | 'pendente'
  | 'encerrado'
  | 'recurso'
  | 'acordo';

export type TribunalType =
  | 'TJSP'
  | 'TRT-2'
  | 'TRF-3'
  | 'JEF/INSS'
  | 'JTSP'
  | 'STJ'
  | 'STF';

export type FaseType =
  | 'peticao_inicial'
  | 'citacao'
  | 'instrucao'
  | 'sentenca'
  | 'recurso'
  | 'execucao'
  | 'arquivado';

export interface Processo {
  id: string;
  numero_cnj: string;
  practice_area: 'trabalhista' | 'civil' | 'criminal' | 'previdenciario' | 'tributario';
  acao: string;
  polo_ativo_id: string;
  polo_ativo_nome: string;
  polo_passivo_nome: string;
  responsible_id: string;
  status: ProcessoStatus;
  tribunal: TribunalType;
  vara: string;
  comarca: string;
  fase: FaseType;
  valor_causa: number;
  proxima_audiencia: string;
  prazo_fatal: string;
  created_at: string;
  updated_at: string;
  notes: string;
}

export const statusLabels: Record<ProcessoStatus, string> = {
  ativo: 'Ativo',
  audiencia: 'Em Audiência',
  pendente: 'Pendente',
  encerrado: 'Encerrado',
  recurso: 'Em Recurso',
  acordo: 'Acordo',
};

export const statusColors: Record<ProcessoStatus, string> = {
  ativo: 'bg-green-100 text-green-700',
  audiencia: 'bg-blue-100 text-blue-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  encerrado: 'bg-slate-100 text-slate-500',
  recurso: 'bg-orange-100 text-orange-700',
  acordo: 'bg-teal-100 text-teal-700',
};

export const faseLabels: Record<FaseType, string> = {
  peticao_inicial: 'Petição Inicial',
  citacao: 'Citação',
  instrucao: 'Instrução',
  sentenca: 'Sentença',
  recurso: 'Recurso',
  execucao: 'Execução',
  arquivado: 'Arquivado',
};

export const areaColors: Record<string, string> = {
  trabalhista: 'bg-blue-100 text-blue-800',
  civil: 'bg-purple-100 text-purple-800',
  criminal: 'bg-red-100 text-red-800',
  previdenciario: 'bg-green-100 text-green-800',
  tributario: 'bg-teal-100 text-teal-800',
};

export const areaLabels: Record<string, string> = {
  trabalhista: 'Trabalhista',
  civil: 'Civil',
  criminal: 'Criminal',
  previdenciario: 'Previdenciário',
  tributario: 'Tributário',
};

export const acaoSuggestions: Record<string, string[]> = {
  trabalhista: [
    'Reclamação Trabalhista',
    'Ação de Execução Trabalhista',
    'Dissídio Individual',
    'Inquérito Judicial',
    'Ação de Consignação',
    'Ação Rescisória',
  ],
  civil: [
    'Ação de Indenização por Dano Moral',
    'Ação de Indenização por Dano Material',
    'Ação de Dissolução Societária',
    'Ação Monitória',
    'Ação de Cobrança',
    'Ação de Execução Civil',
  ],
  criminal: [
    'Ação Penal Pública',
    'Habeas Corpus',
    'Mandado de Segurança Criminal',
    'Revisão Criminal',
    'Agravo em Execução',
  ],
  previdenciario: [
    'Concessão de Benefício Previdenciário',
    'Revisão de Benefício',
    'Restabelecimento de Benefício',
    'BPC/LOAS',
    'Salário-Maternidade',
    'Auxílio-Reclusão',
  ],
  tributario: [
    'Execução Fiscal',
    'Ação Anulatória de Débito Fiscal',
    'Mandado de Segurança Tributário',
    'Ação Declaratória de Inexistência de Relação Tributária',
    'Ação de Repetição de Indébito',
    'Embargos à Execução Fiscal',
  ],
};

export const areaTribunalDefault: Record<string, TribunalType> = {
  trabalhista: 'TRT-2',
  civil: 'TJSP',
  criminal: 'TJSP',
  previdenciario: 'JEF/INSS',
  tributario: 'TRF-3',
};
