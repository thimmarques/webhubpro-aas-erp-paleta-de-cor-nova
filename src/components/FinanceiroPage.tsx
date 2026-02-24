import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, Search, Download, Wallet, TrendingUp, AlertTriangle, Percent,
  MoreHorizontal, Eye, Edit, Trash2, CheckCircle, DollarSign, X, Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import AccessDeniedScreen from './AccessDeniedScreen';
import EmptyState from './EmptyState';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import { MOCK_USERS } from '@/data/mockUsers';
import { loadLancamentos, saveLancamentos } from '@/data/mockLancamentos';
import { loadClientes } from '@/data/mockClientes';
import { getProcessos } from '@/data/mockProcessos';
import {
  Lancamento, LancamentoStatus, LancamentoTipo,
  lancamentoStatusLabels, lancamentoStatusColors,
  lancamentoTipoLabels, lancamentoTipoColors,
  tipoDescricaoSuggestion,
} from '@/types/lancamento';
import { areaLabels, areaColors } from '@/types/processo';

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

function diffDays(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(name: string): string {
  return name.replace(/^(Dr\.|Dra\.)\s+/i, '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const ITEMS_PER_PAGE = 10;

type SortField = 'cliente_nome' | 'numero_cnj' | 'responsible_id' | 'tipo' | 'descricao' | 'vencimento' | 'valor' | 'status';

export default function FinanceiroPage() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const [allLancamentos, setAllLancamentos] = useState<Lancamento[]>(() => loadLancamentos());
  const [search, setSearch] = useState('');
  const [filterAdvogado, setFilterAdvogado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [sortField, setSortField] = useState<SortField>('vencimento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState<Lancamento | null>(null);
  const [pagoDate, setPagoDate] = useState(new Date().toISOString().slice(0, 10));
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // KPIs (always from ALL data)
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalAReceber = allLancamentos.filter(l => l.status === 'pendente' || l.status === 'parcelado').reduce((s, l) => s + l.valor, 0);
    const pagoThisMonth = allLancamentos.filter(l => l.status === 'pago' && l.data_pagamento.startsWith(currentYM));
    const totalRecebidoMes = pagoThisMonth.reduce((s, l) => s + l.valor, 0);
    const vencidos = allLancamentos.filter(l => l.status === 'vencido');
    const totalVencido = vencidos.reduce((s, l) => s + l.valor, 0);
    const denom = totalAReceber + totalVencido + totalRecebidoMes;
    const taxaInadimplencia = denom > 0 ? (totalVencido / denom) * 100 : 0;
    const pendenteCount = allLancamentos.filter(l => l.status === 'pendente' || l.status === 'parcelado').length;
    return { totalAReceber, totalRecebidoMes, totalVencido, taxaInadimplencia, pendenteCount, pagoThisMonthCount: pagoThisMonth.length, vencidoCount: vencidos.length };
  }, [allLancamentos]);

  // Resumo por advogado (always ALL data)
  const resumoPorAdvogado = useMemo(() => {
    const map: Record<string, { aReceber: number; recebido: number }> = {};
    allLancamentos.forEach(l => {
      if (!map[l.responsible_id]) map[l.responsible_id] = { aReceber: 0, recebido: 0 };
      if (l.status === 'pago') map[l.responsible_id].recebido += l.valor;
      else map[l.responsible_id].aReceber += l.valor;
    });
    return Object.entries(map).map(([uid, v]) => {
      const user = MOCK_USERS.find(u => u.id === uid);
      const total = v.aReceber + v.recebido;
      return { uid, name: user?.name || uid, avatar_color: user?.avatar_color || 'bg-slate-400', practice_areas: user?.practice_areas || [], aReceber: v.aReceber, recebido: v.recebido, total, taxaCobranca: total > 0 ? (v.recebido / total) * 100 : 0 };
    }).sort((a, b) => b.total - a.total);
  }, [allLancamentos]);

  const hasActiveFilters = search || filterAdvogado || filterTipo || filterStatus || filterArea || filterPeriodo;

  const filtered = useMemo(() => {
    let items = [...allLancamentos];
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(l => l.cliente_nome.toLowerCase().includes(s) || l.numero_cnj.includes(s) || l.descricao.toLowerCase().includes(s));
    }
    if (filterAdvogado) items = items.filter(l => l.responsible_id === filterAdvogado);
    if (filterTipo) items = items.filter(l => l.tipo === filterTipo);
    if (filterStatus) items = items.filter(l => l.status === filterStatus);
    if (filterArea) items = items.filter(l => l.practice_area === filterArea);
    if (filterPeriodo) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      items = items.filter(l => {
        const d = new Date(l.vencimento || l.created_at);
        if (filterPeriodo === 'este_mes') return d.getFullYear() === y && d.getMonth() === m;
        if (filterPeriodo === 'mes_anterior') { const pm = m === 0 ? 11 : m - 1; const py = m === 0 ? y - 1 : y; return d.getFullYear() === py && d.getMonth() === pm; }
        if (filterPeriodo === 'trimestre') { const q = Math.floor(m / 3); return d.getFullYear() === y && Math.floor(d.getMonth() / 3) === q; }
        if (filterPeriodo === 'ano') return d.getFullYear() === y;
        return true;
      });
    }
    items.sort((a, b) => {
      let va: any = (a as any)[sortField];
      let vb: any = (b as any)[sortField];
      if (sortField === 'valor') { va = a.valor; vb = b.valor; }
      else { va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [allLancamentos, search, filterAdvogado, filterTipo, filterStatus, filterArea, filterPeriodo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const filteredTotal = filtered.reduce((s, l) => s + l.valor, 0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  const handleMarkPago = useCallback(() => {
    if (!showPagoModal) return;
    const updated = allLancamentos.map(l => l.id === showPagoModal.id ? { ...l, status: 'pago' as const, data_pagamento: pagoDate, parcelas_pagas: l.parcelas_total } : l);
    saveLancamentos(updated);
    setAllLancamentos(updated);
    setShowPagoModal(null);
    showToast('Pagamento registrado com sucesso', 'success');
  }, [showPagoModal, pagoDate, allLancamentos, showToast]);

  const handleDelete = useCallback((id: string) => {
    const updated = allLancamentos.filter(l => l.id !== id);
    saveLancamentos(updated);
    setAllLancamentos(updated);
    setDropdownOpen(null);
    showToast('Lançamento excluído', 'success');
  }, [allLancamentos, showToast]);

  const clearFilters = () => { setSearch(''); setFilterAdvogado(''); setFilterTipo(''); setFilterStatus(''); setFilterArea(''); setFilterPeriodo(''); setPage(1); };

  if (!isAdmin()) return <AccessDeniedScreen />;

  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-xs text-slate-400 mt-0.5">WebHubPro ERP / Financeiro</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => showToast('Exportação iniciada', 'info')} className="border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md px-3 py-2 text-sm flex items-center">
            <Download className="w-4 h-4 mr-1.5" />Exportar
          </button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 flex items-center">
            <Plus className="w-4 h-4 mr-1.5" />+ Novo Lançamento
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 flex-shrink-0"><Wallet className="w-5 h-5" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{formatBRL(metrics.totalAReceber)}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Total a Receber</div>
            <div className="text-xs text-slate-400">{metrics.pendenteCount} lançamentos em aberto</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-green-50 text-green-600 flex-shrink-0"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{formatBRL(metrics.totalRecebidoMes)}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Recebido este Mês</div>
            <div className="text-xs text-slate-400">{metrics.pagoThisMonthCount} pagamentos</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center bg-red-50 text-red-600 flex-shrink-0 ${metrics.totalVencido > 0 ? 'ring-2 ring-red-200 ring-offset-1' : ''}`}><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <div className="text-2xl font-bold text-red-600">{formatBRL(metrics.totalVencido)}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Em Atraso</div>
            <div className="text-xs text-slate-400">{metrics.vencidoCount} vencidos</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600 flex-shrink-0"><Percent className="w-5 h-5" /></div>
          <div>
            <div className={`text-2xl font-bold ${metrics.taxaInadimplencia >= 15 ? 'text-red-600' : metrics.taxaInadimplencia >= 8 ? 'text-amber-600' : 'text-green-600'}`}>{metrics.taxaInadimplencia.toFixed(1)}%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Inadimplência</div>
            <div className="h-1.5 rounded-full bg-slate-100 w-full mt-1"><div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(metrics.taxaInadimplencia, 100)}%` }} /></div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[12rem] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por cliente ou processo..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterAdvogado} onChange={e => { setFilterAdvogado(e.target.value); setPage(1); }} className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600">
          <option value="">Todos Advogados</option>
          {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1); }} className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600">
          <option value="">Todos Tipos</option>
          <option value="honorario">Honorário</option>
          <option value="despesa">Despesa</option>
          <option value="repasse">Repasse</option>
          <option value="custas">Custas</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600">
          <option value="">Todos Status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="vencido">Vencido</option>
          <option value="parcelado">Parcelado</option>
        </select>
        <select value={filterArea} onChange={e => { setFilterArea(e.target.value); setPage(1); }} className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600">
          <option value="">Todas Áreas</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="civil">Civil</option>
          <option value="criminal">Criminal</option>
          <option value="previdenciario">Previdenciário</option>
        </select>
        <select value={filterPeriodo} onChange={e => { setFilterPeriodo(e.target.value); setPage(1); }} className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600">
          <option value="">Todos Períodos</option>
          <option value="este_mes">Este mês</option>
          <option value="mes_anterior">Mês anterior</option>
          <option value="trimestre">Este trimestre</option>
          <option value="ano">Este ano</option>
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 ml-auto flex items-center gap-1"><X className="w-3 h-3" />Limpar</button>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* TABLE */}
        <div className="col-span-8">
          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <EmptyState icon={DollarSign} title="Nenhum lançamento encontrado" subtitle="Tente ajustar os filtros ou registre um novo lançamento" ctaLabel="+ Novo Lançamento" onCta={() => setShowModal(true)} />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {([
                        ['cliente_nome', 'CLIENTE'],
                        ['numero_cnj', 'PROCESSO'],
                        ['responsible_id', 'ADVOGADO'],
                        ['tipo', 'TIPO'],
                        ['descricao', 'DESCRIÇÃO'],
                        ['vencimento', 'VENCIMENTO'],
                        ['valor', 'VALOR'],
                        ['status', 'STATUS'],
                      ] as [SortField, string][]).map(([f, label]) => (
                        <th key={f} onClick={() => toggleSort(f)} className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 text-left cursor-pointer hover:text-slate-700 select-none">
                          {label}<SortIcon field={f} />
                        </th>
                      ))}
                      <th className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 text-left">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(l => {
                      const user = MOCK_USERS.find(u => u.id === l.responsible_id);
                      const dd = l.vencimento ? diffDays(l.vencimento) : null;
                      return (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-medium flex-shrink-0">{getInitials(l.cliente_nome)}</div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">{l.cliente_nome}</div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${areaColors[l.practice_area] || ''}`}>{areaLabels[l.practice_area]}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 min-w-[9rem]">
                            <span className="font-mono text-xs text-slate-500" title={l.numero_cnj}>{l.numero_cnj.length > 20 ? l.numero_cnj.slice(0, 20) + '...' : l.numero_cnj}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            {user && (
                              <div className="flex items-center gap-1.5">
                                <UserAvatar name={user.name} color={user.avatar_color} size="sm" />
                                <span className="text-sm text-slate-600">{user.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lancamentoTipoColors[l.tipo]}`}>{lancamentoTipoLabels[l.tipo]}</span>
                          </td>
                          <td className="px-4 py-3.5"><span className="text-sm text-slate-600 truncate max-w-[10rem] block">{l.descricao}</span></td>
                          <td className="px-4 py-3.5">
                            {l.status === 'pago' ? (
                              <div><div className="text-xs text-slate-400">Pago em</div><div className="text-sm text-green-600">{formatDate(l.data_pagamento)}</div></div>
                            ) : dd !== null && dd < 0 ? (
                              <div><div className="text-xs text-red-400">Vencido</div><div className="text-sm text-red-600 font-medium">{formatDate(l.vencimento)}</div></div>
                            ) : dd !== null && dd <= 7 ? (
                              <div><div className="text-xs text-amber-400">Vence em {dd} dias</div><div className="text-sm text-amber-600 font-medium">{formatDate(l.vencimento)}</div></div>
                            ) : (
                              <div><div className="text-xs text-slate-400">Vencimento</div><div className="text-sm text-slate-700">{formatDate(l.vencimento)}</div></div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-sm font-semibold text-slate-900">{formatBRL(l.valor)}</div>
                            {l.status === 'parcelado' && <div className="text-xs text-blue-500">{l.parcelas_pagas}/{l.parcelas_total} parcelas</div>}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lancamentoStatusColors[l.status]}`}>{lancamentoStatusLabels[l.status]}</span>
                          </td>
                          <td className="px-4 py-3.5 relative">
                            <button onClick={() => setDropdownOpen(dropdownOpen === l.id ? null : l.id)} className="text-slate-400 hover:text-slate-600 p-1 rounded"><MoreHorizontal className="w-4 h-4" /></button>
                            {dropdownOpen === l.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded-lg py-1 z-20 w-48">
                                  {l.status !== 'pago' && (
                                    <button onClick={() => { setDropdownOpen(null); setPagoDate(new Date().toISOString().slice(0, 10)); setShowPagoModal(l); }} className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Marcar como Pago</button>
                                  )}
                                  <button onClick={() => { setDropdownOpen(null); showToast('Edição em desenvolvimento', 'info'); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Edit className="w-4 h-4" />Editar</button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button onClick={() => handleDelete(l.id)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" />Excluir</button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* TABLE FOOTER */}
              <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} lançamentos</span>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  Total filtrado: <span className="text-sm font-semibold text-slate-900">{formatBRL(filteredTotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RESUMO POR ADVOGADO */}
        <div className="col-span-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm h-fit">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Resumo por Advogado</span>
              <span className="text-xs text-slate-400 capitalize">{currentMonthLabel}</span>
            </div>
            <div className="px-5 py-2">
              {resumoPorAdvogado.map(adv => {
                const tcColor = adv.taxaCobranca >= 80 ? 'text-green-600' : adv.taxaCobranca >= 50 ? 'text-amber-600' : 'text-red-600';
                const barColor = adv.taxaCobranca >= 80 ? 'bg-green-500' : adv.taxaCobranca >= 50 ? 'bg-amber-400' : 'bg-red-400';
                return (
                  <div key={adv.uid} className="py-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <UserAvatar name={adv.name} color={adv.avatar_color} size="md" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{adv.name}</div>
                        <div className="flex gap-1 flex-wrap">{adv.practice_areas.map(a => <span key={a} className={`text-xs px-1.5 py-0.5 rounded-full ${areaColors[a]}`}>{areaLabels[a]}</span>)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <div className="bg-amber-50 rounded-md p-2.5">
                        <div className="text-xs text-amber-600 uppercase">A Receber</div>
                        <div className="text-sm font-bold text-amber-700 mt-0.5">{formatBRL(adv.aReceber)}</div>
                      </div>
                      <div className="bg-green-50 rounded-md p-2.5">
                        <div className="text-xs text-green-600 uppercase">Recebido</div>
                        <div className="text-sm font-bold text-green-700 mt-0.5">{formatBRL(adv.recebido)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Taxa de cobrança</span>
                      <span className={`text-xs font-semibold ${tcColor}`}>{adv.taxaCobranca.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 w-full"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(adv.taxaCobranca, 100)}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 rounded-b-lg">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Total do Escritório</div>
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-xs text-slate-400">A Receber</div><div className="text-base font-bold text-amber-600">{formatBRL(metrics.totalAReceber)}</div></div>
                <div><div className="text-xs text-slate-400">Recebido (mês)</div><div className="text-base font-bold text-green-600">{formatBRL(metrics.totalRecebidoMes)}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MARCAR COMO PAGO MODAL */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowPagoModal(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <div className="text-lg font-semibold text-slate-900">Confirmar Pagamento</div>
            <div className="text-sm text-slate-500 mt-1">{showPagoModal.descricao}</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">Valor: {formatBRL(showPagoModal.valor)}</div>
            <div className="mt-4 mb-5 text-left">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Data do pagamento*</label>
              <input type="date" value={pagoDate} onChange={e => setPagoDate(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPagoModal(null)} className="flex-1 border border-slate-200 rounded-md py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleMarkPago} className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700">Confirmar Pagamento</button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO LANÇAMENTO MODAL */}
      {showModal && <NovoLancamentoModal onClose={() => setShowModal(false)} onSave={(l) => { const updated = [...allLancamentos, l]; saveLancamentos(updated); setAllLancamentos(updated); setShowModal(false); showToast('Lançamento registrado com sucesso', 'success'); }} />}
    </div>
  );
}

/* ─── NOVO LANÇAMENTO MODAL ─── */
function NovoLancamentoModal({ onClose, onSave }: { onClose: () => void; onSave: (l: Lancamento) => void }) {
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [showClienteList, setShowClienteList] = useState(false);
  const [processoId, setProcessoId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [tipo, setTipo] = useState<LancamentoTipo | ''>('');
  const [area, setArea] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [status, setStatus] = useState<LancamentoStatus>('pendente');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [parcelasTotal, setParcelasTotal] = useState(2);
  const [parcelasPagas, setParcelasPagas] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const allClientes = useMemo(() => loadClientes(), []);
  const allProcessos = useMemo(() => getProcessos(), []);

  const filteredClientes = useMemo(() => {
    if (!clienteSearch) return allClientes;
    const s = clienteSearch.toLowerCase();
    return allClientes.filter(c => {
      const name = (c as any).nome || (c as any).razao_social || '';
      return name.toLowerCase().includes(s);
    });
  }, [allClientes, clienteSearch]);

  const relatedProcessos = useMemo(() => {
    if (!selectedCliente) return [];
    return allProcessos.filter(p => p.polo_ativo_id === selectedCliente.id);
  }, [selectedCliente, allProcessos]);

  const handleSelectCliente = (c: any) => {
    setSelectedCliente(c);
    setClienteSearch('');
    setShowClienteList(false);
    setProcessoId('');
    setArea(c.practice_area || '');
  };

  const handleSelectProcesso = (pid: string) => {
    setProcessoId(pid);
    const proc = allProcessos.find(p => p.id === pid);
    if (proc) {
      setResponsibleId(proc.responsible_id);
      setArea(proc.practice_area);
    }
  };

  const handleTipoChange = (t: LancamentoTipo) => {
    setTipo(t);
    if (!descricao || Object.values(tipoDescricaoSuggestion).some(s => descricao.startsWith(s))) {
      setDescricao(tipoDescricaoSuggestion[t]);
    }
  };

  const parseValor = (v: string): number => {
    const cleaned = v.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleValorBlur = () => {
    const num = parseValor(valor);
    if (num > 0) setValor(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSave = () => {
    const errs: Record<string, boolean> = {};
    if (!selectedCliente) errs.cliente = true;
    if (!responsibleId) errs.responsible = true;
    if (!tipo) errs.tipo = true;
    if (!descricao.trim()) errs.descricao = true;
    if (!parseValor(valor)) errs.valor = true;
    if (!vencimento) errs.vencimento = true;
    if (status === 'pago' && !dataPagamento) errs.dataPagamento = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const proc = allProcessos.find(p => p.id === processoId);
    const clienteName = (selectedCliente as any).nome || (selectedCliente as any).razao_social || '';

    const lancamento: Lancamento = {
      id: 'lan-' + Date.now(),
      processo_id: processoId || '',
      numero_cnj: proc?.numero_cnj || '',
      cliente_nome: clienteName,
      responsible_id: responsibleId,
      practice_area: (area || 'civil') as any,
      tipo: tipo as LancamentoTipo,
      descricao: descricao.trim(),
      valor: parseValor(valor),
      vencimento,
      status,
      data_pagamento: status === 'pago' ? dataPagamento : '',
      parcelas_total: status === 'parcelado' ? parcelasTotal : 1,
      parcelas_pagas: status === 'parcelado' ? parcelasPagas : status === 'pago' ? 1 : 0,
      created_at: new Date().toISOString().slice(0, 10),
    };
    onSave(lancamento);
  };

  const vencDiff = vencimento ? diffDays(vencimento) : null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center"><DollarSign className="w-5 h-5 text-blue-600 mr-2" /><span className="text-lg font-semibold text-slate-900">Novo Lançamento</span></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {/* BODY */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Cliente */}
            <div className="col-span-2 relative">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Cliente <span className="text-red-500">*</span></label>
              {selectedCliente ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">{getInitials((selectedCliente as any).nome || (selectedCliente as any).razao_social || '')}</div>
                  <span className="text-sm">{(selectedCliente as any).nome || (selectedCliente as any).razao_social}</span>
                  <button onClick={() => { setSelectedCliente(null); setProcessoId(''); }} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={clienteSearch} onChange={e => { setClienteSearch(e.target.value); setShowClienteList(true); }} onFocus={() => setShowClienteList(true)} placeholder="Buscar cliente..." className={`w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cliente ? 'border-red-300' : 'border-slate-200'}`} />
                  {showClienteList && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowClienteList(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md max-h-48 overflow-y-auto z-20">
                        {filteredClientes.map(c => {
                          const name = (c as any).nome || (c as any).razao_social || '';
                          return (
                            <button key={c.id} onClick={() => handleSelectCliente(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">{getInitials(name)}</div>
                              <span className="text-sm">{name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${areaColors[c.practice_area]}`}>{areaLabels[c.practice_area]}</span>
                            </button>
                          );
                        })}
                        {filteredClientes.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">Nenhum cliente</div>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* Processo */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Processo</label>
              <select value={processoId} onChange={e => handleSelectProcesso(e.target.value)} disabled={!selectedCliente} className={`w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!selectedCliente ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}>
                <option value="">{selectedCliente ? 'Selecione um processo...' : 'Selecione um cliente primeiro'}</option>
                {relatedProcessos.map(p => <option key={p.id} value={p.id}>{p.numero_cnj} — {p.acao}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">Deixe em branco para lançamento avulso</p>
            </div>
            {/* Advogado */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Advogado Responsável <span className="text-red-500">*</span></label>
              <select value={responsibleId} onChange={e => setResponsibleId(e.target.value)} className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.responsible ? 'border-red-300' : 'border-slate-200'}`}>
                <option value="">Selecione...</option>
                {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo <span className="text-red-500">*</span></label>
              <select value={tipo} onChange={e => handleTipoChange(e.target.value as LancamentoTipo)} className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tipo ? 'border-red-300' : 'border-slate-200'}`}>
                <option value="">Selecione...</option>
                <option value="honorario">Honorário</option>
                <option value="despesa">Despesa</option>
                <option value="repasse">Repasse</option>
                <option value="custas">Custas</option>
              </select>
            </div>
            {/* Área */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Área</label>
              <select value={area} onChange={e => setArea(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                <option value="trabalhista">Trabalhista</option>
                <option value="civil">Civil</option>
                <option value="criminal">Criminal</option>
                <option value="previdenciario">Previdenciário</option>
              </select>
            </div>
            {/* Descrição */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Descrição <span className="text-red-500">*</span></label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do lançamento..." className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.descricao ? 'border-red-300' : 'border-slate-200'}`} />
            </div>
            {/* Valor */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Valor (R$) <span className="text-red-500">*</span></label>
              <input value={valor} onChange={e => setValor(e.target.value)} onBlur={handleValorBlur} placeholder="R$ 0,00" className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.valor ? 'border-red-300' : 'border-slate-200'}`} />
            </div>
            {/* Vencimento */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Vencimento <span className="text-red-500">*</span></label>
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.vencimento ? 'border-red-300' : 'border-slate-200'}`} />
              {vencDiff !== null && vencDiff < 0 && <div className="flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3 text-amber-500" /><span className="text-xs text-amber-600">Data no passado — verifique o vencimento</span></div>}
            </div>
            {/* Status */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Status <span className="text-red-500">*</span></label>
              <select value={status} onChange={e => setStatus(e.target.value as LancamentoStatus)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="parcelado">Parcelado</option>
              </select>
            </div>
            {/* Data pagamento (pago) */}
            {status === 'pago' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Data do Pagamento <span className="text-red-500">*</span></label>
                <input type="date" value={dataPagamento} onChange={e => setDataPagamento(e.target.value)} className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dataPagamento ? 'border-red-300' : 'border-slate-200'}`} />
              </div>
            )}
            {/* Parcelamento */}
            {status === 'parcelado' && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Total de Parcelas</label>
                  <input type="number" min={2} max={36} value={parcelasTotal} onChange={e => setParcelasTotal(Number(e.target.value))} placeholder="Ex: 6" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Parcelas Pagas</label>
                  <input type="number" min={0} max={parcelasTotal} value={parcelasPagas} onChange={e => setParcelasPagas(Number(e.target.value))} placeholder="0" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>
            )}
          </div>
        </div>
        {/* FOOTER */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white rounded-b-xl">
          <div className="flex items-center gap-1.5"><Info className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-400">Campos marcados com * são obrigatórios</span></div>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2">Cancelar</button>
            <button onClick={handleSave} className="bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700">Salvar Lançamento</button>
          </div>
        </div>
      </div>
    </div>
  );
}
