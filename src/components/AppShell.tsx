import React, { useState } from 'react';
import { Page } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PagePlaceholder from './PagePlaceholder';
import AccessDeniedScreen from './AccessDeniedScreen';
import Dashboard from './Dashboard';
import ClientesPage from './ClientesPage';
import ProcessosPage from './ProcessosPage';
import ProcessoDetail from './ProcessoDetail';
import ClienteDetailPage from './ClienteDetailPage';

const pageLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  processos: 'Processos',
  financeiro: 'Financeiro',
  agenda: 'Agenda',
  audiencias: 'Audiências',
  relatorios: 'Relatórios',
  equipe: 'Equipe',
  'meu-perfil': 'Meu Perfil',
  escritorio: 'Escritório',
  integracoes: 'Integrações',
  logs: 'Logs e Auditoria',
  seguranca: 'Segurança',
  sistema: 'Sistema',
};

export default function AppShell() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const renderPage = () => {
    if (currentPage === 'dashboard') return <Dashboard />;
    if (currentPage === 'clientes') return (
      <ClientesPage onNavigateDetail={(id) => {
        setSelectedClientId(id);
        setCurrentPage('cliente-detalhe');
      }} />
    );
    if (currentPage === 'processos') return (
      <ProcessosPage onNavigateDetail={(id) => {
        setSelectedProcessoId(id);
        setCurrentPage('processo-detalhe');
      }} />
    );
    if (currentPage === 'processo-detalhe' && selectedProcessoId) return (
      <ProcessoDetail
        processoId={selectedProcessoId}
        onBack={() => setCurrentPage('processos')}
      />
    );
    if (currentPage === 'cliente-detalhe' && selectedClientId) return (
      <ClienteDetailPage
        clientId={selectedClientId}
        onBack={() => setCurrentPage('clientes')}
        onNavigateProcessoDetail={(id) => {
          setSelectedProcessoId(id);
          setCurrentPage('processo-detalhe');
        }}
      />
    );
    if (currentPage === 'financeiro' && !isAdmin()) {
      return <AccessDeniedScreen />;
    }
    return <PagePlaceholder pageName={pageLabels[currentPage] || currentPage} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="ml-56 min-h-screen flex flex-col">
        <Topbar currentPage={currentPage} />
        <main className="flex-1 p-6">{renderPage()}</main>
      </div>
    </div>
  );
}
