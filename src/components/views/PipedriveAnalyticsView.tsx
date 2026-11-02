'use client';

import { useMemo } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import { formatCurrency } from '@/lib/utils';
import {
  filterByKbRule,
  stageBreakdown,
  sumValue,
  weightedForecast,
} from '@/services/analyticsEngine';

export function PipedriveAnalyticsView() {
  const accounts = useCrmStore((s) => s.getFilteredAccounts());

  const stats = useMemo(() => {
    const byStage = stageBreakdown(accounts);
    const pendingTasks = accounts.reduce(
      (s, a) => s + a.tasks.filter((t) => !t.done).length,
      0
    );
    return {
      total: sumValue(accounts),
      forecast: weightedForecast(accounts),
      byStage,
      pendingTasks,
      handoffs: accounts.filter((a) => a.agentStatus === 'handoff_ready').length,
      agentOn: accounts.filter((a) => a.agentEnabled).length,
      count: accounts.length,
      atRisk: filterByKbRule(accounts, 'AT_RISK').length,
      multichannel: filterByKbRule(accounts, 'MULTICHANNEL_READY').length,
      decision: filterByKbRule(accounts, 'DECISION_MAKER').length,
    };
  }, [accounts]);

  const maxValue = Math.max(...stats.byStage.map((s) => s.value), 1);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-heading font-bold text-[#032D60]">Insights</h1>
          <p className="text-xs text-slate-500">Overview · Forecast · Base de Conhecimento Ciamakers</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Oportunidades', String(stats.count)],
            ['Valor em funil', formatCurrency(stats.total)],
            ['Forecast', formatCurrency(stats.forecast)],
            ['Tarefas pendentes', String(stats.pendingTasks)],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-xl font-heading font-bold text-[#032D60] font-metric mt-1">
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ['Em risco (AT_RISK)', stats.atRisk],
            ['Multicanal pronto', stats.multichannel],
            ['Com decisor', stats.decision],
          ].map(([label, n]) => (
            <div key={label as string} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-2xl font-heading font-bold text-[#0176D3] mt-1">{n}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Funil por etapa</h2>
          <div className="space-y-3">
            {stats.byStage.map((st) => (
              <div key={st.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">
                    {st.label} <span className="text-slate-400 font-normal">({st.count})</span>
                  </span>
                  <span className="font-metric text-slate-600">
                    {formatCurrency(st.value)} · FC {formatCurrency(st.weighted)}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(st.value / maxValue) * 100}%`,
                      backgroundColor: st.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500">Contas com agente ligado</div>
            <div className="text-2xl font-heading font-bold text-[#0176D3] mt-1">{stats.agentOn}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500">Hand-offs aguardando humano</div>
            <div className="text-2xl font-heading font-bold text-[#10B981] mt-1">{stats.handoffs}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
