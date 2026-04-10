import { PracticeArea } from '@/types';

/* ── Base interfaces ── */

export interface ClienteBase {
  id: string;
  type: 'PF' | 'PJ';
  practice_area: PracticeArea;
  responsible_id: string;
  status: 'ativo' | 'inativo';
  is_vip: boolean;
  created_at: string;
  notes: string;
}

export interface ClientePF extends ClienteBase {
  type: 'PF';
  nome: string;
  cpf: string;
  rg: string;
  nascimento: string;
  estado_civil: string;
  email: string;
  phone: string;
  address: string;
}

/* ── Trabalhista ── */

export interface ClientePF_Trabalhista extends ClientePF {
  practice_area: 'trabalhista';
  polo: 'reclamante' | 'reclamada_pf';
  ctps: string;
  cargo: string;
  salario: number;
  data_admissao: string;
  data_demissao: string;
  tipo_demissao:
    | 'sem_justa_causa'
    | 'justa_causa'
    | 'pedido_demissao'
    | 'rescisao_indireta'
    | 'aposentadoria';
  empresa_reclamada: string;
  sindicato: string;
}

export interface ClientePJ_Trabalhista extends ClienteBase {
  type: 'PJ';
  practice_area: 'trabalhista';
  polo: 'reclamada';
  razao_social: string;
  cnpj: string;
  representante_legal: string;
  cpf_representante: string;
  email: string;
  phone: string;
  address: string;
  ramo_atividade: string;
  numero_funcionarios: number;
  sindicato_patronal: string;
}

/* ── Civil ── */

export interface ClientePF_Civil extends ClientePF {
  practice_area: 'civil';
  polo: 'autor' | 'reu' | 'terceiro_interessado';
  profissao: string;
  renda_mensal: number;
  subtipo:
    | 'indenizacao_moral'
    | 'indenizacao_material'
    | 'responsabilidade_civil'
    | 'consumidor'
    | 'outros';
}

export interface ClientePJ_Civil extends ClienteBase {
  type: 'PJ';
  practice_area: 'civil';
  polo: 'autor' | 'reu';
  razao_social: string;
  cnpj: string;
  representante_legal: string;
  cpf_representante: string;
  email: string;
  phone: string;
  address: string;
  tipo_societario: 'ltda' | 'sa' | 'eireli' | 'mei' | 'ss' | 'outros';
  ramo_atividade: string;
  subtipo:
    | 'responsabilidade_civil'
    | 'direito_comercial'
    | 'direito_societario'
    | 'consumidor'
    | 'outros';
}

/* ── Criminal ── */

export interface ClientePF_Criminal extends ClientePF {
  practice_area: 'criminal';
  polo: 'reu' | 'vitima' | 'investigado';
  situacao_prisional:
    | 'solto'
    | 'preso_preventivo'
    | 'preso_definitivo'
    | 'liberdade_provisoria'
    | 'monitorado_eletronico';
  antecedentes_criminais: boolean;
  boletim_ocorrencia: string;
  delegacia: string;
  crime_imputado: string;
  fase_processual:
    | 'inquerito'
    | 'denuncia'
    | 'instrucao'
    | 'julgamento'
    | 'recurso'
    | 'execucao';
  data_fato: string;
  preso_em: string;
}

/* ── Previdenciário ── */

export interface ClientePF_Previdenciario extends ClientePF {
  practice_area: 'previdenciario';
  nit_pis: string;
  numero_beneficio: string;
  especie_beneficio:
    | 'aposentadoria_tempo'
    | 'aposentadoria_idade'
    | 'aposentadoria_invalidez'
    | 'auxilio_doenca'
    | 'auxilio_acidente'
    | 'bpc_loas'
    | 'pensao_morte'
    | 'salario_maternidade';
  der: string;
  dib: string;
  dcb: string;
  cnis_disponivel: boolean;
  pericia_medica: boolean;
  cid: string;
  tempo_contribuicao: string;
}

/* ── Tributário ── */

export interface ClientePF_Tributario extends ClientePF {
  practice_area: 'tributario';
  polo: 'contribuinte' | 'responsavel_tributario';
  tipo_tributo: 'federal' | 'estadual' | 'municipal';
  tributo_especifico: string;
  numero_cda: string;
  valor_debito: number;
  orgao_fiscal: string;
  fase_administrativa: 'auto_infracao' | 'impugnacao' | 'recurso_administrativo' | 'inscricao_divida_ativa' | 'execucao_fiscal';
  parcelamento_ativo: boolean;
  numero_processo_administrativo: string;
}

export interface ClientePJ_Tributario extends ClienteBase {
  type: 'PJ';
  practice_area: 'tributario';
  polo: 'contribuinte' | 'responsavel_tributario' | 'substituto_tributario';
  razao_social: string;
  cnpj: string;
  representante_legal: string;
  cpf_representante: string;
  email: string;
  phone: string;
  address: string;
  ramo_atividade: string;
  regime_tributario: 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei';
  tipo_tributo: 'federal' | 'estadual' | 'municipal';
  tributo_especifico: string;
  numero_cda: string;
  valor_debito: number;
  orgao_fiscal: string;
  fase_administrativa: 'auto_infracao' | 'impugnacao' | 'recurso_administrativo' | 'inscricao_divida_ativa' | 'execucao_fiscal';
  parcelamento_ativo: boolean;
  numero_processo_administrativo: string;
}

/* ── Union type ── */

export type Cliente =
  | ClientePF_Trabalhista
  | ClientePJ_Trabalhista
  | ClientePF_Civil
  | ClientePJ_Civil
  | ClientePF_Criminal
  | ClientePF_Previdenciario
  | ClientePF_Tributario
  | ClientePJ_Tributario;

/* ── Helpers ── */

export function getClienteName(c: Cliente): string {
  return c.type === 'PF' ? (c as ClientePF).nome : (c as any).razao_social;
}

export function getClienteDoc(c: Cliente): string {
  return c.type === 'PF' ? (c as ClientePF).cpf : (c as any).cnpj;
}

export function getClienteEmail(c: Cliente): string {
  return (c as any).email || '';
}

export function maskCpf(cpf: string): string {
  if (!cpf || cpf.length < 11) return cpf;
  const d = cpf.replace(/\D/g, '');
  if (d.length < 11) return cpf;
  return `${d.slice(0, 3)}.***.**-${d.slice(9, 11)}`;
}

export function maskCnpj(cnpj: string): string {
  if (!cnpj || cnpj.length < 14) return cnpj;
  const d = cnpj.replace(/\D/g, '');
  if (d.length < 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.***/****-${d.slice(12, 14)}`;
}

export function getPoloLabel(polo: string): string {
  const map: Record<string, string> = {
    reclamante: 'Reclamante',
    reclamada: 'Reclamada',
    reclamada_pf: 'Reclamada',
    autor: 'Autor',
    reu: 'Réu',
    vitima: 'Vítima',
    investigado: 'Investigado',
    terceiro_interessado: 'Terceiro',
    contribuinte: 'Contribuinte',
    responsavel_tributario: 'Responsável Tributário',
    substituto_tributario: 'Substituto Tributário',
  };
  return map[polo] || polo;
}

/* ── Masks ── */

export function applyCpfMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function applyCnpjMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function applyPhoneMask(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseBRL(value: string): number {
  return Number(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}
