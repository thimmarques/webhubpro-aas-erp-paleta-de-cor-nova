import React from 'react';
import { Lock } from 'lucide-react';

export default function AccessDeniedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Lock className="w-16 h-16 text-muted-foreground/40 mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Apenas administradores podem visualizar informações financeiras.
      </p>
    </div>
  );
}
