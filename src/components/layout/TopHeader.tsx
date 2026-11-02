'use client';

import { useCrmStore } from '@/store/useCrmStore';
import { OPERATIONS } from '@/constants/operations';

export function TopHeader() {
  const currentUser = useCrmStore((s) => s.currentUser);
  const logout = useCrmStore((s) => s.logout);
  const selectedOwnerEmail = useCrmStore((s) => s.selectedOwnerEmail);
  const selectedOperation = useCrmStore((s) => s.selectedOperation);
  const searchQuery = useCrmStore((s) => s.searchQuery);
  const users = useCrmStore((s) => s.users);
  const setSelectedOwner = useCrmStore((s) => s.setSelectedOwner);
  const setSelectedOperation = useCrmStore((s) => s.setSelectedOperation);
  const setSearchQuery = useCrmStore((s) => s.setSearchQuery);

  return (
    <header className="h-14 bg-[#032D60] text-white flex items-center px-4 gap-4 shrink-0 shadow-md z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-heading font-bold text-sm">
          SV
        </div>
        <span className="font-heading font-bold text-sm tracking-tight hidden sm:block">
          SMART V.I.S.I.O.N.
        </span>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-white/20" />

      {/* Filtro Unidade */}
      <select
        value={selectedOperation}
        onChange={(e) => setSelectedOperation(e.target.value)}
        className="bg-[#001639] text-white text-xs rounded-md px-2.5 py-1.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#0176D3]"
      >
        <option value="ALL">Todas as Unidades</option>
        {OPERATIONS.map((op) => (
          <option key={op.code} value={op.code}>
            {op.shortName}
          </option>
        ))}
      </select>

      {/* Filtro Responsável */}
      <select
        value={selectedOwnerEmail}
        onChange={(e) => setSelectedOwner(e.target.value)}
        className="bg-[#001639] text-white text-xs rounded-md px-2.5 py-1.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#0176D3]"
      >
        <option value="ALL">Todos os Responsáveis</option>
        {users.map((u) => (
          <option key={u.id} value={u.email}>
            {u.name}
          </option>
        ))}
      </select>

      {/* Busca */}
      <div className="flex-1 max-w-xs">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar conta, contato..."
          className="w-full bg-[#001639] text-white text-xs rounded-md px-3 py-1.5 border border-white/10 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#0176D3]"
        />
      </div>

      {currentUser && (
        <button
          onClick={() =>
            setSelectedOwner(
              selectedOwnerEmail === currentUser.email ? 'ALL' : currentUser.email
            )
          }
          className="text-[11px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 whitespace-nowrap"
        >
          {selectedOwnerEmail === currentUser.email ? 'Ver todos' : 'Minha carteira'}
        </button>
      )}

      <div className="flex-1" />

      {/* Usuário */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium leading-tight">{currentUser?.name}</div>
          <div className="text-[10px] text-white/60 leading-tight">{currentUser?.role}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0176D3] flex items-center justify-center text-xs font-bold">
          {currentUser?.name?.charAt(0) || 'U'}
        </div>
        <button
          onClick={logout}
          className="text-xs text-white/70 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
