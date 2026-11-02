'use client';

import type { AccountOpportunity } from '@/types/crm.types';
import { getStageConfig } from '@/constants/funnelStages';
import { formatCurrency, formatDate, whatsappLink } from '@/lib/utils';
import { useCrmStore } from '@/store/useCrmStore';
import { colors } from '@/lib/theme';

interface Props {
  account: AccountOpportunity;
  onOpen: (id: string) => void;
  onOpenScript?: (id: string) => void;
}

const agentStatusLabel: Record<string, string> = {
  idle: 'Inativo',
  researching: 'Pesquisando',
  messaging: 'Enviando',
  waiting_response: 'Aguardando',
  follow_up: 'Follow-up',
  handoff_ready: 'Hand-off',
  paused: 'Pausado',
  completed: 'Concluído',
};

export function KanbanCard({ account, onOpen, onOpenScript }: Props) {
  const moveAccountStage = useCrmStore((s) => s.moveAccountStage);
  const primary = account.contacts[0];
  const agentColor = colors.agent[account.agentStatus] || colors.agent.idle;

  return (
    <div
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onOpen(account.id)}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#0176D3]">
            {account.name}
          </h3>
          {account.agentEnabled && (
            <span
              className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: agentColor }}
              title={`Agente: ${agentStatusLabel[account.agentStatus]}`}
            >
              AI
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">{account.cityState}</p>
      </div>

      {/* Valor + Produto */}
      <div className="px-3 pb-2">
        <div className="text-sm font-metric font-semibold text-[#032D60]">
          {formatCurrency(account.value)}
        </div>
        <div className="text-[11px] text-slate-500 truncate">{account.product}</div>
      </div>

      {/* Contato principal */}
      {primary && (
        <div className="px-3 pb-2 text-[11px] text-slate-600">
          <span className="font-medium">{primary.name}</span>
          {primary.decisionRole === 'Decisor' && (
            <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">Decisor</span>
          )}
        </div>
      )}

      {/* Próxima ação */}
      {account.nextAction && (
        <div className="px-3 pb-2">
          <div className="text-[11px] bg-slate-50 rounded px-2 py-1.5 border border-slate-100">
            <div className="text-slate-500 text-[10px]">Próxima ação · {formatDate(account.nextDate)}</div>
            <div className="text-slate-700 font-medium truncate">{account.nextAction}</div>
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div
        className="px-3 pb-3 flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {primary?.phone && (
          <a
            href={whatsappLink(primary.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-md bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-xs hover:bg-[#10B981]/20"
            title="WhatsApp"
          >
            WA
          </a>
        )}
        {primary?.email && (
          <a
            href={`mailto:${primary.email}`}
            className="w-7 h-7 rounded-md bg-[#0176D3]/10 text-[#0176D3] flex items-center justify-center text-xs hover:bg-[#0176D3]/20"
            title="E-mail"
          >
            @
          </a>
        )}
        {primary?.linkedin && (
          <a
            href={primary.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-md bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center text-xs hover:bg-[#0A66C2]/20"
            title="LinkedIn"
          >
            in
          </a>
        )}
        {onOpenScript && (
          <button
            onClick={() => onOpenScript(account.id)}
            className="w-7 h-7 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center text-xs hover:bg-violet-100"
            title="Script Assistant"
          >
            ⚡
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={() => moveAccountStage(account.id, 'prev')}
          className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
          title="Etapa anterior"
        >
          ‹
        </button>
        <button
          onClick={() => moveAccountStage(account.id, 'next')}
          className="w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
          title="Próxima etapa"
        >
          ›
        </button>
      </div>
    </div>
  );
}
