import React, { useState, useMemo, useCallback } from 'react';
import {
  User, Building2, Plug, FileText, Shield, Cpu, Lock,
  Camera, Upload, Eye, EyeOff, Info, CheckCircle, X,
  Download, Settings, MessageCircle, Calendar, Mail,
  CreditCard, FileSignature, Newspaper, RefreshCw,
  AlertCircle, AlertTriangle, Monitor, Smartphone, Tablet,
  Key, Type, ArrowUp, Sun, Moon, Globe, Database, Archive,
  Trash, Send, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import AccessDeniedScreen from './AccessDeniedScreen';
import UserAvatar from './UserAvatar';
import {
  Office, Integracao, Sessao, AuditLog, SystemConfig,
  loadOffice, saveOffice,
  loadIntegracoes, saveIntegracoes,
  loadSessoes, saveSessoes,
  loadAuditLogs, saveAuditLogs, addAuditLog,
  loadSystemConfig, saveSystemConfig,
} from '@/data/mockConfiguracoes';

type ConfigSubmenu = 'meu-perfil' | 'escritorio' | 'integracoes' | 'logs' | 'seguranca' | 'sistema';

const BRAZILIAN_STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador', advogado: 'Advogado', assistente: 'Assistente', estagiario: 'Estagiário'
};

const areaLabels: Record<string, string> = {
  trabalhista: 'Trabalhista', civil: 'Civil', criminal: 'Criminal', previdenciario: 'Previdenciário'
};

const areaDescriptions: Record<string, string> = {
  trabalhista: 'CLT, FGTS, rescisões',
  civil: 'Contratos, societário, indenizações',
  criminal: 'Defesa penal, habeas corpus',
  previdenciario: 'INSS, benefícios, aposentadorias',
};

const areaBadgeColors: Record<string, string> = {
  trabalhista: 'bg-blue-100 text-blue-700',
  civil: 'bg-purple-100 text-purple-700',
  criminal: 'bg-rose-100 text-rose-700',
  previdenciario: 'bg-amber-100 text-amber-700',
};

const entityBadgeColors: Record<string, string> = {
  Processo: 'bg-blue-100 text-blue-700',
  Cliente: 'bg-purple-100 text-purple-700',
  'Lançamento': 'bg-green-100 text-green-700',
  'Audiência': 'bg-indigo-100 text-indigo-700',
  Auth: 'bg-muted text-muted-foreground',
  Sistema: 'bg-amber-100 text-amber-700',
  Financeiro: 'bg-red-100 text-red-600',
};

const integrationIcons: Record<string, React.ElementType> = {
  'WhatsApp Business': MessageCircle,
  'Google Calendar': Calendar,
  'Email SMTP': Mail,
  'Stripe': CreditCard,
  'DocuSign': FileSignature,
  'DJe Automático': Newspaper,
};

const integrationIconColors: Record<string, string> = {
  'WhatsApp Business': 'text-green-500',
  'Google Calendar': 'text-blue-500',
  'Email SMTP': 'text-muted-foreground',
  'Stripe': 'text-purple-500',
  'DocuSign': 'text-blue-600',
  'DJe Automático': 'text-amber-600',
};

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

function formatDateTime(d: string): { date: string; time: string; short: string } {
  if (!d) return { date: '—', time: '—', short: '—' };
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return { date: `${day}/${month}/${year}`, time: `${h}:${min}:${sec}`, short: `${day}/${month} às ${h}:${min}` };
}

function getPasswordStrength(pw: string): { level: number; label: string; color: string; width: string } {
  if (!pw) return { level: 0, label: '', color: '', width: 'w-0' };
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  if (pw.length >= 12 && hasSpecial && hasUpper) return { level: 4, label: 'Forte', color: 'text-green-600 bg-green-500', width: 'w-full' };
  if (pw.length >= 8 && hasSpecial) return { level: 3, label: 'Boa', color: 'text-blue-600 bg-blue-400', width: 'w-3/4' };
  if (pw.length >= 6) return { level: 2, label: 'Média', color: 'text-amber-600 bg-amber-400', width: 'w-2/4' };
  return { level: 1, label: 'Fraca', color: 'text-red-600 bg-red-400', width: 'w-1/4' };
}

interface ConfiguracoesPageProps {
  initialSubmenu?: ConfigSubmenu;
}

export default function ConfiguracoesPage({ initialSubmenu }: ConfiguracoesPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();

  const [activeMenu, setActiveMenu] = useState<ConfigSubmenu>(initialSubmenu || 'meu-perfil');

  // ── Access control ──
  const adminOnlyMenus: ConfigSubmenu[] = ['escritorio', 'integracoes', 'logs', 'seguranca', 'sistema'];
  const isRestricted = adminOnlyMenus.includes(activeMenu) && !admin;

  const navItems: { id: ConfigSubmenu; label: string; icon: React.ElementType; adminOnly: boolean }[] = [
    { id: 'meu-perfil', label: 'Meu Perfil', icon: User, adminOnly: false },
    { id: 'escritorio', label: 'Escritório', icon: Building2, adminOnly: true },
    { id: 'integracoes', label: 'Integrações', icon: Plug, adminOnly: true },
    { id: 'logs', label: 'Logs e Auditoria', icon: FileText, adminOnly: true },
    { id: 'seguranca', label: 'Segurança', icon: Shield, adminOnly: true },
    { id: 'sistema', label: 'Sistema', icon: Cpu, adminOnly: true },
  ];

  const submenuLabels: Record<string, string> = {
    'meu-perfil': 'Meu Perfil', escritorio: 'Escritório', integracoes: 'Integrações',
    logs: 'Logs e Auditoria', seguranca: 'Segurança', sistema: 'Sistema',
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-xs text-muted-foreground">WebHubPro ERP / Configurações / {submenuLabels[activeMenu]}</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left sub-nav */}
        <div className="col-span-3">
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden h-fit">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Configurações</span>
            </div>
            <div className="py-2">
              {/* Meu Perfil */}
              <div
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-150 text-sm ${
                  activeMenu === 'meu-perfil' ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setActiveMenu('meu-perfil')}
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span>Meu Perfil</span>
              </div>

              {/* Divider + admin section */}
              <div className="border-t border-border my-2 px-4 py-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Administração</span>
              </div>

              {navItems.filter(i => i.adminOnly).map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 text-sm ${
                    !admin ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    activeMenu === item.id && admin ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  onClick={() => admin ? setActiveMenu(item.id) : undefined}
                  title={!admin ? 'Acesso restrito a administradores' : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {!admin && <Lock className="w-3 h-3 ml-auto text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="col-span-9">
          {isRestricted ? (
            <AccessDeniedScreen />
          ) : (
            <>
              {activeMenu === 'meu-perfil' && <MeuPerfilSection />}
              {activeMenu === 'escritorio' && <EscritorioSection />}
              {activeMenu === 'integracoes' && <IntegracoesSection />}
              {activeMenu === 'logs' && <LogsSection />}
              {activeMenu === 'seguranca' && <SegurancaSection />}
              {activeMenu === 'sistema' && <SistemaSection />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MEU PERFIL
// ═══════════════════════════════════════
function MeuPerfilSection() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToastContext();
  const admin = isAdmin();
  const u = currentUser!;

  const phoneMap: Record<string, string> = {
    'user-001': '(11) 99876-5432',
    'user-002': '(11) 98765-4321',
    'user-003': '(11) 97654-3210',
    'user-004': '(21) 96543-2109',
    'user-005': '(31) 95432-1098',
  };

  const [name, setName] = useState(u.name);
  const [email, setEmail] = useState(u.email);
  const [phone, setPhone] = useState(phoneMap[u.id] || '(11) 90000-0000');
  const [oab, setOab] = useState(u.oab);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwMismatch, setPwMismatch] = useState(false);

  const strength = getPasswordStrength(newPw);

  const handleDiscard = () => {
    setName(u.name); setEmail(u.email); setOab(u.oab);
    setPhone(phoneMap[u.id] || '(11) 90000-0000');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwMismatch(false);
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) { showToast('Preencha os campos obrigatórios', 'error'); return; }
    if (newPw && newPw !== confirmPw) { setPwMismatch(true); showToast('As senhas não coincidem', 'error'); return; }
    if (newPw && !currentPw) { showToast('Informe a senha atual', 'error'); return; }

    const updatedUser = { ...u, name, email, oab };
    localStorage.setItem('whp_current_user', JSON.stringify(updatedUser));

    addAuditLog({
      user_id: u.id, user_name: name, action: 'Atualizou perfil',
      entity: 'Auth', entity_id: u.id, entity_name: name,
      ip: '189.56.78.90', timestamp: new Date().toISOString(),
      status: 'sucesso', details: 'Perfil atualizado pelo próprio usuário'
    });

    setSaved(true); setTimeout(() => setSaved(false), 3000);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    showToast('Perfil atualizado com sucesso');
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Meu Perfil</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Atualize suas informações pessoais</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">Salvo</span>
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
          <div className="relative group">
            <div className={`w-20 h-20 rounded-full ${u.avatar_color} flex items-center justify-center text-white text-2xl font-semibold`}>
              {u.avatar_initials}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Foto do Perfil</p>
            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG até 2MB</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => showToast('Upload disponível após integração', 'info')} className="border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Alterar foto
              </button>
              <button className="text-xs text-red-500 hover:text-red-600">Remover</button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground">Nome Completo*</label>
            <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Seu nome completo" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Email*</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <p className="text-xs text-muted-foreground mt-1">Usado para login e notificações</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Telefone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="(11) 00000-0000" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">OAB</label>
            <input value={oab} onChange={e => setOab(e.target.value)} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="OAB/SP 000.000" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Cargo</label>
            <input value={roleLabels[u.role] || u.role} readOnly className="mt-1 w-full bg-muted cursor-not-allowed text-muted-foreground border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground">Áreas de Atuação</label>
            <p className="text-xs text-muted-foreground mb-2">Suas áreas de atuação principais</p>
            <div className="flex flex-wrap gap-2">
              {u.practice_areas.map(a => (
                <span key={a} className={`${areaBadgeColors[a]} text-sm font-medium px-3 py-1 rounded-full`}>{areaLabels[a]}</span>
              ))}
            </div>
            {admin && <p className="text-xs text-muted-foreground mt-2">Administradores têm acesso a todas as áreas</p>}
          </div>
        </div>

        {/* Change Password */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Alterar Senha</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 relative">
              <label className="text-sm font-medium text-foreground">Senha Atual*</label>
              <div className="relative mt-1">
                <input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-foreground">Nova Senha*</label>
              <div className="relative mt-1">
                <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPw && (
                <div className="mt-1.5">
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${strength.color.split(' ')[1] || ''} ${strength.width} transition-all duration-300`} />
                  </div>
                  <span className={`text-xs mt-1 ${strength.color.split(' ')[0] || ''}`}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-foreground">Confirmar Nova Senha*</label>
              <div className="relative mt-1">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwMismatch(false); }} onBlur={() => { if (confirmPw && confirmPw !== newPw) setPwMismatch(true); }} className={`w-full border rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${pwMismatch ? 'border-red-300' : 'border-border'}`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwMismatch && <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4 bg-muted flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Campos marcados com * são obrigatórios</span>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDiscard} className="border border-border text-muted-foreground rounded-md px-4 py-2 text-sm hover:bg-muted">Descartar</button>
          <button onClick={handleSave} className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ESCRITÓRIO
// ═══════════════════════════════════════
function EscritorioSection() {
  const { showToast } = useToastContext();
  const { currentUser } = useAuth();
  const [office, setOffice] = useState<Office>(loadOffice);

  const handleSave = () => {
    if (!office.name || !office.cnpj || !office.email) { showToast('Preencha os campos obrigatórios', 'error'); return; }
    saveOffice(office);
    addAuditLog({
      user_id: currentUser!.id, user_name: currentUser!.name,
      action: 'Alterou configurações', entity: 'Sistema', entity_id: office.id,
      entity_name: office.name, ip: '189.56.78.90',
      timestamp: new Date().toISOString(), status: 'sucesso',
      details: 'Atualizou dados do escritório'
    });
    showToast('Dados do escritório atualizados');
  };

  const toggleArea = (area: 'trabalhista' | 'civil' | 'criminal' | 'previdenciario' | 'tributario') => {
    setOffice(prev => ({
      ...prev,
      active_areas: prev.active_areas.includes(area)
        ? prev.active_areas.filter(a => a !== area)
        : [...prev.active_areas, area]
    }));
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Escritório</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Dados e configurações do escritório</p>
      </div>

      <div className="px-6 py-6">
        {/* Logo upload */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
          <div className="w-20 h-20 rounded-xl border-2 border-border bg-muted flex items-center justify-center relative cursor-pointer hover:border-blue-300 transition-colors group">
            <Building2 className="w-8 h-8 text-muted-foreground" />
            <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Logo do Escritório</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, SVG até 5MB</p>
            <p className="text-xs text-muted-foreground mt-0.5">Recomendado: 200x200px</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => showToast('Upload disponível após integração', 'info')} className="border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Alterar logo
              </button>
              <button className="text-xs text-red-500 hover:text-red-600">Remover</button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground">Nome do Escritório*</label>
            <input value={office.name} onChange={e => setOffice({ ...office, name: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">CNPJ*</label>
            <input value={office.cnpj} onChange={e => setOffice({ ...office, cnpj: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Email*</label>
            <input value={office.email} onChange={e => setOffice({ ...office, email: e.target.value })} type="email" className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Telefone</label>
            <input value={office.phone} onChange={e => setOffice({ ...office, phone: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="(00) 0000-0000" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Site</label>
            <input value={office.website} onChange={e => setOffice({ ...office, website: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="www.seusite.com.br" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground">Endereço*</label>
            <input value={office.address} onChange={e => setOffice({ ...office, address: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Rua, número, complemento" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Cidade*</label>
            <input value={office.city} onChange={e => setOffice({ ...office, city: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Estado*</label>
            <select value={office.state} onChange={e => setOffice({ ...office, state: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring">
              {BRAZILIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">CEP</label>
            <input value={office.cep} onChange={e => setOffice({ ...office, cep: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="00000-000" />
          </div>
        </div>

        {/* Areas */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">Áreas de Atuação do Escritório</h3>
          <p className="text-sm text-muted-foreground mb-4">Ative as áreas em que o escritório opera</p>
          <div className="grid grid-cols-2 gap-3">
            {(['trabalhista', 'civil', 'criminal', 'previdenciario', 'tributario'] as const).map(area => {
              const active = office.active_areas.includes(area);
              return (
                <div key={area} onClick={() => toggleArea(area)} className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors ${active ? 'border-blue-200 bg-blue-50/30' : 'border-border'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${active ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{areaLabels[area]}</p>
                      <p className="text-xs text-muted-foreground">{areaDescriptions[area]}</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${active ? 'bg-blue-600' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 bg-muted flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Campos marcados com * são obrigatórios</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setOffice(loadOffice())} className="border border-border text-muted-foreground rounded-md px-4 py-2 text-sm hover:bg-muted">Descartar</button>
          <button onClick={handleSave} className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// INTEGRAÇÕES
// ═══════════════════════════════════════
function IntegracoesSection() {
  const { showToast } = useToastContext();
  const [integracoes, setIntegracoes] = useState<Integracao[]>(loadIntegracoes);
  const [configModal, setConfigModal] = useState<Integracao | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleStatus = (id: string) => {
    const updated = integracoes.map(i => {
      if (i.id !== id) return i;
      if (i.status === 'conectado') {
        return { ...i, status: 'desconectado' as const, last_sync: '' };
      } else {
        // Open config modal for connecting
        setConfigModal(i);
        setConfigValues({ ...i.config });
        return i;
      }
    });
    setIntegracoes(updated);
    saveIntegracoes(updated);
  };

  const openConfig = (i: Integracao) => {
    setConfigModal(i);
    setConfigValues({ ...i.config });
    setShowSecrets({});
  };

  const saveConfig = () => {
    if (!configModal) return;
    const updated = integracoes.map(i => {
      if (i.id !== configModal.id) return i;
      return { ...i, config: configValues, status: 'conectado' as const, last_sync: new Date().toISOString() };
    });
    setIntegracoes(updated);
    saveIntegracoes(updated);
    setConfigModal(null);
    showToast('Configuração salva com sucesso');
  };

  const syncIntegration = (id: string) => {
    const updated = integracoes.map(i => i.id === id ? { ...i, last_sync: new Date().toISOString() } : i);
    setIntegracoes(updated);
    saveIntegracoes(updated);
    showToast('Sincronizando...', 'info');
  };

  const statusDot: Record<string, string> = {
    conectado: 'bg-green-500', desconectado: 'bg-muted-foreground', erro: 'bg-red-500', pendente: 'bg-amber-400 animate-pulse'
  };
  const statusText: Record<string, { label: string; cls: string }> = {
    conectado: { label: 'Conectado', cls: 'text-green-600' },
    desconectado: { label: 'Desconectado', cls: 'text-muted-foreground' },
    erro: { label: 'Erro', cls: 'text-red-600' },
    pendente: { label: 'Pendente', cls: 'text-amber-600' },
  };

  const isSecretField = (key: string) => /key|secret|token|password/i.test(key);

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Integrações</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Conecte o WebHubPro com ferramentas externas</p>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          {integracoes.map(integ => {
            const Icon = integrationIcons[integ.name] || Plug;
            const iconColor = integrationIconColors[integ.name] || 'text-muted-foreground';
            const st = statusText[integ.status];
            const dt = integ.last_sync ? formatDateTime(integ.last_sync) : null;

            return (
              <div key={integ.id} className="bg-card border border-border rounded-xl p-5 hover:border-border hover:shadow-sm transition-all duration-150">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{integ.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{integ.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusDot[integ.status]}`} />
                    <span className={`text-xs ${st.cls}`}>{st.label}</span>
                  </div>
                </div>

                {integ.status === 'conectado' && dt && (
                  <div className="flex items-center gap-1 mb-3">
                    <RefreshCw className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Sincronizado: {dt.short}</span>
                  </div>
                )}

                {integ.status === 'erro' && (
                  <div className="bg-red-50 border border-red-100 rounded-md p-2 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-red-600">Falha na conexão. Reconfigure as credenciais.</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div onClick={() => toggleStatus(integ.id)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${integ.status === 'conectado' ? 'bg-green-500' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-transform duration-200 ${integ.status === 'conectado' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <button onClick={() => openConfig(integ)} className="border border-border text-muted-foreground hover:bg-muted rounded-md px-3 py-1.5 text-xs flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> Configurar
                  </button>
                  {integ.status === 'conectado' && (
                    <button onClick={() => syncIntegration(integ.id)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Config Modal */}
      {configModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setConfigModal(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 relative z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                {(() => { const I = integrationIcons[configModal.name] || Plug; return <I className={`w-5 h-5 ${integrationIconColors[configModal.name] || 'text-muted-foreground'}`} />; })()}
                <h3 className="text-lg font-semibold text-foreground">{configModal.name}</h3>
              </div>
              <button onClick={() => setConfigModal(null)} className="text-muted-foreground hover:text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {Object.keys(configValues).map(key => (
                <div key={key}>
                  <label className="text-sm font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}</label>
                  <div className="relative mt-1">
                    <input
                      type={isSecretField(key) && !showSecrets[key] ? 'password' : 'text'}
                      value={configValues[key]}
                      onChange={e => setConfigValues({ ...configValues, [key]: e.target.value })}
                      className="w-full border border-border rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {isSecretField(key) && (
                      <button type="button" onClick={() => setShowSecrets({ ...showSecrets, [key]: !showSecrets[key] })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showSecrets[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-amber-700">Nunca compartilhe suas chaves de API.</span>
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setConfigModal(null)} className="text-muted-foreground text-sm px-4 py-2 hover:bg-muted rounded-md">Cancelar</button>
              <button onClick={saveConfig} className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700">Salvar Configuração</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// LOGS E AUDITORIA
// ═══════════════════════════════════════
function LogsSection() {
  const { showToast } = useToastContext();
  const [logs, setLogs] = useState<AuditLog[]>(loadAuditLogs);
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const hasFilters = search || filterUser || filterAction || filterStatus || filterPeriod;

  const filtered = useMemo(() => {
    let result = [...logs];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => l.user_name.toLowerCase().includes(s) || l.action.toLowerCase().includes(s) || l.entity_name.toLowerCase().includes(s));
    }
    if (filterUser) result = result.filter(l => l.user_id === filterUser);
    if (filterAction) result = result.filter(l => l.action.toLowerCase().includes(filterAction.toLowerCase()));
    if (filterStatus) result = result.filter(l => l.status === filterStatus);
    if (filterPeriod) {
      const now = new Date();
      result = result.filter(l => {
        const d = new Date(l.timestamp);
        if (filterPeriod === 'hoje') return d.toDateString() === now.toDateString();
        if (filterPeriod === 'semana') { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
        if (filterPeriod === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filterPeriod === '3meses') { const m = new Date(now); m.setMonth(m.getMonth() - 3); return d >= m; }
        return true;
      });
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return result;
  }, [logs, search, filterUser, filterAction, filterStatus, filterPeriod]);

  const totalPages = Math.ceil(filtered.length / 10);
  const paged = filtered.slice(page * 10, (page + 1) * 10);

  const clearFilters = () => { setSearch(''); setFilterUser(''); setFilterAction(''); setFilterStatus(''); setFilterPeriod(''); setPage(0); };

  const getUserColor = (uid: string) => MOCK_USERS.find(u => u.id === uid)?.avatar_color || 'bg-muted';
  const getUserName = (uid: string) => MOCK_USERS.find(u => u.id === uid)?.name || '';

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Logs e Auditoria</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Histórico de ações realizadas no sistema</p>
        </div>
        <button onClick={() => showToast('Exportando logs...', 'info')} className="border border-border text-muted-foreground hover:bg-muted rounded-md px-3 py-2 text-sm flex items-center gap-1.5">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-muted border-b border-border p-3 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="w-full border border-border rounded-md pl-9 pr-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Buscar por usuário, ação ou entidade..." />
          <FileText className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(0); }} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
          <option value="">Todos os usuários</option>
          {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
          <option value="">Todas as ações</option>
          <option value="Login">Login</option>
          <option value="Criou">Criou</option>
          <option value="Editou">Editou</option>
          <option value="Excluiu">Excluiu</option>
          <option value="Registrou pagamento">Registrou pagamento</option>
          <option value="Acesso negado">Acesso negado</option>
          <option value="Alterou configurações">Alterou configurações</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
          <option value="">Todos os status</option>
          <option value="sucesso">Sucesso</option>
          <option value="erro">Erro</option>
        </select>
        <select value={filterPeriod} onChange={e => { setFilterPeriod(e.target.value); setPage(0); }} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
          <option value="">Tudo</option>
          <option value="hoje">Hoje</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="3meses">Últimos 3 meses</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="w-12 h-12 text-muted mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">Nenhum log encontrado</h3>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left">Data/Hora</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left">Usuário</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left">Ação</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left">Entidade</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left">IP</th>
                  <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(log => {
                  const dt = formatDateTime(log.timestamp);
                  const isExpanded = expandedRow === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-muted transition-colors border-b border-border cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : log.id)}>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-foreground font-medium">{dt.date}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{dt.time}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <UserAvatar name={log.user_name} color={getUserColor(log.user_id)} size="sm" />
                            <span className="text-sm text-foreground">{log.user_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-foreground">{log.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-36">{log.entity_name}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`${entityBadgeColors[log.entity] || 'bg-muted text-muted-foreground'} text-xs font-medium px-2 py-0.5 rounded-full`}>{log.entity}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-muted-foreground">{log.ip}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`${log.status === 'sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs font-medium px-2 py-0.5 rounded-full`}>
                            {log.status === 'sucesso' ? 'Sucesso' : 'Erro'}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-muted px-4 py-3 border-b border-border">
                            <span className="text-xs text-muted-foreground font-medium">Detalhes: </span>
                            <span className="text-sm text-foreground">{log.details}</span>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mostrando {page * 10 + 1}–{Math.min((page + 1) * 10, filtered.length)} de {filtered.length} registros</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SEGURANÇA
// ═══════════════════════════════════════
function SegurancaSection() {
  const { showToast } = useToastContext();
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<SystemConfig>(loadSystemConfig);
  const [sessoes, setSessoes] = useState<Sessao[]>(loadSessoes);
  const [sessionTimeout, setSessionTimeout] = useState(String(config.session_timeout));
  const [showEndAllModal, setShowEndAllModal] = useState(false);

  const [passwordPolicies, setPasswordPolicies] = useState({
    minLength: config.password_min_length >= 8,
    specialChars: config.require_special_chars,
    uppercase: config.require_uppercase,
    periodicRenewal: false,
  });

  const toggle2FA = () => {
    const newConfig = { ...config, two_factor_enabled: !config.two_factor_enabled };
    setConfig(newConfig);
    saveSystemConfig(newConfig);
    showToast(newConfig.two_factor_enabled ? '2FA ativado' : '2FA desativado');
  };

  const saveTimeout = () => {
    const newConfig = { ...config, session_timeout: parseInt(sessionTimeout) };
    setConfig(newConfig);
    saveSystemConfig(newConfig);
    showToast('Timeout de sessão atualizado');
  };

  const endSession = (id: string) => {
    const updated = sessoes.filter(s => s.id !== id);
    setSessoes(updated);
    saveSessoes(updated);
    showToast('Sessão encerrada');
  };

  const endAllSessions = () => {
    const updated = sessoes.filter(s => s.current);
    setSessoes(updated);
    saveSessoes(updated);
    setShowEndAllModal(false);
    showToast(`${sessoes.length - updated.length} sessões encerradas`);
  };

  const savePasswordPolicy = () => {
    const newConfig = {
      ...config,
      password_min_length: passwordPolicies.minLength ? 8 : 4,
      require_special_chars: passwordPolicies.specialChars,
      require_uppercase: passwordPolicies.uppercase,
    };
    setConfig(newConfig);
    saveSystemConfig(newConfig);
    addAuditLog({
      user_id: currentUser!.id, user_name: currentUser!.name,
      action: 'Alterou configurações', entity: 'Sistema', entity_id: 'security',
      entity_name: 'Política de Senhas', ip: '189.56.78.90',
      timestamp: new Date().toISOString(), status: 'sucesso',
      details: 'Política de senhas atualizada'
    });
    showToast('Política de senhas atualizada');
  };

  const deviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes('iphone') || d.includes('phone')) return <Smartphone className="w-4 h-4 text-muted-foreground mr-1" />;
    if (d.includes('ipad') || d.includes('tablet')) return <Tablet className="w-4 h-4 text-muted-foreground mr-1" />;
    return <Monitor className="w-4 h-4 text-muted-foreground mr-1" />;
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Configure autenticação e políticas de acesso</p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* 2FA */}
        <div className="flex items-start justify-between pb-6 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Autenticação de Dois Fatores (2FA)</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">Adicione uma camada extra de segurança ao login. Recomendado para todos os usuários.</p>
            {config.two_factor_enabled && (
              <div className="mt-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">2FA ativado via Google Authenticator</span>
                <span className="text-xs text-muted-foreground">Configurado em 10/01/2026</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div onClick={toggle2FA} className={`w-14 h-7 rounded-full relative cursor-pointer transition-colors duration-200 ${config.two_factor_enabled ? 'bg-green-500' : 'bg-muted'}`}>
              <div className={`w-6 h-6 rounded-full bg-card shadow absolute top-0.5 transition-transform duration-200 ${config.two_factor_enabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-muted-foreground">{config.two_factor_enabled ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>

        {/* Session Timeout */}
        <div className="pb-6 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Tempo de expiração da sessão</h3>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">Usuários serão desconectados após inatividade</p>
          <div className="flex items-center gap-4">
            <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm bg-card">
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
              <option value="240">4 horas</option>
              <option value="480">8 horas</option>
              <option value="1440">24 horas</option>
              <option value="0">Nunca</option>
            </select>
            <button onClick={saveTimeout} className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700">Salvar</button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="pb-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Sessões Ativas</h3>
            <button onClick={() => setShowEndAllModal(true)} className="border border-red-200 text-red-600 hover:bg-red-50 rounded-md px-3 py-1.5 text-xs">Encerrar Todas</button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-xs uppercase text-muted-foreground tracking-wide px-4 py-3 text-left">Usuário</th>
                  <th className="text-xs uppercase text-muted-foreground tracking-wide px-4 py-3 text-left">Dispositivo</th>
                  <th className="text-xs uppercase text-muted-foreground tracking-wide px-4 py-3 text-left">Navegador</th>
                  <th className="text-xs uppercase text-muted-foreground tracking-wide px-4 py-3 text-left">IP</th>
                  <th className="text-xs uppercase text-muted-foreground tracking-wide px-4 py-3 text-left">Último Acesso</th>
                  <th className="text-xs uppercase text-muted-foreground tracking-wide px-4 py-3 text-left">Ação</th>
                </tr>
              </thead>
              <tbody>
                {sessoes.map(s => {
                  const dt = formatDateTime(s.last_access);
                  return (
                    <tr key={s.id} className="border-b border-border">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={s.user_name} color={MOCK_USERS.find(u => u.id === s.user_id)?.avatar_color || 'bg-muted-foreground'} size="sm" />
                          <span className="text-sm text-foreground">{s.user_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><div className="flex items-center">{deviceIcon(s.device)}<span className="text-sm text-muted-foreground">{s.device}</span></div></td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{s.browser}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{s.ip}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-muted-foreground">{dt.short}</span>
                        {s.current && <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">ESTA SESSÃO</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {s.current ? (
                          <span className="text-xs text-muted-foreground cursor-not-allowed">Sessão atual</span>
                        ) : (
                          <button onClick={() => endSession(s.id)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-md px-2.5 py-1">Encerrar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Policy */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">Política de Senhas</h3>
          <div className="space-y-3">
            {[
              { key: 'minLength' as const, icon: Key, label: 'Mínimo 8 caracteres', desc: 'Senhas devem ter ao menos 8 caracteres' },
              { key: 'specialChars' as const, icon: Type, label: 'Caracteres especiais', desc: 'Exigir ao menos um caractere especial (!@#$)' },
              { key: 'uppercase' as const, icon: ArrowUp, label: 'Letras maiúsculas', desc: 'Exigir ao menos uma letra maiúscula' },
              { key: 'periodicRenewal' as const, icon: RefreshCw, label: 'Renovação periódica', desc: 'Exigir troca de senha a cada 90 dias' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <div onClick={() => setPasswordPolicies(p => ({ ...p, [item.key]: !p[item.key] }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${passwordPolicies[item.key] ? 'bg-blue-600' : 'bg-muted'}`}>
                  <div className={`w-4 h-4 rounded-full bg-card shadow absolute top-0.5 transition-transform duration-200 ${passwordPolicies[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={savePasswordPolicy} className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700 mt-4">Salvar Política</button>
        </div>
      </div>

      {/* End all sessions modal */}
      {showEndAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowEndAllModal(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 relative z-10" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Encerrar todas as sessões?</h3>
            <p className="text-sm text-muted-foreground mb-5">Todas as sessões exceto a atual serão encerradas.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndAllModal(false)} className="flex-1 border border-border text-muted-foreground rounded-md py-2 text-sm hover:bg-muted">Cancelar</button>
              <button onClick={endAllSessions} className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700">Encerrar Todas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SISTEMA
// ═══════════════════════════════════════
function SistemaSection() {
  const { showToast } = useToastContext();
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<SystemConfig>(loadSystemConfig);
  const office = loadOffice();
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerInput, setDangerInput] = useState('');

  const savePreferences = () => {
    saveSystemConfig(config);
    addAuditLog({
      user_id: currentUser!.id, user_name: currentUser!.name,
      action: 'Alterou configurações', entity: 'Sistema', entity_id: 'preferences',
      entity_name: 'Preferências do Sistema', ip: '189.56.78.90',
      timestamp: new Date().toISOString(), status: 'sucesso',
      details: 'Preferências do sistema atualizadas'
    });
    showToast('Preferências atualizadas');
  };

  const exportJSON = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('whp_')) {
        try { data[key] = JSON.parse(localStorage.getItem(key)!); } catch { data[key] = localStorage.getItem(key); }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url; a.download = `webhubpro-backup-${today}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('Exportação concluída');
  };

  const clearData = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('whp_')) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    showToast('Dados removidos');
    setTimeout(() => window.location.reload(), 1500);
  };

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType; iconColor: string; disabled?: boolean }[] = [
    { value: 'light', label: 'Claro', icon: Sun, iconColor: 'text-amber-400' },
    { value: 'dark', label: 'Escuro', icon: Moon, iconColor: 'text-foreground', disabled: true },
    { value: 'system', label: 'Sistema', icon: Monitor, iconColor: 'text-muted-foreground', disabled: true },
  ];

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Sistema</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Configurações gerais e informações do sistema</p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* System Info */}
        <div className="pb-6 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Informações do Sistema</h3>
          <div className="bg-muted rounded-xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Versão</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-2">
                  WebHubPro ERP v{config.app_version}
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Atualizado</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Ambiente</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-2">
                  Produção
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Estável</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Banco de Dados</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-2">
                  localStorage (Demo)
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Demo Mode</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Última Atualização</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">23/02/2026</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Licença</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-2">
                  Plano Profissional
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">Ativo</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Escritório</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{office.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="pb-6 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Preferências do Sistema</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-foreground">Fuso Horário</label>
              <div className="relative mt-1">
                <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <select value={config.timezone} onChange={e => setConfig({ ...config, timezone: e.target.value })} className="w-full border border-border rounded-md pl-9 pr-3 py-2 text-sm bg-card">
                  <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                  <option value="America/Manaus">America/Manaus</option>
                  <option value="America/Belem">America/Belem</option>
                  <option value="America/Fortaleza">America/Fortaleza</option>
                  <option value="America/Recife">America/Recife</option>
                  <option value="America/Noronha">America/Noronha</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Idioma</label>
              <select value={config.language} onChange={e => setConfig({ ...config, language: e.target.value })} className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">Aparência</label>
              <div className="flex gap-3">
                {themeOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => !opt.disabled && setConfig({ ...config, theme: opt.value })}
                    className={`border-2 rounded-xl p-3 cursor-pointer transition-all w-full text-center ${
                      config.theme === opt.value ? 'border-blue-600 bg-blue-50' : 'border-border'
                    } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={opt.disabled ? 'Disponível na próxima versão' : undefined}
                  >
                    <opt.icon className={`w-5 h-5 mx-auto mb-1 ${config.theme === opt.value ? opt.iconColor : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Dark mode estará disponível na próxima versão</p>
            </div>
          </div>
          <button onClick={savePreferences} className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700 mt-4">Salvar Preferências</button>
        </div>

        {/* Backup & Data */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">Backup e Exportação de Dados</h3>
          <div className="space-y-3">
            {/* Backup frequency */}
            <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Frequência de Backup</p>
                  <p className="text-xs text-muted-foreground">Último backup: {formatDate(config.last_backup.slice(0, 10))}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={config.backup_frequency} onChange={e => setConfig({ ...config, backup_frequency: e.target.value as 'daily' | 'weekly' | 'manual' })} className="border border-border rounded-md px-3 py-1.5 text-sm bg-card">
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="manual">Manual</option>
                </select>
                <button onClick={() => showToast('Backup iniciado...', 'info')} className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap">Fazer backup agora</button>
              </div>
            </div>

            {/* Export */}
            <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Exportar Todos os Dados</p>
                  <p className="text-xs text-muted-foreground">Exporta clientes, processos, financeiro e configurações em JSON</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={exportJSON} className="border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> JSON
                </button>
                <button onClick={() => showToast('Exportação CSV disponível na versão completa', 'info')} className="border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-700">Limpar Dados de Demonstração</p>
                  <p className="text-xs text-red-400">Remove todos os dados mock e reinicia o sistema para configuração inicial</p>
                </div>
              </div>
              <button onClick={() => setShowDangerModal(true)} className="border border-red-300 text-red-600 hover:bg-red-100 rounded-md px-3 py-1.5 text-xs flex items-center gap-1">
                <Trash className="w-3.5 h-3.5" /> Limpar Dados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger confirmation modal */}
      {showDangerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowDangerModal(false); setDangerInput(''); }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 relative z-10" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground text-center mb-1">Tem certeza absoluta?</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">Digite <strong>CONFIRMAR</strong> para prosseguir</p>
            <input value={dangerInput} onChange={e => setDangerInput(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="CONFIRMAR" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDangerModal(false); setDangerInput(''); }} className="flex-1 border border-border text-muted-foreground rounded-md py-2 text-sm hover:bg-muted">Cancelar</button>
              <button disabled={dangerInput !== 'CONFIRMAR'} onClick={clearData} className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">Limpar todos os dados</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
