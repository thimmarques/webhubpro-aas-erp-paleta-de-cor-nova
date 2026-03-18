import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import { loadClientes, saveClientes } from '@/data/mockClientes';
import { filterByUser } from '@/components/Dashboard';
import {
  Cliente,
  getClienteName,
  getClienteDoc,
  maskCpf,
  maskCnpj,
  getPoloLabel,
} from '@/types/cliente';
import StatusBadge from './StatusBadge';
import UserAvatar from './UserAvatar';
import EmptyState from './EmptyState';
import ClienteSlideOver from './ClienteSlideOver';

const ITEMS_PER_PAGE = 10;

// mock process counts per client
const processCountMap: Record<string, number> = {
  'cli-001': 3,
  'cli-002': 5,
  'cli-003': 2,
  'cli-004': 1,
  'cli-005': 2,
};

type SortField = 'name' | 'area' | 'status';
type SortDir = 'asc' | 'desc';

interface ClientesPageProps {
  onNavigateDetail?: (clientId: string) => void;
}

export default function ClientesPage({ onNavigateDetail }: ClientesPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const [allClientes, setAllClientes] = useState<Cliente[]>(() => loadClientes());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | 'PF' | 'PJ'>('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  // slide-over
  const [slideOpen, setSlideOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);

  // dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // filter
  const filtered = useMemo(() => {
    let items = filterByUser(allClientes, currentUser!.id, admin);

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((c) => {
        const name = getClienteName(c).toLowerCase();
        const doc = getClienteDoc(c).toLowerCase();
        return name.includes(q) || doc.includes(q);
      });
    }
    if (filterType) items = items.filter((c) => c.type === filterType);
    if (filterArea) items = items.filter((c) => c.practice_area === filterArea);
    if (filterStatus) items = items.filter((c) => c.status === filterStatus);

    // sort
    items = [...items].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = getClienteName(a).localeCompare(getClienteName(b));
      else if (sortField === 'area') cmp = a.practice_area.localeCompare(b.practice_area);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [allClientes, currentUser, admin, search, filterType, filterArea, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />
    ) : null;

  const handleSave = (cliente: Cliente) => {
    setAllClientes((prev) => {
      const idx = prev.findIndex((c) => c.id === cliente.id);
      let next: Cliente[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = cliente;
      } else {
        next = [...prev, cliente];
      }
      saveClientes(next);
      return next;
    });
    setSlideOpen(false);
    setEditCliente(null);
    showToast('Cliente cadastrado com sucesso', 'success');
  };

  const handleDelete = (id: string) => {
    setAllClientes((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveClientes(next);
      return next;
    });
    setDeleteId(null);
    setOpenDropdown(null);
    showToast('Cliente removido', 'info');
  };

  const openNew = () => {
    setEditCliente(null);
    setSlideOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditCliente(c);
    setSlideOpen(true);
    setOpenDropdown(null);
  };

  const getUserById = (id: string) => MOCK_USERS.find((u) => u.id === id);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">WebHubPro ERP / Clientes</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-lg p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-colors"
            placeholder="Buscar por nome, CPF ou CNPJ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" value={filterType} onChange={(e) => { setFilterType(e.target.value as any); setPage(1); }}>
          <option value="">Tipo: Todos</option>
          <option value="PF">PF</option>
          <option value="PJ">PJ</option>
        </select>
        <select className="bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" value={filterArea} onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}>
          <option value="">Área: Todas</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="civil">Civil</option>
          <option value="criminal">Criminal</option>
          <option value="previdenciario">Previdenciário</option>
        </select>
        <select className="bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">Status: Todos</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Table or empty */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg">
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            subtitle="Tente ajustar os filtros ou cadastre um novo cliente"
            ctaLabel="+ Novo Cliente"
            onCta={openNew}
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  Cliente <SortIcon field="name" />
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('area')}>
                  Área <SortIcon field="area" />
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Polo</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Processos</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                {admin && (
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Responsável</th>
                )}
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => {
                const name = getClienteName(c);
                const doc = getClienteDoc(c);
                const maskedDoc = c.type === 'PF' ? maskCpf(doc) : maskCnpj(doc);
                const initials = name
                  .split(' ')
                  .filter(Boolean)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const responsible = getUserById(c.responsible_id);
                const processCount = processCountMap[c.id] || Math.floor(Math.random() * 4) + 1;

                return (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                    {/* CLIENTE */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                          c.type === 'PF' ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                            {name}
                            {c.is_vip && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{maskedDoc}</p>
                        </div>
                      </div>
                    </td>
                    {/* TIPO */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.type === 'PF' ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    {/* ÁREA */}
                    <td className="px-4 py-3">
                      <StatusBadge variant={c.practice_area} />
                    </td>
                    {/* POLO */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {getPoloLabel((c as any).polo || '')}
                    </td>
                    {/* PROCESSOS */}
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                        {processCount}
                      </span>
                    </td>
                    {/* STATUS */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.status === 'ativo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {/* RESPONSÁVEL */}
                    {admin && (
                      <td className="px-4 py-3">
                        {responsible && (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={responsible.name} color={responsible.avatar_color} size="sm" />
                            <span className="text-sm text-muted-foreground truncate">{responsible.name}</span>
                          </div>
                        )}
                      </td>
                    )}
                    {/* AÇÕES */}
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block" ref={openDropdown === c.id ? dropdownRef : undefined}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openDropdown === c.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded-lg py-1 z-10 w-40">
                            <button
                              onClick={() => { onNavigateDetail?.(c.id); setOpenDropdown(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Detalhes
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => { setDeleteId(c.id); setOpenDropdown(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} clientes
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over */}
      <ClienteSlideOver
        open={slideOpen}
        onClose={() => { setSlideOpen(false); setEditCliente(null); }}
        onSave={handleSave}
        editCliente={editCliente}
      />

      {/* Delete confirmation modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirmar exclusão</h3>
              <p className="text-sm text-slate-600 mb-6">
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteId(null)} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
