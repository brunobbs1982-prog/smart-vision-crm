/**
 * Agent Orchestrator (client-side demo)
 * Em produção isso roda no backend (cron diário + webhooks).
 * Aqui simulamos um ciclo sobre as contas elegíveis.
 */

import type { AccountOpportunity, AgentDecision } from '@/types/crm.types';
import { generateId, todayISO } from '@/lib/utils';

export interface OrchestratorResult {
  accountId: string;
  decisions: AgentDecision[];
  newStatus: AccountOpportunity['agentStatus'];
  interaction?: {
    channel: 'WhatsApp' | 'E-mail' | 'LinkedIn';
    outcome: string;
    summary: string;
  };
  handoffNotes?: string;
}

function isAtRisk(acc: AccountOpportunity): boolean {
  const today = todayISO();
  return (
    (acc.status === 'lead' || acc.status === 'prospect') &&
    (!acc.nextDate || acc.nextDate <= today)
  );
}

function hasMultichannel(acc: AccountOpportunity): boolean {
  const c = acc.contacts[0];
  if (!c) return false;
  return !!(c.email && c.phone && c.linkedin);
}

/**
 * Decide a próxima ação para uma conta (regras + template de insight).
 */
export function planNextAction(acc: AccountOpportunity): OrchestratorResult | null {
  if (!acc.agentEnabled) return null;
  if (acc.agentStatus === 'handoff_ready' || acc.agentStatus === 'paused') return null;
  if (acc.status === 'ativo' || acc.status === 'desativado') return null;

  const decisions: AgentDecision[] = [];
  const contact = acc.contacts[0];
  const today = todayISO();

  // Sinal de interesse no histórico recente
  const positive = acc.interactions.some((i) =>
    /interessad|reuni[aã]o|proposta|demo|agendar/i.test(`${i.outcome} ${i.summary}`)
  );

  if (positive && acc.stage !== 'fechamento') {
    const decision: AgentDecision = {
      id: generateId('dec'),
      timestamp: new Date().toISOString(),
      reasoning: 'Detectado sinal de interesse nas interações. Solicitar hand-off humano.',
      action: 'request_handoff',
      executed: true,
      result: 'handoff_ready',
    };
    decisions.push(decision);
    return {
      accountId: acc.id,
      decisions,
      newStatus: 'handoff_ready',
      handoffNotes: `Interesse detectado em ${acc.name}. Contato: ${contact?.name || '—'}. Últimas interações indicam abertura para reunião/proposta. Próximo passo sugerido: agendar conversa e enviar pauta.`,
    };
  }

  // Conta em risco sem próximo passo
  if (isAtRisk(acc)) {
    const channel = contact?.phone ? 'WhatsApp' : contact?.email ? 'E-mail' : 'LinkedIn';
    const decision: AgentDecision = {
      id: generateId('dec'),
      timestamp: new Date().toISOString(),
      reasoning: `Conta em risco (nextDate vencido ou vazio). Disparar follow-up via ${channel}.`,
      action: 'send_message',
      channel,
      messageDraft: `Olá ${contact?.name?.split(' ')[0] || ''}, retomando nosso contato sobre ${acc.product || 'nossa solução'} para ${acc.name}. Posso te enviar um resumo objetivo?`,
      executed: true,
      result: 'queued',
    };
    decisions.push(decision);
    return {
      accountId: acc.id,
      decisions,
      newStatus: 'messaging',
      interaction: {
        channel,
        outcome: 'Follow-up automático enviado',
        summary: decision.messageDraft || '',
      },
    };
  }

  // Primeiro contato se não há interações
  if (acc.interactions.length === 0 && contact) {
    const channel = hasMultichannel(acc)
      ? 'LinkedIn'
      : contact.email
        ? 'E-mail'
        : contact.phone
          ? 'WhatsApp'
          : 'LinkedIn';
    const decision: AgentDecision = {
      id: generateId('dec'),
      timestamp: new Date().toISOString(),
      reasoning: `Sem histórico. Iniciar 1º contato via ${channel}.`,
      action: 'send_message',
      channel,
      messageDraft: `Olá ${contact.name.split(' ')[0]}, sou Bruno da Ciamakers. Vi a ${acc.name} e acredito que ${acc.product || 'nossa solução'} pode ajudar o time comercial. Faz sentido uma conversa rápida?`,
      executed: true,
      result: 'queued',
    };
    decisions.push(decision);
    return {
      accountId: acc.id,
      decisions,
      newStatus: 'waiting_response',
      interaction: {
        channel,
        outcome: '1º Contato Enviado',
        summary: decision.messageDraft || '',
      },
    };
  }

  // Default: aguardar
  return {
    accountId: acc.id,
    decisions: [
      {
        id: generateId('dec'),
        timestamp: new Date().toISOString(),
        reasoning: 'Nenhuma ação urgente. Manter monitoramento.',
        action: 'wait',
        executed: true,
        result: 'wait',
      },
    ],
    newStatus: 'waiting_response',
  };
}

/**
 * Roda um ciclo do agente em todas as contas elegíveis.
 */
export function runAgentCycle(accounts: AccountOpportunity[]): OrchestratorResult[] {
  const results: OrchestratorResult[] = [];
  for (const acc of accounts) {
    if (!acc.agentEnabled) continue;
    if (acc.status !== 'lead' && acc.status !== 'prospect') continue;
    const plan = planNextAction(acc);
    if (plan) results.push(plan);
  }
  return results;
}
