'use client';

import { FUNNEL_STAGES } from '@/constants/funnelStages';
import { useCrmStore } from '@/store/useCrmStore';
import { KanbanCard } from './KanbanCard';
import { formatCurrency } from '@/lib/utils';
import type { FunnelStageId } from '@/types/crm.types';

interface Props {
  onOpenAccount: (id: string) => void;
  onOpenScript?: (id: string) => void;
  onCreateAtStage?: (stage: FunnelStageId) => void;
}

export function KanbanBoard({ onOpenAccount, onOpenScript, onCreateAtStage }: Props) {
  const accounts = useCrmStore((s) => s.getFilteredAccounts());

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
      <div className="flex gap-3 h-full min-w-max">
        {FUNNEL_STAGES.map((stage) => {
          const stageAccounts = accounts.filter((a) => a.stage === stage.id);
          const totalValue = stageAccounts.reduce((sum, a) => sum + a.value, 0);
          const weighted = totalValue * stage.weight;

          return (
            <div
              key={stage.id}
              className="w-72 flex flex-col bg-slate-100/80 rounded-xl border border-slate-200/80 max-h-full"
            >
              <div className="px-3 py-2.5 border-b border-slate-200/80 shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                  <span className="ml-auto text-xs font-metric text-slate-500 bg-white px-1.5 py-0.5 rounded">
                    {stageAccounts.length}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatCurrency(totalValue)}</span>
                  <span className="font-metric" title="Forecast ponderado">
                    FC {formatCurrency(weighted)}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                {stageAccounts.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-6">
                    Nenhuma oportunidade
                  </div>
                )}
                {stageAccounts.map((acc) => (
                  <KanbanCard
                    key={acc.id}
                    account={acc}
                    onOpen={onOpenAccount}
                    onOpenScript={onOpenScript}
                  />
                ))}
              </div>

              {onCreateAtStage && (
                <div className="p-2 border-t border-slate-200/80 shrink-0">
                  <button
                    onClick={() => onCreateAtStage(stage.id)}
                    className="w-full text-xs font-medium text-[#0176D3] hover:bg-white rounded-lg py-2 transition-colors"
                  >
                    + Adicionar nesta etapa
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
