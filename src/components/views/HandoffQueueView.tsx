'use client';

import { useCrmStore } from '@/store/useCrmStore';
import { formatCurrency, formatDate } from '@/lib/utils';

export function HandoffQueueView({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const accounts = useCrmStore((s) => s.accounts);
  const setAgentStatus = useCrmStore((s) => s.setAgentStatus);
  const updateAccount = useCrmStore((s) => s.updateAccount);

  const handoffs = accounts.filter((a) => a.agentStatus === 'handoff_ready');

  function accept(id: string) {
    setAgentStatus(id, 'paused');
    updateAccount(id, { agentEnabled: false });
    onOpenAccount(id);
  }

  function continueAgent(id: string) {
    setAgentStatus(id, 'follow_up');
    updateAccount(id, { handoffNotes: undefined, handoffRequestedAt: undefined });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-lg font-heading font-bold text-[#032D60] mb-1">Fila de Hand-off</h1>
        <p className="text-sm text-slate-500 mb-6">
          Contas em que o agente detectou interesse e pede intervenção humana.
        </p>

        {handoffs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
            Nenhuma conta aguardando hand-off no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {handoffs.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{a.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {a.stage} · {formatCurrency(a.value)} · {a.ownerName}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                    Hand-off
                  </span>
                </div>
                {a.handoffNotes && (
                  <div className="mt-3 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                    {a.handoffNotes}
                  </div>
                )}
                {a.handoffRequestedAt && (
                  <div className="text-[11px] text-slate-400 mt-2">
                    Solicitado em {new Date(a.handoffRequestedAt).toLocaleString('pt-BR')}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => accept(a.id)} className="btn-emerald text-sm">
                    Assumir conversa
                  </button>
                  <button
                    onClick={() => continueAgent(a.id)}
                    className="text-sm px-4 py-2 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Devolver ao agente
                  </button>
                  <button
                    onClick={() => onOpenAccount(a.id)}
                    className="text-sm px-4 py-2 rounded-lg text-[#0176D3] font-medium hover:bg-[#EBF5FF]"
                  >
                    Ver ficha
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
