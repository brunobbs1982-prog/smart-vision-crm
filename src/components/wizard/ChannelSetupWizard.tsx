'use client';

import { useState, useEffect } from 'react';
import type { ChannelType, ChannelProvider, ChannelConnection } from '@/types/crm.types';
import { useCrmStore } from '@/store/useCrmStore';
import { generateId, cn } from '@/lib/utils';
import { apiHealth, apiStartGmailOAuth } from '@/lib/api';

type WizardStep = 1 | 2 | 3 | 4;

interface ChannelOption {
  id: ChannelType;
  label: string;
  description: string;
  icon: string;
  providers: { id: ChannelProvider; label: string; hint: string; recommended?: boolean }[];
}

const CHANNELS: ChannelOption[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    description: 'Enviar e receber e-mails comerciais',
    icon: 'G',
    providers: [
      {
        id: 'api',
        label: 'Google API (OAuth)',
        hint: 'Oficial, seguro e estável. Recomendado para brunobbs1982@gmail.com.',
        recommended: true,
      },
      {
        id: 'browser',
        label: 'Navegador (sessão humana)',
        hint: 'Abre o Gmail como você faria manualmente.',
      },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Mensagens via WhatsApp Business',
    icon: 'W',
    providers: [
      {
        id: 'api',
        label: 'WhatsApp Business API',
        hint: 'Oficial Meta. Ideal para autonomia em escala.',
        recommended: true,
      },
      {
        id: 'browser',
        label: 'Navegador (não oficial)',
        hint: 'Risco de bloqueio. Use só em testes.',
      },
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Leitura de perfil e mensagens',
    icon: 'in',
    providers: [
      {
        id: 'browser',
        label: 'Navegador (estilo humano)',
        hint: 'Navegação assistida. Volume baixo recomendado.',
        recommended: true,
      },
      {
        id: 'api',
        label: 'LinkedIn API',
        hint: 'Escopos limitados para messaging.',
      },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  initialChannel?: ChannelType;
}

export function ChannelSetupWizard({ open, onClose, initialChannel }: Props) {
  const currentUser = useCrmStore((s) => s.currentUser);
  const upsert = useCrmStore((s) => s.upsertChannelConnection);
  const existingConnections = useCrmStore((s) => s.channelConnections);

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ChannelProvider | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [doneConnection, setDoneConnection] = useState<ChannelConnection | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setConnecting(false);
    setDoneConnection(null);
    setError('');
    setSelectedProvider(null);
    if (initialChannel) {
      setSelectedChannel(initialChannel);
      setStep(2);
      if (initialChannel === 'gmail') setDisplayName(currentUser?.email || 'brunobbs1982@gmail.com');
      else if (initialChannel === 'whatsapp') setDisplayName(currentUser?.phone || '');
      else setDisplayName(currentUser?.name || '');
    } else {
      setSelectedChannel(null);
      setStep(1);
      setDisplayName('');
    }
  }, [open, initialChannel]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const channelMeta = CHANNELS.find((c) => c.id === selectedChannel);
  const stepsLabel = ['Canal', 'Modo', 'Confirmar', 'Pronto'];

  function resetAndClose() {
    setStep(1);
    setSelectedChannel(null);
    setSelectedProvider(null);
    setDisplayName('');
    setConnecting(false);
    setDoneConnection(null);
    setError('');
    onClose();
  }

  function chooseChannel(ch: ChannelType) {
    setSelectedChannel(ch);
    setSelectedProvider(null);
    setError('');
    if (ch === 'gmail') setDisplayName(currentUser?.email || 'brunobbs1982@gmail.com');
    else if (ch === 'whatsapp') setDisplayName(currentUser?.phone || '');
    else setDisplayName(currentUser?.name || '');
    setStep(2);
  }

  function chooseProvider(p: ChannelProvider) {
    setSelectedProvider(p);
    setError('');
    setStep(3);
  }

  async function finalize() {
    if (!currentUser || !selectedChannel || !selectedProvider) return;
    setConnecting(true);
    setError('');

    try {
      // Gmail + API: tenta OAuth real via backend
      if (selectedChannel === 'gmail' && selectedProvider === 'api') {
        const backendUp = await apiHealth();
        if (backendUp) {
          const oauth = await apiStartGmailOAuth();
          if (oauth.mode === 'oauth' && oauth.authUrl) {
            window.location.href = oauth.authUrl;
            return;
          }
          // mode demo no backend
          if (oauth.connection) {
            const conn: ChannelConnection = {
              id: generateId('ch'),
              userId: currentUser.id,
              channel: 'gmail',
              provider: 'api',
              status: 'connected',
              displayName: displayName.trim() || currentUser.email,
              metadata: { mode: 'demo', email: displayName.trim() || currentUser.email },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastUsedAt: new Date().toISOString(),
            };
            upsert(conn);
            setDoneConnection(conn);
            setStep(4);
            setConnecting(false);
            return;
          }
        }
      }

      await new Promise((r) => setTimeout(r, 800));

      const existing = existingConnections.find(
        (c) => c.channel === selectedChannel && c.userId === currentUser.id
      );

      const conn: ChannelConnection = {
        id: existing?.id || generateId('ch'),
        userId: currentUser.id,
        channel: selectedChannel,
        provider: selectedProvider,
        status: 'connected',
        displayName: displayName.trim() || currentUser.email,
        accessToken: selectedProvider === 'api' ? `demo-token-${Date.now()}` : undefined,
        metadata:
          selectedProvider === 'browser'
            ? { sessionId: `session-${Date.now()}`, mode: 'human-like' }
            : selectedChannel === 'whatsapp'
              ? { phoneNumberId: 'pending-real-id' }
              : selectedChannel === 'gmail'
                ? { email: displayName.trim() || currentUser.email }
                : {},
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };

      upsert(conn);
      setDoneConnection(conn);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir a conexão.');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={resetAndClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#032D60] px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg">Instalar conector</h2>
              <p className="text-white/70 text-xs mt-0.5">Configure o canal em poucos cliques</p>
            </div>
            <button
              onClick={resetAndClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white text-lg"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {stepsLabel.map((label, i) => {
              const n = (i + 1) as WizardStep;
              const active = step === n;
              const done = step > n;
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0',
                      done && 'bg-[#10B981] text-white',
                      active && 'bg-white text-[#032D60]',
                      !done && !active && 'bg-white/20 text-white/60'
                    )}
                  >
                    {done ? '✓' : n}
                  </div>
                  <span
                    className={cn(
                      'text-[11px] hidden sm:block',
                      active ? 'text-white font-medium' : 'text-white/50'
                    )}
                  >
                    {label}
                  </span>
                  {i < stepsLabel.length - 1 && (
                    <div className={cn('flex-1 h-px', done ? 'bg-[#10B981]' : 'bg-white/20')} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[280px]">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">Qual canal você quer conectar agora?</p>
              {CHANNELS.map((ch) => {
                const already = existingConnections.some(
                  (c) =>
                    c.channel === ch.id &&
                    c.userId === currentUser?.id &&
                    c.status === 'connected'
                );
                return (
                  <button
                    key={ch.id}
                    onClick={() => chooseChannel(ch.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-[#0176D3] hover:bg-[#EBF5FF] transition-colors text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#032D60] text-white flex items-center justify-center font-bold text-sm group-hover:bg-[#0176D3] transition-colors">
                      {ch.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {ch.label}
                        {already && (
                          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                            já conectado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{ch.description}</div>
                    </div>
                    <span className="text-slate-300 group-hover:text-[#0176D3] text-lg">›</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && channelMeta && (
            <div className="space-y-3">
              <button onClick={() => setStep(1)} className="text-xs text-[#0176D3] hover:underline mb-1">
                ← Voltar
              </button>
              <p className="text-sm text-slate-600 mb-3">
                Como deseja conectar o <strong>{channelMeta.label}</strong>?
              </p>
              {channelMeta.providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => chooseProvider(p.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-colors',
                    p.recommended
                      ? 'border-[#0176D3] bg-[#EBF5FF] hover:bg-[#d6ebff]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{p.label}</span>
                    {p.recommended && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-[#0176D3] text-white px-1.5 py-0.5 rounded">
                        recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.hint}</p>
                </button>
              ))}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && channelMeta && selectedProvider && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="text-xs text-[#0176D3] hover:underline">
                ← Voltar
              </button>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Canal</span>
                  <span className="font-medium text-slate-800">{channelMeta.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modo</span>
                  <span className="font-medium text-slate-800">
                    {channelMeta.providers.find((p) => p.id === selectedProvider)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Usuário CRM</span>
                  <span className="font-medium text-slate-800">{currentUser?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nome de exibição da conexão
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={
                    selectedChannel === 'gmail'
                      ? 'brunobbs1982@gmail.com'
                      : selectedChannel === 'whatsapp'
                        ? '+55 19 99999-0000'
                        : 'Seu nome no LinkedIn'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0176D3] focus:border-transparent text-sm"
                />
                {selectedChannel === 'gmail' && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use o e-mail Google que será autorizado (ex.: brunobbs1982@gmail.com).
                  </p>
                )}
              </div>

              {selectedProvider === 'api' && selectedChannel === 'gmail' && (
                <div className="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  Ao confirmar, o fluxo OAuth do Google será iniciado para autorizar envio de e-mails
                  com a conta <strong>brunobbs1982@gmail.com</strong>. Em modo demo a autorização é
                  simulada.
                </div>
              )}

              {selectedProvider === 'browser' && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  O modo navegador abre uma sessão controlada (estilo humano). Use com moderação no
                  LinkedIn e WhatsApp.
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                onClick={finalize}
                disabled={connecting}
                className="w-full btn-primary py-2.5 text-sm disabled:opacity-60"
              >
                {connecting ? 'Conectando...' : 'Conectar agora'}
              </button>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && doneConnection && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center text-3xl mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-lg font-heading font-bold text-[#032D60]">Conector instalado</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                {doneConnection.channel.toUpperCase()} via {doneConnection.provider} está pronto para o
                agente usar.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm border border-slate-100 mb-6">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Conta</span>
                  <span className="font-medium">{doneConnection.displayName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-emerald-600">Conectado</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Provedor</span>
                  <span className="font-medium">{doneConnection.provider}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedChannel(null);
                    setSelectedProvider(null);
                    setDoneConnection(null);
                    setDisplayName('');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Conectar outro canal
                </button>
                <button onClick={resetAndClose} className="flex-1 btn-emerald py-2.5 text-sm">
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
