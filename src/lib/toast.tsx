'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (message, kind = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ items: [...s.items, { id, message, kind }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export function toast(message: string, kind: ToastKind = 'info') {
  useToastStore.getState().push(message, kind);
}

export function ToastHost() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-xl px-4 py-3 text-sm font-medium shadow-lg border text-white flex items-start gap-2',
            t.kind === 'success' && 'bg-[#10B981] border-emerald-600',
            t.kind === 'error' && 'bg-red-600 border-red-700',
            t.kind === 'info' && 'bg-[#032D60] border-[#001639]'
          )}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="opacity-80 hover:opacity-100 text-lg leading-none">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
