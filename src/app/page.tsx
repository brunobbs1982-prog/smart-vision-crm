'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCrmStore } from '@/store/useCrmStore';
import { TopHeader } from '@/components/layout/TopHeader';
import { LightningNavBar, type NavTabId } from '@/components/layout/LightningNavBar';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ChannelsView } from '@/components/views/ChannelsView';
import { TasksBoardView } from '@/components/views/TasksBoardView';
import { AccountsGridView } from '@/components/views/AccountsGridView';
import { ContactsDirectoryView } from '@/components/views/ContactsDirectoryView';
import { PipedriveAnalyticsView } from '@/components/views/PipedriveAnalyticsView';
import { HandoffQueueView } from '@/components/views/HandoffQueueView';
import { UsersView } from '@/components/views/UsersView';
import { ProductsCatalogView } from '@/components/views/ProductsCatalogView';
import { AccountOpportunityModal } from '@/components/modals/AccountOpportunityModal';
import { ScriptAssistantModal } from '@/components/modals/ScriptAssistantModal';
import { ProductionCenterModal } from '@/components/modals/ProductionCenterModal';
import { ToastHost, toast } from '@/lib/toast';
import { formatCurrency, todayISO } from '@/lib/utils';
import { FUNNEL_STAGES } from '@/constants/funnelStages';
import { runAgentCycle } from '@/services/agent/orchestrator';
import { weightedForecast } from '@/services/analyticsEngine';

function HomeDashboard({
  onOpenAccount,
  onRunAgent,
  onCreate,
  agentLog,
}: {
  onOpenAccount: (id: string) => void;
  onRunAgent: () => void;
  onCreate: (stage?: string) => void;
  agentLog: string[];
}) {
  const accounts = useCrmStore((s) => s.getFilteredAccounts());
  const totalValue = accounts.reduce((s, a) => s + a.value, 0);
  const forecast = weightedForecast(accounts);
  const handoffs = accounts.filter((a) => a.agentStatus === 'handoff_ready').length;
  const agentActive = accounts.filter(
    (a) => a.agentEnabled && !['idle', 'completed', 'paused'].includes(a.agentStatus)
  ).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-xl font-heading font-bold text-[#032D60]">Dashboard</h1>
            <p className="text-sm text-slate-500">Visão geral da carteira e do agente</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCreate} className="btn-primary text-sm">
              + Nova oportunidade
            </button>
            <button onClick={onRunAgent} className="btn-emerald text-sm">
              Rodar ciclo do agente
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Oportunidades', String(accounts.length), false],
            ['Valor em Funil', formatCurrency(totalValue), true],
            ['Forecast Ponderado', formatCurrency(forecast), true],
            ['Agente / Hand-offs', `${agentActive} / ${handoffs}`, false],
          ].map(([label, value, mono]) => (
            <div key={label as string} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div
                className={`text-2xl font-heading font-bold text-[#032D60] ${mono ? 'font-metric' : ''}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">Nenhuma oportunidade ainda.</p>
            <button onClick={onCreate} className="btn-primary text-sm">
              Criar primeira oportunidade
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-3">Contas recentes</h2>
              <div className="divide-y divide-slate-100">
                {accounts.slice(0, 8).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenAccount(a.id)}
                    className="w-full py-2.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50 rounded"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">{a.name}</div>
                      <div className="text-xs text-slate-500">
                        {a.stage} · {a.agentEnabled ? `Agente: ${a.agentStatus}` : 'Manual'}
                      </div>
                    </div>
                    <div className="text-sm font-metric font-semibold text-[#032D60]">
                      {formatCurrency(a.value)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-3">Último ciclo do agente</h2>
              {agentLog.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Clique em &quot;Rodar ciclo do agente&quot; para executar ações autônomas.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700 max-h-64 overflow-y-auto">
                  {agentLog.map((line, i) => (
                    <li key={i} className="border-l-2 border-[#0176D3] pl-3 py-0.5">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useCrmStore((s) => s.isAuthenticated);
  const setupCompleted = useCrmStore((s) => s.setupCompleted);
  const accounts = useCrmStore((s) => s.accounts);
  const addInteraction = useCrmStore((s) => s.addInteraction);
  const setAgentStatus = useCrmStore((s) => s.setAgentStatus);
  const updateAccount = useCrmStore((s) => s.updateAccount);
  const requestHandoff = useCrmStore((s) => s.requestHandoff);
  const getAccountById = useCrmStore((s) => s.getAccountById);

  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [hydrated, setHydrated] = useState(false);
  const [modalAccountId, setModalAccountId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'create'>('edit');
  const [createStage, setCreateStage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [scriptAccountId, setScriptAccountId] = useState<string | null>(null);
  const [prodOpen, setProdOpen] = useState(false);
  const [agentLog, setAgentLog] = useState<string[]>([]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!setupCompleted) {
      router.replace('/setup');
      return;
    }
    if (!isAuthenticated) router.replace('/login');
  }, [hydrated, setupCompleted, isAuthenticated, router]);

  function openAccount(id: string) {
    setModalMode('edit');
    setModalAccountId(id);
    setModalOpen(true);
  }

  function openCreate(stage?: string) {
    setModalMode('create');
    setModalAccountId(null);
    setCreateStage(stage || null);
    setModalOpen(true);
  }

  function handleRunAgent() {
    const results = runAgentCycle(useCrmStore.getState().accounts);
    const lines: string[] = [];
    for (const r of results) {
      const acc = useCrmStore.getState().getAccountById(r.accountId);
      const name = acc?.name || r.accountId;
      if (r.newStatus === 'handoff_ready' && r.handoffNotes) {
        requestHandoff(r.accountId, r.handoffNotes);
        lines.push(`${name}: hand-off solicitado`);
      } else {
        setAgentStatus(r.accountId, r.newStatus);
        if (r.interaction) {
          addInteraction(r.accountId, {
            channel: r.interaction.channel,
            outcome: r.interaction.outcome,
            date: todayISO(),
            summary: r.interaction.summary,
            createdByAgent: true,
          });
          const next = new Date();
          next.setDate(next.getDate() + 2);
          updateAccount(r.accountId, {
            nextAction: r.interaction.outcome,
            nextDate: next.toISOString().slice(0, 10),
            lastAgentRunAt: new Date().toISOString(),
          });
          lines.push(`${name}: ${r.interaction.outcome} (${r.interaction.channel})`);
        } else {
          lines.push(`${name}: ${r.decisions[0]?.reasoning || 'aguardando'}`);
        }
      }
    }
    if (lines.length === 0) lines.push('Nenhuma ação necessária neste ciclo.');
    setAgentLog(lines);
    toast(`Ciclo do agente: ${lines.length} resultado(s)`, 'success');
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F6F9]">
        <div className="text-sm text-slate-500">Carregando...</div>
      </div>
    );
  }

  const handoffCount = accounts.filter((a) => a.agentStatus === 'handoff_ready').length;
  const scriptAccount = scriptAccountId ? getAccountById(scriptAccountId) || null : null;

  return (
    <div className="h-screen flex flex-col bg-[#F3F6F9]">
      <TopHeader />
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3">
        <div className="flex-1 min-w-0">
          <LightningNavBar active={activeTab} onChange={setActiveTab} handoffCount={handoffCount} />
        </div>
        <button
          onClick={() => setProdOpen(true)}
          className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0"
          title="Backup / Import"
        >
          Backup
        </button>
        <button onClick={openCreate} className="btn-primary text-xs shrink-0 my-1.5">
          + Nova
        </button>
      </div>

      {activeTab === 'home' && (
        <HomeDashboard
          onOpenAccount={openAccount}
          onRunAgent={handleRunAgent}
          onCreate={openCreate}
          agentLog={agentLog}
        />
      )}
      {activeTab === 'kanban' && (
        <KanbanBoard
          onOpenAccount={openAccount}
          onOpenScript={(id) => setScriptAccountId(id)}
          onCreateAtStage={(stage) => openCreate(stage)}
        />
      )}
      {activeTab === 'accounts' && <AccountsGridView onOpenAccount={openAccount} />}
      {activeTab === 'contacts' && <ContactsDirectoryView onOpenAccount={openAccount} />}
      {activeTab === 'tasks' && <TasksBoardView onOpenAccount={openAccount} />}
      {activeTab === 'products' && <ProductsCatalogView />}
      {activeTab === 'analytics' && <PipedriveAnalyticsView />}
      {activeTab === 'handoff' && <HandoffQueueView onOpenAccount={openAccount} />}
      {activeTab === 'channels' && <ChannelsView />}
      {activeTab === 'users' && <UsersView />}

      <AccountOpportunityModal
        open={modalOpen}
        accountId={modalAccountId}
        mode={modalMode}
        initialStage={createStage}
        onClose={() => {
          setModalOpen(false);
          setCreateStage(null);
        }}
      />
      <ScriptAssistantModal
        open={!!scriptAccountId}
        account={scriptAccount}
        onClose={() => setScriptAccountId(null)}
      />
      <ProductionCenterModal open={prodOpen} onClose={() => setProdOpen(false)} />
      <ToastHost />

      {handoffCount > 0 && activeTab !== 'handoff' && (
        <button
          onClick={() => setActiveTab('handoff')}
          className="fixed bottom-4 right-4 z-40 btn-emerald text-sm shadow-lg"
        >
          {handoffCount} hand-off{handoffCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
