import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { getProcessos } from '@/data/mockProcessos';
import { MOCK_USERS } from '@/data/mockUsers';
import {
  statusLabels,
  statusColors,
  areaColors,
  areaLabels,
  faseLabels,
} from '@/types/processo';
import UserAvatar from './UserAvatar';

interface ProcessoDetailProps {
  processoId: string;
  onBack: () => void;
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProcessoDetail({ processoId, onBack }: ProcessoDetailProps) {
  const processos = getProcessos();
  const proc = processos.find((p) => p.id === processoId);
  if (!proc) return <div className="text-muted-foreground">Processo não encontrado.</div>;

  const resp = MOCK_USERS.find((u) => u.id === proc.responsible_id);

  const valorDisplay =
    proc.valor_causa === 0 && proc.practice_area === 'criminal'
      ? '—'
      : formatBRL(proc.valor_causa);

  const fields: [string, string][] = [
    ['Tipo de Ação', proc.acao],
    ['Tribunal', proc.tribunal],
    ['Vara', proc.vara],
    ['Comarca', proc.comarca],
    ['Polo Ativo', proc.polo_ativo_nome],
    ['Polo Passivo', proc.polo_passivo_nome],
    ['Fase Atual', faseLabels[proc.fase] || proc.fase],
    ['Valor da Causa', valorDisplay],
    ['Próxima Audiência', proc.proxima_audiencia ? `${formatDateBR(proc.proxima_audiencia)} ${new Date(proc.proxima_audiencia).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '—'],
    ['Prazo Fatal', formatDateBR(proc.prazo_fatal)],
    ['Criado em', formatDateBR(proc.created_at)],
    ['Atualizado em', formatDateBR(proc.updated_at)],
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Processos
      </button>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-mono text-xl font-bold text-foreground">{proc.numero_cnj || 'Sem número'}</h1>
          <span className={`${areaColors[proc.practice_area]} text-xs font-medium px-2 py-0.5 rounded-full`}>
            {areaLabels[proc.practice_area]}
          </span>
          <span className={`${statusColors[proc.status]} text-xs font-medium px-2 py-0.5 rounded-full`}>
            {statusLabels[proc.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left */}
          <div className="col-span-2">
            <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Informações do Processo</h2>
            <div className="grid grid-cols-2 gap-4">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            {resp && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Responsável</h3>
                <div className="flex items-center gap-3 mb-2">
                  <UserAvatar name={resp.name} color={resp.avatar_color} size="lg" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{resp.name}</p>
                    <p className="text-xs text-muted-foreground">{resp.oab}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {resp.practice_areas.map((a) => (
                    <span key={a} className={`${areaColors[a]} text-xs px-1.5 py-0.5 rounded-full`}>
                      {areaLabels[a]}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{resp.email}</p>
              </div>
            )}

            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Observações</h3>
              <p className="text-sm text-muted-foreground italic">{proc.notes || 'Nenhuma observação.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
