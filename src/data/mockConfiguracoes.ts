export interface Office {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  active_areas: ('trabalhista' | 'civil' | 'criminal' | 'previdenciario')[];
  created_at: string;
}

export interface Integracao {
  id: string;
  name: string;
  description: string;
  status: 'conectado' | 'desconectado' | 'erro' | 'pendente';
  last_sync: string;
  config: Record<string, string>;
}

export interface Sessao {
  id: string;
  user_id: string;
  user_name: string;
  device: string;
  browser: string;
  ip: string;
  last_access: string;
  current: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  entity_name: string;
  ip: string;
  timestamp: string;
  status: 'sucesso' | 'erro';
  details: string;
}

export interface SystemConfig {
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  app_version: string;
  two_factor_enabled: boolean;
  session_timeout: number;
  password_min_length: number;
  require_special_chars: boolean;
  require_uppercase: boolean;
  backup_frequency: 'daily' | 'weekly' | 'manual';
  last_backup: string;
}

const SEED_OFFICE: Office = {
  id: "office-001",
  name: "Alves & Associados Advocacia",
  cnpj: "12.456.789/0001-34",
  address: "Av. Paulista, 1500 — Conjunto 1204",
  city: "São Paulo",
  state: "SP",
  cep: "01310-200",
  phone: "(11) 3456-7890",
  email: "contato@alvesassociados.com.br",
  website: "www.alvesassociados.com.br",
  logo_url: "",
  active_areas: ["trabalhista", "civil", "criminal", "previdenciario"],
  created_at: "2023-01-10"
};

const SEED_INTEGRACOES: Integracao[] = [
  {
    id: "int-001",
    name: "WhatsApp Business",
    description: "Envio automático de mensagens e notificações para clientes",
    status: "desconectado",
    last_sync: "",
    config: { phone_number: "", api_key: "" }
  },
  {
    id: "int-002",
    name: "Google Calendar",
    description: "Sincronização de audiências e prazos com Google Agenda",
    status: "conectado",
    last_sync: "2026-02-20T08:30:00",
    config: { calendar_id: "contato@alvesassociados.com.br" }
  },
  {
    id: "int-003",
    name: "Email SMTP",
    description: "Envio de e-mails automáticos para clientes e notificações",
    status: "conectado",
    last_sync: "2026-02-22T14:00:00",
    config: { host: "smtp.gmail.com", port: "587", user: "contato@alvesassociados.com.br" }
  },
  {
    id: "int-004",
    name: "Stripe",
    description: "Processamento de pagamentos e cobranças online",
    status: "desconectado",
    last_sync: "",
    config: { public_key: "", secret_key: "" }
  },
  {
    id: "int-005",
    name: "DocuSign",
    description: "Assinatura digital de contratos e procurações",
    status: "pendente",
    last_sync: "",
    config: { account_id: "", integration_key: "" }
  },
  {
    id: "int-006",
    name: "DJe Automático",
    description: "Monitoramento automático do Diário da Justiça Eletrônico",
    status: "desconectado",
    last_sync: "",
    config: { oab_numbers: "", tribunais: "" }
  }
];

const SEED_SESSOES: Sessao[] = [
  {
    id: "ses-001",
    user_id: "user-001",
    user_name: "Dr. Roberto Alves",
    device: "MacBook Pro 16",
    browser: "Chrome 121",
    ip: "189.56.78.90",
    last_access: "2026-02-23T10:30:00",
    current: true
  },
  {
    id: "ses-002",
    user_id: "user-001",
    user_name: "Dr. Roberto Alves",
    device: "iPhone 15 Pro",
    browser: "Safari Mobile 17",
    ip: "189.56.78.91",
    last_access: "2026-02-22T18:45:00",
    current: false
  },
  {
    id: "ses-003",
    user_id: "user-002",
    user_name: "Dr. Marcos Ferreira",
    device: "Windows 11 Desktop",
    browser: "Edge 121",
    ip: "200.123.45.67",
    last_access: "2026-02-23T09:15:00",
    current: false
  },
  {
    id: "ses-004",
    user_id: "user-003",
    user_name: "Dra. Patrícia Lima",
    device: "MacBook Air M2",
    browser: "Chrome 121",
    ip: "177.89.123.45",
    last_access: "2026-02-23T08:00:00",
    current: false
  },
  {
    id: "ses-005",
    user_id: "user-004",
    user_name: "Dr. Carlos Mendes",
    device: "iPad Pro",
    browser: "Safari 17",
    ip: "201.45.67.89",
    last_access: "2026-02-22T20:10:00",
    current: false
  }
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-001",
    user_id: "user-002",
    user_name: "Dr. Marcos Ferreira",
    action: "Criou processo",
    entity: "Processo",
    entity_id: "proc-012",
    entity_name: "0012345-67.2026.5.02.0044",
    ip: "200.123.45.67",
    timestamp: "2026-02-01T09:32:15",
    status: "sucesso",
    details: "Reclamação Trabalhista — Horas Extras"
  },
  {
    id: "log-002",
    user_id: "user-003",
    user_name: "Dra. Patrícia Lima",
    action: "Editou cliente",
    entity: "Cliente",
    entity_id: "cli-003",
    entity_name: "Martins & Associados Ltda",
    ip: "177.89.123.45",
    timestamp: "2026-02-01T10:15:30",
    status: "sucesso",
    details: "Atualizou endereço e telefone"
  },
  {
    id: "log-003",
    user_id: "user-001",
    user_name: "Dr. Roberto Alves",
    action: "Registrou pagamento",
    entity: "Lançamento",
    entity_id: "lan-003",
    entity_name: "Construtora Betel S.A.",
    ip: "189.56.78.90",
    timestamp: "2026-02-08T14:22:10",
    status: "sucesso",
    details: "Honorários R$ 15.000,00 marcados como pagos"
  },
  {
    id: "log-004",
    user_id: "user-004",
    user_name: "Dr. Carlos Mendes",
    action: "Registrou resultado",
    entity: "Audiência",
    entity_id: "evt-008",
    entity_name: "Oitiva de testemunhas",
    ip: "201.45.67.89",
    timestamp: "2026-02-01T16:05:00",
    status: "sucesso",
    details: "1ª oitiva de testemunha realizada"
  },
  {
    id: "log-005",
    user_id: "user-005",
    user_name: "Dra. Sandra Costa",
    action: "Criou cliente",
    entity: "Cliente",
    entity_id: "cli-005",
    entity_name: "Maria de Fátima Oliveira",
    ip: "192.168.1.105",
    timestamp: "2025-08-20T11:40:00",
    status: "sucesso",
    details: "Cadastro PF Previdenciário — Auxílio-doença"
  },
  {
    id: "log-006",
    user_id: "user-002",
    user_name: "Dr. Marcos Ferreira",
    action: "Tentativa de acesso negada",
    entity: "Financeiro",
    entity_id: "",
    entity_name: "Página Financeiro",
    ip: "200.123.45.67",
    timestamp: "2026-02-10T08:55:20",
    status: "erro",
    details: "Acesso à página Financeiro negado — permissão insuficiente"
  },
  {
    id: "log-007",
    user_id: "user-001",
    user_name: "Dr. Roberto Alves",
    action: "Alterou configurações",
    entity: "Sistema",
    entity_id: "office-001",
    entity_name: "Alves & Associados",
    ip: "189.56.78.90",
    timestamp: "2026-02-15T09:10:05",
    status: "sucesso",
    details: "Atualizou dados do escritório"
  },
  {
    id: "log-008",
    user_id: "user-003",
    user_name: "Dra. Patrícia Lima",
    action: "Adicionou lançamento",
    entity: "Lançamento",
    entity_id: "lan-007",
    entity_name: "Martins & Associados Ltda",
    ip: "177.89.123.45",
    timestamp: "2026-01-30T17:02:33",
    status: "sucesso",
    details: "Preparo recursal R$ 1.850,00"
  },
  {
    id: "log-009",
    user_id: "user-001",
    user_name: "Dr. Roberto Alves",
    action: "Login realizado",
    entity: "Auth",
    entity_id: "user-001",
    entity_name: "Dr. Roberto Alves",
    ip: "189.56.78.90",
    timestamp: "2026-02-23T08:45:00",
    status: "sucesso",
    details: "Acesso via Chrome 121 — MacBook Pro"
  },
  {
    id: "log-010",
    user_id: "user-004",
    user_name: "Dr. Carlos Mendes",
    action: "Encerrou processo",
    entity: "Processo",
    entity_id: "proc-008",
    entity_name: "0008901-23.2025.8.26.0500",
    ip: "201.45.67.89",
    timestamp: "2025-10-20T10:30:00",
    status: "sucesso",
    details: "HC concedido — processo encerrado"
  }
];

const SEED_SYSTEM_CONFIG: SystemConfig = {
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
  theme: "light",
  app_version: "1.0.0",
  two_factor_enabled: false,
  session_timeout: 480,
  password_min_length: 8,
  require_special_chars: true,
  require_uppercase: true,
  backup_frequency: "daily",
  last_backup: "2026-02-22T03:00:00"
};

export function loadOffice(): Office {
  const stored = localStorage.getItem('whp_office');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('whp_office', JSON.stringify(SEED_OFFICE));
  return SEED_OFFICE;
}

export function saveOffice(office: Office) {
  localStorage.setItem('whp_office', JSON.stringify(office));
}

export function loadIntegracoes(): Integracao[] {
  const stored = localStorage.getItem('whp_integracoes');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('whp_integracoes', JSON.stringify(SEED_INTEGRACOES));
  return SEED_INTEGRACOES;
}

export function saveIntegracoes(integracoes: Integracao[]) {
  localStorage.setItem('whp_integracoes', JSON.stringify(integracoes));
}

export function loadSessoes(): Sessao[] {
  const stored = localStorage.getItem('whp_sessoes');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('whp_sessoes', JSON.stringify(SEED_SESSOES));
  return SEED_SESSOES;
}

export function saveSessoes(sessoes: Sessao[]) {
  localStorage.setItem('whp_sessoes', JSON.stringify(sessoes));
}

export function loadAuditLogs(): AuditLog[] {
  const stored = localStorage.getItem('whp_audit_logs');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('whp_audit_logs', JSON.stringify(SEED_AUDIT_LOGS));
  return SEED_AUDIT_LOGS;
}

export function saveAuditLogs(logs: AuditLog[]) {
  localStorage.setItem('whp_audit_logs', JSON.stringify(logs));
}

export function addAuditLog(log: Omit<AuditLog, 'id'>) {
  const logs = loadAuditLogs();
  const newLog: AuditLog = { ...log, id: 'log-' + Date.now() };
  logs.unshift(newLog);
  saveAuditLogs(logs);
  return newLog;
}

export function loadSystemConfig(): SystemConfig {
  const stored = localStorage.getItem('whp_system_config');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('whp_system_config', JSON.stringify(SEED_SYSTEM_CONFIG));
  return SEED_SYSTEM_CONFIG;
}

export function saveSystemConfig(config: SystemConfig) {
  localStorage.setItem('whp_system_config', JSON.stringify(config));
}
