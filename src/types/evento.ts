export type EventoTipo = 'audiencia' | 'reuniao' | 'prazo' | 'pericia' | 'outro';

export type AudienciaTipo = 'conciliacao' | 'instrucao' | 'julgamento' | 'una' | 'virtual';

export type AudienciaStatus = 'agendada' | 'realizada' | 'adiada' | 'cancelada';

export interface Evento {
  id: string;
  title: string;
  responsible_id: string;
  processo_id: string;
  cliente_nome: string;
  tipo: EventoTipo;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  notes: string;
  created_at: string;
  audiencia_tipo?: AudienciaTipo;
  audiencia_status?: AudienciaStatus;
}

export const tipoLabels: Record<EventoTipo, string> = {
  audiencia: 'Audiência',
  reuniao: 'Reunião',
  prazo: 'Prazo',
  pericia: 'Perícia',
  outro: 'Outro',
};

export const tipoBgColors: Record<EventoTipo, string> = {
  audiencia: 'bg-purple-100 text-purple-700',
  reuniao: 'bg-blue-100 text-blue-700',
  prazo: 'bg-red-100 text-red-700',
  pericia: 'bg-amber-100 text-amber-700',
  outro: 'bg-slate-100 text-slate-600',
};

export const tipoBorderColors: Record<EventoTipo, string> = {
  audiencia: 'border-l-purple-500',
  reuniao: 'border-l-blue-500',
  prazo: 'border-l-red-500',
  pericia: 'border-l-amber-500',
  outro: 'border-l-slate-400',
};

export const tipoSelectedColors: Record<EventoTipo, string> = {
  audiencia: 'bg-purple-600 border-purple-600 text-white',
  reuniao: 'bg-blue-600 border-blue-600 text-white',
  prazo: 'bg-red-600 border-red-600 text-white',
  pericia: 'bg-amber-500 border-amber-500 text-white',
  outro: 'bg-slate-600 border-slate-600 text-white',
};

export const audienciaTipoLabels: Record<AudienciaTipo, string> = {
  conciliacao: 'Conciliação',
  instrucao: 'Instrução',
  julgamento: 'Julgamento',
  una: 'Una',
  virtual: 'Virtual',
};

export const audienciaTipoColors: Record<AudienciaTipo, string> = {
  conciliacao: 'bg-teal-100 text-teal-700',
  instrucao: 'bg-blue-100 text-blue-700',
  julgamento: 'bg-purple-100 text-purple-700',
  una: 'bg-slate-100 text-slate-600',
  virtual: 'bg-indigo-100 text-indigo-700',
};

export const audienciaStatusLabels: Record<AudienciaStatus, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  adiada: 'Adiada',
  cancelada: 'Cancelada',
};

export const audienciaStatusColors: Record<AudienciaStatus, string> = {
  agendada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  adiada: 'bg-amber-100 text-amber-700',
  cancelada: 'bg-slate-100 text-slate-500',
};
