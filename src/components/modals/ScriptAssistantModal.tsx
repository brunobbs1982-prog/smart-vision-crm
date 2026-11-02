'use client';

import { useMemo, useState } from 'react';
import type { AccountOpportunity } from '@/types/crm.types';
import { whatsappLink, cn } from '@/lib/utils';

type ScriptType = 'SPIN' | 'JOLT' | 'Jarvis' | 'Follow-up';

interface Props {
  account: AccountOpportunity | null;
  open: boolean;
  onClose: () => void;
}

function buildScript(type: ScriptType, acc: AccountOpportunity): string {
  const contact = acc.contacts[0];
  const nome = contact?.name?.split(' ')[0] || 'tudo bem';
  const empresa = acc.name;
  const produto = acc.product || 'nossa solução';

  switch (type) {
    case 'SPIN':
      return `Olá ${nome}, tudo bem?

Sou Bruno, da Ciamakers. Vi que a ${empresa} está em um momento interessante de crescimento comercial.

Situação: como está organizado o processo de prospecção e follow-up do time hoje?
Problema: o que mais trava a previsibilidade do funil ou a conversão nas etapas intermediárias?
Implicação: quando isso acontece, qual o impacto em meta e no tempo do time comercial?
Need-payoff: se vocês tivessem um processo + ferramenta que organizasse abordagem e follow-up de forma consistente, o que mudaria no resultado das próximas 4–6 semanas?

Faz sentido uma conversa rápida de 15 min sobre ${produto}?`;

    case 'JOLT':
      return `Oi ${nome},

Percebi que muitas empresas do porte da ${empresa} ainda dependem de follow-up manual e perdem ritmo entre o 1º contato e a apresentação.

O risco de não agir agora: o funil fica “cheio”, mas a conversão cai e a previsão de receita fica instável.

Sugestão objetiva: em 20 minutos eu te mostro como o ${produto} encaixa no dia a dia do time — sem compromisso.

Pode ser esta semana?`;

    case 'Jarvis':
      return `Olá ${nome},

Preparei um resumo rápido para a ${empresa}:

• Contexto: oportunidade em ${acc.stage} · ${produto}
• Valor estimado: R$ ${acc.value.toLocaleString('pt-BR')}
• Próximo passo sugerido: ${acc.nextAction || 'agendar uma conversa com o decisor'}

Posso te enviar a pauta e dois horários para alinharmos?

Abs,
Bruno | Ciamakers`;

    case 'Follow-up':
      return `Oi ${nome}, tudo bem?

Retomando nosso contato sobre ${produto} para a ${empresa}.

Ficou alguma dúvida ou prefere que eu te envie um material mais objetivo (1 página) antes de conversarmos?

Fico no aguardo.`;
  }
}

export function ScriptAssistantModal({ account, open, onClose }: Props) {
  const [type, setType] = useState<ScriptType>('SPIN');
  const [copied, setCopied] = useState(false);

  const script = useMemo(() => {
    if (!account) return '';
    return buildScript(type, account);
  }, [account, type]);

  if (!open || !account) return null;

  const contact = account.contacts[0];

  async function copy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#032D60] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold">Script Assistant</h2>
            <p className="text-white/60 text-xs">{account.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-lg">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['SPIN', 'JOLT', 'Jarvis', 'Follow-up'] as ScriptType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-lg border',
                  type === t
                    ? 'bg-[#0176D3] text-white border-[#0176D3]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <textarea
            className="w-full min-h-[220px] text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0176D3]"
            value={script}
            readOnly
          />

          <div className="flex flex-wrap gap-2">
            <button onClick={copy} className="btn-primary text-sm">
              {copied ? 'Copiado!' : 'Copiar texto'}
            </button>
            {contact?.phone && (
              <a
                href={whatsappLink(contact.phone, script)}
                target="_blank"
                rel="noreferrer"
                className="btn-emerald text-sm"
              >
                Abrir WhatsApp
              </a>
            )}
            {contact?.email && (
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent(
                  `${account.product || 'Proposta'} — ${account.name}`
                )}&body=${encodeURIComponent(script)}`}
                className="text-sm px-4 py-2 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
              >
                Abrir E-mail
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
