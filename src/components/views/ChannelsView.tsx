'use client';

import { useState } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import type { ChannelType } from '@/types/crm.types';
import { ChannelSetupWizard } from '@/components/wizard/ChannelSetupWizard';

const CHANNEL_LABELS: Record<ChannelType, { label: string; icon: string }> = {
  gmail: { label: 'Gmail', icon: 'G' },
  whatsapp: { label: 'WhatsApp', icon: 'W' },
  linkedin: { label: 'LinkedIn', icon: 'in' },
};

export function ChannelsView() {
  const currentUser = useCrmStore((s) => s.currentUser);
  const connections = useCrmStore((s) => s.channelConnections);
  const remove = useCrmStore((s) => s.removeChannelConnection);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [initialChannel, setInitialChannel] = useState<ChannelType | undefined>();

  const myConnections = connections.filter((c) => c.userId === currentUser?.id);

  function openWizard(channel?: ChannelType) {
    setInitialChannel(channel);
    setWizardOpen(true);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-heading font-bold text-[#032D60]">Conectores</h1>
            <p className="text-sm text-slate-500 mt-1">
              Instale Gmail, WhatsApp e LinkedIn para o agente enviar mensagens e enriquecer perfis.
            </p>
          </div>
          <button onClick={() => openWizard()} className="btn-primary text-sm shrink-0">
            + Instalar conector
          </button>
        </div>

        {/* Conta logada */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#0176D3] text-white flex items-center justify-center font-bold text-sm">
            {currentUser?.name?.charAt(0) || 'B'}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{currentUser?.name}</div>
            <div className="text-xs text-slate-500">{currentUser?.email}</div>
          </div>
        </div>

        {/* Lista de conexões */}
        {myConnections.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-slate-500 text-sm mb-4">Nenhum conector instalado ainda.</p>
            <button onClick={() => openWizard()} className="btn-primary text-sm">
              Começar instalação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myConnections.map((conn) => {
              const meta = CHANNEL_LABELS[conn.channel];
              return (
                <div
                  key={conn.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#032D60] text-white flex items-center justify-center font-bold text-sm">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      {meta.label}
                      <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                        conectado
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {conn.displayName} · via {conn.provider}
                    </div>
                  </div>
                  <button
                    onClick={() => openWizard(conn.channel)}
                    className="text-xs text-[#0176D3] font-medium px-3 py-1.5 rounded-md hover:bg-[#EBF5FF]"
                  >
                    Reconfigurar
                  </button>
                  <button
                    onClick={() => remove(conn.id)}
                    className="text-xs text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Atalhos rápidos se faltar algum canal */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {(['gmail', 'whatsapp', 'linkedin'] as ChannelType[]).map((ch) => {
            const connected = myConnections.some((c) => c.channel === ch && c.status === 'connected');
            if (connected) return null;
            const meta = CHANNEL_LABELS[ch];
            return (
              <button
                key={ch}
                onClick={() => openWizard(ch)}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-[#0176D3] hover:bg-[#EBF5FF] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs mx-auto mb-2">
                  {meta.icon}
                </div>
                <div className="text-sm font-medium text-slate-700">{meta.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Instalar</div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
          <strong>Dica:</strong> para autonomia real, prefira <strong>Gmail via Google API</strong> e{' '}
          <strong>WhatsApp Business API</strong>. LinkedIn via browser deve ser usado com volume baixo.
        </div>
      </div>

      <ChannelSetupWizard
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setInitialChannel(undefined);
        }}
        initialChannel={initialChannel}
      />
    </div>
  );
}
