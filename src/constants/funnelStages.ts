import type { FunnelStageConfig, FunnelStageId } from '@/types/crm.types';

export const FUNNEL_STAGES: FunnelStageConfig[] = [
  {
    id: 'nutricao',
    label: 'Nutrição',
    weight: 0.1,
    avgDays: 6,
    color: '#94A3B8', // slate
  },
  {
    id: 'mapeamento',
    label: 'Mapeamento',
    weight: 0.25,
    avgDays: 8,
    color: '#60A5FA', // blue-400
  },
  {
    id: 'abordagem',
    label: 'Abordagem',
    weight: 0.4,
    avgDays: 10,
    color: '#3B82F6', // blue-500
  },
  {
    id: 'apresentacao',
    label: 'Apresentação',
    weight: 0.6,
    avgDays: 12,
    color: '#0176D3', // sf.blue
  },
  {
    id: 'negociacao',
    label: 'Negociação',
    weight: 0.8,
    avgDays: 9,
    color: '#F59E0B', // amber
  },
  {
    id: 'fechamento',
    label: 'Fechamento',
    weight: 1.0,
    avgDays: 4,
    color: '#10B981', // emerald
  },
];

export const STAGE_ORDER: FunnelStageId[] = FUNNEL_STAGES.map((s) => s.id);

export function getStageConfig(id: FunnelStageId): FunnelStageConfig {
  return FUNNEL_STAGES.find((s) => s.id === id) ?? FUNNEL_STAGES[0];
}

export function getNextStage(current: FunnelStageId): FunnelStageId | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function getPrevStage(current: FunnelStageId): FunnelStageId | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}
