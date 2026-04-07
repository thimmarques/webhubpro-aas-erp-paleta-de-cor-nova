import React from 'react';
import { Search, Bell, Moon } from 'lucide-react';
import { Page } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from './UserAvatar';

const pageNames: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  processos: 'Processos',
  financeiro: 'Financeiro',
  agenda: 'Agenda',
  audiencias: 'Audiências',
  relatorios: 'Relatórios',
  equipe: 'Equipe',
  configuracoes: 'Configurações',
  'meu-perfil': 'Meu Perfil',
  escritorio: 'Escritório',
  integracoes: 'Integrações',
  logs: 'Logs e Auditoria',
  seguranca: 'Segurança',
  sistema: 'Sistema',
  'cliente-detalhe': 'Detalhes do Cliente',
  'processo-detalhe': 'Detalhes do Processo',
};

const breadcrumbs: Record<string, string[]> = {
  'meu-perfil': ['Configurações', 'Meu Perfil'],
  escritorio: ['Configurações', 'Escritório'],
  integracoes: ['Configurações', 'Integrações'],
  logs: ['Configurações', 'Logs e Auditoria'],
  seguranca: ['Configurações', 'Segurança'],
  sistema: ['Configurações', 'Sistema'],
};

interface TopbarProps {
  currentPage: Page;
}

export default function Topbar({ currentPage }: TopbarProps) {
  const { currentUser } = useAuth();

  const crumbs = breadcrumbs[currentPage];

  return (
    <header className="sticky top-0 z-10 h-14 bg-card border-b border-border flex items-center px-6 gap-4">
      {/* Left */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground leading-tight">
          {pageNames[currentPage] || currentPage}
        </h1>
        {crumbs && (
          <p className="text-xs text-muted-foreground">
            {crumbs.join(' / ')}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full bg-muted/50 border border-border rounded-lg text-sm pl-9 pr-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-colors"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Moon className="w-5 h-5" />
        </button>
        {currentUser && (
          <UserAvatar name={currentUser.name} color={currentUser.avatar_color} size="md" />
        )}
      </div>
    </header>
  );
}
