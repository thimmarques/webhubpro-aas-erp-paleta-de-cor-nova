import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  PieChart,
  TrendingUp,
  Award,
  Calendar,
  AlertTriangle,
  Download,
  ArrowRight,
  Info,
  X,
  Briefcase,
  Scale,
  Clock,
  Users,
  Activity,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import { getProcessos } from '@/data/mockProcessos';
import { loadClientes } from '@/data/mockClientes';
import { loadLancamentos } from '@/data/mockLancamentos';
import { getEventos } from '@/data/mockEventos';
import { loadAtividades } from '@/data/mockAtividades';
import { ProcessoStatus, statusLabels, statusColors, areaLabels, areaColors } from '@/types/processo';
import EmptyState from './EmptyState';
import UserAvatar from './UserAvatar';

/* ─── helpers ─── */

function filterByUser<T extends { responsible_id: string }>(items: T[], userId: string, isAdmin: boolean): T[] {
  return isAdmin ? items : items.filter((i) => i.responsible_id === userId);
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysDiff(dateStr: string): number {
  if (!dateStr) return Infinity;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function isWithinMonths(dateStr: string, months: number): boolean {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return diff >= 0 && diff < months;
}

const statusBarColors: Record<string, string> = {
  ativo: 'bg-green-500',
  audiencia: 'bg-blue-500',
  pendente: 'bg-yellow-400',
  recurso: 'bg-orange-400',
  acordo: 'bg-teal-400',
  encerrado: 'bg-slate-300',
};

type ReportType = 'processos-status' | 'processos-area' | 'financeiro' | 'produtividade' | 'audiencias' | 'inadimplencia' | 'meus-processos-status' | 'meus-processos-area' | 'minhas-audiencias' | 'meus-prazos' | 'meus-clientes' | 'atividade-recente';

export default function RelatoriosPage() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [periodFilter, setPeriodFilter] = useState('todos');

  /* ─── load data ─── */
  const allProcessos = useMemo(() => filterByUser(getProcessos(), currentUser!.id, admin), [currentUser, admin]);
  const allClientes = useMemo(() => {
    const cl = loadClientes();
    return admin ? cl : cl.filter(c => c.responsible_id === currentUser!.id);
  }, [currentUser, admin]);
  const allLancamentos = useMemo(() => admin ? loadLancamentos() : [], [admin]);
  const allEventos = useMemo(() => filterByUser(getEventos(), currentUser!.id, admin), [currentUser, admin]);
  const allAtividades = useMemo(() => {
    const at = loadAtividades();
    return admin ? at : at.filter(a => a.responsible_id === currentUser!.id);
  }, [currentUser, admin]);

  /* ─── processos metrics ─── */
  const processosPorStatus = useMemo(() => {
    const m: Record<string, number> = {};
    allProcessos.forEach(p => { m[p.status] = (m[p.status] || 0) + 1; });
    return m;
  }, [allProcessos]);

  const processosPorArea = useMemo(() => {
    const m: Record<string, number> = {};
    allProcessos.forEach(p => { m[p.practice_area] = (m[p.practice_area] || 0) + 1; });
    return m;
  }, [allProcessos]);

  /* ─── clientes metrics ─── */
  const clientesPorStatus = useMemo(() => {
    const m = { ativo: 0, inativo: 0 };
    allClientes.forEach(c => { if (c.status === 'ativo') m.ativo++; else m.inativo++; });
    return m;
  }, [allClientes]);

  const clientesPorTipo = useMemo(() => {
    const m = { PF: 0, PJ: 0 };
    allClientes.forEach(c => { m[c.type]++; });
    return m;
  }, [allClientes]);

  /* ─── financial metrics (admin only) ─── */
  const totalAReceber = useMemo(() => allLancamentos.filter(l => l.status === 'pendente' || l.status === 'parcelado').reduce((s, l) => s + l.valor, 0), [allLancamentos]);
  const totalRecebido = useMemo(() => allLancamentos.filter(l => l.status === 'pago').reduce((s, l) => s + l.valor, 0), [allLancamentos]);
  const totalVencido = useMemo(() => allLancamentos.filter(l => l.status === 'vencido').reduce((s, l) => s + l.valor, 0), [allLancamentos]);
  const taxaInadimplencia = useMemo(() => {
    const denom = totalAReceber + totalVencido + totalRecebido;
    return denom > 0 ? ((totalVencido / denom) * 100) : 0;
  }, [totalAReceber, totalRecebido, totalVencido]);

  /* ─── audiencias from eventos ─── */
  const audienciaEventos = useMemo(() => allEventos.filter(e => e.tipo === 'audiencia'), [allEventos]);
  const audienciasRealizadas = useMemo(() => audienciaEventos.filter(e => e.audiencia_status === 'realizada').length, [audienciaEventos]);
  const audienciasAgendadas = useMemo(() => audienciaEventos.filter(e => e.audiencia_status === 'agendada').length, [audienciaEventos]);
  const audienciasCanceladas = useMemo(() => audienciaEventos.filter(e => e.audiencia_status === 'cancelada').length, [audienciaEventos]);

  /* ─── prazos (non-admin) ─── */
  const prazosEstaSemana = useMemo(() => allProcessos.filter(p => p.prazo_fatal && daysDiff(p.prazo_fatal) >= 0 && daysDiff(p.prazo_fatal) <= 7).length, [allProcessos]);
  const prazosEsteMes = useMemo(() => allProcessos.filter(p => p.prazo_fatal && daysDiff(p.prazo_fatal) >= 0 && daysDiff(p.prazo_fatal) <= 30).length, [allProcessos]);
  const prazosFatais = useMemo(() => allProcessos.filter(p => p.prazo_fatal && daysDiff(p.prazo_fatal) >= 0 && daysDiff(p.prazo_fatal) <= 7), [allProcessos]);

  /* ─── top performer (admin) ─── */
  const topPerformer = useMemo(() => {
    if (!admin) return null;
    const counts: Record<string, number> = {};
    allProcessos.filter(p => p.status !== 'encerrado').forEach(p => { counts[p.responsible_id] = (counts[p.responsible_id] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const user = MOCK_USERS.find(u => u.id === top[0]);
    return user ? { name: user.name, count: top[1] } : null;
  }, [allProcessos, admin]);

  /* ─── inadimplencia por advogado (admin) ─── */
  const inadimplenciaPorAdvogado = useMemo(() => {
    if (!admin) return [];
    const m: Record<string, { name: string; avatar_color: string; aReceber: number; vencido: number; recebido: number }> = {};
    MOCK_USERS.filter(u => u.role === 'advogado' || u.role === 'admin').forEach(u => {
      m[u.id] = { name: u.name, avatar_color: u.avatar_color, aReceber: 0, vencido: 0, recebido: 0 };
    });
    allLancamentos.forEach(l => {
      if (!m[l.responsible_id]) return;
      if (l.status === 'pendente' || l.status === 'parcelado') m[l.responsible_id].aReceber += l.valor;
      if (l.status === 'vencido') m[l.responsible_id].vencido += l.valor;
      if (l.status === 'pago') m[l.responsible_id].recebido += l.valor;
    });
    return Object.entries(m).map(([id, v]) => ({ id, ...v, total: v.aReceber + v.vencido + v.recebido }));
  }, [allLancamentos, admin]);

  /* ─── vencidos por cliente (admin) ─── */
  const vencidosPorCliente = useMemo(() => {
    if (!admin) return [];
    return allLancamentos.filter(l => l.status === 'vencido').map(l => ({
      ...l,
      diasAtraso: Math.abs(daysDiff(l.vencimento)),
      advogado: MOCK_USERS.find(u => u.id === l.responsible_id),
    }));
  }, [allLancamentos, admin]);

  /* ─── produtividade (admin) ─── */
  const produtividadeData = useMemo(() => {
    if (!admin) return [];
    return MOCK_USERS.filter(u => u.role === 'advogado' || u.role === 'admin').map(u => {
      const procs = allProcessos.filter(p => p.responsible_id === u.id && p.status !== 'encerrado');
      const clientes = allClientes.filter(c => c.responsible_id === u.id);
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const audiMes = allEventos.filter(e => e.tipo === 'audiencia' && e.responsible_id === u.id && e.data.startsWith(monthKey));
      const prazosSemana = allProcessos.filter(p => p.responsible_id === u.id && p.prazo_fatal && daysDiff(p.prazo_fatal) >= 0 && daysDiff(p.prazo_fatal) <= 7);
      return { user: u, processos: procs.length, clientes: clientes.length, audiencias: audiMes.length, prazos: prazosSemana.length };
    });
  }, [allProcessos, allClientes, allEventos, admin]);

  /* ─── financeiro mensal (admin) ─── */
  const financeiroMensal = useMemo(() => {
    if (!admin) return [];
    const months: Record<string, { honorarios: number; despesas: number; custas: number; total: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { honorarios: 0, despesas: 0, custas: 0, total: 0 };
    }
    allLancamentos.filter(l => l.status === 'pago' && l.data_pagamento).forEach(l => {
      const key = l.data_pagamento.slice(0, 7);
      if (months[key]) {
        if (l.tipo === 'honorario') months[key].honorarios += l.valor;
        else if (l.tipo === 'despesa' || l.tipo === 'repasse') months[key].despesas += l.valor;
        else months[key].custas += l.valor;
        months[key].total += l.valor;
      }
    });
    const entries = Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]));
    const avg = entries.reduce((s, [, v]) => s + v.total, 0) / Math.max(entries.length, 1);
    return entries.map(([k, v]) => ({ month: k, ...v, avg, aboveAvg: v.total >= avg }));
  }, [allLancamentos, admin]);

  /* ─── report card render ─── */
  const renderCard = (
    icon: React.ElementType,
    iconBg: string,
    title: string,
    description: string,
    preview: React.ReactNode,
    reportType: ReportType,
    extraBadge?: React.ReactNode,
  ) => {
    const Icon = icon;
    return (
      <div key={reportType} className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <button onClick={() => { showToast('Exportação iniciada', 'info'); }} className="bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md px-2.5 py-1.5 text-xs text-slate-600 flex items-center gap-1">
            <Download className="w-3 h-3" /> Gerar
          </button>
        </div>
        <div>
          <div className="text-base font-semibold text-slate-900 flex items-center gap-2">{title} {extraBadge}</div>
          <div className="text-sm text-slate-500 leading-snug mt-1">{description}</div>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">{preview}</div>
        <button onClick={() => setActiveReport(reportType)} className="border border-slate-200 rounded-md py-2 text-sm text-slate-600 hover:bg-slate-50 w-full text-center mt-auto flex items-center justify-center gap-1">
          Ver Relatório <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  /* ─── period filter helper ─── */
  const filterByPeriod = <T extends { created_at?: string }>(items: T[], dateField: (i: T) => string) => {
    if (periodFilter === 'todos') return items;
    return items.filter(i => {
      const d = dateField(i);
      if (!d) return false;
      if (periodFilter === 'mes') return isWithinMonths(d, 1);
      if (periodFilter === '3meses') return isWithinMonths(d, 3);
      if (periodFilter === '6meses') return isWithinMonths(d, 6);
      if (periodFilter === 'ano') return isWithinMonths(d, 12);
      return true;
    });
  };

  const periodButtons = (
    <div className="flex gap-2 mb-4">
      {[['mes', 'Este mês'], ['3meses', '3 meses'], ['6meses', '6 meses'], ['ano', '1 ano'], ['todos', 'Todos']].map(([k, l]) => (
        <button key={k} onClick={() => setPeriodFilter(k)} className={`text-xs rounded-md px-2.5 py-1.5 cursor-pointer ${periodFilter === k ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
      ))}
    </div>
  );

  /* ─── modal content renderers ─── */
  const renderProcessosPorStatus = () => {
    const procs = filterByPeriod(allProcessos, p => p.created_at);
    const counts: Record<string, number> = {};
    const valorByStatus: Record<string, number> = {};
    procs.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
      valorByStatus[p.status] = (valorByStatus[p.status] || 0) + p.valor_causa;
    });
    const total = procs.length;
    const totalValor = procs.reduce((s, p) => s + p.valor_causa, 0);
    const statuses: ProcessoStatus[] = ['ativo', 'audiencia', 'pendente', 'recurso', 'acordo', 'encerrado'];

    return (
      <div>
        {periodButtons}
        <div className="bg-slate-50 rounded-lg p-4 mb-5 flex items-center gap-6 flex-wrap">
          {statuses.filter(s => counts[s]).map(s => (
            <div key={s} className="flex flex-col items-center">
              <span className={`${statusColors[s]} text-xs font-medium px-2 py-0.5 rounded-full`}>{statusLabels[s]}</span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{counts[s] || 0}</span>
              <span className="text-xs text-slate-400">processos</span>
            </div>
          ))}
          <div className="border-l border-slate-200 pl-6">
            <span className="text-xs text-slate-400">Total</span>
            <div className="text-2xl font-bold text-slate-900">{total}</div>
          </div>
        </div>
        {total > 0 && (
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex mb-5">
            {statuses.filter(s => counts[s]).map(s => (
              <div key={s} className={`${statusBarColors[s]}`} style={{ width: `${Math.min((counts[s] / total) * 100, 100)}%` }} title={`${statusLabels[s]}: ${counts[s]}`} />
            ))}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Processos</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">% do Total</th>
                {admin && <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Valor Total</th>}
              </tr>
            </thead>
            <tbody>
              {statuses.filter(s => counts[s]).map(s => (
                <tr key={s} className="border-b border-slate-100">
                  <td className="px-4 py-3"><span className={`${statusColors[s]} text-xs font-medium px-2 py-0.5 rounded-full`}>{statusLabels[s]}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-900">{counts[s]}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{total > 0 ? ((counts[s] / total) * 100).toFixed(1) : 0}%</td>
                  {admin && <td className="px-4 py-3 text-sm text-slate-900">{formatBRL(valorByStatus[s] || 0)}</td>}
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-3 text-sm text-slate-900">Total</td>
                <td className="px-4 py-3 text-sm text-slate-900">{total}</td>
                <td className="px-4 py-3 text-sm text-slate-900">100%</td>
                {admin && <td className="px-4 py-3 text-sm text-slate-900">{formatBRL(totalValor)}</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProcessosPorArea = () => {
    const total = allProcessos.length;
    const areas = ['trabalhista', 'civil', 'criminal', 'previdenciario'];
    return (
      <div className="bg-slate-50 rounded-lg p-4 mb-5 grid grid-cols-4 gap-4">
        {areas.map(a => {
          const count = processosPorArea[a] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={a} className="bg-white rounded-lg p-4 text-center border border-slate-200">
              <span className={`${areaColors[a]} text-xs font-medium px-2 py-0.5 rounded-full`}>{areaLabels[a]}</span>
              <div className="text-3xl font-bold text-slate-900 mt-2">{count}</div>
              <div className="text-xs text-slate-400">processos</div>
              <div className="h-1.5 rounded-full bg-slate-100 mt-3">
                <div className={`h-1.5 rounded-full ${a === 'trabalhista' ? 'bg-blue-500' : a === 'civil' ? 'bg-purple-500' : a === 'criminal' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">{pct.toFixed(1)}% do total</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFinanceiroMensal = () => (
    <div>
      {periodButtons}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400 uppercase">Recebido</div>
          <div className="text-xl font-bold text-green-600">{formatBRL(totalRecebido)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400 uppercase">A Receber</div>
          <div className="text-xl font-bold text-amber-600">{formatBRL(totalAReceber)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400 uppercase">Em Atraso</div>
          <div className="text-xl font-bold text-red-600">{formatBRL(totalVencido)}</div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Mês</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Honorários</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Despesas</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Custas</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Total</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {financeiroMensal.map(m => (
              <tr key={m.month} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-900">{monthLabel(m.month + '-01')}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatBRL(m.honorarios)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatBRL(m.despesas)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatBRL(m.custas)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatBRL(m.total)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.aboveAvg ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {m.aboveAvg ? 'Acima da média' : 'Abaixo da média'}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-3 text-sm text-slate-900">Total</td>
              <td className="px-4 py-3 text-sm text-slate-900">{formatBRL(financeiroMensal.reduce((s, m) => s + m.honorarios, 0))}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{formatBRL(financeiroMensal.reduce((s, m) => s + m.despesas, 0))}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{formatBRL(financeiroMensal.reduce((s, m) => s + m.custas, 0))}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{formatBRL(financeiroMensal.reduce((s, m) => s + m.total, 0))}</td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProdutividade = () => (
    <div className="grid grid-cols-1 gap-3">
      {produtividadeData.map(d => (
        <div key={d.user.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4">
          <UserAvatar name={d.user.name} color={d.user.avatar_color} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{d.user.name}</span>
              {d.user.practice_areas.map(a => (
                <span key={a} className={`${areaColors[a]} text-xs font-medium px-2 py-0.5 rounded-full`}>{areaLabels[a]}</span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4 mt-2">
              <div><span className="text-lg font-bold text-slate-900">{d.processos}</span><div className="text-xs text-slate-400">Processos Ativos</div></div>
              <div><span className="text-lg font-bold text-slate-900">{d.clientes}</span><div className="text-xs text-slate-400">Clientes</div></div>
              <div><span className="text-lg font-bold text-slate-900">{d.audiencias}</span><div className="text-xs text-slate-400">Audiências (mês)</div></div>
              <div><span className={`text-lg font-bold ${d.prazos > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{d.prazos}</span><div className="text-xs text-slate-400">Prazos (semana)</div></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">{d.user.oab}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAudienciasPeriodo = () => {
    const aggs = [
      { label: 'Agendadas', count: audienciasAgendadas, color: 'text-blue-600' },
      { label: 'Realizadas', count: audienciasRealizadas, color: 'text-green-600' },
      { label: 'Adiadas', count: audienciaEventos.filter(e => e.audiencia_status === 'adiada').length, color: 'text-amber-600' },
      { label: 'Canceladas', count: audienciasCanceladas, color: 'text-slate-600' },
    ];
    const tipoLabels: Record<string, string> = { conciliacao: 'Conciliação', instrucao: 'Instrução', julgamento: 'Julgamento', una: 'Una', virtual: 'Virtual' };
    const tipoCounts: Record<string, number> = {};
    audienciaEventos.forEach(e => { const t = e.audiencia_tipo || 'instrucao'; tipoCounts[t] = (tipoCounts[t] || 0) + 1; });
    const totalAud = audienciaEventos.length;
    return (
      <div>
        {periodButtons}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {aggs.map(a => (
            <div key={a.label} className="bg-slate-50 rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold ${a.color}`}>{a.count}</div>
              <div className="text-xs text-slate-400">{a.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          {Object.entries(tipoCounts).map(([t, c]) => (
            <div key={t} className="flex items-center gap-3 mb-2 last:mb-0">
              <span className="text-xs text-slate-600 w-24">{tipoLabels[t] || t}</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 rounded-full h-2" style={{ width: `${totalAud > 0 ? Math.min((c / totalAud) * 100, 100) : 0}%` }} />
              </div>
              <span className="text-xs text-slate-500 w-16 text-right">{c} ({totalAud > 0 ? ((c / totalAud) * 100).toFixed(0) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInadimplencia = () => (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-xs text-red-400 uppercase">Total Vencido</div>
          <div className="text-xl font-bold text-red-600">{formatBRL(totalVencido)}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-xs text-orange-400 uppercase">Taxa Inadimplência</div>
          <div className="text-xl font-bold text-orange-600">{taxaInadimplencia.toFixed(1)}%</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400 uppercase">Lançamentos Vencidos</div>
          <div className="text-xl font-bold text-slate-900">{vencidosPorCliente.length}</div>
        </div>
      </div>
      <div className="space-y-3 mb-5">
        {inadimplenciaPorAdvogado.filter(a => a.vencido > 0 || a.aReceber > 0).map(a => {
          const taxa = a.total > 0 ? (a.recebido / a.total) * 100 : 0;
          return (
            <div key={a.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4">
              <UserAvatar name={a.name} color={a.avatar_color} />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{a.name}</div>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-amber-600">A receber: {formatBRL(a.aReceber)}</span>
                  <span className="text-red-600">Vencido: {formatBRL(a.vencido)}</span>
                  <span className="text-green-600">Recebido: {formatBRL(a.recebido)}</span>
                </div>
              </div>
              <div className="w-32">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                  <div className="bg-green-500 h-full" style={{ width: `${Math.min(taxa, 100)}%` }} />
                  {a.vencido > 0 && <div className="bg-red-400 h-full" style={{ width: `${Math.min((a.vencido / Math.max(a.total, 1)) * 100, 100)}%` }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {vencidosPorCliente.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Advogado</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Valor Vencido</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Vencimento</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Dias em Atraso</th>
              </tr>
            </thead>
            <tbody>
              {vencidosPorCliente.map(v => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-900">{v.cliente_nome}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{v.advogado?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatBRL(v.valor)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDateBR(v.vencimento)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${v.diasAtraso > 90 ? 'text-red-600 font-bold' : v.diasAtraso > 30 ? 'text-orange-600' : 'text-amber-600'}`}>
                      {v.diasAtraso} dias
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderMeusPrazos = () => (
    <div>
      {periodButtons}
      {prazosFatais.length > 0 ? (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
          <div className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-2">
            <Flame className="w-4 h-4 text-red-500" /> Prazos Fatais
          </div>
          {prazosFatais.map(p => (
            <div key={p.id} className="flex items-center gap-3 mb-2 last:mb-0">
              <span className="font-mono text-xs text-slate-500">{p.numero_cnj}</span>
              <span className="text-sm text-slate-700 flex-1">{p.acao}</span>
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">Vence em {daysDiff(p.prazo_fatal)} dias</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-600">Nenhum prazo fatal nos próximos 7 dias</span>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Processo</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Ação</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Área</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Prazo Fatal</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Dias Restantes</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {allProcessos.filter(p => p.prazo_fatal).sort((a, b) => daysDiff(a.prazo_fatal) - daysDiff(b.prazo_fatal)).map(p => {
              const diff = daysDiff(p.prazo_fatal);
              return (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.numero_cnj}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{p.acao}</td>
                  <td className="px-4 py-3"><span className={`${areaColors[p.practice_area]} text-xs font-medium px-2 py-0.5 rounded-full`}>{areaLabels[p.practice_area]}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatDateBR(p.prazo_fatal)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${diff <= 0 ? 'text-red-600 font-bold' : diff <= 3 ? 'text-red-600' : diff <= 7 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {diff <= 0 ? 'Vencido' : `${diff} dias`}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className={`${statusColors[p.status]} text-xs font-medium px-2 py-0.5 rounded-full`}>{statusLabels[p.status]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMinhasAudiencias = () => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const mesCount = audienciaEventos.filter(e => e.data.startsWith(monthKey)).length;
    return (
      <div>
        {periodButtons}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-blue-600">{mesCount}</div><div className="text-xs text-slate-400">Este mês</div></div>
          <div className="bg-green-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-green-600">{audienciasRealizadas}</div><div className="text-xs text-slate-400">Realizadas</div></div>
          <div className="bg-amber-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-amber-600">{audienciasAgendadas}</div><div className="text-xs text-slate-400">Pendentes</div></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Data</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Título</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {audienciaEventos.sort((a, b) => a.data.localeCompare(b.data)).map(e => (
                <tr key={e.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-700">{formatDateBR(e.data)} {e.hora_inicio}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{e.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.cliente_nome || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.audiencia_status === 'realizada' ? 'bg-green-100 text-green-700' : e.audiencia_status === 'cancelada' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                      {e.audiencia_status === 'realizada' ? 'Realizada' : e.audiencia_status === 'cancelada' ? 'Cancelada' : 'Agendada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMeusClientes = () => (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-green-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-green-600">{clientesPorStatus.ativo}</div><div className="text-xs text-slate-400">Ativos</div></div>
        <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-slate-600">{clientesPorStatus.inativo}</div><div className="text-xs text-slate-400">Inativos</div></div>
        <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-blue-600">{clientesPorTipo.PF}</div><div className="text-xs text-slate-400">Pessoa Física</div></div>
        <div className="bg-purple-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-purple-600">{clientesPorTipo.PJ}</div><div className="text-xs text-slate-400">Pessoa Jurídica</div></div>
      </div>
    </div>
  );

  const renderAtividadeRecente = () => (
    <div>
      {allAtividades.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">Nenhuma atividade registrada</div>
      ) : (
        <div className="space-y-3">
          {allAtividades.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 20).map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <Activity className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-900">{a.descricao}</div>
                <div className="text-xs text-slate-400 mt-0.5">{formatDateBR(a.data)} · {a.usuario_nome}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ─── modal content dispatcher ─── */
  const getModalContent = () => {
    switch (activeReport) {
      case 'processos-status':
      case 'meus-processos-status': return renderProcessosPorStatus();
      case 'processos-area':
      case 'meus-processos-area': return renderProcessosPorArea();
      case 'financeiro': return renderFinanceiroMensal();
      case 'produtividade': return renderProdutividade();
      case 'audiencias':
      case 'minhas-audiencias': return renderAudienciasPeriodo();
      case 'inadimplencia': return renderInadimplencia();
      case 'meus-prazos': return renderMeusPrazos();
      case 'meus-clientes': return renderMeusClientes();
      case 'atividade-recente': return renderAtividadeRecente();
      default: return null;
    }
  };

  const reportTitles: Record<ReportType, string> = {
    'processos-status': 'Processos por Status',
    'processos-area': 'Distribuição por Área do Direito',
    'financeiro': 'Financeiro Mensal',
    'produtividade': 'Produtividade por Advogado',
    'audiencias': 'Audiências do Período',
    'inadimplencia': 'Análise de Inadimplência',
    'meus-processos-status': 'Meus Processos por Status',
    'meus-processos-area': 'Meus Processos por Área',
    'minhas-audiencias': 'Minhas Audiências',
    'meus-prazos': 'Meus Prazos',
    'meus-clientes': 'Meus Clientes',
    'atividade-recente': 'Atividade Recente',
  };

  const reportIcons: Record<ReportType, { icon: React.ElementType; bg: string }> = {
    'processos-status': { icon: BarChart2, bg: 'bg-blue-50 text-blue-600' },
    'processos-area': { icon: PieChart, bg: 'bg-purple-50 text-purple-600' },
    'financeiro': { icon: TrendingUp, bg: 'bg-green-50 text-green-600' },
    'produtividade': { icon: Award, bg: 'bg-amber-50 text-amber-600' },
    'audiencias': { icon: Calendar, bg: 'bg-indigo-50 text-indigo-600' },
    'inadimplencia': { icon: AlertTriangle, bg: 'bg-red-50 text-red-600' },
    'meus-processos-status': { icon: BarChart2, bg: 'bg-blue-50 text-blue-600' },
    'meus-processos-area': { icon: Briefcase, bg: 'bg-purple-50 text-purple-600' },
    'minhas-audiencias': { icon: Scale, bg: 'bg-indigo-50 text-indigo-600' },
    'meus-prazos': { icon: Clock, bg: 'bg-amber-50 text-amber-600' },
    'meus-clientes': { icon: Users, bg: 'bg-green-50 text-green-600' },
    'atividade-recente': { icon: Activity, bg: 'bg-teal-50 text-teal-600' },
  };

  const hasData = allProcessos.length > 0 || allClientes.length > 0;

  if (!hasData) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
            <p className="text-xs text-slate-400 mt-0.5">WebHubPro ERP / Relatórios{admin ? ' — Escritório' : ' — Meus Dados'}</p>
          </div>
        </div>
        <EmptyState icon={BarChart2} title="Nenhum dado disponível" subtitle="Cadastre processos e clientes para visualizar os relatórios" ctaLabel="Ir para Processos" onCta={() => {}} />
      </div>
    );
  }

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-xs text-slate-400 mt-0.5">WebHubPro ERP / Relatórios{admin ? ' — Escritório' : ' — Meus Dados'}</p>
        </div>
        {admin && (
          <button onClick={() => showToast('Exportação iniciada', 'info')} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md px-3 py-2 text-sm">
            <Download className="w-4 h-4" /> Exportar Todos
          </button>
        )}
      </div>

      {/* Role banner */}
      {!admin && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div>
            <div className="text-sm text-blue-700">Você está visualizando apenas seus próprios dados.</div>
            <div className="text-xs text-blue-500 mt-0.5">Administradores têm acesso aos relatórios completos do escritório.</div>
          </div>
        </div>
      )}

      <h2 className="text-base font-semibold text-slate-900 mb-4">{admin ? 'Relatórios do Escritório' : 'Meus Relatórios'}</h2>

      {/* Report cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {admin ? (
          <>
            {renderCard(BarChart2, 'bg-blue-50 text-blue-600', 'Processos por Status', 'Visão geral de todos os processos agrupados por status atual',
              <><span>Ativos: {processosPorStatus['ativo'] || 0}</span><span>Pendentes: {processosPorStatus['pendente'] || 0}</span><span>Encerrados: {processosPorStatus['encerrado'] || 0}</span></>,
              'processos-status'
            )}
            {renderCard(PieChart, 'bg-purple-50 text-purple-600', 'Distribuição por Área do Direito', 'Porcentagem de processos em cada área de atuação do escritório',
              <>{Object.entries(processosPorArea).map(([a, c]) => <span key={a}>{areaLabels[a] || a}: {c}</span>)}</>,
              'processos-area'
            )}
            {renderCard(TrendingUp, 'bg-green-50 text-green-600', 'Financeiro Mensal', 'Receitas, despesas e inadimplência dos últimos 6 meses',
              <><span>Recebido: {formatBRL(totalRecebido)}</span><span>A receber: {formatBRL(totalAReceber)}</span><span>Inadimpl: {taxaInadimplencia.toFixed(1)}%</span></>,
              'financeiro'
            )}
            {renderCard(Award, 'bg-amber-50 text-amber-600', 'Produtividade por Advogado', 'Processos ativos, audiências e prazos por advogado do escritório',
              topPerformer ? <span>{topPerformer.name} — {topPerformer.count} processos ativos</span> : <span>—</span>,
              'produtividade'
            )}
            {renderCard(Calendar, 'bg-indigo-50 text-indigo-600', 'Audiências do Período', 'Audiências realizadas, agendadas e canceladas por período',
              <><span>Realizadas: {audienciasRealizadas}</span><span>Agendadas: {audienciasAgendadas}</span><span>Canceladas: {audienciasCanceladas}</span></>,
              'audiencias'
            )}
            {renderCard(AlertTriangle, 'bg-red-50 text-red-600', 'Análise de Inadimplência', 'Clientes com valores em atraso e taxa de inadimplência por advogado',
              <><span>Total vencido: {formatBRL(totalVencido)}</span><span>Taxa: {taxaInadimplencia.toFixed(1)}%</span></>,
              'inadimplencia',
              taxaInadimplencia > 10 ? <span className="bg-red-100 text-red-600 text-xs rounded-full px-2 py-0.5">⚠ Atenção</span> : undefined
            )}
          </>
        ) : (
          <>
            {renderCard(BarChart2, 'bg-blue-50 text-blue-600', 'Meus Processos por Status', 'Seus processos agrupados por status atual',
              <><span>Ativos: {processosPorStatus['ativo'] || 0}</span><span>Pendentes: {processosPorStatus['pendente'] || 0}</span><span>Encerrados: {processosPorStatus['encerrado'] || 0}</span></>,
              'meus-processos-status'
            )}
            {renderCard(Briefcase, 'bg-purple-50 text-purple-600', 'Meus Processos por Área', 'Distribuição dos seus processos por área do direito',
              <>{currentUser!.practice_areas.map(a => <span key={a}>{areaLabels[a]}: {processosPorArea[a] || 0}</span>)}</>,
              'meus-processos-area'
            )}
            {renderCard(Scale, 'bg-indigo-50 text-indigo-600', 'Minhas Audiências', 'Histórico e agenda de audiências dos seus processos',
              <><span>Este mês: {audienciaEventos.filter(e => e.data.startsWith(monthKey)).length}</span><span>Realizadas: {audienciasRealizadas}</span><span>Pendentes: {audienciasAgendadas}</span></>,
              'minhas-audiencias'
            )}
            {renderCard(Clock, 'bg-amber-50 text-amber-600', 'Meus Prazos', 'Prazos processuais e fatais dos seus processos',
              <>
                <span>Esta semana: {prazosEstaSemana}</span><span>Este mês: {prazosEsteMes}</span>
                {prazosFatais.length > 0 && <span className="bg-red-100 text-red-600 text-xs rounded px-1.5">{prazosFatais.length} FATAIS</span>}
              </>,
              'meus-prazos'
            )}
            {renderCard(Users, 'bg-green-50 text-green-600', 'Meus Clientes', 'Visão dos seus clientes ativos e respectivos processos',
              <><span>Ativos: {clientesPorStatus.ativo}</span><span>Inativos: {clientesPorStatus.inativo}</span><span>PF: {clientesPorTipo.PF} | PJ: {clientesPorTipo.PJ}</span></>,
              'meus-clientes'
            )}
            {renderCard(Activity, 'bg-teal-50 text-teal-600', 'Atividade Recente', 'Histórico de ações realizadas nos seus processos',
              <span>Últimas {allAtividades.length} atividades registradas</span>,
              'atividade-recente'
            )}
          </>
        )}
      </div>

      {/* Report detail modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setActiveReport(null); setPeriodFilter('todos'); }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4 relative z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${reportIcons[activeReport].bg}`}>
                  {React.createElement(reportIcons[activeReport].icon, { className: 'w-5 h-5' })}
                </div>
                <span className="text-lg font-semibold text-slate-900">{reportTitles[activeReport]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => showToast('Exportando relatório...', 'info')} className="border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md px-3 py-1.5 text-sm flex items-center gap-1">
                  <Download className="w-4 h-4" /> Exportar CSV
                </button>
                <button onClick={() => { setActiveReport(null); setPeriodFilter('todos'); }} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {getModalContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
