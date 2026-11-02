/**
 * SMART V.I.S.I.O.N. Design Tokens
 * Salesforce Lightning + Emerald Tech
 */

export const colors = {
  sf: {
    navy: '#032D60',
    dark: '#001639',
    blue: '#0176D3',
    blueHover: '#014486',
    lightBlue: '#EBF5FF',
    bg: '#F3F6F9',
    emerald: '#10B981',
    emeraldHover: '#059669',
  },
  status: {
    lead: '#94A3B8',
    prospect: '#3B82F6',
    ativo: '#10B981',
    desativado: '#EF4444',
  },
  agent: {
    idle: '#94A3B8',
    researching: '#8B5CF6',
    messaging: '#0176D3',
    waiting_response: '#F59E0B',
    follow_up: '#F97316',
    handoff_ready: '#10B981',
    paused: '#6B7280',
    completed: '#22C55E',
  },
} as const;

export const fonts = {
  heading: '"Plus Jakarta Sans", system-ui, sans-serif',
  sans: 'Inter, system-ui, sans-serif',
  metric: '"JetBrains Mono", ui-monospace, monospace',
} as const;
