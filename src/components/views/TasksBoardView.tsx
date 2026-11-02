'use client';

import { useMemo } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import { formatDate, todayISO, cn } from '@/lib/utils';
import type { OpportunityTask } from '@/types/crm.types';

interface TaskRow {
  task: OpportunityTask;
  accountId: string;
  accountName: string;
}

export function TasksBoardView({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const accounts = useCrmStore((s) => s.getFilteredAccounts());
  const toggleTaskDone = useCrmStore((s) => s.toggleTaskDone);
  const today = todayISO();

  const allTasks: TaskRow[] = useMemo(() => {
    const rows: TaskRow[] = [];
    for (const a of accounts) {
      for (const t of a.tasks) {
        rows.push({ task: t, accountId: a.id, accountName: a.name });
      }
    }
    return rows;
  }, [accounts]);

  const urgent = allTasks.filter((r) => !r.task.done && r.task.dueDate <= today);
  const scheduled = allTasks.filter((r) => !r.task.done && r.task.dueDate > today);
  const done = allTasks.filter((r) => r.task.done);

  function Column({
    title,
    items,
    accent,
  }: {
    title: string;
    items: TaskRow[];
    accent: string;
  }) {
    return (
      <div className="flex-1 min-w-[260px] bg-slate-100/80 rounded-xl border border-slate-200/80 flex flex-col">
        <div className="px-3 py-2.5 border-b border-slate-200/80 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <span className="ml-auto text-xs font-metric bg-white px-1.5 py-0.5 rounded text-slate-500">
            {items.length}
          </span>
        </div>
        <div className="p-2 space-y-2 overflow-y-auto flex-1">
          {items.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-8">Vazio</div>
          )}
          {items
            .slice()
            .sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate))
            .map(({ task, accountId, accountName }) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTaskDone(accountId, task.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'text-sm font-medium text-slate-800',
                        task.done && 'line-through text-slate-400'
                      )}
                    >
                      {task.title}
                    </div>
                    <button
                      onClick={() => onOpenAccount(accountId)}
                      className="text-[11px] text-[#0176D3] hover:underline mt-0.5"
                    >
                      {accountName}
                    </button>
                    <div className={cn(
                      'text-[11px] mt-1',
                      !task.done && task.dueDate < today ? 'text-red-600 font-medium' : 'text-slate-500'
                    )}>
                      {task.type} · {formatDate(task.dueDate)}
                      {!task.done && task.dueDate < today ? ' · atrasada' : ''}
                      {task.contactName ? ` · ${task.contactName}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden p-4 flex flex-col">
      <div className="mb-3">
        <h1 className="text-lg font-heading font-bold text-[#032D60]">Tarefas</h1>
        <p className="text-xs text-slate-500">Urgente / Hoje · Agendadas · Realizadas</p>
      </div>
      <div className="flex-1 flex gap-3 overflow-x-auto min-h-0">
        <Column title="Urgente / Hoje" items={urgent} accent="#EF4444" />
        <Column title="Agendadas" items={scheduled} accent="#0176D3" />
        <Column title="Realizadas" items={done} accent="#10B981" />
      </div>
    </div>
  );
}
