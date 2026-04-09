import React, { useState, useEffect } from 'react';
import { X, User, Building2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { PracticeArea } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_USERS } from '@/data/mockUsers';
import {
  Cliente,
  applyCpfMask,
  applyCnpjMask,
  applyPhoneMask,
  formatBRL,
  parseBRL,
} from '@/types/cliente';
import StatusBadge from './StatusBadge';

/* ── shared field helpers ── */

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  colSpan?: 2;
  children: React.ReactNode;
}

function Field({ label, required, error, colSpan, children }: FieldProps) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent';
const inputErrCls =
  'w-full bg-card border border-red-300 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent';
const selectCls = inputCls;
const readOnlyCls =
  'w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed';
const sectionTitle = 'text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border col-span-2';

/* ── Main component ── */

interface ClienteSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSave: (cliente: Cliente) => void;
  editCliente?: Cliente | null;
}

type ClientType = 'PF' | 'PJ';

const areaOptions: { value: PracticeArea; label: string; selectedCls: string }[] = [
  { value: 'trabalhista', label: 'Trabalhista', selectedCls: 'bg-blue-600 border-blue-600 text-white' },
  { value: 'civil', label: 'Civil', selectedCls: 'bg-purple-600 border-purple-600 text-white' },
  { value: 'criminal', label: 'Criminal', selectedCls: 'bg-red-600 border-red-600 text-white' },
  { value: 'previdenciario', label: 'Previdenciário', selectedCls: 'bg-green-600 border-green-600 text-white' },
];

export default function ClienteSlideOver({ open, onClose, onSave, editCliente }: ClienteSlideOverProps) {
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();

  const [step, setStep] = useState(1);
  const [clientType, setClientType] = useState<ClientType | null>(null);
  const [area, setArea] = useState<PracticeArea | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // reset on open/close
  useEffect(() => {
    if (open) {
      if (editCliente) {
        setClientType(editCliente.type);
        setArea(editCliente.practice_area);
        setForm({ ...editCliente });
        setStep(2);
      } else {
        setClientType(null);
        setArea(null);
        setForm({});
        setStep(1);
      }
      setErrors({});
    }
  }, [open, editCliente]);

  const set = (key: string, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const req = (k: string, label: string) => {
      if (!form[k] && form[k] !== 0 && form[k] !== false) errs[k] = `${label} é obrigatório`;
    };

    // common
    if (clientType === 'PF') {
      req('nome', 'Nome');
      req('cpf', 'CPF');
      req('email', 'Email');
    } else {
      req('razao_social', 'Razão Social');
      req('cnpj', 'CNPJ');
      req('representante_legal', 'Representante Legal');
      req('cpf_representante', 'CPF do Representante');
      req('email', 'Email');
      req('phone', 'Telefone');
    }

    // area-specific
    if (area === 'trabalhista' && clientType === 'PF') {
      req('polo', 'Polo');
      req('cargo', 'Cargo');
      req('salario', 'Salário');
      req('data_admissao', 'Data de admissão');
      req('data_demissao', 'Data de demissão');
      req('tipo_demissao', 'Tipo de demissão');
      if (form.polo === 'reclamante') req('empresa_reclamada', 'Empresa reclamada');
    }
    if (area === 'civil') {
      req('polo', 'Polo');
      req('subtipo', 'Subtipo');
    }
    if (area === 'criminal') {
      req('polo', 'Polo');
      req('situacao_prisional', 'Situação prisional');
      req('crime_imputado', 'Crime imputado');
      req('fase_processual', 'Fase processual');
      req('phone', 'Telefone');
      req('rg', 'RG');
    }
    if (area === 'previdenciario') {
      req('nit_pis', 'NIT/PIS');
      req('especie_beneficio', 'Espécie do benefício');
      req('phone', 'Telefone');
    }

    if (admin) req('responsible_id', 'Responsável');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const cliente: any = {
      ...form,
      id: editCliente?.id || `cli-${Date.now()}`,
      type: clientType,
      practice_area: area,
      status: form.status || 'ativo',
      is_vip: form.is_vip || false,
      created_at: editCliente?.created_at || new Date().toISOString().split('T')[0],
      responsible_id: admin ? form.responsible_id : currentUser!.id,
      notes: form.notes || '',
    };

    onSave(cliente as Cliente);
  };

  if (!open) return null;

  const stepLabel = step === 1 ? 'Passo 1 de 2 — Tipo e Área' : 'Passo 2 de 2 — Dados';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {editCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-sm text-muted-foreground">{stepLabel}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 ? (
            <Step1
              clientType={clientType}
              setClientType={setClientType}
              area={area}
              setArea={setArea}
            />
          ) : (
            <Step2Form
              clientType={clientType!}
              area={area!}
              form={form}
              set={set}
              errors={errors}
              admin={admin}
              currentUser={currentUser}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-card shrink-0">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            {step === 1 ? (
              <button
                disabled={!clientType || !area}
                onClick={() => {
                  if (!admin) set('responsible_id', currentUser!.id);
                  setStep(2);
                }}
                className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium rounded-md px-6 py-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white text-sm font-medium rounded-md px-6 py-2 hover:bg-blue-700 transition-colors"
              >
                Salvar Cliente
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════
   STEP 1
   ════════════════════════════════════ */

function Step1({
  clientType,
  setClientType,
  area,
  setArea,
}: {
  clientType: ClientType | null;
  setClientType: (t: ClientType) => void;
  area: PracticeArea | null;
  setArea: (a: PracticeArea) => void;
}) {
  const card = (selected: boolean) =>
    `border-2 rounded-xl p-5 cursor-pointer transition-all duration-150 ${
      selected ? 'border-blue-600 bg-blue-50' : 'border-border bg-card hover:border-border'
    }`;

  return (
    <>
      <p className="text-sm font-semibold text-foreground mb-3">Tipo de cliente</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className={card(clientType === 'PF')} onClick={() => setClientType('PF')}>
          <User className={`w-8 h-8 mb-3 ${clientType === 'PF' ? 'text-blue-600' : 'text-muted-foreground'}`} />
          <p className="text-sm font-semibold text-foreground">Pessoa Física</p>
          <p className="text-xs text-muted-foreground mt-1">CPF, dados pessoais</p>
        </div>
        <div className={card(clientType === 'PJ')} onClick={() => setClientType('PJ')}>
          <Building2 className={`w-8 h-8 mb-3 ${clientType === 'PJ' ? 'text-blue-600' : 'text-muted-foreground'}`} />
          <p className="text-sm font-semibold text-foreground">Pessoa Jurídica</p>
          <p className="text-xs text-muted-foreground mt-1">CNPJ, razão social</p>
        </div>
      </div>

      <p className="text-sm font-semibold text-foreground mb-3">Área do Direito</p>
      <div className="flex gap-2 flex-wrap">
        {areaOptions
          .filter((a) => !(clientType === 'PJ' && (a.value === 'criminal' || a.value === 'previdenciario')))
          .map((opt) => (
            <button
              key={opt.value}
              onClick={() => setArea(opt.value)}
              className={`border rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                area === opt.value
                  ? opt.selectedCls
                  : 'bg-card border-border text-muted-foreground hover:border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
      </div>
    </>
  );
}

/* ════════════════════════════════════
   STEP 2 — Dynamic form
   ════════════════════════════════════ */

function Step2Form({
  clientType,
  area,
  form,
  set,
  errors,
  admin,
  currentUser,
}: {
  clientType: ClientType;
  area: PracticeArea;
  form: Record<string, any>;
  set: (k: string, v: any) => void;
  errors: Record<string, string>;
  admin: boolean;
  currentUser: any;
}) {
  const ic = (k: string) => (errors[k] ? inputErrCls : inputCls);

  const handleMoneyBlur = (key: string) => {
    const v = form[key];
    if (v !== undefined && v !== '') {
      const num = typeof v === 'number' ? v : parseBRL(String(v));
      set(key, formatBRL(num));
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* ── PF forms ── */}
      {clientType === 'PF' && (
        <>
          <h3 className={sectionTitle}>Dados Pessoais</h3>
          <Field label="Nome completo" required colSpan={2} error={errors.nome}>
            <input className={ic('nome')} value={form.nome || ''} onChange={(e) => set('nome', e.target.value)} placeholder="Nome completo" />
          </Field>
          <Field label="CPF" required error={errors.cpf}>
            <input className={ic('cpf')} value={form.cpf || ''} onChange={(e) => set('cpf', applyCpfMask(e.target.value))} placeholder="000.000.000-00" />
          </Field>
          <Field label="RG" error={errors.rg}>
            <input className={ic('rg')} value={form.rg || ''} onChange={(e) => set('rg', e.target.value)} placeholder="RG" />
          </Field>
          <Field label="Data de nascimento">
            <input type="date" className={inputCls} value={form.nascimento || ''} onChange={(e) => set('nascimento', e.target.value)} />
          </Field>
          <Field label="Estado civil">
            <select className={selectCls} value={form.estado_civil || ''} onChange={(e) => set('estado_civil', e.target.value)}>
              <option value="">Selecione</option>
              <option value="solteiro">Solteiro</option>
              <option value="casado">Casado</option>
              <option value="divorciado">Divorciado</option>
              <option value="viuvo">Viúvo</option>
              <option value="uniao_estavel">União estável</option>
            </select>
          </Field>
          <Field label="Email" required colSpan={area === 'criminal' || area === 'previdenciario' ? undefined : 2} error={errors.email}>
            <input type="email" className={ic('email')} value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@exemplo.com" />
          </Field>
          {(area === 'criminal' || area === 'previdenciario') && (
            <Field label="Telefone" required error={errors.phone}>
              <input className={ic('phone')} value={form.phone || ''} onChange={(e) => set('phone', applyPhoneMask(e.target.value))} placeholder="(00) 00000-0000" />
            </Field>
          )}
          {area === 'trabalhista' && (
            <Field label="Telefone">
              <input className={inputCls} value={form.phone || ''} onChange={(e) => set('phone', applyPhoneMask(e.target.value))} placeholder="(00) 00000-0000" />
            </Field>
          )}
          {area === 'civil' && (
            <>
              <Field label="Telefone" required error={errors.phone}>
                <input className={ic('phone')} value={form.phone || ''} onChange={(e) => set('phone', applyPhoneMask(e.target.value))} placeholder="(00) 00000-0000" />
              </Field>
            </>
          )}
          {(area === 'trabalhista' || area === 'criminal' || area === 'previdenciario') && (
            <div /> // spacer
          )}
          <Field label="Endereço completo" colSpan={2}>
            <input className={inputCls} value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Rua, número — Cidade/UF" />
          </Field>

          {/* Profissão / Renda for Civil */}
          {area === 'civil' && (
            <>
              <Field label="Profissão">
                <input className={inputCls} value={form.profissao || ''} onChange={(e) => set('profissao', e.target.value)} placeholder="Profissão" />
              </Field>
              <Field label="Renda mensal (R$)">
                <input className={inputCls} value={form.renda_mensal || ''} onChange={(e) => set('renda_mensal', e.target.value)} onBlur={() => handleMoneyBlur('renda_mensal')} placeholder="R$ 0,00" />
              </Field>
            </>
          )}
        </>
      )}

      {/* ── PJ forms ── */}
      {clientType === 'PJ' && (
        <>
          <h3 className={sectionTitle}>Dados da Empresa</h3>
          <Field label="Razão Social" required colSpan={2} error={errors.razao_social}>
            <input className={ic('razao_social')} value={form.razao_social || ''} onChange={(e) => set('razao_social', e.target.value)} placeholder="Razão social da empresa" />
          </Field>
          <Field label="CNPJ" required error={errors.cnpj}>
            <input className={ic('cnpj')} value={form.cnpj || ''} onChange={(e) => set('cnpj', applyCnpjMask(e.target.value))} placeholder="00.000.000/0000-00" />
          </Field>
          {area === 'civil' && (
            <Field label="Tipo societário" required error={errors.tipo_societario}>
              <select className={ic('tipo_societario')} value={form.tipo_societario || ''} onChange={(e) => set('tipo_societario', e.target.value)}>
                <option value="">Selecione</option>
                <option value="ltda">LTDA</option>
                <option value="sa">S.A.</option>
                <option value="eireli">EIRELI</option>
                <option value="mei">MEI</option>
                <option value="ss">Sociedade Simples</option>
                <option value="outros">Outros</option>
              </select>
            </Field>
          )}
          {area === 'trabalhista' && <div />}
          <Field label="Representante Legal" required error={errors.representante_legal}>
            <input className={ic('representante_legal')} value={form.representante_legal || ''} onChange={(e) => set('representante_legal', e.target.value)} placeholder="Nome do representante" />
          </Field>
          <Field label="CPF do Representante" required error={errors.cpf_representante}>
            <input className={ic('cpf_representante')} value={form.cpf_representante || ''} onChange={(e) => set('cpf_representante', applyCpfMask(e.target.value))} placeholder="000.000.000-00" />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input type="email" className={ic('email')} value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@empresa.com" />
          </Field>
          <Field label="Telefone" required error={errors.phone}>
            <input className={ic('phone')} value={form.phone || ''} onChange={(e) => set('phone', applyPhoneMask(e.target.value))} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Endereço completo" colSpan={2}>
            <input className={inputCls} value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Rua, número — Cidade/UF" />
          </Field>
          <Field label="Ramo de Atividade" colSpan={area === 'civil' ? 2 : undefined}>
            <input className={inputCls} value={form.ramo_atividade || ''} onChange={(e) => set('ramo_atividade', e.target.value)} placeholder="Ramo de atividade" />
          </Field>
          {area === 'trabalhista' && (
            <>
              <Field label="Nº aprox. de Funcionários">
                <input type="number" className={inputCls} value={form.numero_funcionarios || ''} onChange={(e) => set('numero_funcionarios', Number(e.target.value))} placeholder="0" />
              </Field>
              <Field label="Sindicato Patronal" colSpan={2}>
                <input className={inputCls} value={form.sindicato_patronal || ''} onChange={(e) => set('sindicato_patronal', e.target.value)} placeholder="Sindicato patronal" />
              </Field>
              <Field label="Polo" colSpan={2}>
                <input className={readOnlyCls} value="Reclamada" readOnly />
              </Field>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════
         AREA-SPECIFIC SECTIONS
         ══════════════════════════════ */}

      {/* TRABALHISTA PF */}
      {area === 'trabalhista' && clientType === 'PF' && (
        <>
          <h3 className={sectionTitle}>Dados Trabalhistas</h3>
          <Field label="Polo" required colSpan={2} error={errors.polo}>
            <div className="flex gap-4">
              {[
                { v: 'reclamante', l: 'Reclamante' },
                { v: 'reclamada_pf', l: 'Reclamada (PF)' },
              ].map((o) => (
                <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="polo" value={o.v} checked={form.polo === o.v} onChange={() => set('polo', o.v)} className="accent-blue-600" />
                  <span className="text-sm text-foreground">{o.l}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="CTPS número">
            <input className={inputCls} value={form.ctps || ''} onChange={(e) => set('ctps', e.target.value)} placeholder="000000 / 001-SP" />
          </Field>
          <Field label="Cargo / Função" required error={errors.cargo}>
            <input className={ic('cargo')} value={form.cargo || ''} onChange={(e) => set('cargo', e.target.value)} placeholder="Cargo" />
          </Field>
          <Field label="Salário último (R$)" required error={errors.salario}>
            <input className={ic('salario')} value={form.salario || ''} onChange={(e) => set('salario', e.target.value)} onBlur={() => handleMoneyBlur('salario')} placeholder="R$ 0,00" />
          </Field>
          <div />
          <Field label="Data de admissão" required error={errors.data_admissao}>
            <input type="date" className={ic('data_admissao')} value={form.data_admissao || ''} onChange={(e) => set('data_admissao', e.target.value)} />
          </Field>
          <Field label="Data de demissão" required error={errors.data_demissao}>
            <input type="date" className={ic('data_demissao')} value={form.data_demissao || ''} onChange={(e) => set('data_demissao', e.target.value)} />
          </Field>
          <Field label="Tipo de demissão" required colSpan={2} error={errors.tipo_demissao}>
            <select className={ic('tipo_demissao')} value={form.tipo_demissao || ''} onChange={(e) => set('tipo_demissao', e.target.value)}>
              <option value="">Selecione</option>
              <option value="sem_justa_causa">Sem justa causa</option>
              <option value="justa_causa">Com justa causa</option>
              <option value="pedido_demissao">Pedido de demissão</option>
              <option value="rescisao_indireta">Rescisão indireta</option>
              <option value="aposentadoria">Aposentadoria</option>
            </select>
          </Field>
          {form.polo === 'reclamante' && (
            <>
              <Field label="Empresa reclamada" required colSpan={2} error={errors.empresa_reclamada}>
                <input className={ic('empresa_reclamada')} value={form.empresa_reclamada || ''} onChange={(e) => set('empresa_reclamada', e.target.value)} placeholder="Nome da empresa" />
              </Field>
              <Field label="Sindicato da categoria" colSpan={2}>
                <input className={inputCls} value={form.sindicato || ''} onChange={(e) => set('sindicato', e.target.value)} placeholder="Sindicato" />
              </Field>
            </>
          )}
        </>
      )}

      {/* CIVIL — both PF & PJ */}
      {area === 'civil' && (
        <>
          <h3 className={sectionTitle}>Dados Processuais</h3>
          <Field label="Polo" required colSpan={2} error={errors.polo}>
            <select className={ic('polo')} value={form.polo || ''} onChange={(e) => set('polo', e.target.value)}>
              <option value="">Selecione</option>
              <option value="autor">Autor</option>
              <option value="reu">Réu</option>
              {clientType === 'PF' && <option value="terceiro_interessado">Terceiro interessado</option>}
            </select>
          </Field>
          <Field label="Subtipo da Ação" required colSpan={2} error={errors.subtipo}>
            <select className={ic('subtipo')} value={form.subtipo || ''} onChange={(e) => set('subtipo', e.target.value)}>
              <option value="">Selecione</option>
              {clientType === 'PF' ? (
                <>
                  <option value="indenizacao_moral">Indenização por dano moral</option>
                  <option value="indenizacao_material">Indenização por dano material</option>
                  <option value="responsabilidade_civil">Responsabilidade civil</option>
                  <option value="consumidor">Direito do consumidor</option>
                  <option value="outros">Outros</option>
                </>
              ) : (
                <>
                  <option value="responsabilidade_civil">Responsabilidade civil</option>
                  <option value="direito_comercial">Direito comercial</option>
                  <option value="direito_societario">Direito societário</option>
                  <option value="consumidor">Direito do consumidor</option>
                  <option value="outros">Outros</option>
                </>
              )}
            </select>
          </Field>
        </>
      )}

      {/* CRIMINAL PF */}
      {area === 'criminal' && clientType === 'PF' && (
        <>
          <h3 className={sectionTitle}>Dados Criminais</h3>
          <Field label="Polo" required colSpan={2} error={errors.polo}>
            <select className={ic('polo')} value={form.polo || ''} onChange={(e) => set('polo', e.target.value)}>
              <option value="">Selecione</option>
              <option value="reu">Réu / Acusado</option>
              <option value="vitima">Vítima</option>
              <option value="investigado">Investigado</option>
            </select>
          </Field>
          <Field label="Situação prisional" required colSpan={2} error={errors.situacao_prisional}>
            <select className={ic('situacao_prisional')} value={form.situacao_prisional || ''} onChange={(e) => set('situacao_prisional', e.target.value)}>
              <option value="">Selecione</option>
              <option value="solto">Solto</option>
              <option value="preso_preventivo">Preso preventivo</option>
              <option value="preso_definitivo">Preso definitivo</option>
              <option value="liberdade_provisoria">Liberdade provisória</option>
              <option value="monitorado_eletronico">Monitorado eletronicamente</option>
            </select>
          </Field>
          <Field label="Crime imputado" required colSpan={2} error={errors.crime_imputado}>
            <input className={ic('crime_imputado')} value={form.crime_imputado || ''} onChange={(e) => set('crime_imputado', e.target.value)} placeholder="Artigo e descrição" />
          </Field>
          <Field label="Fase processual" required colSpan={2} error={errors.fase_processual}>
            <select className={ic('fase_processual')} value={form.fase_processual || ''} onChange={(e) => set('fase_processual', e.target.value)}>
              <option value="">Selecione</option>
              <option value="inquerito">Inquérito policial</option>
              <option value="denuncia">Denúncia</option>
              <option value="instrucao">Instrução</option>
              <option value="julgamento">Julgamento</option>
              <option value="recurso">Recurso</option>
              <option value="execucao">Execução penal</option>
            </select>
          </Field>
          <Field label="Boletim de Ocorrência">
            <input className={inputCls} value={form.boletim_ocorrencia || ''} onChange={(e) => set('boletim_ocorrencia', e.target.value)} placeholder="BO nº" />
          </Field>
          <Field label="Delegacia responsável">
            <input className={inputCls} value={form.delegacia || ''} onChange={(e) => set('delegacia', e.target.value)} placeholder="Delegacia" />
          </Field>
          <Field label="Data do fato">
            <input type="date" className={inputCls} value={form.data_fato || ''} onChange={(e) => set('data_fato', e.target.value)} />
          </Field>
          {form.situacao_prisional && form.situacao_prisional !== 'solto' && (
            <Field label="Preso em">
              <input type="date" className={inputCls} value={form.preso_em || ''} onChange={(e) => set('preso_em', e.target.value)} />
            </Field>
          )}
          <Field label="Antecedentes criminais" colSpan={2}>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={form.antecedentes_criminais || false}
                onClick={() => set('antecedentes_criminais', !form.antecedentes_criminais)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                  form.antecedentes_criminais ? 'bg-red-500' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-card shadow transform transition-transform mt-0.5 ${form.antecedentes_criminais ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-foreground">Possui antecedentes criminais</span>
            </label>
          </Field>
        </>
      )}

      {/* PREVIDENCIÁRIO PF */}
      {area === 'previdenciario' && clientType === 'PF' && (
        <>
          <h3 className={sectionTitle}>Dados Previdenciários</h3>
          <Field label="NIT / PIS" required error={errors.nit_pis}>
            <input className={ic('nit_pis')} value={form.nit_pis || ''} onChange={(e) => set('nit_pis', e.target.value)} placeholder="000.00000.00-0" />
          </Field>
          <Field label="Número do benefício">
            <input className={inputCls} value={form.numero_beneficio || ''} onChange={(e) => set('numero_beneficio', e.target.value)} placeholder="000.000.000-0" />
          </Field>
          <Field label="Espécie do benefício" required colSpan={2} error={errors.especie_beneficio}>
            <select className={ic('especie_beneficio')} value={form.especie_beneficio || ''} onChange={(e) => set('especie_beneficio', e.target.value)}>
              <option value="">Selecione</option>
              <option value="aposentadoria_tempo">Aposentadoria por tempo de contribuição</option>
              <option value="aposentadoria_idade">Aposentadoria por idade</option>
              <option value="aposentadoria_invalidez">Aposentadoria por invalidez</option>
              <option value="auxilio_doenca">Auxílio-doença</option>
              <option value="auxilio_acidente">Auxílio-acidente</option>
              <option value="bpc_loas">BPC / LOAS</option>
              <option value="pensao_morte">Pensão por morte</option>
              <option value="salario_maternidade">Salário-maternidade</option>
            </select>
          </Field>
          <Field label="DER">
            <input type="date" className={inputCls} value={form.der || ''} onChange={(e) => set('der', e.target.value)} />
          </Field>
          <Field label="DIB">
            <input type="date" className={inputCls} value={form.dib || ''} onChange={(e) => set('dib', e.target.value)} />
          </Field>
          <Field label="DCB">
            <input type="date" className={inputCls} value={form.dcb || ''} onChange={(e) => set('dcb', e.target.value)} />
          </Field>
          <Field label="Tempo de contribuição estimado">
            <input className={inputCls} value={form.tempo_contribuicao || ''} onChange={(e) => set('tempo_contribuicao', e.target.value)} placeholder="Ex: 22 anos e 4 meses" />
          </Field>
          {['auxilio_doenca', 'aposentadoria_invalidez', 'auxilio_acidente'].includes(form.especie_beneficio) && (
            <Field label="CID" colSpan={2}>
              <input className={inputCls} value={form.cid || ''} onChange={(e) => set('cid', e.target.value)} placeholder="Ex: M54.5" />
            </Field>
          )}
          <Field label="" colSpan={2}>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.cnis_disponivel || false}
                  onClick={() => set('cnis_disponivel', !form.cnis_disponivel)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    form.cnis_disponivel ? 'bg-green-500' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-card shadow transform transition-transform mt-0.5 ${form.cnis_disponivel ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-foreground">CNIS disponível</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.pericia_medica || false}
                  onClick={() => set('pericia_medica', !form.pericia_medica)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    form.pericia_medica ? 'bg-amber-500' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-card shadow transform transition-transform mt-0.5 ${form.pericia_medica ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-foreground">Perícia médica necessária</span>
              </label>
            </div>
          </Field>
        </>
      )}

      {/* ══════════════════════════════
         COMMON FIELDS
         ══════════════════════════════ */}
      <div className="col-span-2 border-t border-border mt-4 pt-4" />
      <h3 className={sectionTitle}>Informações Adicionais</h3>

      <Field label="" colSpan={2}>
        <label className="flex items-center gap-3 cursor-pointer">
          <Star className={`w-4 h-4 ${form.is_vip ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
          <span className="text-sm text-foreground">Marcar como cliente VIP</span>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_vip || false}
            onClick={() => set('is_vip', !form.is_vip)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ml-auto ${
              form.is_vip ? 'bg-amber-400' : 'bg-muted'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-card shadow transform transition-transform mt-0.5 ${form.is_vip ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
          </button>
        </label>
      </Field>

      <Field label="Responsável" required={admin} colSpan={2} error={errors.responsible_id}>
        {admin ? (
          <select className={ic('responsible_id')} value={form.responsible_id || ''} onChange={(e) => set('responsible_id', e.target.value)}>
            <option value="">Selecione</option>
            {MOCK_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>
        ) : (
          <input className={readOnlyCls} value={currentUser?.name || ''} readOnly />
        )}
      </Field>

      <Field label="Observações" colSpan={2}>
        <textarea
          rows={3}
          className={inputCls}
          value={form.notes || ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Observações internas sobre este cliente..."
        />
      </Field>
    </div>
  );
}
