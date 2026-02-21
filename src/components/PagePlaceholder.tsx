import React from 'react';
import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
  pageName: string;
}

export default function PagePlaceholder({ pageName }: PagePlaceholderProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
      <Construction className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{pageName}</h2>
      <p className="text-sm text-slate-400">Em construção</p>
    </div>
  );
}
