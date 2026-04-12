import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Scale,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  DollarSign,
  User,
  FileText,
  MessageSquare,
  Gavel,
  Plus,
  Send,
  Activity,
  Landmark,
  BookOpen,
} from 'lucide-react';
import { getProcessos } from '@/data/mockProcessos';
import { loadAtividades } from '@/data/mockAtividades';
import { loadLancamentos } from '@/data/mockLancamentos';
import { getEventos } from '@/data/mockEventos';
import { MOCK_USERS } from '@/data/mockUsers';
import {
  statusLabels,
  statusColors,
  areaColors,
  areaLabels,
  faseLabels,
} from '@/types/processo';
import {
  lancamentoStatusLabels,
  lancamentoStatusColors,
  lancamentoTipoLabels,
  lancamentoTipoColors,
} from '@/types/lancamento';
import {
  tipoLabels as eventoTipoLabels,
  tipoBgColors as eventoTipoBgColors,
  audienciaTipoLabels,
  audienciaStatusLabels,
  audienciaStatusColors,
} from '@/types/evento';
import UserAvatar from './UserAvatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

interface ProcessoDetailProps {
  processoId: string;
  onBack: () => void;
}

interface DiarioEntry {
  id: string;
  processo_id: string;
  user_id: string;
  user_name: string;
  texto: string;
  created_at: string;
}

const WHP_DIARIO_KEY = 'whp_diario';

function loadDiario(): DiarioEntry[] {
  const stored = localStorage.getItem(WHP_DIARIO_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* */ }
  }
  return [];
}

function saveDiario(entries: DiarioEntry[]): void {
  localStorage.setItem(WHP_DIARIO_KEY, JSON.stringify(entries));
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTimeBR(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function daysDiff(dateStr: string): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const atividadeTipoLabels: Record<string, string> = {
  processo_criado: 'Processo Criado',
  audiencia_realizada: 'Audiência Realizada',
  documento_enviado: 'Documento Enviado',
  prazo_cumprido: 'Prazo Cumprido',
  anotacao: 'Anotação',
  contato: 'Contato',
  peticao_protocolada: 'Petição Protocolada',
  decisao_recebida: 'Decisão Recebida',
};

const atividadeTipoColors: Record<string, string> = {
  processo_criado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  audiencia_realizada: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  documento_enviado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  prazo_cumprido: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  anotacao: 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
  contato: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  peticao_protocolada: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  decisao_recebida: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function ProcessoDetail({ processoId, onBack }: ProcessoDetailProps) {
  const { currentUser } = useAuth();
  const processos = getProcessos();
  const proc = processos.find((p) => p.id === processoId);

  const [diarioEntries, setDiarioEntries] = useState<DiarioEntry[]>(() => loadDiario());
  const [newDiarioText, setNewDiarioText] = useState('');

  const atividades = useMemo(() =>
    proc ? loadAtividades().filter((a) => a.processo_id === proc.id).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) : [],
    [proc?.id]
  );

  const lancamentos = useMemo(() =>
    proc ? loadLancamentos().filter((l) => l.processo_id === proc.id).sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime()) : [],
    [proc?.id]
  );

  const eventos = useMemo(() =>
    proc ? getEventos().filter((e) => e.processo_id === proc.id).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) : [],
    [proc?.id]
  );

  const processoDiario = useMemo(() =>
    proc ? diarioEntries.filter((d) => d.processo_id === proc.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [],
    [diarioEntries, proc?.id]
  );

  if (!proc) return <div className="text-muted-foreground p-8">Processo não encontrado.</div>;

  const resp = MOCK_USERS.find((u) => u.id === proc.responsible_id);

  const valorDisplay = proc.valor_causa === 0 && proc.practice_area === 'criminal' ? '—' : formatBRL(proc.valor_causa);

  const prazoDays = daysDiff(proc.prazo_fatal);
  const prazoUrgent = prazoDays >= 0 && prazoDays <= 5;
  const prazoExpired = prazoDays < 0;

  const totalFinanceiro = lancamentos.reduce((s, l) => s + l.valor, 0);
  const totalPago = lancamentos.filter((l) => l.status === 'pago').reduce((s, l) => s + l.valor, 0);
  const totalPendente = lancamentos.filter((l) => l.status !== 'pago').reduce((s, l) => s + l.valor, 0);

  function handleAddDiario() {
    if (!newDiarioText.trim() || !currentUser) return;
    const entry: DiarioEntry = {
      id: `diary-${Date.now()}`,
      processo_id: proc.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      texto: newDiarioText.trim(),
      created_at: new Date().toISOString(),
    };
    const updated = [...diarioEntries, entry];
    setDiarioEntries(updated);
    saveDiario(updated);
    setNewDiarioText('');
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar aos Processos
      </button>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-mono text-xl font-bold text-foreground">{proc.numero_cnj || 'Sem número'}</h1>
              <span className={`${areaColors[proc.practice_area]} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                {areaLabels[proc.practice_area]}
              </span>
              <span className={`${statusColors[proc.status]} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                {statusLabels[proc.status]}
              </span>
              <span className="bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full">
                {faseLabels[proc.fase] || proc.fase}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{proc.acao}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Landmark className="w-3.5 h-3.5" />{proc.tribunal}</span>
              <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" />{proc.vara}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{proc.comarca}</span>
            </div>
          </div>
          {resp && (
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <UserAvatar name={resp.name} color={resp.avatar_color} size="sm" />
              <div className="text-right">
                <p className="text-xs font-medium text-foreground">{resp.name}</p>
                <p className="text-[10px] text-muted-foreground">{resp.oab}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Valor da Causa */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Valor da Causa</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{valorDisplay}</p>
          </div>
        </div>

        {/* Próxima Audiência */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Gavel className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Próx. Audiência</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {proc.proxima_audiencia ? formatDateTimeBR(proc.proxima_audiencia) : '—'}
            </p>
          </div>
        </div>

        {/* Prazo Fatal */}
        <div className={`bg-card rounded-xl border p-4 flex items-start gap-3 ${prazoUrgent ? 'border-amber-400 dark:border-amber-600' : prazoExpired ? 'border-red-400 dark:border-red-600' : 'border-border'}`}>
          <div className={`p-2 rounded-lg ${prazoExpired ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : prazoUrgent ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400'}`}>
            {prazoExpired || prazoUrgent ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Prazo Fatal</p>
            <p className={`text-sm font-semibold mt-0.5 ${prazoExpired ? 'text-red-600 dark:text-red-400' : prazoUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              {formatDateBR(proc.prazo_fatal)}
            </p>
            {proc.prazo_fatal && (
              <p className={`text-[10px] ${prazoExpired ? 'text-red-500' : prazoUrgent ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {prazoExpired ? `Vencido há ${Math.abs(prazoDays)} dias` : prazoDays === 0 ? 'Vence hoje!' : `${prazoDays} dias restantes`}
              </p>
            )}
          </div>
        </div>

        {/* Financeiro resumo */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Financeiro</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{formatBRL(totalPago)}</p>
            <p className="text-[10px] text-muted-foreground">de {formatBRL(totalFinanceiro)} total</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 border border-border rounded-lg p-1">
          <TabsTrigger value="informacoes" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" />Informações</TabsTrigger>
          <TabsTrigger value="atividades" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" />Atividades <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{atividades.length}</span></TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1.5 text-xs"><DollarSign className="w-3.5 h-3.5" />Financeiro <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{lancamentos.length}</span></TabsTrigger>
          <TabsTrigger value="audiencias" className="gap-1.5 text-xs"><Gavel className="w-3.5 h-3.5" />Audiências <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{eventos.length}</span></TabsTrigger>
          <TabsTrigger value="diario" className="gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" />Diário <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{processoDiario.length}</span></TabsTrigger>
        </TabsList>

        {/* Tab: Informações */}
        <TabsContent value="informacoes">
          <div className="grid grid-cols-3 gap-6 mt-4">
            <div className="col-span-2 space-y-6">
              {/* Partes */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2"><User className="w-3.5 h-3.5" />Partes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">Polo Ativo</p>
                    <p className="text-sm font-medium text-foreground mt-1">{proc.polo_ativo_nome}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">Polo Passivo</p>
                    <p className="text-sm font-medium text-foreground mt-1">{proc.polo_passivo_nome}</p>
                  </div>
                </div>
              </div>

              {/* Detalhes */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2"><Scale className="w-3.5 h-3.5" />Detalhes do Processo</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {([
                    ['Tipo de Ação', proc.acao],
                    ['Tribunal', proc.tribunal],
                    ['Vara', proc.vara],
                    ['Comarca', proc.comarca],
                    ['Fase Atual', faseLabels[proc.fase] || proc.fase],
                    ['Valor da Causa', valorDisplay],
                    ['Criado em', formatDateBR(proc.created_at)],
                    ['Atualizado em', formatDateBR(proc.updated_at)],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Responsável */}
              {resp && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Responsável</h3>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={resp.name} color={resp.avatar_color} size="lg" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{resp.name}</p>
                      <p className="text-xs text-muted-foreground">{resp.oab}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {resp.practice_areas.map((a) => (
                      <span key={a} className={`${areaColors[a]} text-[10px] px-1.5 py-0.5 rounded-full`}>
                        {areaLabels[a]}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{resp.email}</p>
                </div>
              )}

              {/* Observações */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" />Observações</h3>
                <p className="text-sm text-muted-foreground italic">{proc.notes || 'Nenhuma observação.'}</p>
              </div>

              {/* Datas */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />Datas Importantes</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Próx. Audiência</span>
                    <span className="font-medium text-foreground">{proc.proxima_audiencia ? formatDateBR(proc.proxima_audiencia) : '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Prazo Fatal</span>
                    <span className={`font-medium ${prazoExpired ? 'text-red-600 dark:text-red-400' : prazoUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                      {formatDateBR(proc.prazo_fatal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Criado em</span>
                    <span className="font-medium text-foreground">{formatDateBR(proc.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Atividades */}
        <TabsContent value="atividades">
          <div className="mt-4 space-y-3">
            {atividades.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada para este processo.
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {atividades.map((a) => (
                  <div key={a.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`${atividadeTipoColors[a.tipo] || 'bg-muted text-muted-foreground'} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                          {atividadeTipoLabels[a.tipo] || a.tipo}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTimeBR(a.data)}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{a.descricao}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">por {a.usuario_nome}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Financeiro */}
        <TabsContent value="financeiro">
          <div className="mt-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                <p className="text-lg font-bold text-foreground mt-1">{formatBRL(totalFinanceiro)}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Pago</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatBRL(totalPago)}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Pendente</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatBRL(totalPendente)}</p>
              </div>
            </div>

            {lancamentos.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum lançamento vinculado a este processo.
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Tipo</th>
                      <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Descrição</th>
                      <th className="text-right px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Valor</th>
                      <th className="text-center px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Vencimento</th>
                      <th className="text-center px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lancamentos.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`${lancamentoTipoColors[l.tipo]} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                            {lancamentoTipoLabels[l.tipo]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">{l.descricao}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatBRL(l.valor)}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{formatDateBR(l.vencimento)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`${lancamentoStatusColors[l.status]} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                            {lancamentoStatusLabels[l.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Audiências/Eventos */}
        <TabsContent value="audiencias">
          <div className="mt-4 space-y-3">
            {eventos.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                Nenhuma audiência ou evento vinculado a este processo.
              </div>
            ) : (
              <div className="space-y-3">
                {eventos.map((e) => (
                  <div key={e.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`${eventoTipoBgColors[e.tipo]} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                            {eventoTipoLabels[e.tipo]}
                          </span>
                          {e.audiencia_tipo && (
                            <span className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                              {audienciaTipoLabels[e.audiencia_tipo]}
                            </span>
                          )}
                          {e.audiencia_status && (
                            <span className={`${audienciaStatusColors[e.audiencia_status]} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                              {audienciaStatusLabels[e.audiencia_status]}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">{e.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateBR(e.data)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.hora_inicio} - {e.hora_fim}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.local}</span>
                        </div>
                      </div>
                    </div>
                    {e.notes && <p className="text-xs text-muted-foreground mt-2 italic">{e.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Diário do Advogado */}
        <TabsContent value="diario">
          <div className="mt-4 space-y-4">
            {/* Input area */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Nova Anotação
              </h3>
              <div className="flex gap-2">
                <textarea
                  value={newDiarioText}
                  onChange={(e) => setNewDiarioText(e.target.value)}
                  placeholder="Ex: Cliente veio saber sobre o andamento do processo... Documento recebido via e-mail..."
                  className="flex-1 bg-card text-foreground border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[70px] placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddDiario();
                  }}
                />
                <button
                  onClick={handleAddDiario}
                  disabled={!newDiarioText.trim()}
                  className="self-end px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Salvar
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Ctrl+Enter para salvar rapidamente</p>
            </div>

            {/* Entries */}
            {processoDiario.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                Nenhuma anotação no diário. Use o campo acima para registrar conversas, ações e observações.
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {processoDiario.map((d) => (
                  <div key={d.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">{d.user_name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDateTimeBR(d.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{d.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
