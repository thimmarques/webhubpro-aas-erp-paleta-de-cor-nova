import React from 'react';

interface UserAvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

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

export default function UserAvatar({ name, color, size = 'md' }: UserAvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} ${color} rounded-full flex items-center justify-center text-white font-medium shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}
