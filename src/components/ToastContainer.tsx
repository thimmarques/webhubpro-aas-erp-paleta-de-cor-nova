import React from 'react';
import { useToastContext } from '@/contexts/ToastContext';
import { X } from 'lucide-react';

const borderColors = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-sidebar text-sidebar-foreground rounded-lg shadow-lg px-4 py-3 border-l-4 ${borderColors[toast.type]} flex items-center gap-3 min-w-[280px] animate-in slide-in-from-right-5`}
        >
          <span className="text-sm flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
