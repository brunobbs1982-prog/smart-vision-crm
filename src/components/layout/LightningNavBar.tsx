'use client';

import { cn } from '@/lib/utils';

const TABS = [
  { id: 'home', label: 'Início' },
  { id: 'kanban', label: 'Funil' },
  { id: 'accounts', label: 'Contas' },
  { id: 'contacts', label: 'Contatos' },
  { id: 'tasks', label: 'Tarefas' },
  { id: 'products', label: 'Produtos' },
  { id: 'analytics', label: 'Insights' },
  { id: 'handoff', label: 'Hand-off' },
  { id: 'channels', label: 'Conectores' },
  { id: 'users', label: 'Usuários' },
] as const;

export type NavTabId = (typeof TABS)[number]['id'];

interface Props {
  active: NavTabId;
  onChange: (id: NavTabId) => void;
  handoffCount?: number;
}

export function LightningNavBar({ active, onChange, handoffCount = 0 }: Props) {
  return (
    <nav className="h-11 bg-white flex items-center gap-0.5 shrink-0 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative px-2.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
            active === tab.id
              ? 'text-[#0176D3] bg-[#EBF5FF]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          {tab.label}
          {tab.id === 'handoff' && handoffCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#10B981] text-white text-[10px] font-bold flex items-center justify-center">
              {handoffCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
