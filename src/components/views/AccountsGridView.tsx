'use client';

import { useCrmStore } from '@/store/useCrmStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getStageConfig } from '@/constants/funnelStages';

export function AccountsGridView({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const accounts = useCrmStore((s) => s.getFilteredAccounts());

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-lg font-heading font-bold text-[#032D60] mb-4">Contas & Oportunidades</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const stage = getStageConfig(a.stage);
            return (
              <button
                key={a.id}
                onClick={() => onOpenAccount(a.id)}
                className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-[#0176D3] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{a.name}</h3>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white shrink-0"
                    style={{ background: stage.color }}
                  >
                    {stage.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{a.cityState} · {a.status}</div>
                <div className="text-base font-metric font-semibold text-[#032D60] mt-2">
                  {formatCurrency(a.value)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">{a.product}</div>
                {a.nextAction && (
                  <div className="mt-2 text-[11px] bg-slate-50 rounded px-2 py-1.5 border border-slate-100">
                    <span className="text-slate-400">{formatDate(a.nextDate)} · </span>
                    {a.nextAction}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
