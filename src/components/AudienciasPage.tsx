import React, { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  Search,
  MoreHorizontal,
  Clock,
  MapPin,
  User,
  Briefcase,
  Calendar,
  CalendarDays,
  LayoutList,
  CheckCircle,
  Flame,
  ChevronDown,
  X,
  Video,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import { getEventos, saveEventos } from '@/data/mockEventos';
import { getProcessos } from '@/data/mockProcessos';
import { loadAtividades, saveAtividades } from '@/data/mockAtividades';
import {
  Evento,
  EventoTipo,
  AudienciaTipo,
  AudienciaStatus,
  tipoLabels,
  tipoBgColors,
  tipoBorderColors,
  tipoSelectedColors,
  audienciaTipoLabels,
  audienciaTipoColors,
  audienciaStatusLabels,
  audienciaStatusColors,
} from '@/types/evento';
import { areaColors, areaLabels } from '@/types/processo';
import EmptyState from './EmptyState';

/* ─── helpers ─── */
function filterByUser<T extends { responsible_id: string }>(items: T[], userId: string, isAdmin: boolean): T[] {
  return isAdmin ? items : items.filter((i) => i.responsible_id === userId);
}

function formatISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface UnifiedAudiencia {
  id: string;
  title: string;
  responsible_id: string;
  processo_id: string;
  numero_cnj: string;
  acao: string;
  practice_area: string;
  cliente_nome: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  notes: string;
  audiencia_tipo: AudienciaTipo;
  audiencia_status: AudienciaStatus;
}

interface AudienciasPageProps {
  onNavigateProcessoDetail?: (id: string) => void;
}

export default function AudienciasPage({ onNavigateProcessoDetail }: AudienciasPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const [allEventos, setAllEventos] = useState<Evento[]>(() => getEventos());
  const [activeTab, setActiveTab] = useState<'todas' | 'hoje' | 'semana' | 'mes' | 'realizadas'>('todas');
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterAudTipo, setFilterAudTipo] = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [resultModal, setResultModal] = useState<UnifiedAudiencia | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const allProcessos = useMemo(() => getProcessos(), []);

  /* ─── Build unified audiência list ─── */
  const audiencias = useMemo(() => {
    const userEventos = filterByUser(allEventos, currentUser!.id, admin);
    const userProcessos = filterByUser(allProcessos, currentUser!.id, admin);

    const map = new Map<string, UnifiedAudiencia>();

    // From eventos with tipo=audiencia
    for (const e of userEventos) {
      if (e.tipo !== 'audiencia') continue;
      const proc = allProcessos.find((p) => p.id === e.processo_id);
      const key = `${e.processo_id}-${e.data}`;
      map.set(e.id, {
        id: e.id,
        title: e.title,
        responsible_id: e.responsible_id,
        processo_id: e.processo_id,
        numero_cnj: proc?.numero_cnj || '',
        acao: proc?.acao || e.title,
        practice_area: proc?.practice_area || '',
        cliente_nome: e.cliente_nome,
        data: e.data,
        hora_inicio: e.hora_inicio,
        hora_fim: e.hora_fim,
        local: e.local,
        notes: e.notes,
        audiencia_tipo: e.audiencia_tipo || 'instrucao',
        audiencia_status: e.audiencia_status || 'agendada',
      });
    }

    // From processos with proxima_audiencia
    for (const p of userProcessos) {
      if (!p.proxima_audiencia) continue;
      const dateStr = p.proxima_audiencia.slice(0, 10);
      const timeStr = p.proxima_audiencia.length > 10 ? p.proxima_audiencia.slice(11, 16) : '00:00';
      // Check for duplicate
      const isDup = Array.from(map.values()).some((a) => a.processo_id === p.id && a.data === dateStr);
      if (isDup) continue;
      map.set(`proc-aud-${p.id}`, {
        id: `proc-aud-${p.id}`,
        title: `Audiência — ${p.polo_ativo_nome}`,
        responsible_id: p.responsible_id,
        processo_id: p.id,
        numero_cnj: p.numero_cnj,
        acao: p.acao,
        practice_area: p.practice_area,
        cliente_nome: p.polo_ativo_nome,
        data: dateStr,
        hora_inicio: timeStr,
        hora_fim: '',
        local: p.vara,
        notes: '',
        audiencia_tipo: 'instrucao',
        audiencia_status: 'agendada',
      });
    }

    return Array.from(map.values());
  }, [allEventos, allProcessos, currentUser, admin]);

  const today = new Date();
  const todayStr = formatISO(today);

  // Week boundaries (Mon-Sun)
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = formatISO(monday);
  const sundayStr = formatISO(sunday);

  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}`;

  /* ─── Filtered list ─── */
  const filtered = useMemo(() => {
    let items = [...audiencias];

    // Tab filter
    if (activeTab === 'hoje') items = items.filter((a) => a.data === todayStr);
    else if (activeTab === 'semana') items = items.filter((a) => a.data >= mondayStr && a.data <= sundayStr);
    else if (activeTab === 'mes') items = items.filter((a) => a.data >= monthStart && a.data <= monthEnd);
    else if (activeTab === 'realizadas') items = items.filter((a) => a.audiencia_status === 'realizada');

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((a) => a.numero_cnj.includes(q) || a.cliente_nome.toLowerCase().includes(q) || a.acao.toLowerCase().includes(q));
    }
    if (filterArea) items = items.filter((a) => a.practice_area === filterArea);
    if (filterAudTipo) items = items.filter((a) => a.audiencia_tipo === filterAudTipo);
    if (filterResponsible) items = items.filter((a) => a.responsible_id === filterResponsible);

    items.sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio));
    return items;
  }, [audiencias, activeTab, search, filterArea, filterAudTipo, filterResponsible, todayStr, mondayStr, sundayStr, monthStart, monthEnd]);

  /* ─── Stats ─── */
  const totalCount = audiencias.length;
  const todayCount = audiencias.filter((a) => a.data === todayStr).length;
  const weekCount = audiencias.filter((a) => a.data >= mondayStr && a.data <= sundayStr).length;
  const realizadasCount = audiencias.filter((a) => a.audiencia_status === 'realizada').length;
  const prazosUrgentCount = useMemo(() => {
    const evts = filterByUser(getEventos(), currentUser!.id, admin);
    const in7 = formatISO(new Date(today.getTime() + 7 * 86400000));
    return evts.filter((e) => e.tipo === 'prazo' && e.data >= todayStr && e.data <= in7).length;
  }, [allEventos, currentUser, admin]);

  /* ─── Group by date ─── */
  const grouped = useMemo(() => {
    const groups: { label: string; items: UnifiedAudiencia[] }[] = [];
    let currentLabel = '';
    for (const a of filtered) {
      const d = new Date(a.data + 'T00:00:00');
      let label: string;
      const tomorrowStr = formatISO(new Date(today.getTime() + 86400000));
      if (a.data === todayStr) {
        label = `HOJE — ${d.getDate()} DE ${MONTH_NAMES[d.getMonth()].toUpperCase()} DE ${d.getFullYear()}`;
      } else if (a.data === tomorrowStr) {
        label = `AMANHÃ — ${d.getDate()} DE ${MONTH_NAMES[d.getMonth()].toUpperCase()} DE ${d.getFullYear()}`;
      } else if (a.data >= mondayStr && a.data <= sundayStr) {
        label = `ESTA SEMANA — ${DAY_FULL[d.getDay()].toUpperCase()}, ${d.getDate()} DE ${MONTH_NAMES[d.getMonth()].toUpperCase()}`;
      } else {
        label = `${d.getDate()} DE ${MONTH_NAMES[d.getMonth()].toUpperCase()} DE ${d.getFullYear()}`;
      }
      if (label !== currentLabel) {
        groups.push({ label, items: [] });
        currentLabel = label;
      }
      groups[groups.length - 1].items.push(a);
    }
    return groups;
  }, [filtered, todayStr, mondayStr, sundayStr]);

  function reload() {
    setAllEventos(getEventos());
  }

  function handleRegistrarResultado(aud: UnifiedAudiencia) {
    setResultModal(aud);
    setOpenDropdown(null);
  }

  const tabs = [
    { key: 'todas' as const, label: 'Todas' },
    { key: 'hoje' as const, label: 'Hoje' },
    { key: 'semana' as const, label: 'Esta Semana' },
    { key: 'mes' as const, label: 'Este Mês' },
    { key: 'realizadas' as const, label: 'Realizadas' },
  ];

  const emptySubtitle: Record<string, string> = {
    hoje: 'Não há audiências agendadas para hoje',
    semana: 'Não há audiências nesta semana',
    realizadas: 'Nenhuma audiência realizada ainda',
    todas: 'Tente ajustar os filtros',
    mes: 'Tente ajustar os filtros',
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audiências</h1>
          <p className="text-xs text-muted-foreground">WebHubPro ERP / Audiências</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 transition-colors">
          <Scale className="w-4 h-4 mr-1.5" />
          Nova Audiência
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 mb-5 bg-card border border-border rounded-lg p-1.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm cursor-pointer transition-colors ${
              activeTab === t.key ? 'bg-blue-600 text-white font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SECONDARY FILTER ROW */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por processo ou cliente..."
            className="w-full bg-card text-foreground border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todas Áreas</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="civil">Civil</option>
          <option value="criminal">Criminal</option>
          <option value="previdenciario">Previdenciário</option>
        </select>
        <select value={filterAudTipo} onChange={(e) => setFilterAudTipo(e.target.value)} className="bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos Tipos</option>
          <option value="conciliacao">Conciliação</option>
          <option value="instrucao">Instrução</option>
          <option value="julgamento">Julgamento</option>
          <option value="una">Una</option>
          <option value="virtual">Virtual</option>
        </select>
        {admin && (
          <select value={filterResponsible} onChange={(e) => setFilterResponsible(e.target.value)} className="bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos Responsáveis</option>
            {MOCK_USERS.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><LayoutList className="w-4 h-4 text-muted-foreground" /></div>
          <div><span className="text-xl font-bold text-foreground">{totalCount}</span><p className="text-xs text-muted-foreground">audiências</p></div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-600" /></div>
          <div><span className="text-xl font-bold text-foreground">{todayCount}</span><p className="text-xs text-muted-foreground">agendadas</p></div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center"><CalendarDays className="w-4 h-4 text-purple-600" /></div>
          <div><span className="text-xl font-bold text-foreground">{weekCount}</span><p className="text-xs text-muted-foreground">nesta semana</p></div>
        </div>
        {admin ? (
          <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><Flame className="w-4 h-4 text-red-500" /></div>
            <div><span className="text-xl font-bold text-red-600">{prazosUrgentCount}</span><p className="text-xs text-red-400">prazos urgentes</p></div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>
            <div><span className="text-xl font-bold text-foreground">{realizadasCount}</span><p className="text-xs text-muted-foreground">realizadas</p></div>
          </div>
        )}
      </div>

      {/* AUDIÊNCIAS LIST */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Nenhuma audiência encontrada"
          subtitle={emptySubtitle[activeTab]}
          ctaLabel="+ Nova Audiência"
          onCta={() => setShowNewModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {grouped.map((group, gi) => (
            <div key={gi}>
              {/* Date header */}
              <div className={`flex items-center gap-3 py-2 mb-2 ${gi > 0 ? 'mt-4' : ''}`}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{group.label}</span>
                <div className="flex-1 border-t border-border ml-2" />
              </div>
              {group.items.map((aud) => {
                const lawyer = MOCK_USERS.find((u) => u.id === aud.responsible_id);
                const d = new Date(aud.data + 'T00:00:00');
                const diff = Math.ceil((d.getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000);
                const isT = aud.data === todayStr;
                const isUrgent = diff >= 0 && diff <= 3 && !isT;

                return (
                  <div key={aud.id} className="bg-card border border-border rounded-lg p-4 hover:border-border hover:shadow-sm transition-all duration-150 mb-3">
                    <div className="flex items-start gap-4">
                      {/* DATE BLOCK */}
                      <div className={`flex-shrink-0 rounded-lg p-3 text-center w-16 ${isT ? 'bg-blue-600' : isUrgent ? 'bg-amber-50' : 'bg-muted'}`}>
                        <div className={`text-3xl font-bold leading-none ${isT ? 'text-white' : isUrgent ? 'text-amber-600' : 'text-foreground'}`}>
                          {d.getDate()}
                        </div>
                        <div className={`text-xs uppercase mt-1 ${isT ? 'text-blue-200' : 'text-muted-foreground'}`}>
                          {MONTH_NAMES[d.getMonth()].slice(0, 3)}
                        </div>
                        <div className={`text-xs ${isT ? 'text-blue-200' : 'text-muted-foreground'}`}>{d.getFullYear()}</div>
                      </div>

                      {/* CENTER BLOCK */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {aud.numero_cnj && <span className="font-mono text-xs text-muted-foreground">{aud.numero_cnj}</span>}
                          {aud.numero_cnj && <span className="text-muted-foreground">·</span>}
                          {aud.practice_area && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${areaColors[aud.practice_area] || 'bg-muted text-muted-foreground'}`}>
                              {areaLabels[aud.practice_area] || aud.practice_area}
                            </span>
                          )}
                        </div>
                        <div className="text-base font-semibold text-foreground mt-0.5">{aud.acao}</div>
                        {aud.cliente_nome && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{aud.cliente_nome}</span>
                          </div>
                        )}
                        {aud.local && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{aud.local}</span>
                          </div>
                        )}
                        <div className="border-t border-border mt-3 pt-3 flex items-center gap-2 flex-wrap">
                          {lawyer && (
                            <>
                              <div className={`w-6 h-6 rounded-full ${lawyer.avatar_color} flex items-center justify-center text-white text-[9px] font-bold`}>
                                {lawyer.avatar_initials}
                              </div>
                              <span className="text-xs text-muted-foreground">{lawyer.name}</span>
                              <span className="text-muted-foreground">·</span>
                            </>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${audienciaTipoColors[aud.audiencia_tipo]}`}>
                            {audienciaTipoLabels[aud.audiencia_tipo]}
                          </span>
                          {aud.audiencia_tipo === 'virtual' && <Video className="w-3.5 h-3.5 text-indigo-500 ml-1" />}
                        </div>
                      </div>

                      {/* RIGHT BLOCK */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">{aud.hora_inicio}</span>
                          {aud.hora_fim && aud.hora_fim !== aud.hora_inicio && <span className="text-sm text-muted-foreground">–{aud.hora_fim}</span>}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${audienciaStatusColors[aud.audiencia_status]}`}>
                          {audienciaStatusLabels[aud.audiencia_status]}
                        </span>
                        {/* Dropdown */}
                        <div className="relative">
                          <button onClick={() => setOpenDropdown(openDropdown === aud.id ? null : aud.id)} className="text-muted-foreground hover:text-muted-foreground p-1">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openDropdown === aud.id && (
                            <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 z-20 w-48">
                              {aud.processo_id && onNavigateProcessoDetail && (
                                <button onClick={() => { setOpenDropdown(null); onNavigateProcessoDetail(aud.processo_id); }} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                                  <Briefcase className="w-4 h-4" /> Ver Processo
                                </button>
                              )}
                              {aud.audiencia_status === 'agendada' && (
                                <button onClick={() => handleRegistrarResultado(aud)} className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-muted flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> Registrar Resultado
                                </button>
                              )}
                              <div className="border-t border-border my-1" />
                              <button onClick={() => setOpenDropdown(null)} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                                <Scale className="w-4 h-4" /> Editar
                              </button>
                              <button onClick={() => setOpenDropdown(null)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <X className="w-4 h-4" /> Cancelar Audiência
                              </button>
                            </div>
                          )}
                        </div>
                        {aud.audiencia_status === 'agendada' && diff >= 0 && (
                          <button onClick={() => handleRegistrarResultado(aud)} className="border border-border text-muted-foreground hover:bg-muted rounded-md px-3 py-1 text-xs flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Registrar Resultado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ─── NOVA AUDIÊNCIA MODAL ─── */}
      {showNewModal && (
        <NovaAudienciaModal
          onClose={() => setShowNewModal(false)}
          onSave={() => { reload(); setShowNewModal(false); showToast('Audiência agendada com sucesso', 'success'); }}
          processos={filterByUser(allProcessos, currentUser!.id, admin)}
          currentUser={currentUser!}
          isAdmin={admin}
        />
      )}

      {/* ─── REGISTRAR RESULTADO MODAL ─── */}
      {resultModal && (
        <RegistrarResultadoModal
          audiencia={resultModal}
          onClose={() => setResultModal(null)}
          onSave={() => { reload(); setResultModal(null); showToast('Resultado registrado com sucesso', 'success'); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   NOVA AUDIÊNCIA MODAL
   ═══════════════════════════════════════ */
interface NovaAudienciaModalProps {
  onClose: () => void;
  onSave: () => void;
  processos: any[];
  currentUser: any;
  isAdmin: boolean;
}

function NovaAudienciaModal({ onClose, onSave, processos, currentUser, isAdmin }: NovaAudienciaModalProps) {
  const [title, setTitle] = useState('');
  const [audienciaTipo, setAudTipo] = useState<AudienciaTipo>('instrucao');
  const [audStatus, setAudStatus] = useState<AudienciaStatus>('agendada');
  const [processoId, setProcessoId] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [local, setLocal] = useState('');
  const [responsibleId, setResponsibleId] = useState(currentUser.id);
  const [notes, setNotes] = useState('');
  const [processoSearch, setProcessoSearch] = useState('');
  const [showPList, setShowPList] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const filteredP = useMemo(() => {
    if (!processoSearch) return processos;
    const q = processoSearch.toLowerCase();
    return processos.filter((p) => p.numero_cnj.includes(q) || p.acao.toLowerCase().includes(q));
  }, [processos, processoSearch]);

  function selectProcesso(p: any) {
    setProcessoId(p.id);
    setClienteNome(p.polo_ativo_nome);
    setProcessoSearch(p.numero_cnj);
    setShowPList(false);
    if (!local) setLocal(p.vara);
  }

  function handleSave() {
    const errs: Record<string, boolean> = {};
    if (!title.trim()) errs.title = true;
    if (!data) errs.data = true;
    if (!horaInicio) errs.horaInicio = true;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const allEvt = getEventos();
    allEvt.push({
      id: 'evt-' + Date.now(),
      title,
      tipo: 'audiencia',
      processo_id: processoId,
      cliente_nome: clienteNome,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      local,
      responsible_id: responsibleId,
      notes,
      created_at: new Date().toISOString().slice(0, 10),
      audiencia_tipo: audienciaTipo,
      audiencia_status: audStatus,
    });
    saveEventos(allEvt);
    onSave();
  }

  const fc = (name: string) => `w-full bg-card text-foreground border ${errors[name] ? 'border-red-400' : 'border-border'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`;

  const audTipoOptions: AudienciaTipo[] = ['conciliacao', 'instrucao', 'julgamento', 'una', 'virtual'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            <Scale className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-lg font-semibold text-foreground">Nova Audiência</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Título*</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Audiência de Instrução — Cliente" className={fc('title')} />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de Audiência*</label>
              <div className="flex gap-2 flex-wrap">
                {audTipoOptions.map((t) => (
                  <button key={t} type="button" onClick={() => setAudTipo(t)}
                    className={`rounded-md px-3 py-2 text-sm border transition-colors ${audienciaTipo === t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-card border-border text-muted-foreground'}`}>
                    {audienciaTipoLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Processo</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={processoSearch} onChange={(e) => { setProcessoSearch(e.target.value); setShowPList(true); }} onFocus={() => setShowPList(true)} placeholder="Vincular a um processo (opcional)..." className="w-full bg-card text-foreground border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {showPList && filteredP.length > 0 && (
                <div className="absolute z-10 w-full bg-card border border-border rounded-lg shadow-md max-h-48 overflow-y-auto mt-1">
                  {filteredP.map((p) => (
                    <div key={p.id} onClick={() => selectProcesso(p)} className="hover:bg-muted px-3 py-2 cursor-pointer">
                      <span className="font-mono text-xs text-muted-foreground">{p.numero_cnj}</span>
                      <span className="text-sm text-foreground ml-2">{p.acao}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Data*</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={fc('data')} />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status*</label>
              <select value={audStatus} onChange={(e) => setAudStatus(e.target.value as AudienciaStatus)} className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {(['agendada', 'realizada', 'adiada', 'cancelada'] as AudienciaStatus[]).map((s) => (
                  <option key={s} value={s}>{audienciaStatusLabels[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hora Início*</label>
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={fc('horaInicio')} />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hora Fim</label>
              <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Vara/Tribunal</label>
              <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Vara, fórum, endereço..." className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Responsável*</label>
              {isAdmin ? (
                <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {MOCK_USERS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <div className="bg-muted cursor-not-allowed border border-border rounded-md px-3 py-2 text-sm text-muted-foreground">{currentUser.name}</div>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Detalhes adicionais..." className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md">Cancelar</button>
          <button onClick={handleSave} className="bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700">Salvar Audiência</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   REGISTRAR RESULTADO MODAL
   ═══════════════════════════════════════ */
interface RegistrarResultadoModalProps {
  audiencia: UnifiedAudiencia;
  onClose: () => void;
  onSave: () => void;
}

function RegistrarResultadoModal({ audiencia, onClose, onSave }: RegistrarResultadoModalProps) {
  const [resultado, setResultado] = useState('');
  const [dataRealizacao, setDataRealizacao] = useState(audiencia.data);
  const [detalhes, setDetalhes] = useState('');

  const resultados = [
    'Acordo celebrado',
    'Sem acordo — prossegue instrução',
    'Sentença proferida',
    'Audiência adiada',
    'Audiência cancelada',
    'Outra decisão',
  ];

  function handleSave() {
    if (!resultado || !detalhes.trim()) return;

    // Update event status
    const allEvt = getEventos();
    const idx = allEvt.findIndex((e) => e.id === audiencia.id);
    if (idx >= 0) {
      allEvt[idx] = { ...allEvt[idx], audiencia_status: 'realizada' };
      saveEventos(allEvt);
    }

    // Create atividade
    const atividades = loadAtividades();
    const proc = getProcessos().find((p) => p.id === audiencia.processo_id);
    atividades.push({
      id: 'atv-' + Date.now(),
      client_id: proc ? proc.polo_ativo_id : '',
      processo_id: audiencia.processo_id,
      responsible_id: audiencia.responsible_id,
      tipo: 'audiencia_realizada',
      descricao: `${resultado} — ${detalhes.slice(0, 100)}`,
      data: new Date().toISOString(),
      usuario_nome: MOCK_USERS.find((u) => u.id === audiencia.responsible_id)?.name || '',
    });
    saveAtividades(atividades);

    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative bg-card rounded-xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-lg font-semibold text-foreground">Registrar Resultado</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5">
          {/* Context */}
          <div className="bg-muted rounded-lg p-3 mb-4">
            <p className="text-sm font-semibold text-foreground">{audiencia.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDateBR(audiencia.data)} às {audiencia.hora_inicio}</p>
            {audiencia.numero_cnj && <p className="font-mono text-xs text-muted-foreground">{audiencia.numero_cnj}</p>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Resultado da Audiência*</label>
              <select value={resultado} onChange={(e) => setResultado(e.target.value)} className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {resultados.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Data de Realização*</label>
              <input type="date" value={dataRealizacao} onChange={(e) => setDataRealizacao(e.target.value)} className="w-full bg-card text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Detalhes / Observações*</label>
              <textarea value={detalhes} onChange={(e) => setDetalhes(e.target.value)} rows={4} placeholder="Descreva o resultado da audiência, decisões tomadas, próximos passos..." className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
          <button onClick={handleSave} className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700">Registrar</button>
        </div>
      </div>
    </div>
  );
}
