import React from 'react';
import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
  pageName: string;
}

export default function PagePlaceholder({ pageName }: PagePlaceholderProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-8 text-center">
      <Construction className="w-10 h-10 text-muted mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-foreground mb-1">{pageName}</h2>
      <p className="text-sm text-muted-foreground">Em construção</p>
    </div>
  );
}
