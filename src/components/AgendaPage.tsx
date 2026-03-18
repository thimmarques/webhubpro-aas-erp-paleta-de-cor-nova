import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Briefcase,
  Calendar,
  CalendarX,
  Search,
  X,
  AlertCircle,
  Flame,
  StickyNote,
  Edit,
  Trash,
  Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import { getEventos, saveEventos } from '@/data/mockEventos';
import { getProcessos } from '@/data/mockProcessos';
import {
  Evento,
  EventoTipo,
  tipoLabels,
  tipoBgColors,
  tipoBorderColors,
  tipoSelectedColors,
} from '@/types/evento';
import UserAvatar from './UserAvatar';

/* ─── helpers ─── */
function filterByUser<T extends { responsible_id: string }>(items: T[], userId: string, isAdmin: boolean): T[] {
  return isAdmin ? items : items.filter((i) => i.responsible_id === userId);
}

function formatDateBR(d: string) {
  if (!d) return '';
  const dt = new Date(d + (d.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isSameDay(a: string, b: Date) {
  return a === formatISO(b);
}

function formatISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function diffDays(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface AgendaPageProps {}

export default function AgendaPage(_props: AgendaPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const [allEventos, setAllEventos] = useState<Evento[]>(() => getEventos());
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [typeFilters, setTypeFilters] = useState<Set<EventoTipo>>(new Set());
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Evento | null>(null);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Evento | null>(null);
  const [prefillDate, setPrefillDate] = useState<string>('');

  const allProcessos = useMemo(() => getProcessos(), []);

  const eventos = useMemo(() => {
    let items = filterByUser(allEventos, currentUser!.id, admin);
    if (typeFilters.size > 0) {
      items = items.filter((e) => typeFilters.has(e.tipo));
    }
    return items;
  }, [allEventos, currentUser, admin, typeFilters]);

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  /* ─── calendar grid ─── */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    const days: { date: Date; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(viewYear, viewMonth - 1, daysInPrev - i), current: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(viewYear, viewMonth, i), current: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(viewYear, viewMonth + 1, i), current: false });
    }
    return days;
  }, [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const e of eventos) {
      const key = e.data;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    map.forEach((arr) => arr.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)));
    return map;
  }, [eventos]);

  const selectedDateStr = formatISO(selectedDate);
  const selectedDayEvents = useMemo(() => {
    return (eventsByDate.get(selectedDateStr) || []).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [eventsByDate, selectedDateStr]);

  const upcomingEvents = useMemo(() => {
    const todayStr = formatISO(today);
    return eventos
      .filter((e) => e.data > todayStr)
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio))
      .slice(0, 3);
  }, [eventos]);

  /* ─── type filter toggle ─── */
  function toggleType(tipo: EventoTipo) {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo);
      else next.add(tipo);
      return next;
    });
  }

  function clearFilters() {
    setTypeFilters(new Set());
  }

  function reload() {
    setAllEventos(getEventos());
  }

  function openNewModal(date?: string) {
    setPrefillDate(date || formatISO(selectedDate));
    setEditingEvent(null);
    setShowNewModal(true);
  }

  function openEditModal(evt: Evento) {
    setEditingEvent(evt);
    setPrefillDate(evt.data);
    setShowDetailModal(null);
    setShowNewModal(true);
  }

  function handleDeleteEvent(evt: Evento) {
    const updated = allEventos.filter((e) => e.id !== evt.id);
    saveEventos(updated);
    setAllEventos(updated);
    setShowDeleteConfirm(null);
    setShowDetailModal(null);
    showToast('Evento excluído', 'success');
  }

  /* ─── pill colors for calendar ─── */
  const pillColors: Record<EventoTipo, string> = {
    audiencia: 'bg-purple-100 text-purple-700 border-l-2 border-purple-500',
    reuniao: 'bg-blue-100 text-blue-700 border-l-2 border-blue-500',
    prazo: 'bg-red-100 text-red-700 border-l-2 border-red-500',
    pericia: 'bg-amber-100 text-amber-700 border-l-2 border-amber-500',
    outro: 'bg-slate-100 text-slate-600 border-l-2 border-slate-400',
  };

  const tipoDotColors: Record<EventoTipo, string> = {
    audiencia: 'bg-purple-500',
    reuniao: 'bg-blue-500',
    prazo: 'bg-red-500',
    pericia: 'bg-amber-500',
    outro: 'bg-slate-400',
  };

  const todayStr = formatISO(today);
  const isToday = (d: Date) => formatISO(d) === todayStr;
  const isSelected = (d: Date) => formatISO(d) === selectedDateStr;

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-xs text-muted-foreground mt-0.5">WebHubPro ERP / Agenda</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Type filter pills */}
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className={`text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-150 ${
                typeFilters.size === 0 ? 'bg-foreground text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Todos
            </button>
            {(['audiencia', 'reuniao', 'prazo', 'pericia'] as EventoTipo[]).map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-150 ${
                  typeFilters.has(t) ? tipoSelectedColors[t] : tipoBgColors[t]
                }`}
              >
                {tipoLabels[t]}
              </button>
            ))}
          </div>
          <button
            onClick={() => openNewModal()}
            className="flex items-center bg-primary text-primary-foreground text-sm font-medium rounded-md px-4 py-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Evento
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* CALENDAR */}
        <div className="col-span-8">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Calendar header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setMonthOffset((o) => o - 1)} className="w-8 h-8 rounded-md border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-lg font-semibold text-foreground">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button onClick={() => setMonthOffset((o) => o + 1)} className="w-8 h-8 rounded-md border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setMonthOffset(0); setSelectedDate(new Date()); }} className="border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
                  Hoje
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center py-2.5">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, current }, idx) => {
                const dateKey = formatISO(date);
                const dayEvents = eventsByDate.get(dateKey) || [];
                const isT = isToday(date);
                const isSel = isSelected(date) && !isT;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(new Date(date))}
                    className={`min-h-28 border-b border-r border-border/50 p-1.5 relative cursor-pointer hover:bg-muted/50 transition-colors duration-100 ${
                      isSel ? 'ring-2 ring-accent/40 bg-accent/5' : ''
                    }`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full ${
                      isT ? 'bg-primary text-primary-foreground font-bold' :
                      isSel ? 'text-accent' :
                      current ? 'text-foreground' : 'text-muted-foreground/60'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const isPrazoUrgent = evt.tipo === 'prazo' && diffDays(evt.data) <= 3;
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => { e.stopPropagation(); setShowDetailModal(evt); }}
                            className={`text-xs px-1.5 py-0.5 rounded truncate w-full cursor-pointer ${pillColors[evt.tipo]}`}
                          >
                            {isPrazoUrgent && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                            {evt.hora_inicio} {evt.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-400 pl-1.5 mt-0.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedDate(new Date(date)); }}>
                          +{dayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* EVENTOS DO DIA PANEL */}
        <div className="col-span-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm h-fit sticky top-20">
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-slate-900">
                  {todayStr === selectedDateStr
                    ? 'Hoje'
                    : `${DAY_NAMES[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]}`}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedDate.getDate()} de {MONTH_NAMES[selectedDate.getMonth()]} de {selectedDate.getFullYear()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {selectedDayEvents.length} evento{selectedDayEvents.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => openNewModal(selectedDateStr)}
                  className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel body */}
            <div className="px-4 py-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
              {selectedDayEvents.length === 0 ? (
                <div className="py-10 text-center">
                  <CalendarX className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhum evento neste dia</p>
                  <button
                    onClick={() => openNewModal(selectedDateStr)}
                    className="mt-3 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Novo Evento
                  </button>
                </div>
              ) : (
                selectedDayEvents.map((evt) => {
                  const lawyer = MOCK_USERS.find((u) => u.id === evt.responsible_id);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setShowDetailModal(evt)}
                      className={`bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors cursor-pointer border-l-4 ${tipoBorderColors[evt.tipo]}`}
                    >
                      <div className="px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 leading-snug">{evt.title}</div>
                            {evt.tipo === 'prazo' && evt.notes.includes('PRAZO FATAL') && (
                              <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 inline-flex items-center">
                                <Flame className="w-3 h-3 mr-1" />PRAZO FATAL
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${tipoBgColors[evt.tipo]}`}>
                            {tipoLabels[evt.tipo]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs text-slate-500">{evt.hora_inicio}{evt.hora_fim && evt.hora_fim !== evt.hora_inicio ? `–${evt.hora_fim}` : ''}</span>
                          {evt.cliente_nome && (
                            <>
                              <span className="text-slate-300">·</span>
                              <User className="w-3.5 h-3.5 text-slate-300" />
                              <span className="text-xs text-slate-500 truncate">{evt.cliente_nome}</span>
                            </>
                          )}
                        </div>
                        {evt.local && (
                          <div className="mt-1 flex items-center">
                            <MapPin className="w-3 h-3 text-slate-300 inline mr-1" />
                            <span className="text-xs text-slate-400 truncate">{evt.local}</span>
                          </div>
                        )}
                        {lawyer && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className={`w-5 h-5 rounded-full ${lawyer.avatar_color} flex items-center justify-center text-white text-[9px] font-bold`}>
                              {lawyer.avatar_initials}
                            </div>
                            <span className="text-xs text-slate-400">{lawyer.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel footer */}
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 rounded-b-lg">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Próximos eventos</p>
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum evento agendado</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center gap-2 py-1.5">
                    <div className={`w-2 h-2 rounded-full ${tipoDotColors[evt.tipo]}`} />
                    <span className="text-xs text-slate-400 w-10 flex-shrink-0">
                      {new Date(evt.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="text-xs text-slate-600 truncate">{evt.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── NOVO EVENTO MODAL ─── */}
      {showNewModal && (
        <NovoEventoModal
          onClose={() => { setShowNewModal(false); setEditingEvent(null); }}
          onSave={() => { reload(); setShowNewModal(false); setEditingEvent(null); showToast(editingEvent ? 'Evento atualizado' : 'Evento adicionado à agenda', 'success'); }}
          prefillDate={prefillDate}
          processos={filterByUser(allProcessos, currentUser!.id, admin)}
          currentUser={currentUser!}
          isAdmin={admin}
          editing={editingEvent}
        />
      )}

      {/* ─── EVENT DETAIL MODAL ─── */}
      {showDetailModal && (
        <EventDetailModal
          evento={showDetailModal}
          onClose={() => setShowDetailModal(null)}
          onEdit={() => openEditModal(showDetailModal)}
          onDelete={() => setShowDeleteConfirm(showDetailModal)}
        />
      )}

      {/* ─── DELETE CONFIRM ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 text-center" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">Tem certeza?</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 border border-slate-200 rounded-md py-2 text-sm text-slate-600">Cancelar</button>
              <button onClick={() => handleDeleteEvent(showDeleteConfirm)} className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   NOVO EVENTO MODAL
   ═══════════════════════════════════════ */
interface NovoEventoModalProps {
  onClose: () => void;
  onSave: () => void;
  prefillDate: string;
  processos: any[];
  currentUser: any;
  isAdmin: boolean;
  editing: Evento | null;
}

function NovoEventoModal({ onClose, onSave, prefillDate, processos, currentUser, isAdmin, editing }: NovoEventoModalProps) {
  const [title, setTitle] = useState(editing?.title || '');
  const [tipo, setTipo] = useState<EventoTipo>(editing?.tipo || 'audiencia');
  const [processoId, setProcessoId] = useState(editing?.processo_id || '');
  const [clienteNome, setClienteNome] = useState(editing?.cliente_nome || '');
  const [data, setData] = useState(editing?.data || prefillDate);
  const [horaInicio, setHoraInicio] = useState(editing?.hora_inicio || '');
  const [horaFim, setHoraFim] = useState(editing?.hora_fim || '');
  const [local, setLocal] = useState(editing?.local || '');
  const [responsibleId, setResponsibleId] = useState(editing?.responsible_id || currentUser.id);
  const [notes, setNotes] = useState(editing?.notes || '');
  const [processoSearch, setProcessoSearch] = useState('');
  const [showProcessoList, setShowProcessoList] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tipo === 'prazo' && !horaInicio) setHoraInicio('23:59');
  }, [tipo]);

  const filteredProcessos = useMemo(() => {
    if (!processoSearch) return processos;
    const q = processoSearch.toLowerCase();
    return processos.filter((p) => p.numero_cnj.includes(q) || p.acao.toLowerCase().includes(q) || p.polo_ativo_nome.toLowerCase().includes(q));
  }, [processos, processoSearch]);

  function selectProcesso(p: any) {
    setProcessoId(p.id);
    setClienteNome(p.polo_ativo_nome);
    setProcessoSearch(p.numero_cnj);
    setShowProcessoList(false);
    if (!local) setLocal(p.vara);
  }

  function handleSave() {
    const errs: Record<string, boolean> = {};
    if (!title.trim()) errs.title = true;
    if (!data) errs.data = true;
    if (!horaInicio) errs.horaInicio = true;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const allEvt = getEventos();
    if (editing) {
      const idx = allEvt.findIndex((e) => e.id === editing.id);
      if (idx >= 0) {
        allEvt[idx] = { ...allEvt[idx], title, tipo, processo_id: processoId, cliente_nome: clienteNome, data, hora_inicio: horaInicio, hora_fim: horaFim, local, responsible_id: responsibleId, notes };
      }
    } else {
      allEvt.push({
        id: 'evt-' + Date.now(),
        title,
        tipo,
        processo_id: processoId,
        cliente_nome: clienteNome,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        local,
        responsible_id: responsibleId,
        notes,
        created_at: new Date().toISOString().slice(0, 10),
      });
    }
    saveEventos(allEvt);
    onSave();
  }

  const fieldClass = (name: string) =>
    `w-full border ${errors[name] ? 'border-red-400' : 'border-slate-200'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-lg font-semibold text-slate-900">{editing ? 'Editar Evento' : 'Novo Evento'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Título*</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Audiência de Instrução — Cliente X" className={fieldClass('title')} />
            </div>

            {/* Tipo */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo*</label>
              <div className="flex gap-2 flex-wrap">
                {(['audiencia', 'reuniao', 'prazo', 'pericia', 'outro'] as EventoTipo[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`rounded-md px-3 py-2 text-sm border transition-colors ${
                      tipo === t ? tipoSelectedColors[t] : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {tipoLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Processo */}
            <div className="col-span-2 relative" ref={searchRef}>
              <label className="block text-xs font-medium text-slate-600 mb-1">Processo</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={processoSearch}
                  onChange={(e) => { setProcessoSearch(e.target.value); setShowProcessoList(true); }}
                  onFocus={() => setShowProcessoList(true)}
                  placeholder="Vincular a um processo (opcional)..."
                  className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {showProcessoList && filteredProcessos.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-48 overflow-y-auto mt-1">
                  {filteredProcessos.map((p) => (
                    <div key={p.id} onClick={() => selectProcesso(p)} className="hover:bg-slate-50 px-3 py-2 cursor-pointer">
                      <span className="font-mono text-xs text-slate-500">{p.numero_cnj}</span>
                      <span className="text-sm text-slate-700 ml-2">{p.acao}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data*</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={fieldClass('data')} />
            </div>

            {/* Hora Inicio */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hora Início*</label>
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={fieldClass('horaInicio')} />
            </div>

            {/* Hora Fim */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hora Fim</label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                onFocus={() => { if (!horaFim && horaInicio) { const [h, m] = horaInicio.split(':').map(Number); const newH = h + 1; setHoraFim(`${String(Math.min(newH, 23)).padStart(2, '0')}:${String(m + 30 >= 60 ? 0 : m + 30).padStart(2, '0')}`); } }}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-0.5">Opcional</p>
            </div>

            {/* Local */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Local</label>
              <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Vara, fórum, endereço..." className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Responsável */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Responsável*</label>
              {isAdmin ? (
                <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {MOCK_USERS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <div className="bg-slate-50 cursor-not-allowed border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-500">{currentUser.name}</div>
              )}
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Detalhes adicionais, orientações..." className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md">Cancelar</button>
          <button onClick={handleSave} className="bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700">
            {editing ? 'Atualizar Evento' : 'Salvar Evento'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   EVENT DETAIL MODAL
   ═══════════════════════════════════════ */
interface EventDetailModalProps {
  evento: Evento;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EventDetailModal({ evento, onClose, onEdit, onDelete }: EventDetailModalProps) {
  const lawyer = MOCK_USERS.find((u) => u.id === evento.responsible_id);
  const processo = evento.processo_id ? getProcessos().find((p) => p.id === evento.processo_id) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 border-l-4 ${tipoBorderColors[evento.tipo]}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoBgColors[evento.tipo]}`}>{tipoLabels[evento.tipo]}</span>
              <h3 className="text-lg font-semibold text-slate-900 mt-1">{evento.title}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-sm text-slate-700">
                <Calendar className="w-4 h-4 text-slate-300 mr-1.5" />
                {formatDateBR(evento.data)}
              </div>
              <div className="flex items-center text-sm text-slate-700 mt-1">
                <Clock className="w-4 h-4 text-slate-300 mr-1.5" />
                {evento.hora_inicio}{evento.hora_fim && evento.hora_fim !== evento.hora_inicio ? `–${evento.hora_fim}` : ''}
              </div>
            </div>
            <div>
              <div className="flex items-center text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-slate-300 mr-1.5" />
                {evento.local || '—'}
              </div>
            </div>
            {processo && (
              <div className="col-span-2">
                <div className="flex items-center text-sm text-slate-700">
                  <Briefcase className="w-4 h-4 text-slate-300 mr-1.5" />
                  <span className="font-mono text-xs text-slate-500 mr-2">{processo.numero_cnj}</span>
                  <span>{processo.acao}</span>
                </div>
              </div>
            )}
            {evento.cliente_nome && (
              <div>
                <div className="flex items-center text-sm text-slate-700">
                  <User className="w-4 h-4 text-slate-300 mr-1.5" />
                  {evento.cliente_nome}
                </div>
              </div>
            )}
            {lawyer && (
              <div>
                <div className="flex items-center text-sm text-slate-700 gap-1.5">
                  <div className={`w-5 h-5 rounded-full ${lawyer.avatar_color} flex items-center justify-center text-white text-[9px] font-bold`}>
                    {lawyer.avatar_initials}
                  </div>
                  {lawyer.name}
                </div>
              </div>
            )}
          </div>
          {evento.notes && (
            <>
              <div className="border-t border-slate-100" />
              <div>
                <div className="flex items-center gap-1.5">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400 uppercase">Observações</span>
                </div>
                <p className="text-sm text-slate-600 italic leading-relaxed mt-1">{evento.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={onDelete} className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs">
            <Trash className="w-3.5 h-3.5" /> Excluir
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="border border-slate-200 text-slate-600 rounded-md px-4 py-2 text-sm">Fechar</button>
            <button onClick={onEdit} className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700">Editar Evento</button>
          </div>
        </div>
      </div>
    </div>
  );
}
