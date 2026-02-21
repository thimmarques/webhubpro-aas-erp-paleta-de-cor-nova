import { MockUser } from '@/types';

function getInitials(name: string): string {
  return name
    .replace(/^(Dr\.|Dra\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-001',
    name: 'Dr. Roberto Alves',
    email: 'roberto@webhubpro.com.br',
    password: 'admin123',
    oab: 'OAB/SP 123.456',
    role: 'admin',
    practice_areas: ['trabalhista', 'civil', 'criminal', 'previdenciario'],
    avatar_color: 'bg-blue-600',
    avatar_initials: getInitials('Dr. Roberto Alves'),
  },
  {
    id: 'user-002',
    name: 'Dr. Marcos Ferreira',
    email: 'marcos@webhubpro.com.br',
    password: 'marcos123',
    oab: 'OAB/SP 234.567',
    role: 'advogado',
    practice_areas: ['trabalhista', 'civil'],
    avatar_color: 'bg-emerald-600',
    avatar_initials: getInitials('Dr. Marcos Ferreira'),
  },
  {
    id: 'user-003',
    name: 'Dra. Patrícia Lima',
    email: 'patricia@webhubpro.com.br',
    password: 'patricia123',
    oab: 'OAB/SP 345.678',
    role: 'advogado',
    practice_areas: ['trabalhista', 'civil'],
    avatar_color: 'bg-violet-600',
    avatar_initials: getInitials('Dra. Patrícia Lima'),
  },
  {
    id: 'user-004',
    name: 'Dr. Carlos Mendes',
    email: 'carlos@webhubpro.com.br',
    password: 'carlos123',
    oab: 'OAB/RJ 456.789',
    role: 'advogado',
    practice_areas: ['criminal'],
    avatar_color: 'bg-rose-600',
    avatar_initials: getInitials('Dr. Carlos Mendes'),
  },
  {
    id: 'user-005',
    name: 'Dra. Sandra Costa',
    email: 'sandra@webhubpro.com.br',
    password: 'sandra123',
    oab: 'OAB/MG 567.890',
    role: 'advogado',
    practice_areas: ['previdenciario'],
    avatar_color: 'bg-amber-600',
    avatar_initials: getInitials('Dra. Sandra Costa'),
  },
];
