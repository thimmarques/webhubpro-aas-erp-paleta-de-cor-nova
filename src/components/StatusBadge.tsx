import React from 'react';
import { BadgeVariant } from '@/types';

const variantStyles: Record<BadgeVariant, string> = {
  // Practice areas
  trabalhista: 'bg-blue-100 text-blue-800',
  civil: 'bg-purple-100 text-purple-800',
  criminal: 'bg-red-100 text-red-800',
  previdenciario: 'bg-green-100 text-green-800',
  // Statuses
  ativo: 'bg-green-100 text-green-700',
  audiencia: 'bg-blue-100 text-blue-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  encerrado: 'bg-muted text-muted-foreground',
  recurso: 'bg-orange-100 text-orange-700',
  // Roles
  admin: 'bg-blue-100 text-blue-800',
  advogado: 'bg-emerald-100 text-emerald-800',
  assistente: 'bg-amber-100 text-amber-800',
  estagiario: 'bg-muted text-foreground',
  // Special
  vip: 'bg-amber-100 text-amber-800',
};

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  trabalhista: 'Trabalhista',
  civil: 'Civil',
  criminal: 'Criminal',
  previdenciario: 'Previdenciário',
  ativo: 'Ativo',
  audiencia: 'Audiência',
  pendente: 'Pendente',
  encerrado: 'Encerrado',
  recurso: 'Recurso',
  admin: 'Admin',
  advogado: 'Advogado',
  assistente: 'Assistente',
  estagiario: 'Estagiário',
  vip: 'VIP',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {label || variantLabels[variant] || variant}
    </span>
  );
}
