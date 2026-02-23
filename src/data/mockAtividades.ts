export interface Atividade {
  id: string;
  client_id: string;
  processo_id: string;
  responsible_id: string;
  tipo:
    | 'processo_criado'
    | 'audiencia_realizada'
    | 'documento_enviado'
    | 'prazo_cumprido'
    | 'anotacao'
    | 'contato'
    | 'peticao_protocolada'
    | 'decisao_recebida';
  descricao: string;
  data: string;
  usuario_nome: string;
}

const SEED_ATIVIDADES: Atividade[] = [
  {
    id: 'atv-001',
    client_id: 'cli-001',
    processo_id: 'proc-001',
    responsible_id: 'user-002',
    tipo: 'audiencia_realizada',
    descricao: 'Audiência de conciliação realizada. Proposta rejeitada pela reclamada.',
    data: '2026-02-10T14:00:00',
    usuario_nome: 'Dr. Marcos Ferreira',
  },
  {
    id: 'atv-002',
    client_id: 'cli-001',
    processo_id: 'proc-001',
    responsible_id: 'user-002',
    tipo: 'peticao_protocolada',
    descricao: 'Petição inicial protocolada no TRT-2. Número CNJ gerado.',
    data: '2026-01-20T09:30:00',
    usuario_nome: 'Dr. Marcos Ferreira',
  },
  {
    id: 'atv-003',
    client_id: 'cli-001',
    processo_id: 'proc-001',
    responsible_id: 'user-002',
    tipo: 'documento_enviado',
    descricao: 'CTPS e contracheques enviados pelo cliente via WhatsApp.',
    data: '2026-01-18T16:45:00',
    usuario_nome: 'Dr. Marcos Ferreira',
  },
  {
    id: 'atv-004',
    client_id: 'cli-001',
    processo_id: 'proc-001',
    responsible_id: 'user-002',
    tipo: 'contato',
    descricao: 'Ligação para orientar cliente sobre audiência de instrução.',
    data: '2026-01-15T11:00:00',
    usuario_nome: 'Dr. Marcos Ferreira',
  },
  {
    id: 'atv-005',
    client_id: 'cli-002',
    processo_id: 'proc-003',
    responsible_id: 'user-002',
    tipo: 'decisao_recebida',
    descricao: 'Decisão interlocutória determinando penhora de bens recebida.',
    data: '2026-01-10T08:00:00',
    usuario_nome: 'Dr. Marcos Ferreira',
  },
  {
    id: 'atv-006',
    client_id: 'cli-003',
    processo_id: 'proc-004',
    responsible_id: 'user-003',
    tipo: 'peticao_protocolada',
    descricao: 'Manifestação ao laudo pericial protocolada.',
    data: '2026-01-15T14:20:00',
    usuario_nome: 'Dra. Patrícia Lima',
  },
  {
    id: 'atv-007',
    client_id: 'cli-003',
    processo_id: 'proc-005',
    responsible_id: 'user-003',
    tipo: 'peticao_protocolada',
    descricao: 'Apelação protocolada no TJSP. Prazo: 15 dias para contrarrazões.',
    data: '2026-01-30T17:00:00',
    usuario_nome: 'Dra. Patrícia Lima',
  },
  {
    id: 'atv-008',
    client_id: 'cli-004',
    processo_id: 'proc-007',
    responsible_id: 'user-004',
    tipo: 'audiencia_realizada',
    descricao: '1ª oitiva de testemunha da defesa realizada.',
    data: '2026-02-01T13:30:00',
    usuario_nome: 'Dr. Carlos Mendes',
  },
  {
    id: 'atv-009',
    client_id: 'cli-004',
    processo_id: 'proc-008',
    responsible_id: 'user-004',
    tipo: 'decisao_recebida',
    descricao: 'HC concedido pelo TJSP. Liberdade provisória garantida.',
    data: '2025-10-20T10:00:00',
    usuario_nome: 'Dr. Carlos Mendes',
  },
  {
    id: 'atv-010',
    client_id: 'cli-005',
    processo_id: 'proc-010',
    responsible_id: 'user-005',
    tipo: 'anotacao',
    descricao: 'CNIS obtido via procuração. Perícia médica confirmada para 05/03/2026.',
    data: '2026-01-15T09:00:00',
    usuario_nome: 'Dra. Sandra Costa',
  },
];

const WHP_ATIVIDADES_KEY = 'whp_atividades';

export function loadAtividades(): Atividade[] {
  const stored = localStorage.getItem(WHP_ATIVIDADES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fall through
    }
  }
  localStorage.setItem(WHP_ATIVIDADES_KEY, JSON.stringify(SEED_ATIVIDADES));
  return [...SEED_ATIVIDADES];
}

export function saveAtividades(atividades: Atividade[]): void {
  localStorage.setItem(WHP_ATIVIDADES_KEY, JSON.stringify(atividades));
}
