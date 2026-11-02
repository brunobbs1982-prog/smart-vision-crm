'use client';

import { useMemo } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import { whatsappLink } from '@/lib/utils';

export function ContactsDirectoryView({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const accounts = useCrmStore((s) => s.getFilteredAccounts());

  const rows = useMemo(() => {
    const list: {
      contactId: string;
      name: string;
      role: string;
      decisionRole: string;
      email: string;
      phone: string;
      linkedin: string;
      accountId: string;
      accountName: string;
    }[] = [];
    for (const a of accounts) {
      for (const c of a.contacts) {
        list.push({
          contactId: c.id,
          name: c.name,
          role: c.role,
          decisionRole: c.decisionRole,
          email: c.email,
          phone: c.phone,
          linkedin: c.linkedin,
          accountId: a.id,
          accountName: a.name,
        });
      }
    }
    return list.sort((x, y) => x.name.localeCompare(y.name));
  }, [accounts]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-lg font-heading font-bold text-[#032D60] mb-4">
          Contatos ({rows.length})
        </h1>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-4 py-2.5 font-medium">Cargo</th>
                <th className="px-4 py-2.5 font-medium">Papel</th>
                <th className="px-4 py-2.5 font-medium">Empresa</th>
                <th className="px-4 py-2.5 font-medium">Canais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.contactId} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.role || '—'}</td>
                  <td className="px-4 py-2.5">
                    {r.decisionRole === 'Decisor' ? (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                        Decisor
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">{r.decisionRole}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => onOpenAccount(r.accountId)}
                      className="text-[#0176D3] hover:underline text-left"
                    >
                      {r.accountName}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {r.phone && (
                        <a
                          href={whatsappLink(r.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
                        >
                          WA
                        </a>
                      )}
                      {r.email && (
                        <a
                          href={`mailto:${r.email}`}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700"
                        >
                          @
                        </a>
                      )}
                      {r.linkedin && (
                        <a
                          href={r.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700"
                        >
                          in
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">Nenhum contato</div>
          )}
        </div>
      </div>
    </div>
  );
}
