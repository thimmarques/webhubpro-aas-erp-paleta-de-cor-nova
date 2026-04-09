import React, { useState, useMemo } from 'react';
import {
  Users,
  Briefcase,
  Scale,
  LayoutGrid,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  UserX,
  X,
  Mail,
  Phone,
  Send,
  Info,
  Clock,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import { getProcessos } from '@/data/mockProcessos';
import { loadClientes } from '@/data/mockClientes';
import { getEventos } from '@/data/mockEventos';
import { loadLancamentos } from '@/data/mockLancamentos';
import { areaLabels, areaColors } from '@/types/processo';
import UserAvatar from './UserAvatar';
import EmptyState from './EmptyState';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  oab: string;
  role: string;
  practice_areas: string[];
  phone: string;
  status: 'pendente';
  avatar_color: string;
  avatar_initials: string;
}

const roleLabels: Record<string, string> = { admin: 'Admin', advogado: 'Advogado', assistente: 'Assistente', estagiario: 'Estagiário' };
const roleBadgeColors: Record<string, string> = { admin: 'bg-amber-100 text-amber-700', advogado: 'bg-blue-100 text-blue-700', assistente: 'bg-purple-100 text-purple-700', estagiario: 'bg-muted text-muted-foreground' };
const roleOrder: Record<string, number> = { admin: 0, advogado: 1, assistente: 2, estagiario: 3 };

const mockPhones: Record<string, string> = {
  'user-001': '(11) 99876-5432',
  'user-002': '(11) 98765-4321',
  'user-003': '(11) 97654-3210',
  'user-004': '(11) 91234-5678',
  'user-005': '(11) 94567-8901',
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function EquipePage() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<typeof MOCK_USERS[0] | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(() => {
    const stored = localStorage.getItem('whp_usuarios_pendentes');
    return stored ? JSON.parse(stored) : [];
  });

  /* invite form */
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invOab, setInvOab] = useState('');
  const [invRole, setInvRole] = useState('advogado');
  const [invAreas, setInvAreas] = useState<string[]>([]);
  const [invPhone, setInvPhone] = useState('');
  const [invErrors, setInvErrors] = useState<Record<string, string>>({});

  /* data */
  const allProcessos = useMemo(() => getProcessos(), []);
  const allClientes = useMemo(() => loadClientes(), []);
  const allEventos = useMemo(() => getEventos(), []);
  const allLancamentos = useMemo(() => admin ? loadLancamentos() : [], [admin]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const getUserStats = (userId: string) => {
    const processos = allProcessos.filter(p => p.responsible_id === userId && p.status !== 'encerrado').length;
    const clientes = allClientes.filter(c => c.responsible_id === userId).length;
    const audiencias = allEventos.filter(e => e.tipo === 'audiencia' && e.responsible_id === userId && e.data.startsWith(monthKey)).length;
    return { processos, clientes, audiencias };
  };

  const getFinancialStats = (userId: string) => {
    if (!admin) return { aReceber: 0, recebido: 0 };
    const userLanc = allLancamentos.filter(l => l.responsible_id === userId);
    const aReceber = userLanc.filter(l => l.status === 'pendente' || l.status === 'parcelado').reduce((s, l) => s + l.valor, 0);
    const recebido = userLanc.filter(l => l.status === 'pago' && l.data_pagamento && l.data_pagamento.startsWith(monthKey)).reduce((s, l) => s + l.valor, 0);
    return { aReceber, recebido };
  };

  /* stats */
  const totalMembers = MOCK_USERS.length + pendingUsers.length;
  const totalAdvogados = MOCK_USERS.filter(u => u.role === 'advogado' || u.role === 'admin').length;
  const totalProcessosAtivos = allProcessos.filter(p => p.status !== 'encerrado').length;

  /* filtering + sorting */
  const filteredUsers = useMemo(() => {
    let users = [...MOCK_USERS];
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(s) || u.oab.toLowerCase().includes(s) || u.practice_areas.some(a => areaLabels[a]?.toLowerCase().includes(s)));
    }
    if (filterArea) users = users.filter(u => u.practice_areas.includes(filterArea as any));
    if (filterRole) users = users.filter(u => u.role === filterRole);
    users.sort((a, b) => {
      const ro = (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
      if (ro !== 0) return ro;
      return a.name.localeCompare(b.name);
    });
    return users;
  }, [search, filterArea, filterRole]);

  const filteredPending = useMemo(() => {
    let users = [...pendingUsers];
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (filterRole) users = users.filter(u => u.role === filterRole);
    if (filterArea) users = users.filter(u => u.practice_areas.includes(filterArea));
    return users;
  }, [pendingUsers, search, filterArea, filterRole]);

  /* invite handlers */
  const resetInvite = () => {
    setInvName(''); setInvEmail(''); setInvOab(''); setInvRole('advogado'); setInvAreas([]); setInvPhone(''); setInvErrors({});
  };

  const handleInvite = () => {
    const errors: Record<string, string> = {};
    if (!invName.trim()) errors.name = 'Obrigatório';
    if (!invEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invEmail)) errors.email = 'Email inválido';
    if (!invRole) errors.role = 'Obrigatório';
    if (invAreas.length === 0) errors.areas = 'Selecione ao menos uma área';
    if (Object.keys(errors).length > 0) { setInvErrors(errors); return; }

    const initials = invName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const newUser: PendingUser = {
      id: 'user-' + Date.now(),
      name: invName,
      email: invEmail,
      oab: invOab,
      role: invRole,
      practice_areas: invAreas,
      phone: invPhone,
      status: 'pendente',
      avatar_color: 'bg-muted-foreground',
      avatar_initials: initials,
    };
    const updated = [...pendingUsers, newUser];
    setPendingUsers(updated);
    localStorage.setItem('whp_usuarios_pendentes', JSON.stringify(updated));
    showToast(`Convite enviado para ${invEmail}`, 'success');
    resetInvite();
    setInviteOpen(false);
  };

  const removePending = (id: string) => {
    const updated = pendingUsers.filter(u => u.id !== id);
    setPendingUsers(updated);
    localStorage.setItem('whp_usuarios_pendentes', JSON.stringify(updated));
    showToast('Convite cancelado', 'info');
  };

  const toggleArea = (area: string) => {
    setInvAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const selectClass = 'bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-xs text-muted-foreground mt-0.5">WebHubPro ERP / Equipe</p>
        </div>
        {admin && (
          <button onClick={() => { resetInvite(); setInviteOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors">
            <UserPlus className="w-4 h-4" /> Convidar Membro
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border shadow-sm rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground"><Users className="w-4 h-4" /></div>
          <div><span className="text-xl font-bold text-foreground">{totalMembers}</span><div className="text-xs text-muted-foreground">membros</div></div>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600"><Briefcase className="w-4 h-4" /></div>
          <div><span className="text-xl font-bold text-foreground">{totalAdvogados}</span><div className="text-xs text-muted-foreground">advogados</div></div>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600"><Scale className="w-4 h-4" /></div>
          <div><span className="text-xl font-bold text-foreground">{totalProcessosAtivos}</span><div className="text-xs text-muted-foreground">processos ativos</div></div>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50 text-green-600"><LayoutGrid className="w-4 h-4" /></div>
          <div><span className="text-xl font-bold text-foreground">4</span><div className="text-xs text-muted-foreground">áreas do direito</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, OAB ou área..." className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className={selectClass}>
          <option value="">Todas Áreas</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="civil">Civil</option>
          <option value="criminal">Criminal</option>
          <option value="previdenciario">Previdenciário</option>
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={selectClass}>
          <option value="">Todos Cargos</option>
          <option value="admin">Admin</option>
          <option value="advogado">Advogado</option>
          <option value="assistente">Assistente</option>
          <option value="estagiario">Estagiário</option>
        </select>
      </div>

      {/* Team cards */}
      {filteredUsers.length === 0 && filteredPending.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum membro encontrado" subtitle="Tente ajustar os filtros de busca" ctaLabel={admin ? '+ Convidar Membro' : undefined} onCta={admin ? () => { resetInvite(); setInviteOpen(true); } : undefined} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const isMe = user.id === currentUser!.id;
            const stats = getUserStats(user.id);
            return (
              <div key={user.id} className={`bg-card border rounded-lg p-5 hover:shadow-sm transition-shadow duration-150 flex flex-col gap-4 ${isMe ? 'border-blue-200 bg-blue-50/30' : 'border-border'}`}>
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} color={user.avatar_color} size="lg" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-semibold text-foreground">{user.name}</span>
                        {isMe && <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">Você</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{user.oab}</div>
                      <span className={`${roleBadgeColors[user.role]} text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block`}>{roleLabels[user.role]}</span>
                    </div>
                  </div>
                  {admin && (
                    <div className="relative">
                      <button onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)} className="text-muted-foreground hover:text-muted-foreground p-1"><MoreHorizontal className="w-4 h-4" /></button>
                      {openDropdown === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 w-48 z-20">
                            <button className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 text-left" onClick={() => { setOpenDropdown(null); showToast('Funcionalidade em desenvolvimento', 'info'); }}><Edit className="w-3.5 h-3.5" /> Editar Membro</button>
                            <button className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 text-left" onClick={() => { setOpenDropdown(null); }}><Briefcase className="w-3.5 h-3.5" /> Ver Processos</button>
                            {!isMe && (
                              <>
                                <div className="border-t border-border my-1" />
                                <button className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 text-left" onClick={() => { setOpenDropdown(null); showToast('Funcionalidade em desenvolvimento', 'info'); }}><UserX className="w-3.5 h-3.5" /> Remover do Escritório</button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Areas */}
                <div className="flex flex-wrap gap-1.5">
                  {user.practice_areas.map(a => (
                    <span key={a} className={`${areaColors[a]} text-xs font-medium px-2 py-0.5 rounded-full`}>{areaLabels[a]}</span>
                  ))}
                </div>

                {/* Contact */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{user.email}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{mockPhones[user.id] || '(11) 90000-0000'}</span></div>
                </div>

                {/* Stats */}
                <div className="border-t border-border pt-3 grid grid-cols-3 gap-2">
                  <div><div className="text-xs text-muted-foreground">Processos</div><div className="text-lg font-bold text-foreground">{stats.processos}</div></div>
                  <div><div className="text-xs text-muted-foreground">Clientes</div><div className="text-lg font-bold text-foreground">{stats.clientes}</div></div>
                  <div><div className="text-xs text-muted-foreground">Audiências</div><div className="text-lg font-bold text-foreground">{stats.audiencias}</div><div className="text-xs text-muted-foreground">este mês</div></div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setProfileUser(user)} className="flex-1 border border-border rounded-md py-2 text-sm text-muted-foreground hover:bg-muted text-center cursor-pointer">Ver Perfil</button>
                  <button className="flex-1 border border-border rounded-md py-2 text-sm text-muted-foreground hover:bg-muted text-center cursor-pointer flex items-center justify-center gap-1">
                    <Briefcase className="w-4 h-4" /> Ver Processos
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pending invite cards */}
          {filteredPending.map(user => (
            <div key={user.id} className="bg-muted border border-dashed border-border rounded-lg p-5 opacity-80 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xl font-semibold">?</div>
                  <div>
                    <span className="text-lg font-semibold text-foreground">{user.name}</span>
                    <div className="mt-1"><span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Convite Pendente</span></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.practice_areas.map(a => (
                  <span key={a} className={`${areaColors[a] || 'bg-muted text-muted-foreground'} text-xs font-medium px-2 py-0.5 rounded-full`}>{areaLabels[a] || a}</span>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{user.email}</span></div>
              </div>
              <div className="border-t border-border pt-3 grid grid-cols-3 gap-2">
                <div><div className="text-xs text-muted-foreground">Processos</div><div className="text-lg font-bold text-muted-foreground">—</div></div>
                <div><div className="text-xs text-muted-foreground">Clientes</div><div className="text-lg font-bold text-muted-foreground">—</div></div>
                <div><div className="text-xs text-muted-foreground">Audiências</div><div className="text-lg font-bold text-muted-foreground">—</div></div>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => showToast('Convite reenviado', 'success')} className="flex-1 border border-border rounded-md py-2 text-sm text-muted-foreground hover:bg-muted text-center">Reenviar</button>
                <button onClick={() => removePending(user.id)} className="flex-1 border border-red-200 rounded-md py-2 text-sm text-red-500 hover:bg-red-50 text-center">Cancelar convite</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile detail modal */}
      {profileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setProfileUser(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="bg-card rounded-xl shadow-xl max-w-md mx-4 w-full relative z-10 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Banner */}
            <div className={`h-16 ${profileUser.avatar_color} relative`}>
              <button onClick={() => setProfileUser(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-card/20 hover:bg-card/40 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative px-6 pt-0 pb-4 border-b border-border">
              <div className={`w-20 h-20 rounded-full border-4 border-white ${profileUser.avatar_color} flex items-center justify-center text-white text-2xl font-semibold -mt-10`}>
                {profileUser.avatar_initials}
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold text-foreground">{profileUser.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`${roleBadgeColors[profileUser.role]} text-xs font-medium px-2 py-0.5 rounded-full`}>{roleLabels[profileUser.role]}</span>
                  <span className="text-xs text-muted-foreground">{profileUser.oab}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profileUser.practice_areas.map(a => (
                    <span key={a} className={`${areaColors[a]} text-xs font-medium px-2 py-0.5 rounded-full`}>{areaLabels[a]}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Contato</div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">{profileUser.email}</span></div>
                <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">{mockPhones[profileUser.id] || '(11) 90000-0000'}</span></div>
              </div>
              <div className="border-t border-border my-4" />
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Atividade</div>
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const s = getUserStats(profileUser.id);
                  return (<>
                    <div className="bg-muted rounded-lg p-3 text-center"><div className="text-xl font-bold text-foreground">{s.processos}</div><div className="text-xs text-muted-foreground mt-0.5">Processos Ativos</div></div>
                    <div className="bg-muted rounded-lg p-3 text-center"><div className="text-xl font-bold text-foreground">{s.clientes}</div><div className="text-xs text-muted-foreground mt-0.5">Clientes</div></div>
                    <div className="bg-muted rounded-lg p-3 text-center"><div className="text-xl font-bold text-foreground">{s.audiencias}</div><div className="text-xs text-muted-foreground mt-0.5">Audiências (mês)</div></div>
                  </>);
                })()}
              </div>
              {admin && profileUser.id !== currentUser!.id && (
                <>
                  <div className="border-t border-border my-4" />
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Desempenho Financeiro</div>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const f = getFinancialStats(profileUser.id);
                      return (<>
                        <div className="bg-amber-50 rounded-lg p-3"><div className="text-xs text-amber-600">A Receber</div><div className="text-lg font-bold text-amber-700">{formatBRL(f.aReceber)}</div></div>
                        <div className="bg-green-50 rounded-lg p-3"><div className="text-xs text-green-600">Recebido</div><div className="text-lg font-bold text-green-700">{formatBRL(f.recebido)}</div></div>
                      </>);
                    })()}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button onClick={() => setProfileUser(null)} className="flex-1 border border-border rounded-md py-2 text-sm text-muted-foreground">Fechar</button>
              {admin && profileUser.id !== currentUser!.id && (
                <button onClick={() => { setProfileUser(null); showToast('Funcionalidade em desenvolvimento', 'info'); }} className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700">Editar Membro</button>
              )}
              {profileUser.id === currentUser!.id && (
                <button onClick={() => { setProfileUser(null); }} className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700">Editar Meu Perfil</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setInviteOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col mx-4 relative z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-foreground">Convidar Membro</span>
              </div>
              <button onClick={() => setInviteOpen(false)} className="text-muted-foreground hover:text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Nome Completo*</label>
                  <input value={invName} onChange={e => setInvName(e.target.value)} placeholder="Nome completo do advogado" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  {invErrors.name && <p className="text-xs text-red-500 mt-0.5">{invErrors.name}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Email*</label>
                  <input value={invEmail} onChange={e => setInvEmail(e.target.value)} type="email" placeholder="email@escritorio.com.br" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <p className="text-xs text-muted-foreground mt-0.5">Um convite será enviado para este e-mail</p>
                  {invErrors.email && <p className="text-xs text-red-500 mt-0.5">{invErrors.email}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">OAB</label>
                  <input value={invOab} onChange={e => setInvOab(e.target.value)} placeholder="OAB/SP 000.000" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Cargo/Role*</label>
                  <select value={invRole} onChange={e => setInvRole(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="advogado">Advogado</option>
                    <option value="assistente">Assistente</option>
                    <option value="estagiario">Estagiário</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-0.5">Admins devem ser promovidos manualmente</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-2">Áreas de Atuação*</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['trabalhista', 'civil', 'criminal', 'previdenciario'].map(a => (
                      <button key={a} type="button" onClick={() => toggleArea(a)} className={`flex items-center gap-2.5 border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors ${invAreas.includes(a) ? 'border-blue-300 bg-blue-50' : 'border-border'}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${invAreas.includes(a) ? 'bg-blue-600 border-blue-600' : 'border-border bg-card'}`}>
                          {invAreas.includes(a) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-foreground">{areaLabels[a]}</span>
                        <span className={`${areaColors[a]} text-xs font-medium px-2 py-0.5 rounded-full ml-auto`}>{areaLabels[a]}</span>
                      </button>
                    ))}
                  </div>
                  {invErrors.areas && <p className="text-xs text-red-500 mt-0.5">{invErrors.areas}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Telefone</label>
                  <input value={invPhone} onChange={e => setInvPhone(e.target.value)} type="tel" placeholder="(11) 00000-0000" className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <p className="text-xs text-muted-foreground mt-0.5">Opcional</p>
                </div>
                {invEmail && invName && (
                  <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="text-xs font-semibold text-blue-700 uppercase mb-2">Prévia do convite</div>
                    <div className="bg-card rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-500" /><span className="text-sm text-foreground">Convite para: {invEmail}</span></div>
                      <div className="text-xs text-muted-foreground mt-0.5">{invName} foi convidado como {roleLabels[invRole] || invRole}</div>
                      {invAreas.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {invAreas.map(a => <span key={a} className={`${areaColors[a] || 'bg-muted text-muted-foreground'} text-xs font-medium px-2 py-0.5 rounded-full`}>{areaLabels[a] || a}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Info className="w-4 h-4" /> O convite expira em 48 horas</div>
              <div className="flex gap-3">
                <button onClick={() => setInviteOpen(false)} className="text-muted-foreground text-sm px-3 py-2">Cancelar</button>
                <button onClick={handleInvite} className="bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5"><Send className="w-4 h-4" /> Enviar Convite</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
