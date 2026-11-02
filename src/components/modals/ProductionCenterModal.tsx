'use client';

import { useRef, useState } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import {
  buildSnapshot,
  downloadSnapshot,
  mergeAccountsNonDestructive,
  normalizeAccount,
  SCHEMA_VERSION,
  type CrmSnapshot,
} from '@/services/exportImportService';
import { toast } from '@/lib/toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProductionCenterModal({ open, onClose }: Props) {
  const accounts = useCrmStore((s) => s.accounts);
  const products = useCrmStore((s) => s.products);
  const users = useCrmStore((s) => s.users);
  const channelConnections = useCrmStore((s) => s.channelConnections);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  if (!open) return null;

  function handleExport() {
    const snap = buildSnapshot({ accounts, products, users, channelConnections });
    downloadSnapshot(snap, `smart-vision-backup-${new Date().toISOString().slice(0, 10)}.json`);
    toast('Backup exportado (JSON)', 'success');
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as CrmSnapshot;
      if (!data.accounts || !Array.isArray(data.accounts)) {
        throw new Error('Arquivo inválido: falta accounts[]');
      }
      const normalized = data.accounts.map((a) => normalizeAccount(a));
      if (importMode === 'replace') {
        useCrmStore.setState({ accounts: normalized });
        toast(`Importação substituiu ${normalized.length} contas`, 'success');
      } else {
        const merged = mergeAccountsNonDestructive(accounts, normalized);
        useCrmStore.setState({ accounts: merged });
        toast(`Merge concluído · ${merged.length} contas no total`, 'success');
      }
      if (data.products?.length) {
        useCrmStore.setState({ products: data.products });
      }
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha na importação', 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#032D60] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold">Central de Produção</h2>
            <p className="text-white/60 text-xs">Zero Data Loss · schema v{SCHEMA_VERSION}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-lg">
            ×
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Exporte um snapshot JSON completo ou importe com <strong>smart merge</strong> (não apaga
            histórico existente) ou substituição total.
          </p>

          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-100 space-y-1">
            <div className="flex justify-between">
              <span>Contas</span>
              <span className="font-metric font-semibold">{accounts.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Usuários</span>
              <span className="font-metric font-semibold">{users.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Conectores</span>
              <span className="font-metric font-semibold">{channelConnections.length}</span>
            </div>
          </div>

          <button onClick={handleExport} className="w-full btn-primary text-sm py-2.5">
            Exportar backup JSON
          </button>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="text-sm font-medium text-slate-800">Importar</div>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                />
                Smart merge
              </label>
              <label className="flex-1 flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                Substituir tudo
              </label>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Selecionar arquivo JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
