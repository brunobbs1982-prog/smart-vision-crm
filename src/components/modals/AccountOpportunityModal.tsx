'use client';

import { useEffect, useState } from 'react';
import type {
  AccountOpportunity,
  AccountStatus,
  Contact,
  DecisionRole,
  FunnelStageId,
  InteractionChannel,
  OpportunityOrigin,
  OpportunityTask,
  OperationUnitCode,
  TaskChannelType,
} from '@/types/crm.types';
import { useCrmStore } from '@/store/useCrmStore';
import { FUNNEL_STAGES } from '@/constants/funnelStages';
import { OPERATIONS } from '@/constants/operations';
import { formatCurrency, formatDate, generateId, todayISO, whatsappLink, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const ORIGINS: OpportunityOrigin[] = [
  'Executivo', 'IA', 'LinkedIn Insight', 'Evento', 'Webinar', 'Indicação', 'Site',
];
const STATUSES: AccountStatus[] = ['lead', 'prospect', 'ativo', 'desativado'];
const TASK_TYPES: TaskChannelType[] = ['Ligação', 'E-mail', 'Reunião', 'WhatsApp', 'Follow-up', 'LinkedIn'];
const INTERACTION_CHANNELS: InteractionChannel[] = ['WhatsApp', 'E-mail', 'LinkedIn', 'Reunião', 'Ligação'];
const DECISION_ROLES: DecisionRole[] = ['Decisor', 'Influenciador', 'Não definido'];

interface Props {
  accountId: string | null;
  open: boolean;
  onClose: () => void;
  mode?: 'edit' | 'create';
  initialStage?: string | null;
}

const emptyForm = (): Partial<AccountOpportunity> => ({
  name: '',
  cityState: '',
  cnpj: '',
  website: '',
  operation: 'OP1',
  status: 'lead',
  stage: 'nutricao',
  product: '',
  value: 0,
  origin: 'Executivo',
  nextAction: '',
  nextDate: todayISO(),
  notes: '',
  contacts: [],
  tasks: [],
  interactions: [],
  agentEnabled: true,
  agentStatus: 'idle',
});

export function AccountOpportunityModal({ accountId, open, onClose, mode = 'edit', initialStage }: Props) {
  const currentUser = useCrmStore((s) => s.currentUser);
  const getAccountById = useCrmStore((s) => s.getAccountById);
  const updateAccount = useCrmStore((s) => s.updateAccount);
  const addAccount = useCrmStore((s) => s.addAccount);
  const addTask = useCrmStore((s) => s.addTask);
  const toggleTaskDone = useCrmStore((s) => s.toggleTaskDone);
  const addInteraction = useCrmStore((s) => s.addInteraction);
  const addContact = useCrmStore((s) => s.addContact);
  const deleteAccount = useCrmStore((s) => s.deleteAccount);
  const products = useCrmStore((s) => s.products);

  const [form, setForm] = useState<Partial<AccountOpportunity>>(emptyForm());
  const [tab, setTab] = useState<'ficha' | 'tarefas' | 'contatos' | 'historico'>('ficha');

  // task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskChannelType>('Follow-up');
  const [taskDue, setTaskDue] = useState(todayISO());
  const [taskContact, setTaskContact] = useState('');

  // interaction form
  const [intChannel, setIntChannel] = useState<InteractionChannel>('WhatsApp');
  const [intOutcome, setIntOutcome] = useState('');
  const [intSummary, setIntSummary] = useState('');

  // contact form
  const [ctName, setCtName] = useState('');
  const [ctRole, setCtRole] = useState('');
  const [ctDecision, setCtDecision] = useState<DecisionRole>('Não definido');
  const [ctEmail, setCtEmail] = useState('');
  const [ctPhone, setCtPhone] = useState('');
  const [ctLinkedin, setCtLinkedin] = useState('');

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      setForm({
        ...emptyForm(),
        stage: (initialStage as FunnelStageId) || 'nutricao',
        ownerEmail: currentUser?.email || '',
        ownerName: currentUser?.name || '',
      });
      setTab('ficha');
      return;
    }
    if (accountId) {
      const acc = getAccountById(accountId);
      if (acc) {
        setForm({ ...acc });
        setTaskContact(acc.contacts[0]?.name || '');
      }
    }
  }, [open, accountId, mode, initialStage]); // eslint-disable-line

  if (!open) return null;

  function patch<K extends keyof AccountOpportunity>(key: K, value: AccountOpportunity[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!form.name?.trim()) return;
    if (mode === 'create') {
      addAccount({
        name: form.name!,
        cityState: form.cityState || '',
        cnpj: form.cnpj,
        website: form.website,
        operation: (form.operation as OperationUnitCode) || 'OP1',
        status: (form.status as AccountStatus) || 'lead',
        stage: (form.stage as FunnelStageId) || 'nutricao',
        product: form.product || '',
        value: Number(form.value) || 0,
        ownerEmail: form.ownerEmail || currentUser?.email || '',
        ownerName: form.ownerName || currentUser?.name || '',
        origin: (form.origin as OpportunityOrigin) || 'Executivo',
        nextAction: form.nextAction || '',
        nextDate: form.nextDate || todayISO(),
        notes: form.notes || '',
        contacts: form.contacts || [],
        tasks: form.tasks || [],
        interactions: form.interactions || [],
        agentEnabled: form.agentEnabled ?? true,
        agentStatus: form.agentStatus || 'idle',
      });
    } else if (accountId) {
      updateAccount(accountId, {
        name: form.name,
        cityState: form.cityState,
        cnpj: form.cnpj,
        website: form.website,
        operation: form.operation as OperationUnitCode,
        status: form.status as AccountStatus,
        stage: form.stage as FunnelStageId,
        product: form.product,
        value: Number(form.value) || 0,
        origin: form.origin as OpportunityOrigin,
        nextAction: form.nextAction,
        nextDate: form.nextDate,
        notes: form.notes,
        agentEnabled: form.agentEnabled,
      });
    }
    toast(mode === 'create' ? 'Oportunidade criada' : 'Alterações salvas', 'success');
    onClose();
  }

  function handleDelete() {
    if (!accountId) return;
    if (!confirm('Excluir esta conta/oportunidade permanentemente?')) return;
    deleteAccount(accountId);
    toast('Conta excluída', 'info');
    onClose();
  }

  function handleAddTask() {
    if (!accountId || !taskTitle.trim()) return;
    addTask(accountId, {
      title: taskTitle.trim(),
      type: taskType,
      dueDate: taskDue,
      contactName: taskContact || form.contacts?.[0]?.name || '',
      ownerEmail: currentUser?.email || '',
      ownerName: currentUser?.name || '',
      notes: '',
      done: false,
    });
    setTaskTitle('');
    // refresh form from store
    const acc = useCrmStore.getState().getAccountById(accountId);
    if (acc) setForm({ ...acc });
  }

  function handleQuickTask(title: string, daysOffset: number) {
    if (!accountId) return;
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    addTask(accountId, {
      title,
      type: 'Follow-up',
      dueDate: d.toISOString().slice(0, 10),
      contactName: form.contacts?.[0]?.name || '',
      ownerEmail: currentUser?.email || '',
      ownerName: currentUser?.name || '',
      notes: '',
      done: false,
    });
    const acc = useCrmStore.getState().getAccountById(accountId);
    if (acc) setForm({ ...acc });
  }

  function handleToggleTask(taskId: string) {
    if (!accountId) return;
    toggleTaskDone(accountId, taskId);
    const acc = useCrmStore.getState().getAccountById(accountId);
    if (acc) setForm({ ...acc });
  }

  function handleAddInteraction() {
    if (!accountId || !intOutcome.trim()) return;
    addInteraction(accountId, {
      channel: intChannel,
      outcome: intOutcome.trim(),
      date: todayISO(),
      summary: intSummary.trim(),
      createdByAgent: false,
    });
    setIntOutcome('');
    setIntSummary('');
    const acc = useCrmStore.getState().getAccountById(accountId);
    if (acc) setForm({ ...acc });
  }

  function handleAddContact() {
    if (!accountId || !ctName.trim()) return;
    addContact(accountId, {
      name: ctName.trim(),
      role: ctRole,
      decisionRole: ctDecision,
      email: ctEmail,
      phone: ctPhone,
      linkedin: ctLinkedin,
      instagram: '',
      notes: '',
    });
    setCtName('');
    setCtRole('');
    setCtEmail('');
    setCtPhone('');
    setCtLinkedin('');
    setCtDecision('Não definido');
    const acc = useCrmStore.getState().getAccountById(accountId);
    if (acc) setForm({ ...acc });
  }

  const tasks = form.tasks || [];
  const contacts = form.contacts || [];
  const interactions = form.interactions || [];
  const primary = contacts[0];

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 mb-10">
        {/* Header */}
        <div className="bg-[#032D60] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-lg truncate">
              {mode === 'create' ? 'Nova oportunidade' : form.name || 'Conta'}
            </h2>
            {mode === 'edit' && (
              <p className="text-white/60 text-xs mt-0.5">
                {form.stage} · {formatCurrency(Number(form.value) || 0)} · {form.ownerName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {primary?.phone && mode === 'edit' && (
              <a
                href={whatsappLink(primary.phone)}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-[#10B981] hover:bg-[#059669] px-3 py-1.5 rounded-lg font-medium"
              >
                WhatsApp
              </a>
            )}
            {primary?.email && mode === 'edit' && (
              <a
                href={`mailto:${primary.email}`}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-medium"
              >
                E-mail
              </a>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-lg">
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        {mode === 'edit' && (
          <div className="flex border-b border-slate-200 px-4 gap-1">
            {([
              ['ficha', 'Ficha'],
              ['tarefas', `Tarefas (${tasks.filter((t) => !t.done).length})`],
              ['contatos', `Contatos (${contacts.length})`],
              ['historico', `Histórico (${interactions.length})`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === id
                    ? 'border-[#0176D3] text-[#0176D3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* ===== FICHA ===== */}
          {(mode === 'create' || tab === 'ficha') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field label="Nome da empresa *" className="md:col-span-2">
                  <input
                    className="input"
                    value={form.name || ''}
                    onChange={(e) => patch('name', e.target.value)}
                    placeholder="Ex: TechNova Soluções"
                  />
                </Field>
                <Field label="CNPJ">
                  <input
                    className="input"
                    value={form.cnpj || ''}
                    onChange={(e) => patch('cnpj', e.target.value)}
                  />
                </Field>
                <Field label="Cidade/UF">
                  <input
                    className="input"
                    value={form.cityState || ''}
                    onChange={(e) => patch('cityState', e.target.value)}
                    placeholder="Campinas, SP"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Field label="Unidade">
                  <select
                    className="input"
                    value={form.operation || 'OP1'}
                    onChange={(e) => patch('operation', e.target.value as OperationUnitCode)}
                  >
                    {OPERATIONS.map((o) => (
                      <option key={o.code} value={o.code}>{o.shortName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    className="input"
                    value={form.status || 'lead'}
                    onChange={(e) => patch('status', e.target.value as AccountStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Etapa">
                  <select
                    className="input"
                    value={form.stage || 'nutricao'}
                    onChange={(e) => patch('stage', e.target.value as FunnelStageId)}
                  >
                    {FUNNEL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Produto">
                  <select
                    className="input"
                    value={form.product || ''}
                    onChange={(e) => patch('product', e.target.value)}
                  >
                    <option value="">—</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Valor (R$)">
                  <input
                    type="number"
                    className="input font-metric"
                    value={form.value || 0}
                    onChange={(e) => patch('value', Number(e.target.value))}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field label="Origem">
                  <select
                    className="input"
                    value={form.origin || 'Executivo'}
                    onChange={(e) => patch('origin', e.target.value as OpportunityOrigin)}
                  >
                    {ORIGINS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Site">
                  <input
                    className="input"
                    value={form.website || ''}
                    onChange={(e) => patch('website', e.target.value)}
                    placeholder="https://"
                  />
                </Field>
                <Field label="Próxima ação">
                  <input
                    className="input"
                    value={form.nextAction || ''}
                    onChange={(e) => patch('nextAction', e.target.value)}
                  />
                </Field>
                <Field label="Data próxima">
                  <input
                    type="date"
                    className="input"
                    value={form.nextDate || ''}
                    onChange={(e) => patch('nextDate', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Observações cadastrais">
                <textarea
                  className="input min-h-[80px]"
                  value={form.notes || ''}
                  onChange={(e) => patch('notes', e.target.value)}
                  placeholder="Receita, QSA, CNAE, contexto..."
                />
              </Field>

              {mode === 'edit' && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!form.agentEnabled}
                    onChange={(e) => patch('agentEnabled', e.target.checked)}
                  />
                  Agente autônomo habilitado nesta conta
                </label>
              )}
            </div>
          )}

          {/* ===== TAREFAS ===== */}
          {mode === 'edit' && tab === 'tarefas' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  ['1º Contato', 0],
                  ['FUP +2 dias', 2],
                  ['FUP +5 dias', 5],
                  ['Agendar reunião', 3],
                  ['Revisão pré-agendada', 30],
                ].map(([label, days]) => (
                  <button
                    key={label as string}
                    onClick={() => handleQuickTask(label as string, days as number)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#0176D3] hover:bg-[#EBF5FF] font-medium text-slate-700"
                  >
                    {label as string}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <Field label="Título da tarefa" className="md:col-span-2">
                  <input
                    className="input"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ex: Agendar com decisor"
                  />
                </Field>
                <Field label="Tipo">
                  <select className="input" value={taskType} onChange={(e) => setTaskType(e.target.value as TaskChannelType)}>
                    {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Vencimento">
                  <input type="date" className="input" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                </Field>
              </div>
              <button onClick={handleAddTask} className="btn-primary text-sm">
                Adicionar tarefa
              </button>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {tasks.length === 0 && (
                  <div className="p-6 text-center text-sm text-slate-400">Nenhuma tarefa</div>
                )}
                {tasks
                  .slice()
                  .sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate))
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => handleToggleTask(t.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-medium', t.done && 'line-through text-slate-400')}>
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.type} · {formatDate(t.dueDate)}
                          {t.contactName ? ` · ${t.contactName}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ===== CONTATOS ===== */}
          {mode === 'edit' && tab === 'contatos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Field label="Nome *">
                  <input className="input" value={ctName} onChange={(e) => setCtName(e.target.value)} />
                </Field>
                <Field label="Cargo">
                  <input className="input" value={ctRole} onChange={(e) => setCtRole(e.target.value)} />
                </Field>
                <Field label="Papel na decisão">
                  <select className="input" value={ctDecision} onChange={(e) => setCtDecision(e.target.value as DecisionRole)}>
                    {DECISION_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="E-mail">
                  <input className="input" value={ctEmail} onChange={(e) => setCtEmail(e.target.value)} />
                </Field>
                <Field label="Telefone / WhatsApp">
                  <input className="input" value={ctPhone} onChange={(e) => setCtPhone(e.target.value)} placeholder="11999990000" />
                </Field>
                <Field label="LinkedIn">
                  <input className="input" value={ctLinkedin} onChange={(e) => setCtLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </Field>
              </div>
              <button onClick={handleAddContact} className="btn-primary text-sm">
                Adicionar contato
              </button>

              <div className="space-y-2">
                {contacts.length === 0 && (
                  <div className="text-sm text-slate-400 text-center py-6">Nenhum contato</div>
                )}
                {contacts.map((c) => (
                  <div key={c.id} className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {c.name}{' '}
                        {c.decisionRole === 'Decisor' && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-1">Decisor</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.role}</div>
                      <div className="text-xs text-slate-500 mt-1 space-x-3">
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span>{c.phone}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {c.phone && (
                        <a href={whatsappLink(c.phone)} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">WA</a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">@</a>
                      )}
                      {c.linkedin && (
                        <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded bg-sky-50 text-sky-700">in</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== HISTÓRICO ===== */}
          {mode === 'edit' && tab === 'historico' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Field label="Canal">
                  <select className="input" value={intChannel} onChange={(e) => setIntChannel(e.target.value as InteractionChannel)}>
                    {INTERACTION_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Resultado *" className="md:col-span-2">
                  <input
                    className="input"
                    value={intOutcome}
                    onChange={(e) => setIntOutcome(e.target.value)}
                    placeholder="Ex: 1º Contato Enviado, Interessado, Sem resposta..."
                  />
                </Field>
                <Field label="Resumo" className="md:col-span-3">
                  <textarea
                    className="input min-h-[60px]"
                    value={intSummary}
                    onChange={(e) => setIntSummary(e.target.value)}
                    placeholder="O que foi dito / combinado..."
                  />
                </Field>
              </div>
              <button onClick={handleAddInteraction} className="btn-primary text-sm">
                Registrar interação
              </button>

              <div className="space-y-2">
                {interactions.length === 0 && (
                  <div className="text-sm text-slate-400 text-center py-6">Nenhuma interação registrada</div>
                )}
                {interactions.map((i) => (
                  <div key={i.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-medium text-slate-700">{i.channel}</span>
                      <span>·</span>
                      <span>{formatDate(i.date)}</span>
                      {i.createdByAgent && (
                        <span className="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded text-[10px]">Agente</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-800">{i.outcome}</div>
                    {i.summary && <div className="text-xs text-slate-500 mt-1">{i.summary}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between gap-2 rounded-b-2xl bg-slate-50">
          <div>
            {mode === 'edit' && accountId && (
              <button onClick={handleDelete} className="px-4 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 font-medium">
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-white">
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-primary text-sm px-5">
              {mode === 'create' ? 'Criar oportunidade' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
