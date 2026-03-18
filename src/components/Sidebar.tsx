import React, { useState } from 'react';
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  BarChart2,
  UserCheck,
  Settings,
  LogOut,
  Lock,
  User,
  Building2,
  Plug,
  FileText,
  Shield,
  Cpu,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Page } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from './UserAvatar';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  lockIfNotAdmin?: boolean;
}

const mainNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'processos', label: 'Processos', icon: Briefcase },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, lockIfNotAdmin: true },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'audiencias', label: 'Audiências', icon: Scale },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart2 },
  { id: 'equipe', label: 'Equipe', icon: UserCheck },
];

const configSubNav: NavItem[] = [
  { id: 'meu-perfil', label: 'Meu Perfil', icon: User },
  { id: 'escritorio', label: 'Escritório', icon: Building2, adminOnly: true },
  { id: 'integracoes', label: 'Integrações', icon: Plug, adminOnly: true },
  { id: 'logs', label: 'Logs e Auditoria', icon: FileText, adminOnly: true },
  { id: 'seguranca', label: 'Segurança', icon: Shield, adminOnly: true },
  { id: 'sistema', label: 'Sistema', icon: Cpu, adminOnly: true },
];

const configPages = new Set<Page>(['configuracoes', 'meu-perfil', 'escritorio', 'integracoes', 'logs', 'seguranca', 'sistema']);

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { currentUser, logout, isAdmin } = useAuth();
  const [configOpen, setConfigOpen] = useState(configPages.has(currentPage));

  const isActive = (id: Page) => currentPage === id;
  const isConfigActive = configPages.has(currentPage);

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150 ${
      active
        ? 'bg-sidebar-muted text-sidebar-foreground'
        : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground'
    }`;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-sidebar flex flex-col z-20">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-muted">
        <div className="flex items-center gap-2">
          <div className="bg-accent rounded-md p-1.5 w-8 h-8 flex items-center justify-center">
            <Scale className="w-4 h-4 text-accent-foreground" />
          </div>
          <span className="text-sm font-bold text-white">WebHubPro ERP</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => (
          <div
            key={item.id}
            className={itemClass(isActive(item.id))}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.lockIfNotAdmin && !isAdmin() && (
              <Lock className="w-3 h-3 ml-auto text-sidebar-foreground/40" />
            )}
          </div>
        ))}

        <div className="mx-4 my-3 border-t border-sidebar-muted" />

        {/* Configurações */}
        <div
          className={itemClass(isConfigActive)}
          onClick={() => {
            setConfigOpen(!configOpen);
            if (!configOpen) onNavigate('meu-perfil');
          }}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="flex-1">Configurações</span>
          {configOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/40" />
          )}
        </div>

        {configOpen && (
          <div className="space-y-0.5">
            {configSubNav
              .filter((item) => !item.adminOnly || isAdmin())
              .map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 mx-2 pl-8 pr-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    isActive(item.id)
                      ? 'text-sidebar-foreground'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
                  }`}
                  onClick={() => onNavigate(item.id)}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
          </div>
        )}
      </nav>

      {/* User info */}
      {currentUser && (
        <div className="border-t border-slate-700 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="sm" />
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      )}
    </aside>
  );
}
