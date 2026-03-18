import React, { useState } from 'react';
import { Scale } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_USERS } from '@/data/mockUsers';
import StatusBadge from '@/components/StatusBadge';
import UserAvatar from '@/components/UserAvatar';

export default function Login() {
  const { login, loginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = login(email, password);
    if (!ok) setError('E-mail ou senha incorretos.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
           <div className="bg-primary rounded-md p-2 mb-3">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">WebHubPro ERP</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão Jurídica Inteligente</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-2.5 rounded-md transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>

        {/* Quick access */}
        <div className="mt-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3 text-center">
            Acesso rápido — demo
          </p>
          <div className="space-y-2">
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => loginAs(user.id)}
                className="w-full bg-muted/50 border border-border rounded-lg p-3 text-left hover:border-accent hover:bg-card transition-colors flex items-center gap-3"
              >
                <UserAvatar name={user.name} color={user.avatar_color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                </div>
                <StatusBadge variant={user.role} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
