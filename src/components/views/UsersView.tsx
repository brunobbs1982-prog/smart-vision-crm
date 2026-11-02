'use client';

import { useState, FormEvent } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import type { PlatformUser } from '@/types/crm.types';

export function UsersView() {
  const currentUser = useCrmStore((s) => s.currentUser);
  const users = useCrmStore((s) => s.users);
  const createUser = useCrmStore((s) => s.createUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<PlatformUser['role']>('executivo');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
        Apenas administradores podem gerenciar usuários.
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    const res = createUser({ name, email, password, role });
    if (!res.ok) {
      setErr(res.error || 'Erro');
      return;
    }
    setMsg(`Usuário ${email} criado`);
    setName('');
    setEmail('');
    setPassword('');
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-heading font-bold text-[#032D60]">Usuários</h1>
          <p className="text-sm text-slate-500">Criar e listar usuários do CRM</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-800 text-sm">Novo usuário</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
            <select
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as PlatformUser['role'])}
            >
              <option value="executivo">Executivo</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          <button type="submit" className="btn-primary text-sm">
            Criar usuário
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5">Nome</th>
                <th className="px-4 py-2.5">E-mail</th>
                <th className="px-4 py-2.5">Papel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
