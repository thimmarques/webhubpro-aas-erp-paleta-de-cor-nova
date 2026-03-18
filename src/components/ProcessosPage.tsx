import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Scale,
  Trash,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Flame,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import { getProcessos, saveProcessos } from '@/data/mockProcessos';
import {
  Processo,
  ProcessoStatus,
  TribunalType,
  FaseType,
  statusLabels,
  statusColors,
  faseLabels,
  areaColors,
  areaLabels,
  acaoSuggestions,
  areaTribunalDefault,
} from '@/types/processo';
import EmptyState from './EmptyState';
import UserAvatar from './UserAvatar';

/* ─── helpers ─── */

function filterByUser<T extends { responsible_id: string }>(
  items: T[],
  userId: string,
  isAdmin: boolean
): T[] {
  return isAdmin ? items : items.filter((i) => i.responsible_id === userId);
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTimeBR(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBRL(str: string): number {
  const cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function daysDiff(dateStr: string): number {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function maskCNJ(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 20);
  let r = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 7) r += '-';
    if (i === 9) r += '.';
    if (i === 13) r += '.';
    if (i === 14) r += '.';
    if (i === 16) r += '.';
    r += digits[i];
  }
  return r;
}

function isWithinDays(dateStr: string, days: number): boolean {
  const diff = daysDiff(dateStr);
  return diff >= 0 && diff <= days;
}

const PER_PAGE = 10;

interface ProcessosPageProps {
  onNavigateDetail: (id: string) => void;
}

type SortField = 'numero_cnj' | 'polo_ativo_nome' | 'practice_area' | 'tribunal' | 'status' | 'proxima_audiencia' | 'prazo_fatal' | 'responsible_id';

export default function ProcessosPage({ onNavigateDetail }: ProcessosPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const [allProcessos, setAllProcessos] = useState<Processo[]>(() => getProcessos());
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTribunal, setFilterTribunal] = useState('');
  const [filterPrazo, setFilterPrazo] = useState('');
  const [sortField, setSortField] = useState<SortField>('prazo_fatal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ─── filtering ─── */
  const filtered = useMemo(() => {
    let items = filterByUser(allProcessos, currentUser!.id, admin);

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.numero_cnj.toLowerCase().includes(s) ||
          p.polo_ativo_nome.toLowerCase().includes(s) ||
          p.polo_passivo_nome.toLowerCase().includes(s)
      );
    }
    if (filterArea) items = items.filter((p) => p.practice_area === filterArea);
    if (filterStatus) items = items.filter((p) => p.status === filterStatus);
    if (filterTribunal) items = items.filter((p) => p.tribunal === filterTribunal);
    if (filterPrazo) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      items = items.filter((p) => {
        if (!p.prazo_fatal) return false;
        const diff = daysDiff(p.prazo_fatal);
        if (filterPrazo === 'hoje') return diff === 0;
        if (filterPrazo === '3dias') return diff >= 0 && diff <= 3;
        if (filterPrazo === 'semana') return diff >= 0 && diff <= 7;
        if (filterPrazo === 'mes') return diff >= 0 && diff <= 30;
        return true;
      });
    }

    // sort
    items = [...items].sort((a, b) => {
      let va: any = a[sortField] ?? '';
      let vb: any = b[sortField] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [allProcessos, currentUser, admin, search, filterArea, filterStatus, filterTribunal, filterPrazo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, filterArea, filterStatus, filterTribunal, filterPrazo]);

  /* ─── stats ─── */
  const statsTotal = filtered.length;
  const statsAudiencias = filtered.filter((p) => p.proxima_audiencia).length;
  const statsPrazos = filtered.filter((p) => isWithinDays(p.prazo_fatal, 7)).length;
  const statsValor = filtered.reduce((s, p) => s + p.valor_causa, 0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  const getUserById = (id: string) => MOCK_USERS.find((u) => u.id === id);

  const handleDelete = (id: string) => {
    const updated = allProcessos.filter((p) => p.id !== id);
    setAllProcessos(updated);
    saveProcessos(updated);
    setDeleteConfirm(null);
    showToast('Processo excluído com sucesso', 'success');
  };

  const handleEnclose = (id: string) => {
    const updated = allProcessos.map((p) =>
      p.id === id ? { ...p, status: 'encerrado' as ProcessoStatus, updated_at: new Date().toISOString() } : p
    );
    setAllProcessos(updated);
    saveProcessos(updated);
    setOpenDropdown(null);
    showToast('Processo encerrado', 'info');
  };

  const handleSaveNew = (proc: Processo) => {
    const updated = [...allProcessos, proc];
    setAllProcessos(updated);
    saveProcessos(updated);
    setModalOpen(false);
    showToast('Processo cadastrado com sucesso', 'success');
  };

  /* ─── prazo cell ─── */
  const renderPrazo = (prazo: string) => {
    if (!prazo) return <span className="text-muted-foreground/60">—</span>;
    const diff = daysDiff(prazo);
    if (diff <= 0) return (
      <span className="bg-red-100 text-red-700 rounded-md px-2 py-0.5 text-xs font-semibold inline-flex items-center gap-1">
        VENCIDO
      </span>
    );
    if (diff <= 3) return (
      <span className="bg-red-100 text-red-700 rounded-md px-2 py-0.5 text-xs font-semibold inline-flex items-center gap-1">
        <Flame className="w-3 h-3" /> {diff} {diff === 1 ? 'dia' : 'dias'}
      </span>
    );
    if (diff <= 7) return (
      <span className="bg-amber-100 text-amber-700 rounded-md px-2 py-0.5 text-xs font-medium">
        {diff} dias
      </span>
    );
    return <span className="text-sm text-muted-foreground">{formatDateBR(prazo)}</span>;
  };

  /* ─── audience cell ─── */
  const renderAudiencia = (aud: string) => {
    if (!aud) return <span className="text-muted-foreground/60">—</span>;
    const diff = daysDiff(aud);
    const isUrgent = diff >= 0 && diff <= 3;
    return (
      <div className={`flex items-center gap-1 ${isUrgent ? '' : ''}`}>
        {isUrgent && <AlertCircle className="w-3 h-3 text-amber-500" />}
        <div>
          <div className="text-sm text-foreground">{formatDateBR(aud)}</div>
          <div className="text-xs text-muted-foreground">{formatTimeBR(aud)}</div>
        </div>
      </div>
    );
  };

  const selectClass = 'bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Processos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">WebHubPro ERP / Processos</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Processo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[12rem] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número CNJ ou cliente..."
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className={selectClass}>
          <option value="">Todas Áreas</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="civil">Civil</option>
          <option value="criminal">Criminal</option>
          <option value="previdenciario">Previdenciário</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
          <option value="">Todos Status</option>
          <option value="ativo">Ativo</option>
          <option value="audiencia">Audiência</option>
          <option value="pendente">Pendente</option>
          <option value="encerrado">Encerrado</option>
          <option value="recurso">Recurso</option>
          <option value="acordo">Acordo</option>
        </select>
        <select value={filterTribunal} onChange={(e) => setFilterTribunal(e.target.value)} className={selectClass}>
          <option value="">Todos Tribunais</option>
          <option value="TJSP">TJSP</option>
          <option value="TRT-2">TRT-2</option>
          <option value="TRF-3">TRF-3</option>
          <option value="JEF/INSS">JEF/INSS</option>
          <option value="JTSP">JTSP</option>
          <option value="STJ">STJ</option>
        </select>
        <select value={filterPrazo} onChange={(e) => setFilterPrazo(e.target.value)} className={selectClass}>
          <option value="">Todos Prazos</option>
          <option value="hoje">Vence hoje</option>
          <option value="3dias">Próximos 3 dias</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="bg-muted text-foreground text-xs font-semibold px-2 py-0.5 rounded-md">{statsTotal}</span>
          <span className="text-xs text-muted-foreground">processos</span>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md">{statsAudiencias}</span>
          <span className="text-xs text-muted-foreground">com audiência</span>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-md">{statsPrazos}</span>
          <span className="text-xs text-muted-foreground">prazos esta semana</span>
        </div>
        {admin && (
          <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{formatBRL(statsValor)}</span>
          </div>
        )}
      </div>

      {/* Table or Empty */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum processo encontrado"
          subtitle="Tente ajustar os filtros ou cadastre um novo processo"
          ctaLabel="+ Novo Processo"
          onCta={() => setModalOpen(true)}
        />
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none min-w-[13rem]" onClick={() => toggleSort('numero_cnj')}>
                    Processo <SortIcon field="numero_cnj" />
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('polo_ativo_nome')}>
                    Cliente <SortIcon field="polo_ativo_nome" />
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('practice_area')}>
                    Área <SortIcon field="practice_area" />
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('tribunal')}>
                    Tribunal <SortIcon field="tribunal" />
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    Status <SortIcon field="status" />
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('proxima_audiencia')}>
                    Próx. Audiência <SortIcon field="proxima_audiencia" />
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('prazo_fatal')}>
                    Prazo Fatal <SortIcon field="prazo_fatal" />
                  </th>
                  {admin && (
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('responsible_id')}>
                      Responsável <SortIcon field="responsible_id" />
                    </th>
                  )}
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((proc) => {
                  const resp = getUserById(proc.responsible_id);
                  return (
                    <tr key={proc.id} className="hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                      <td className="px-4 py-3.5 min-w-[13rem]">
                        <div className="font-mono text-xs font-semibold text-foreground tracking-tight">{proc.numero_cnj || '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{proc.acao}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${resp?.avatar_color || 'bg-muted'} text-white`}>
                            {proc.polo_ativo_nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-foreground truncate">{proc.polo_ativo_nome}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[9rem]">{proc.polo_passivo_nome}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`${areaColors[proc.practice_area]} text-xs font-medium px-2 py-0.5 rounded-full`}>
                          {areaLabels[proc.practice_area]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-md">{proc.tribunal}</span>
                        <div className="text-xs text-muted-foreground truncate max-w-[9rem] mt-0.5">{proc.vara}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`${statusColors[proc.status]} text-xs font-medium px-2 py-0.5 rounded-full`}>
                          {statusLabels[proc.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{renderAudiencia(proc.proxima_audiencia)}</td>
                      <td className="px-4 py-3.5">{renderPrazo(proc.prazo_fatal)}</td>
                      {admin && (
                        <td className="px-4 py-3.5">
                          {resp && (
                            <div className="flex items-center gap-2">
                              <UserAvatar name={resp.name} color={resp.avatar_color} size="sm" />
                              <span className="text-sm text-muted-foreground truncate">{resp.name}</span>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === proc.id ? null : proc.id)}
                            className="text-muted-foreground hover:text-foreground p-1 rounded"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openDropdown === proc.id && (
                            <DropdownMenu
                              onClose={() => setOpenDropdown(null)}
                              onView={() => { setOpenDropdown(null); onNavigateDetail(proc.id); }}
                              onEdit={() => { setOpenDropdown(null); }}
                              onAudiencia={() => { setOpenDropdown(null); }}
                              onEnclose={() => { setOpenDropdown(null); handleEnclose(proc.id); }}
                              onDelete={() => { setOpenDropdown(null); setDeleteConfirm(proc.id); }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Mostrando {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} processos
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="bg-card border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="bg-card border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 relative z-10">
            <h3 className="text-lg font-semibold text-foreground mb-2">Excluir processo?</h3>
            <p className="text-sm text-muted-foreground mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="text-sm text-muted-foreground px-4 py-2 hover:text-foreground">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* New Processo Modal */}
      {modalOpen && (
        <NovoProcessoModal
          onClose={() => setModalOpen(false)}
          onSave={handleSaveNew}
          admin={admin}
          currentUserId={currentUser!.id}
        />
      )}
    </div>
  );
}

/* ─── Dropdown Menu ─── */
function DropdownMenu({ onClose, onView, onEdit, onAudiencia, onEnclose, onDelete }: {
  onClose: () => void; onView: () => void; onEdit: () => void;
  onAudiencia: () => void; onEnclose: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const item = 'flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 cursor-pointer w-full';
  return (
    <div ref={ref} className="absolute right-0 top-8 bg-card border border-border shadow-lg rounded-lg py-1 z-10 w-44">
      <button className={item} onClick={onView}><Eye className="w-4 h-4" /> Ver Detalhes</button>
      <button className={item} onClick={onEdit}><Edit className="w-4 h-4" /> Editar</button>
      <button className={item} onClick={onAudiencia}><Scale className="w-4 h-4" /> Nova Audiência</button>
      <div className="my-1 border-t border-border/50" />
      <button className={item} onClick={onEnclose}><CheckCircle className="w-4 h-4" /> Encerrar</button>
      <div className="my-1 border-t border-border/50" />
      <button className={`${item} !text-red-600 hover:!bg-red-50`} onClick={onDelete}><Trash className="w-4 h-4" /> Excluir</button>
    </div>
  );
}

/* ─── Novo Processo Modal ─── */
function NovoProcessoModal({ onClose, onSave, admin, currentUserId }: {
  onClose: () => void; onSave: (p: Processo) => void; admin: boolean; currentUserId: string;
}) {
  const [form, setForm] = useState<Record<string, any>>({
    practice_area: '',
    acao: '',
    numero_cnj: '',
    tribunal: '',
    vara: '',
    comarca: '',
    valor_causa_str: '',
    polo_passivo_nome: '',
    fase: 'peticao_inicial',
    status: 'ativo',
    proxima_audiencia: '',
    prazo_fatal: '',
    responsible_id: admin ? '' : currentUserId,
    notes: '',
    polo_ativo_id: '',
    polo_ativo_nome: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [acaoFocus, setAcaoFocus] = useState(false);

  // load clients
  const clients = useMemo(() => {
    const stored = localStorage.getItem('whp_clientes');
    if (!stored) return [];
    const all = JSON.parse(stored);
    return admin ? all : all.filter((c: any) => c.responsible_id === currentUserId);
  }, [admin, currentUserId]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const s = clientSearch.toLowerCase();
    return clients.filter((c: any) => {
      const name = c.nome || c.razao_social || '';
      return name.toLowerCase().includes(s);
    });
  }, [clients, clientSearch]);

  const selectedClient = form.polo_ativo_id ? clients.find((c: any) => c.id === form.polo_ativo_id) : null;

  const set = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleAreaChange = (area: string) => {
    set('practice_area', area);
    set('tribunal', areaTribunalDefault[area] || '');
  };

  const acaoSugs = useMemo(() => {
    const area = form.practice_area;
    if (!area || !acaoSuggestions[area]) return [];
    const s = (form.acao || '').toLowerCase();
    return acaoSuggestions[area].filter((a) => !s || a.toLowerCase().includes(s));
  }, [form.practice_area, form.acao]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.polo_ativo_id) errs.polo_ativo_id = 'Selecione um cliente';
    if (!form.practice_area) errs.practice_area = 'Selecione a área';
    if (!form.acao) errs.acao = 'Informe o tipo de ação';
    if (!form.tribunal) errs.tribunal = 'Selecione o tribunal';
    if (!form.vara) errs.vara = 'Informe a vara';
    if (!form.comarca) errs.comarca = 'Informe a comarca';
    if (!form.polo_passivo_nome) errs.polo_passivo_nome = 'Informe o polo passivo';
    if (!form.fase) errs.fase = 'Selecione a fase';
    if (!form.status) errs.status = 'Selecione o status';
    if (admin && !form.responsible_id) errs.responsible_id = 'Selecione o responsável';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const proc: Processo = {
      id: 'proc-' + Date.now(),
      numero_cnj: form.numero_cnj,
      practice_area: form.practice_area,
      acao: form.acao,
      polo_ativo_id: form.polo_ativo_id,
      polo_ativo_nome: form.polo_ativo_nome,
      polo_passivo_nome: form.polo_passivo_nome,
      responsible_id: form.responsible_id,
      status: form.status,
      tribunal: form.tribunal,
      vara: form.vara,
      comarca: form.comarca,
      fase: form.fase,
      valor_causa: parseBRL(form.valor_causa_str || '0'),
      proxima_audiencia: form.proxima_audiencia,
      prazo_fatal: form.prazo_fatal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: form.notes,
    };
    onSave(proc);
  };

  const inputClass = (field?: string) =>
    `w-full bg-white border ${field && errors[field] ? 'border-red-300' : 'border-slate-200'} rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  const labelClass = 'text-sm font-medium text-slate-700 mb-1 block';

  const prazoDiff = form.prazo_fatal ? daysDiff(form.prazo_fatal) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Novo Processo</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Cliente */}
            <div className="col-span-2 relative">
              <label className={labelClass}>Cliente <span className="text-red-500">*</span></label>
              {selectedClient ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                    {(selectedClient.nome || selectedClient.razao_social || '')[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-900">{selectedClient.nome || selectedClient.razao_social}</span>
                  <span className={`${areaColors[selectedClient.practice_area]} text-xs px-1.5 py-0.5 rounded-full`}>
                    {areaLabels[selectedClient.practice_area]}
                  </span>
                  <button onClick={() => { set('polo_ativo_id', ''); set('polo_ativo_nome', ''); }} className="ml-auto text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); setClientDropdownOpen(true); }}
                    onFocus={() => setClientDropdownOpen(true)}
                    placeholder="Buscar cliente por nome..."
                    className={`${inputClass('polo_ativo_id')} pl-9`}
                  />
                  {clientDropdownOpen && filteredClients.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md max-h-48 overflow-y-auto z-10">
                      {filteredClients.map((c: any) => (
                        <button
                          key={c.id}
                          className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 text-left"
                          onClick={() => {
                            set('polo_ativo_id', c.id);
                            set('polo_ativo_nome', c.nome || c.razao_social);
                            setClientSearch('');
                            setClientDropdownOpen(false);
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-medium">
                            {(c.nome || c.razao_social || '')[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-900">{c.nome || c.razao_social}</span>
                          <span className={`${areaColors[c.practice_area]} text-xs px-1.5 py-0.5 rounded-full ml-auto`}>
                            {areaLabels[c.practice_area]}
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">{c.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.polo_ativo_id && <p className="text-xs text-red-500 mt-1">{errors.polo_ativo_id}</p>}
            </div>

            {/* Area */}
            <div className="col-span-2">
              <label className={labelClass}>Área do Direito <span className="text-red-500">*</span></label>
              <div className="flex gap-2 flex-wrap">
                {(['trabalhista', 'civil', 'criminal', 'previdenciario'] as const).map((area) => {
                  const selected = form.practice_area === area;
                  const colors: Record<string, string> = {
                    trabalhista: 'bg-blue-600 border-blue-600 text-white',
                    civil: 'bg-purple-600 border-purple-600 text-white',
                    criminal: 'bg-red-600 border-red-600 text-white',
                    previdenciario: 'bg-green-600 border-green-600 text-white',
                  };
                  return (
                    <button
                      key={area}
                      onClick={() => handleAreaChange(area)}
                      className={`border rounded-md px-4 py-2 text-sm transition-colors ${
                        selected ? colors[area] : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {areaLabels[area]}
                    </button>
                  );
                })}
              </div>
              {errors.practice_area && <p className="text-xs text-red-500 mt-1">{errors.practice_area}</p>}
            </div>

            {/* Acao */}
            <div className="col-span-2 relative">
              <label className={labelClass}>Tipo de Ação <span className="text-red-500">*</span></label>
              <input
                value={form.acao}
                onChange={(e) => set('acao', e.target.value)}
                onFocus={() => setAcaoFocus(true)}
                onBlur={() => setTimeout(() => setAcaoFocus(false), 200)}
                placeholder="Tipo de ação..."
                className={inputClass('acao')}
              />
              {acaoFocus && acaoSugs.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-y-auto z-10">
                  {acaoSugs.map((s) => (
                    <button key={s} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onMouseDown={() => set('acao', s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {errors.acao && <p className="text-xs text-red-500 mt-1">{errors.acao}</p>}
            </div>

            {/* CNJ */}
            <div className="col-span-2">
              <label className={labelClass}>Número CNJ</label>
              <input
                value={form.numero_cnj}
                onChange={(e) => set('numero_cnj', maskCNJ(e.target.value))}
                placeholder="0000000-00.0000.0.00.0000"
                className={`${inputClass()} font-mono`}
              />
              <p className="text-xs text-slate-400 mt-1">Deixe em branco se ainda não distribuído</p>
            </div>

            {/* Tribunal & Vara */}
            <div>
              <label className={labelClass}>Tribunal <span className="text-red-500">*</span></label>
              <select value={form.tribunal} onChange={(e) => set('tribunal', e.target.value)} className={inputClass('tribunal')}>
                <option value="">Selecione</option>
                {(['TJSP', 'TRT-2', 'TRF-3', 'JEF/INSS', 'JTSP', 'STJ', 'STF'] as TribunalType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.tribunal && <p className="text-xs text-red-500 mt-1">{errors.tribunal}</p>}
            </div>
            <div>
              <label className={labelClass}>Vara <span className="text-red-500">*</span></label>
              <input value={form.vara} onChange={(e) => set('vara', e.target.value)} placeholder="Ex: 3ª Vara do Trabalho de SP" className={inputClass('vara')} />
              {errors.vara && <p className="text-xs text-red-500 mt-1">{errors.vara}</p>}
            </div>

            {/* Comarca & Valor */}
            <div>
              <label className={labelClass}>Comarca <span className="text-red-500">*</span></label>
              <input value={form.comarca} onChange={(e) => set('comarca', e.target.value)} placeholder="Ex: São Paulo" className={inputClass('comarca')} />
              {errors.comarca && <p className="text-xs text-red-500 mt-1">{errors.comarca}</p>}
            </div>
            <div>
              <label className={labelClass}>Valor da Causa</label>
              <input
                value={form.valor_causa_str}
                onChange={(e) => set('valor_causa_str', e.target.value)}
                onBlur={() => {
                  const v = parseBRL(form.valor_causa_str || '0');
                  if (v > 0) set('valor_causa_str', formatBRL(v));
                }}
                placeholder="R$ 0,00"
                className={inputClass()}
              />
              <p className="text-xs text-slate-400 mt-1">Informe 0 para ações sem valor de causa (criminal/previdenciário)</p>
            </div>

            {/* Polo Passivo */}
            <div className="col-span-2">
              <label className={labelClass}>Polo Passivo <span className="text-red-500">*</span></label>
              <input value={form.polo_passivo_nome} onChange={(e) => set('polo_passivo_nome', e.target.value)} placeholder="Nome da parte contrária..." className={inputClass('polo_passivo_nome')} />
              <p className="text-xs text-slate-400 mt-1">Empresa, pessoa ou órgão contra quem a ação é movida</p>
              {errors.polo_passivo_nome && <p className="text-xs text-red-500 mt-1">{errors.polo_passivo_nome}</p>}
            </div>

            {/* Fase & Status */}
            <div>
              <label className={labelClass}>Fase Atual <span className="text-red-500">*</span></label>
              <select value={form.fase} onChange={(e) => set('fase', e.target.value)} className={inputClass('fase')}>
                {(Object.entries(faseLabels) as [FaseType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {errors.fase && <p className="text-xs text-red-500 mt-1">{errors.fase}</p>}
            </div>
            <div>
              <label className={labelClass}>Status <span className="text-red-500">*</span></label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass('status')}>
                {(Object.entries(statusLabels) as [ProcessoStatus, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
            </div>

            {/* Audiencia & Prazo */}
            <div>
              <label className={labelClass}>Próxima Audiência</label>
              <input type="datetime-local" value={form.proxima_audiencia} onChange={(e) => set('proxima_audiencia', e.target.value)} className={inputClass()} />
              <p className="text-xs text-slate-400 mt-1">Opcional</p>
            </div>
            <div>
              <label className={labelClass}>Prazo Fatal</label>
              <input type="date" value={form.prazo_fatal} onChange={(e) => set('prazo_fatal', e.target.value)} className={inputClass()} />
              {prazoDiff !== null && prazoDiff <= 7 && prazoDiff > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-amber-600">Prazo próximo — verifique os prazos processuais</span>
                </div>
              )}
              {prazoDiff !== null && prazoDiff <= 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">Prazo já vencido</span>
                </div>
              )}
            </div>

            {/* Responsavel */}
            <div className="col-span-2">
              <label className={labelClass}>Responsável <span className="text-red-500">*</span></label>
              {admin ? (
                <select value={form.responsible_id} onChange={(e) => set('responsible_id', e.target.value)} className={inputClass('responsible_id')}>
                  <option value="">Selecione</option>
                  {MOCK_USERS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                  ))}
                </select>
              ) : (
                <div className="bg-slate-50 cursor-not-allowed border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-500">
                  {MOCK_USERS.find((u) => u.id === currentUserId)?.name}
                </div>
              )}
              {errors.responsible_id && <p className="text-xs text-red-500 mt-1">{errors.responsible_id}</p>}
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className={labelClass}>Observações</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anotações internas sobre este processo..." className={inputClass()} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white rounded-b-xl">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Campos marcados com * são obrigatórios</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-slate-600 px-4 py-2 hover:text-slate-900">Cancelar</button>
            <button onClick={handleSave} className="bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">Salvar Processo</button>
          </div>
        </div>
      </div>
    </div>
  );
}
