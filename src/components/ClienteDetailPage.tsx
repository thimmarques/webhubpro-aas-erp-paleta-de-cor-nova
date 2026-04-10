import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Star,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  MessageCircle,
  Plus,
  Briefcase,
  Scale,
  AlertCircle,
  Smile,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  StickyNote,
  FolderOpen,
  Inbox,
  X,
  AlertTriangle,
  Trash2,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { MOCK_USERS } from '@/data/mockUsers';
import { loadClientes, saveClientes } from '@/data/mockClientes';
import { getProcessos, saveProcessos } from '@/data/mockProcessos';
import { loadAtividades, saveAtividades, Atividade } from '@/data/mockAtividades';
import {
  Cliente,
  getClienteName,
  getClienteDoc,
  getClienteEmail,
  maskCpf,
  maskCnpj,
  getPoloLabel,
  formatBRL,
} from '@/types/cliente';
import {
  Processo,
  statusLabels,
  statusColors,
  areaColors,
  areaLabels,
  faseLabels,
} from '@/types/processo';
import StatusBadge from './StatusBadge';
import UserAvatar from './UserAvatar';
import EmptyState from './EmptyState';
import ClienteSlideOver from './ClienteSlideOver';

/* ── helpers ── */

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—';
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

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function daysDiff(dateStr: string): number {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const tipoLabels: Record<string, string> = {
  processo_criado: 'PROCESSO',
  audiencia_realizada: 'AUDIÊNCIA',
  documento_enviado: 'DOCUMENTO',
  prazo_cumprido: 'PRAZO',
  anotacao: 'ANOTAÇÃO',
  contato: 'CONTATO',
  peticao_protocolada: 'PETIÇÃO',
  decisao_recebida: 'DECISÃO',
};

const tipoDotColors: Record<string, string> = {
  processo_criado: 'bg-blue-500',
  audiencia_realizada: 'bg-purple-500',
  documento_enviado: 'bg-muted-foreground',
  prazo_cumprido: 'bg-green-500',
  anotacao: 'bg-amber-400',
  contato: 'bg-teal-500',
  peticao_protocolada: 'bg-indigo-500',
  decisao_recebida: 'bg-rose-500',
};

const poloColors: Record<string, string> = {
  reclamante: 'bg-blue-50 text-blue-600',
  reclamada: 'bg-red-50 text-red-600',
  reclamada_pf: 'bg-red-50 text-red-600',
  autor: 'bg-purple-50 text-purple-600',
  reu: 'bg-red-50 text-red-600',
  vitima: 'bg-green-50 text-green-600',
  investigado: 'bg-amber-50 text-amber-600',
  terceiro_interessado: 'bg-muted text-muted-foreground',
};

const situacaoLabels: Record<string, string> = {
  solto: 'Solto',
  preso_preventivo: 'Preso preventivo',
  preso_definitivo: 'Preso definitivo',
  liberdade_provisoria: 'Liberdade provisória',
  monitorado_eletronico: 'Monitorado eletronicamente',
};

const situacaoDot: Record<string, string> = {
  solto: 'bg-green-500',
  preso_preventivo: 'bg-red-500',
  preso_definitivo: 'bg-red-500',
  liberdade_provisoria: 'bg-amber-500',
  monitorado_eletronico: 'bg-amber-500',
};

const especieLabels: Record<string, string> = {
  aposentadoria_tempo: 'Aposentadoria por tempo',
  aposentadoria_idade: 'Aposentadoria por idade',
  aposentadoria_invalidez: 'Aposentadoria por invalidez',
  auxilio_doenca: 'Auxílio-doença',
  auxilio_acidente: 'Auxílio-acidente',
  bpc_loas: 'BPC / LOAS',
  pensao_morte: 'Pensão por morte',
  salario_maternidade: 'Salário-maternidade',
};

const demissaoLabels: Record<string, string> = {
  sem_justa_causa: 'Sem justa causa',
  justa_causa: 'Com justa causa',
  pedido_demissao: 'Pedido de demissão',
  rescisao_indireta: 'Rescisão indireta',
  aposentadoria: 'Aposentadoria',
};

const subtipoLabels: Record<string, string> = {
  indenizacao_moral: 'Indenização por dano moral',
  indenizacao_material: 'Indenização por dano material',
  responsabilidade_civil: 'Responsabilidade civil',
  consumidor: 'Direito do consumidor',
  direito_comercial: 'Direito comercial',
  direito_societario: 'Direito societário',
  outros: 'Outros',
};

const faseProcessualLabels: Record<string, string> = {
  inquerito: 'Inquérito policial',
  denuncia: 'Denúncia',
  instrucao: 'Instrução',
  julgamento: 'Julgamento',
  recurso: 'Recurso',
  execucao: 'Execução penal',
};

const tipoSocietarioLabels: Record<string, string> = {
  ltda: 'LTDA',
  sa: 'S.A.',
  eireli: 'EIRELI',
  mei: 'MEI',
  ss: 'Sociedade Simples',
  outros: 'Outros',
};

const estadoCivilLabels: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  viuva: 'Viúvo(a)',
  uniao_estavel: 'União estável',
};

/* ── Props ── */

interface ClienteDetailPageProps {
  clientId: string;
  onBack: () => void;
  onNavigateProcessoDetail?: (id: string) => void;
}

export default function ClienteDetailPage({ clientId, onBack, onNavigateProcessoDetail }: ClienteDetailPageProps) {
  const { currentUser } = useAuth();
  const { showToast } = useToastContext();

  const [allClientes, setAllClientes] = useState<Cliente[]>(() => loadClientes());
  const [allProcessos, setAllProcessos] = useState<Processo[]>(() => getProcessos());
  const [allAtividades, setAllAtividades] = useState<Atividade[]>(() => loadAtividades());
  const [activeTab, setActiveTab] = useState<'resumo' | 'processos' | 'historico' | 'documentos'>('resumo');

  // slide-over
  const [slideOpen, setSlideOpen] = useState(false);
  // delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  // new annotation modal
  const [annotationModal, setAnnotationModal] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  // historico filters
  const [histTipoFilter, setHistTipoFilter] = useState('');
  const [histProcessoFilter, setHistProcessoFilter] = useState('');
  // dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const cliente = allClientes.find((c) => c.id === clientId);

  const relatedProcessos = useMemo(
    () => allProcessos.filter((p) => p.polo_ativo_id === clientId),
    [allProcessos, clientId]
  );

  const relatedAtividades = useMemo(
    () => allAtividades.filter((a) => a.client_id === clientId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [allAtividades, clientId]
  );

  // 404
  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Inbox className="w-16 h-16 text-muted mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Cliente não encontrado</h2>
        <button onClick={onBack} className="mt-4 text-sm text-blue-600 hover:text-blue-700">← Voltar para Clientes</button>
      </div>
    );
  }

  const name = getClienteName(cliente);
  const doc = getClienteDoc(cliente);
  const maskedDoc = cliente.type === 'PF' ? maskCpf(doc) : maskCnpj(doc);
  const email = getClienteEmail(cliente);
  const phone = (cliente as any).phone || '';
  const address = (cliente as any).address || '';
  const polo = (cliente as any).polo || '';
  const city = address.includes('—') ? address.split('—').pop()?.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const responsible = MOCK_USERS.find((u) => u.id === cliente.responsible_id);

  // KPIs
  const activeProcessCount = relatedProcessos.filter((p) => p.status !== 'encerrado').length;

  const nearestAudiencia = relatedProcessos
    .filter((p) => p.proxima_audiencia && new Date(p.proxima_audiencia) >= new Date())
    .sort((a, b) => new Date(a.proxima_audiencia).getTime() - new Date(b.proxima_audiencia).getTime())[0];

  const nearestPrazo = relatedProcessos
    .filter((p) => p.prazo_fatal)
    .sort((a, b) => new Date(a.prazo_fatal).getTime() - new Date(b.prazo_fatal).getTime())
    .find((p) => daysDiff(p.prazo_fatal) >= 0) || relatedProcessos.filter((p) => p.prazo_fatal).sort((a, b) => new Date(b.prazo_fatal).getTime() - new Date(a.prazo_fatal).getTime())[0];

  const prazoDiff = nearestPrazo ? daysDiff(nearestPrazo.prazo_fatal) : Infinity;
  const prazoColor = prazoDiff <= 3 ? 'text-red-600' : prazoDiff <= 7 ? 'text-amber-600' : 'text-foreground';

  // handlers
  const handleSaveCliente = (c: Cliente) => {
    const updated = allClientes.map((x) => (x.id === c.id ? c : x));
    setAllClientes(updated);
    saveClientes(updated);
    setSlideOpen(false);
    showToast('Cliente atualizado com sucesso', 'success');
  };

  const handleDelete = () => {
    const updated = allClientes.filter((c) => c.id !== clientId);
    saveClientes(updated);
    setDeleteConfirm(false);
    showToast('Cliente excluído', 'info');
    onBack();
  };

  const handleSaveAnnotation = () => {
    if (!annotationText.trim()) return;
    const newAtv: Atividade = {
      id: 'atv-' + Date.now(),
      client_id: clientId,
      processo_id: '',
      responsible_id: currentUser!.id,
      tipo: 'anotacao',
      descricao: annotationText.trim(),
      data: new Date().toISOString(),
      usuario_nome: currentUser!.name,
    };
    const updated = [...allAtividades, newAtv];
    setAllAtividades(updated);
    saveAtividades(updated);
    setAnnotationText('');
    setAnnotationModal(false);
    showToast('Anotação registrada', 'success');
  };

  const handleEncloseProcesso = (id: string) => {
    const updated = allProcessos.map((p) =>
      p.id === id ? { ...p, status: 'encerrado' as any, updated_at: new Date().toISOString() } : p
    );
    setAllProcessos(updated);
    saveProcessos(updated);
    setOpenDropdown(null);
    showToast('Processo encerrado', 'info');
  };

  /* ── Prazo cell renderer ── */
  const renderPrazo = (prazo: string) => {
    if (!prazo) return <span className="text-muted-foreground">—</span>;
    const diff = daysDiff(prazo);
    if (diff <= 0) return <span className="bg-red-100 text-red-700 rounded-md px-2 py-0.5 text-xs font-semibold">VENCIDO</span>;
    if (diff <= 3) return <span className="bg-red-100 text-red-700 rounded-md px-2 py-0.5 text-xs font-semibold inline-flex items-center gap-1"><Flame className="w-3 h-3" />{diff} {diff === 1 ? 'dia' : 'dias'}</span>;
    if (diff <= 7) return <span className="bg-amber-100 text-amber-700 rounded-md px-2 py-0.5 text-xs font-medium">{diff} dias</span>;
    return <span className="text-sm text-muted-foreground">{formatDateBR(prazo)}</span>;
  };

  const renderAudiencia = (aud: string) => {
    if (!aud) return <span className="text-muted-foreground">—</span>;
    const diff = daysDiff(aud);
    const isUrgent = diff >= 0 && diff <= 3;
    return (
      <div className="flex items-center gap-1">
        {isUrgent && <AlertCircle className="w-3 h-3 text-amber-500" />}
        <div>
          <div className="text-sm text-foreground">{formatDateBR(aud)}</div>
          <div className="text-xs text-muted-foreground">{formatTimeBR(aud)}</div>
        </div>
      </div>
    );
  };

  /* ── Timeline renderer ── */
  const renderTimeline = (items: Atividade[], limit?: number) => {
    const display = limit ? items.slice(0, limit) : items;
    if (display.length === 0) {
      return (
        <div className="py-8 text-center">
          <Clock className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
        </div>
      );
    }
    return (
      <div className="border-l-2 border-border ml-3">
        {display.map((atv, i) => (
          <div key={atv.id} className={`relative pl-4 ${i < display.length - 1 ? 'pb-4' : ''}`}>
            <span className={`absolute -left-[5px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${tipoDotColors[atv.tipo] || 'bg-muted-foreground'}`} />
            <div className="ml-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">{tipoLabels[atv.tipo] || atv.tipo}</p>
              <p className="text-sm text-foreground leading-snug">{atv.descricao}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatDateBR(atv.data)} às {formatTimeBR(atv.data)}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{atv.usuario_nome}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* ── Processos table (shared between Resumo and Processos tab) ── */
  const renderProcessosTable = (procs: Processo[], showEmpty = true) => {
    if (procs.length === 0 && showEmpty) {
      return (
        <EmptyState
          icon={Briefcase}
          title="Nenhum processo vinculado"
          subtitle="Clique em + Novo Processo para começar"
          ctaLabel="+ Novo Processo"
          onCta={() => {}}
        />
      );
    }
    return (
      <table className="w-full">
        <thead>
          <tr className="bg-muted border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Processo</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Ação</th>
            {activeTab === 'processos' && (
              <>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Área</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Tribunal</th>
              </>
            )}
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">
              {activeTab === 'processos' ? 'Vara' : 'Vara'}
            </th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Status</th>
            {activeTab === 'processos' && (
              <>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Próx. Audiência</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Prazo Fatal</th>
              </>
            )}
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Ações</th>
          </tr>
        </thead>
        <tbody>
          {procs.map((proc) => (
            <tr key={proc.id} className="hover:bg-muted transition-colors border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="font-mono text-xs font-semibold text-foreground tracking-tight">{proc.numero_cnj || '—'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-muted-foreground truncate max-w-36">{proc.acao}</div>
                {activeTab === 'resumo' && (
                  <span className={`${areaColors[proc.practice_area]} text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block`}>
                    {areaLabels[proc.practice_area]}
                  </span>
                )}
              </td>
              {activeTab === 'processos' && (
                <>
                  <td className="px-4 py-3">
                    <span className={`${areaColors[proc.practice_area]} text-xs font-medium px-2 py-0.5 rounded-full`}>
                      {areaLabels[proc.practice_area]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-md">{proc.tribunal}</span>
                  </td>
                </>
              )}
              <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-32">{proc.vara}</td>
              <td className="px-4 py-3">
                <span className={`${statusColors[proc.status]} text-xs font-medium px-2 py-0.5 rounded-full`}>
                  {statusLabels[proc.status]}
                </span>
              </td>
              {activeTab === 'processos' && (
                <>
                  <td className="px-4 py-3">{renderAudiencia(proc.proxima_audiencia)}</td>
                  <td className="px-4 py-3">{renderPrazo(proc.prazo_fatal)}</td>
                </>
              )}
              <td className="px-4 py-3">
                <div className="relative">
                  <button onClick={() => setOpenDropdown(openDropdown === proc.id ? null : proc.id)} className="text-muted-foreground hover:text-muted-foreground p-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openDropdown === proc.id && (
                    <div className="absolute right-0 top-8 bg-card border border-border shadow-lg rounded-lg py-1 z-10 w-44">
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted w-full" onClick={() => { setOpenDropdown(null); onNavigateProcessoDetail?.(proc.id); }}>
                        <Eye className="w-4 h-4" /> Ver Detalhes
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted w-full" onClick={() => setOpenDropdown(null)}>
                        <Scale className="w-4 h-4" /> Nova Audiência
                      </button>
                      <div className="my-1 border-t border-border" />
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted w-full" onClick={() => handleEncloseProcesso(proc.id)}>
                        <CheckCircle className="w-4 h-4" /> Encerrar
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  /* ── Dados cadastrais card ── */
  const renderDadosCadastrais = () => {
    const fields: { label: string; value: React.ReactNode }[] = [];

    fields.push({ label: 'TIPO', value: cliente.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica' });
    fields.push({ label: 'ÁREA', value: <StatusBadge variant={cliente.practice_area} /> });
    fields.push({ label: 'POLO', value: getPoloLabel(polo) });
    fields.push({
      label: 'STATUS',
      value: (
        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cliente.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
          {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      ),
    });
    fields.push({ label: 'CLIENTE DESDE', value: formatDateBR(cliente.created_at) });
    fields.push({
      label: 'RESPONSÁVEL',
      value: responsible ? (
        <div className="flex items-center gap-2">
          <UserAvatar name={responsible.name} color={responsible.avatar_color} size="sm" />
          <span className="text-sm text-foreground">{responsible.name}</span>
        </div>
      ) : '—',
    });

    // PF fields
    if (cliente.type === 'PF') {
      const pf = cliente as any;
      fields.push({ label: '', value: null }); // divider marker
      fields.push({ label: 'CPF', value: maskedDoc });
      fields.push({ label: 'RG', value: pf.rg || '—' });
      fields.push({ label: 'NASCIMENTO', value: pf.nascimento ? formatDateBR(pf.nascimento) : '—' });
      fields.push({ label: 'ESTADO CIVIL', value: estadoCivilLabels[pf.estado_civil] || pf.estado_civil || '—' });
      fields.push({ label: 'EMAIL', value: email || '—' });
      fields.push({ label: 'TELEFONE', value: phone || '—' });
      fields.push({ label: 'ENDEREÇO', value: address || '—' });
    }

    // Area-specific
    if (cliente.practice_area === 'trabalhista' && cliente.type === 'PF') {
      const c = cliente as any;
      fields.push({ label: '__SECTION__', value: 'Dados Trabalhistas' });
      fields.push({ label: 'CTPS', value: c.ctps || '—' });
      fields.push({ label: 'CARGO', value: c.cargo || '—' });
      fields.push({ label: 'SALÁRIO', value: c.salario ? formatBRL(c.salario) : '—' });
      fields.push({ label: 'ADMISSÃO', value: formatDateBR(c.data_admissao) });
      fields.push({ label: 'DEMISSÃO', value: formatDateBR(c.data_demissao) });
      fields.push({ label: 'TIPO DEMISSÃO', value: demissaoLabels[c.tipo_demissao] || c.tipo_demissao || '—' });
      if (c.polo === 'reclamante') {
        fields.push({ label: 'EMPRESA RECLAMADA', value: c.empresa_reclamada || '—' });
      }
    }

    if (cliente.practice_area === 'trabalhista' && cliente.type === 'PJ') {
      const c = cliente as any;
      fields.push({ label: '', value: null });
      fields.push({ label: 'CNPJ', value: maskedDoc });
      fields.push({ label: 'REPRESENTANTE', value: c.representante_legal || '—' });
      fields.push({ label: 'RAMO', value: c.ramo_atividade || '—' });
      fields.push({ label: 'FUNCIONÁRIOS', value: c.numero_funcionarios ? `${c.numero_funcionarios} aprox.` : '—' });
      fields.push({ label: 'SINDICATO', value: c.sindicato_patronal || '—' });
    }

    if (cliente.practice_area === 'civil' && cliente.type === 'PF') {
      const c = cliente as any;
      fields.push({ label: '__SECTION__', value: 'Dados Civis' });
      fields.push({ label: 'PROFISSÃO', value: c.profissao || '—' });
      fields.push({ label: 'RENDA', value: c.renda_mensal ? formatBRL(c.renda_mensal) : '—' });
      fields.push({ label: 'SUBTIPO', value: subtipoLabels[c.subtipo] || c.subtipo || '—' });
    }

    if (cliente.practice_area === 'civil' && cliente.type === 'PJ') {
      const c = cliente as any;
      fields.push({ label: '', value: null });
      fields.push({ label: 'CNPJ', value: maskedDoc });
      fields.push({ label: 'TIPO SOCIETÁRIO', value: tipoSocietarioLabels[c.tipo_societario] || c.tipo_societario?.toUpperCase() || '—' });
      fields.push({ label: 'REPRESENTANTE', value: c.representante_legal || '—' });
      fields.push({ label: 'RAMO', value: c.ramo_atividade || '—' });
      fields.push({ label: 'SUBTIPO', value: subtipoLabels[c.subtipo] || c.subtipo || '—' });
    }

    if (cliente.practice_area === 'criminal') {
      const c = cliente as any;
      fields.push({ label: '__SECTION__', value: 'Dados Criminais' });
      fields.push({ label: 'POLO', value: getPoloLabel(c.polo) });
      fields.push({
        label: 'SITUAÇÃO',
        value: (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${situacaoDot[c.situacao_prisional] || 'bg-muted-foreground'}`} />
            <span>{situacaoLabels[c.situacao_prisional] || c.situacao_prisional || '—'}</span>
          </div>
        ),
      });
      fields.push({
        label: 'ANTECEDENTES',
        value: c.antecedentes_criminais ? <span className="text-red-600">Sim</span> : <span className="text-green-600">Não</span>,
      });
      fields.push({ label: 'CRIME IMPUTADO', value: c.crime_imputado || '—' });
      fields.push({ label: 'FASE', value: faseProcessualLabels[c.fase_processual] || c.fase_processual || '—' });
      fields.push({ label: 'B.O.', value: c.boletim_ocorrencia || '—' });
      fields.push({ label: 'DELEGACIA', value: c.delegacia || '—' });
    }

    if (cliente.practice_area === 'previdenciario') {
      const c = cliente as any;
      fields.push({ label: '__SECTION__', value: 'Dados Previdenciários' });
      fields.push({ label: 'NIT/PIS', value: c.nit_pis || '—' });
      fields.push({ label: 'Nº BENEFÍCIO', value: c.numero_beneficio || 'Sem benefício ativo' });
      fields.push({ label: 'ESPÉCIE', value: especieLabels[c.especie_beneficio] || c.especie_beneficio || '—' });
      fields.push({ label: 'DER', value: c.der ? formatDateBR(c.der) : '—' });
      fields.push({ label: 'DIB', value: c.dib ? formatDateBR(c.dib) : 'Não concedido' });
      fields.push({ label: 'DCB', value: c.dcb ? formatDateBR(c.dcb) : 'Ativo' });
      fields.push({ label: 'CNIS', value: c.cnis_disponivel ? <span className="text-green-600">Disponível</span> : <span className="text-muted-foreground">Indisponível</span> });
      fields.push({ label: 'PERÍCIA', value: c.pericia_medica ? <span className="text-amber-600">Necessária</span> : <span>Não necessária</span> });
      fields.push({ label: 'CID', value: c.cid || '—' });
      fields.push({ label: 'TEMPO CONTRIB.', value: c.tempo_contribuicao || '—' });
    }

    if (cliente.practice_area === 'tributario') {
      const c = cliente as any;
      fields.push({ label: '__SECTION__', value: 'Dados Tributários' });
      fields.push({ label: 'POLO', value: getPoloLabel(c.polo) });
      if (cliente.type === 'PJ') {
        const regimeLabels: Record<string, string> = { simples_nacional: 'Simples Nacional', lucro_presumido: 'Lucro Presumido', lucro_real: 'Lucro Real', mei: 'MEI' };
        fields.push({ label: 'REGIME TRIBUTÁRIO', value: regimeLabels[c.regime_tributario] || c.regime_tributario || '—' });
      }
      const tributoTipoLabels: Record<string, string> = { federal: 'Federal', estadual: 'Estadual', municipal: 'Municipal' };
      fields.push({ label: 'TIPO TRIBUTO', value: tributoTipoLabels[c.tipo_tributo] || c.tipo_tributo || '—' });
      fields.push({ label: 'TRIBUTO', value: c.tributo_especifico || '—' });
      fields.push({ label: 'Nº CDA', value: c.numero_cda || '—' });
      fields.push({ label: 'VALOR DÉBITO', value: c.valor_debito ? formatBRL(c.valor_debito) : '—' });
      fields.push({ label: 'ÓRGÃO FISCAL', value: c.orgao_fiscal || '—' });
      const faseLabels: Record<string, string> = { auto_infracao: 'Auto de infração', impugnacao: 'Impugnação', recurso_administrativo: 'Recurso administrativo', inscricao_divida_ativa: 'Inscrição em dívida ativa', execucao_fiscal: 'Execução fiscal' };
      fields.push({ label: 'FASE ADMIN.', value: faseLabels[c.fase_administrativa] || c.fase_administrativa || '—' });
      fields.push({ label: 'PROC. ADMIN.', value: c.numero_processo_administrativo || '—' });
      fields.push({ label: 'PARCELAMENTO', value: c.parcelamento_ativo ? <span className="text-teal-600">Ativo</span> : <span className="text-muted-foreground">Não</span> });
    }

    return (
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => {
          if (f.label === '' && f.value === null) {
            return <div key={i} className="border-t border-border my-1" />;
          }
          if (f.label === '__SECTION__') {
            return <div key={i} className="border-t border-border my-1"><p className="text-xs text-muted-foreground uppercase tracking-wide mt-2 mb-1">{f.value}</p></div>;
          }
          return (
            <div key={i}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{f.label}</p>
              <div className="text-sm font-medium text-foreground mt-0.5">{f.value}</div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Historico filtered ── */
  const filteredHistorico = useMemo(() => {
    let items = relatedAtividades;
    if (histTipoFilter) items = items.filter((a) => a.tipo === histTipoFilter);
    if (histProcessoFilter) items = items.filter((a) => a.processo_id === histProcessoFilter);
    return items;
  }, [relatedAtividades, histTipoFilter, histProcessoFilter]);

  const recentProcessos = useMemo(
    () => [...relatedProcessos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5),
    [relatedProcessos]
  );

  const selectCls = 'bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="bg-muted min-h-full -m-6">
      {/* Back nav */}
      <div className="px-6 pt-4 pb-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          Clientes
        </button>
      </div>

      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-xl shrink-0 ${
            cliente.type === 'PF' ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
          }`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{name}</h1>
              {cliente.is_vip && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> VIP
                </span>
              )}
              <StatusBadge variant={cliente.practice_area} />
              <span className={`text-xs px-2 py-0.5 rounded-full ${cliente.type === 'PF' ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'}`}>
                {cliente.type}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />{maskedDoc}</span>
              {email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /><span className="truncate max-w-40">{email}</span></span>}
              {phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{phone}</span>}
              {city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{city}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDateBR(cliente.created_at)}</span>
              {polo && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${poloColors[polo] || 'bg-muted text-muted-foreground'}`}>
                  {getPoloLabel(polo)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setSlideOpen(true)} className="border border-border text-muted-foreground hover:bg-muted rounded-md px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors">
            <Edit className="w-4 h-4" /> Editar
          </button>
          <button className="border border-border text-muted-foreground hover:bg-muted rounded-md px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors">
            <Mail className="w-4 h-4" /> E-mail
          </button>
          <button className="bg-muted text-foreground hover:bg-muted rounded-md px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors">
            <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
          </button>
          <button className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors">
            <Plus className="w-4 h-4" /> Novo Processo
          </button>
          <div className="flex items-center gap-1.5 ml-2">
            <span className={`w-2 h-2 rounded-full ${cliente.status === 'ativo' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground capitalize">{cliente.status}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 bg-card border-b border-border">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 flex-shrink-0"><Briefcase className="w-4 h-4" /></div>
            <div>
              <p className="text-xl font-bold text-foreground">{activeProcessCount}</p>
              <p className="text-xs text-muted-foreground">Processos Ativos</p>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 flex-shrink-0"><Scale className="w-4 h-4" /></div>
            <div>
              <p className="text-xl font-bold text-foreground">{nearestAudiencia ? formatDateShort(nearestAudiencia.proxima_audiencia) : '—'}</p>
              {nearestAudiencia && <p className="text-xs text-muted-foreground">{nearestAudiencia.tribunal}</p>}
              <p className="text-xs text-muted-foreground">Próxima Audiência</p>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600 flex-shrink-0"><AlertCircle className="w-4 h-4" /></div>
            <div>
              <p className={`text-xl font-bold ${prazoColor}`}>{nearestPrazo ? formatDateShort(nearestPrazo.prazo_fatal) : '—'}</p>
              <p className="text-xs text-muted-foreground">Prazo Fatal</p>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-100 text-green-600 flex-shrink-0"><Smile className="w-4 h-4" /></div>
            <div>
              <p className="text-xl font-bold text-foreground">9.8</p>
              <p className="text-xs text-green-500">Excelência</p>
              <p className="text-xs text-muted-foreground">Satisfação NPS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border px-6 flex items-center gap-0">
        {([
          { key: 'resumo', label: 'Resumo' },
          { key: 'processos', label: 'Processos', badge: relatedProcessos.length },
          { key: 'historico', label: 'Histórico' },
          { key: 'documentos', label: 'Documentos', comingSoon: true },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-4 text-sm cursor-pointer border-b-2 transition-colors duration-150 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
            {'badge' in tab && tab.badge !== undefined && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-1.5">{tab.badge}</span>
            )}
            {'comingSoon' in tab && tab.comingSoon && (
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full ml-1.5">Em breve</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {/* ── RESUMO ── */}
        {activeTab === 'resumo' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left */}
            <div className="col-span-7">
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Processos Recentes</h3>
                  <button onClick={() => setActiveTab('processos')} className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">Ver todos</button>
                </div>
                {recentProcessos.length === 0 ? (
                  <EmptyState icon={Briefcase} title="Nenhum processo vinculado" subtitle="Clique em + Novo Processo para começar" ctaLabel="+ Novo Processo" onCta={() => {}} />
                ) : (
                  renderProcessosTable(recentProcessos, false)
                )}
              </div>
            </div>

            {/* Right */}
            <div className="col-span-5 space-y-6">
              {/* Dados cadastrais */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Dados Cadastrais</h3>
                  <button onClick={() => setSlideOpen(true)} className="text-xs text-blue-600 cursor-pointer">Editar</button>
                </div>
                <div className="px-5 py-4">
                  {renderDadosCadastrais()}
                </div>
              </div>

              {/* Atividade recente */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Atividade Recente</h3>
                </div>
                <div className="px-5 py-4">
                  {renderTimeline(relatedAtividades, 5)}
                </div>
              </div>

              {/* Observações */}
              {cliente.notes ? (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-5 py-4 flex items-start gap-3">
                  <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">Observações internas</p>
                    <p className="text-sm text-amber-800 leading-relaxed italic">{cliente.notes}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-muted border border-border rounded-lg px-5 py-4 flex items-start gap-3">
                  <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground italic">Nenhuma observação registrada.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROCESSOS TAB ── */}
        {activeTab === 'processos' && (
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Processos ({relatedProcessos.length})</h3>
              <button className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors">
                <Plus className="w-4 h-4" /> Novo Processo
              </button>
            </div>
            {relatedProcessos.length === 0 ? (
              <EmptyState icon={Briefcase} title="Nenhum processo para este cliente" ctaLabel="+ Novo Processo" onCta={() => {}} />
            ) : (
              <div className="overflow-x-auto">
                {renderProcessosTable(relatedProcessos, false)}
              </div>
            )}
          </div>
        )}

        {/* ── HISTÓRICO TAB ── */}
        {activeTab === 'historico' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <select value={histTipoFilter} onChange={(e) => setHistTipoFilter(e.target.value)} className={selectCls}>
                <option value="">Tipo: Todos</option>
                <option value="processo_criado">Processo</option>
                <option value="audiencia_realizada">Audiência</option>
                <option value="documento_enviado">Documento</option>
                <option value="prazo_cumprido">Prazo</option>
                <option value="anotacao">Anotação</option>
                <option value="contato">Contato</option>
                <option value="peticao_protocolada">Petição</option>
                <option value="decisao_recebida">Decisão</option>
              </select>
              <select value={histProcessoFilter} onChange={(e) => setHistProcessoFilter(e.target.value)} className={selectCls}>
                <option value="">Processo: Todos</option>
                {relatedProcessos.map((p) => (
                  <option key={p.id} value={p.id}>{p.numero_cnj || p.acao}</option>
                ))}
              </select>
              <div className="ml-auto">
                <button onClick={() => setAnnotationModal(true)} className="border border-border text-muted-foreground hover:bg-muted rounded-md px-3 py-2 text-sm flex items-center gap-1.5 transition-colors">
                  <Plus className="w-4 h-4" /> Nova Anotação
                </button>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border shadow-sm p-5">
              {filteredHistorico.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="w-12 h-12 text-muted mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">Nenhuma atividade registrada</h3>
                  <p className="text-sm text-muted-foreground">As atividades aparecerão aqui conforme forem registradas</p>
                </div>
              ) : (
                renderTimeline(filteredHistorico)
              )}
            </div>
          </div>
        )}

        {/* ── DOCUMENTOS TAB ── */}
        {activeTab === 'documentos' && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <FolderOpen className="w-16 h-16 text-muted" />
            <h2 className="text-xl font-semibold text-muted-foreground">Módulo de Documentos</h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs">Este módulo estará disponível em breve.</p>
            <span className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">Em desenvolvimento</span>
          </div>
        )}
      </div>

      {/* Slide-over for edit */}
      <ClienteSlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        onSave={handleSaveCliente}
        editCliente={cliente}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setDeleteConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-xl p-6 max-w-sm mx-4 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Tem certeza?</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Esta ação não pode ser desfeita. O cliente será removido permanentemente do sistema.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-border rounded-md py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 transition-colors">Excluir</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Annotation modal */}
      {annotationModal && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setAnnotationModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Nova Anotação</h3>
                <button onClick={() => setAnnotationModal(false)} className="text-muted-foreground hover:text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-4">
                <textarea
                  rows={4}
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Registre uma observação interna..."
                  className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                <button onClick={() => setAnnotationModal(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                <button onClick={handleSaveAnnotation} className="bg-blue-600 text-white text-sm font-medium rounded-md px-6 py-2 hover:bg-blue-700 transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
