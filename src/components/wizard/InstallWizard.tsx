'use client';

import { useState, FormEvent } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

export function InstallWizard() {
  const completeSetup = useCrmStore((s) => s.completeSetup);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('Bruno Salomão');
  const [email, setEmail] = useState('brunobbs1982@gmail.com');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loadDemo, setLoadDemo] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const steps = ['Boas-vindas', 'Administrador', 'Preferências', 'Concluir'];

  function nextFromWelcome() {
    setStep(2);
  }

  function nextFromAdmin(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Informe o nome');
    if (!email.trim() || !email.includes('@')) return setError('E-mail inválido');
    if (password.length < 4) return setError('Senha com pelo menos 4 caracteres');
    if (password !== password2) return setError('As senhas não coincidem');
    setStep(3);
  }

  function finish() {
    completeSetup({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      loadDemo,
    });
    setDone(true);
    setStep(4);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F6F9] px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#032D60] mb-3 shadow-lg">
            <span className="text-xl font-bold text-white font-heading">SV</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-[#032D60]">
            Instalação · SMART V.I.S.I.O.N.
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure sua conta em poucos passos</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 mb-4 px-1">
          {steps.map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const completed = step > n || (step === 4 && done);
            return (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                    completed && 'bg-[#10B981] text-white',
                    active && !completed && 'bg-[#0176D3] text-white',
                    !active && !completed && 'bg-slate-200 text-slate-500'
                  )}
                >
                  {completed ? '✓' : n}
                </div>
                <span
                  className={cn(
                    'text-[10px] hidden sm:block truncate',
                    active ? 'text-slate-800 font-medium' : 'text-slate-400'
                  )}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn('flex-1 h-px', completed ? 'bg-[#10B981]' : 'bg-slate-200')} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Bem-vindo</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Este assistente cria o <strong>usuário administrador</strong> do CRM, prepara o
                armazenamento local e opcionalmente carrega dados de demonstração para você testar o
                funil, tarefas e o agente.
              </p>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li>Gestão de oportunidades e funil de 6 etapas</li>
                <li>Conectores Gmail, WhatsApp e LinkedIn</li>
                <li>Agente de follow-up com hand-off humano</li>
              </ul>
              <button onClick={nextFromWelcome} className="w-full btn-primary py-2.5 text-sm mt-2">
                Começar instalação
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={nextFromAdmin} className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Criar administrador</h2>
              <p className="text-xs text-slate-500">Este será o primeiro usuário (admin) do sistema.</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176D3]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de acesso</label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176D3]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (opcional)</label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176D3]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 19 99999-0000"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176D3]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar senha</label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176D3]"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Voltar
                </button>
                <button type="submit" className="flex-1 btn-primary py-2.5 text-sm">
                  Continuar
                </button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Preferências iniciais</h2>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={loadDemo}
                  onChange={(e) => setLoadDemo(e.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium text-slate-800">Carregar dados de demonstração</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Inclui 2–3 oportunidades de exemplo para explorar o funil, tarefas e o agente
                    imediatamente.
                  </div>
                </div>
              </label>

              <div className="bg-slate-50 rounded-xl p-4 text-sm border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail</span>
                  <span className="font-medium">{email}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Voltar
                </button>
                <button onClick={finish} className="flex-1 btn-emerald py-2.5 text-sm">
                  Concluir instalação
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="text-center py-2 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center text-3xl mx-auto">
                ✓
              </div>
              <h2 className="text-lg font-heading font-bold text-[#032D60]">Instalação concluída</h2>
              <p className="text-sm text-slate-600">
                Sua conta admin está pronta. Você já pode usar o funil, criar oportunidades e instalar
                conectores.
              </p>
              <a
                href="/"
                className="inline-block w-full btn-primary py-2.5 text-sm text-center"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/';
                }}
              >
                Ir para o CRM
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Dados salvos neste navegador · Ciamakers SMART V.I.S.I.O.N.
        </p>
      </div>
    </div>
  );
}
