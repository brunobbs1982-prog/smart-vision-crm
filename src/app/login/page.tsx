'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCrmStore } from '@/store/useCrmStore';
import { apiLogin, apiHealth, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const loginLocal = useCrmStore((s) => s.login);
  const setupCompleted = useCrmStore((s) => s.setupCompleted);
  const isAuthenticated = useCrmStore((s) => s.isAuthenticated);
  const users = useCrmStore((s) => s.users);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && users.length > 0 && !email) {
      setEmail(users[0].email);
    }
  }, [hydrated, users]);

  useEffect(() => {
    if (!hydrated) return;
    if (!setupCompleted) {
      router.replace('/setup');
      return;
    }
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [hydrated, setupCompleted, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const backendUp = await apiHealth();
    if (backendUp) {
      try {
        await apiLogin(email, password);
        const result = await loginLocal(email, password);
        if (result.ok) {
          setLoading(false);
          router.push('/');
          return;
        }
      } catch {
        /* fallback local */
      }
    }

    const result = await loginLocal(email, password);
    setLoading(false);
    if (result.ok) {
      setToken(null);
      router.push('/');
    } else {
      setError(result.error || 'Falha no login');
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F6F9] text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F6F9] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#032D60] mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white font-heading">SV</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-[#032D60] tracking-tight">
            SMART V.I.S.I.O.N.
          </h1>
          <p className="text-slate-500 mt-1 text-sm">CRM + Inteligência Comercial</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0176D3] text-sm"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0176D3] text-sm"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm disabled:opacity-60">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
