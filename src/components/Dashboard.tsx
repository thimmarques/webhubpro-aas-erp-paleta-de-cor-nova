import React from 'react';
import {
  Briefcase,
  Users,
  Scale,
  AlertCircle,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Percent,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from './StatusBadge';

/* ── helpers ── */

export function filterByUser<T extends { responsible_id: string }>(
  items: T[],
  currentUserId: string,
  isAdmin: boolean
): T[] {
  return isAdmin ? items : items.filter((i) => i.responsible_id === currentUserId);
}

/* ── KPI Card ── */

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  subtitleClass?: string;
}

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, subtitle, subtitleClass }: KpiCardProps) {
  return (
    <div className="bg-card border border-border shadow-sm rounded-lg p-5 flex items-start gap-4">
      <div className={`${iconBg} ${iconColor} rounded-lg p-2.5 shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && (
          <p className={`text-xs mt-1 ${subtitleClass || 'text-muted-foreground'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/* ── Activity item ── */

interface Activity {
  id: number;
  text: string;
  time: string;
  active?: boolean;
}

const activities: Activity[] = [
  { id: 1, text: 'Petição inicial protocolada no processo 0001234-55.2024.5.02.0001', time: 'Há 25 min', active: true },
  { id: 2, text: 'Audiência agendada para Maria Silva — Vara do Trabalho 3ª Região', time: 'Há 1 hora' },
  { id: 3, text: 'Prazo fatal adicionado: contestação até 28/02/2026', time: 'Há 2 horas' },
  { id: 4, text: 'Novo cliente cadastrado: Empresa ABC Ltda.', time: 'Há 4 horas' },
  { id: 5, text: 'Honorários recebidos — Processo João Pereira (R$ 4.500,00)', time: 'Ontem 17:30' },
];

/* ── Hearing item ── */

interface Hearing {
  id: number;
  day: string;
  month: string;
  process: string;
  client: string;
  area: 'trabalhista' | 'civil' | 'criminal' | 'previdenciario';
}

const hearings: Hearing[] = [
  { id: 1, day: '22', month: 'FEV', process: '0001234-55.2024', client: 'Maria Silva', area: 'trabalhista' },
  { id: 2, day: '24', month: 'FEV', process: '0005678-12.2024', client: 'João Pereira', area: 'civil' },
  { id: 3, day: '28', month: 'FEV', process: '0009012-89.2024', client: 'Ana Costa', area: 'criminal' },
];

/* ── Area distribution ── */

interface AreaStat {
  area: 'trabalhista' | 'civil' | 'criminal' | 'previdenciario';
  count: number;
  total: number;
  barColor: string;
}

const areaStats: AreaStat[] = [
  { area: 'trabalhista', count: 18, total: 40, barColor: 'bg-blue-500' },
  { area: 'civil', count: 12, total: 40, barColor: 'bg-purple-500' },
  { area: 'criminal', count: 6, total: 40, barColor: 'bg-red-500' },
  { area: 'previdenciario', count: 4, total: 40, barColor: 'bg-green-500' },
];

/* ── Dashboard ── */

export default function Dashboard() {
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();

  return (
    <div className="space-y-6">
      {/* Section A — KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Meus Processos Ativos" value="12" icon={Briefcase} iconBg="bg-blue-50" iconColor="text-blue-600" subtitle="+2 este mês" />
        <KpiCard label="Meus Clientes" value="8" icon={Users} iconBg="bg-green-50" iconColor="text-green-600" subtitle="1 novo esta semana" />
        <KpiCard label="Próxima Audiência" value="Amanhã 14h" icon={Scale} iconBg="bg-purple-50" iconColor="text-purple-600" subtitle="Vara do Trabalho 3ª" />
        <KpiCard label="Prazos Esta Semana" value="3" icon={AlertCircle} iconBg="bg-amber-50" iconColor="text-amber-600" subtitle="1 prazo fatal" subtitleClass="text-red-500" />
      </div>

      {admin && (
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="A Receber" value="R$ 84.500" icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <KpiCard label="Recebido este Mês" value="R$ 32.000" icon={TrendingUp} iconBg="bg-teal-50" iconColor="text-teal-600" />
          <KpiCard label="Em Atraso" value="R$ 8.400" icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" />
          <KpiCard label="Inadimplência" value="9,2%" icon={Percent} iconBg="bg-orange-50" iconColor="text-orange-600" />
        </div>
      )}

      {/* Section B — Activity + Hearings */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left — Activity */}
        <div className="col-span-2 bg-card border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Atividade Recente</h2>
          <div className="relative ml-3 border-l-2 border-slate-200 space-y-5 pl-5">
            {activities.map((a) => (
              <div key={a.id} className="relative">
                <span
                  className={`absolute -left-[25px] top-1.5 w-2 h-2 rounded-full ${
                    a.active ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
                <p className="text-sm text-foreground">{a.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Hearings */}
        <div className="col-span-1 bg-card border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Próximas Audiências</h2>
          <div className="space-y-4">
            {hearings.map((h) => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="bg-slate-50 rounded-lg p-2 text-center min-w-[48px]">
                  <p className="text-xl font-bold text-foreground leading-tight">{h.day}</p>
                  <p className="text-xs text-muted-foreground uppercase">{h.month}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{h.client}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.process}</p>
                  <div className="mt-1">
                    <StatusBadge variant={h.area} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section C — Area Distribution */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Distribuição por Área</h2>
        <div className="grid grid-cols-4 gap-6">
          {areaStats.map((s) => (
            <div key={s.area}>
              <div className="flex items-center justify-between mb-2">
                <StatusBadge variant={s.area} />
                <span className="text-sm font-semibold text-foreground">{s.count}</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`${s.barColor} h-2 rounded-full transition-all`}
                  style={{ width: `${(s.count / s.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
