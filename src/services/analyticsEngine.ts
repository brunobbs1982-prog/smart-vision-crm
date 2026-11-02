import type { AccountOpportunity, KnowledgeBaseRuleId, FunnelStageId } from '@/types/crm.types';
import { FUNNEL_STAGES } from '@/constants/funnelStages';
import { todayISO } from '@/lib/utils';

export function weightedForecast(accounts: AccountOpportunity[]): number {
  return accounts.reduce((sum, a) => {
    const w = FUNNEL_STAGES.find((s) => s.id === a.stage)?.weight ?? 0;
    return sum + a.value * w;
  }, 0);
}

export function sumValue(accounts: AccountOpportunity[]): number {
  return accounts.reduce((s, a) => s + a.value, 0);
}

export function filterByKbRule(
  accounts: AccountOpportunity[],
  rule: KnowledgeBaseRuleId
): AccountOpportunity[] {
  const today = todayISO();
  switch (rule) {
    case 'FOCUS_LEAD_PROSPECT':
      return accounts.filter((a) => a.status === 'lead' || a.status === 'prospect');
    case 'AT_RISK':
      return accounts.filter(
        (a) =>
          (a.status === 'lead' || a.status === 'prospect') &&
          (!a.nextDate || a.nextDate <= today)
      );
    case 'ACTIVE_FUNNEL':
      return accounts.filter((a) =>
        (['abordagem', 'apresentacao', 'negociacao'] as FunnelStageId[]).includes(a.stage)
      );
    case 'MULTICHANNEL_READY':
      return accounts.filter((a) => {
        const c = a.contacts[0];
        return !!(c?.email && c?.phone && c?.linkedin);
      });
    case 'DECISION_MAKER':
      return accounts.filter((a) => a.contacts.some((c) => c.decisionRole === 'Decisor'));
    case 'PRE_SCHEDULED_REVIEW':
      return accounts.filter(
        (a) =>
          a.tasks.some((t) => /revis[aã]o/i.test(t.title) && !t.done) ||
          /revis[aã]o/i.test(a.nextAction)
      );
    case 'ALL':
    default:
      return accounts;
  }
}

export function stageBreakdown(accounts: AccountOpportunity[]) {
  return FUNNEL_STAGES.map((st) => {
    const list = accounts.filter((a) => a.stage === st.id);
    const value = sumValue(list);
    return {
      ...st,
      count: list.length,
      value,
      weighted: value * st.weight,
    };
  });
}
