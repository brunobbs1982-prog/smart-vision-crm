'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AccountOpportunity,
  PlatformUser,
  ChannelConnection,
  ProductCatalogItem,
  AgentStatus,
  FunnelStageId,
  OpportunityTask,
  InteractionLog,
  Contact,
} from '@/types/crm.types';
import { DEMO_ACCOUNTS, DEMO_PRODUCTS } from '@/constants/defaultSeeds';
import { getNextStage, getPrevStage } from '@/constants/funnelStages';
import { generateId, todayISO } from '@/lib/utils';

/** Hash simples para demo estática (não use em produção real) */
export function simpleHash(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(h).toString(16)}`;
}

interface AuthState {
  currentUser: PlatformUser | null;
  isAuthenticated: boolean;
  setupCompleted: boolean;
  users: PlatformUser[];
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  completeSetup: (user: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    loadDemo?: boolean;
  }) => void;
  createUser: (user: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: PlatformUser['role'];
  }) => { ok: boolean; error?: string };
}

interface CrmState {
  accounts: AccountOpportunity[];
  products: ProductCatalogItem[];
  channelConnections: ChannelConnection[];
  passwordMap: Record<string, string>; // email -> hash (demo only)

  selectedOwnerEmail: string | 'ALL';
  selectedOperation: string | 'ALL';
  searchQuery: string;

  addAccount: (
    account: Omit<AccountOpportunity, 'id' | 'createdAt' | 'updatedAt' | 'agentStatus' | 'agentEnabled'> &
      Partial<AccountOpportunity>
  ) => string;
  updateAccount: (id: string, patch: Partial<AccountOpportunity>) => void;
  deleteAccount: (id: string) => void;
  moveAccountStage: (id: string, direction: 'next' | 'prev') => void;
  setAccountStage: (id: string, stage: FunnelStageId) => void;

  addTask: (accountId: string, task: Omit<OpportunityTask, 'id'>) => void;
  toggleTaskDone: (accountId: string, taskId: string) => void;
  addInteraction: (accountId: string, interaction: Omit<InteractionLog, 'id'>) => void;
  addContact: (accountId: string, contact: Omit<Contact, 'id'>) => void;

  setAgentEnabled: (accountId: string, enabled: boolean) => void;
  setAgentStatus: (accountId: string, status: AgentStatus) => void;
  requestHandoff: (accountId: string, notes: string) => void;

  upsertChannelConnection: (conn: ChannelConnection) => void;
  removeChannelConnection: (id: string) => void;

  setSelectedOwner: (email: string | 'ALL') => void;
  setSelectedOperation: (op: string | 'ALL') => void;
  setSearchQuery: (q: string) => void;

  getFilteredAccounts: () => AccountOpportunity[];
  getAccountById: (id: string) => AccountOpportunity | undefined;
  loadDemoData: () => void;
}

type Store = AuthState & CrmState;

export const useCrmStore = create<Store>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      setupCompleted: false,
      users: [],
      passwordMap: {},

      accounts: [],
      products: DEMO_PRODUCTS,
      channelConnections: [],

      selectedOwnerEmail: 'ALL',
      selectedOperation: 'ALL',
      searchQuery: '',

      completeSetup: ({ name, email, password, phone, loadDemo }) => {
        const user: PlatformUser = {
          id: generateId('user'),
          email: email.toLowerCase().trim(),
          name: name.trim(),
          phone: phone || '',
          role: 'admin',
          createdAt: new Date().toISOString(),
          isActive: true,
          lastLoginAt: new Date().toISOString(),
        };
        let accounts: AccountOpportunity[] = [];
        if (loadDemo) {
          accounts = DEMO_ACCOUNTS.map((a) => ({
            ...a,
            id: generateId('acc'),
            ownerEmail: user.email,
            ownerName: user.name,
            tasks: a.tasks.map((t) => ({
              ...t,
              id: generateId('task'),
              ownerEmail: user.email,
              ownerName: user.name,
            })),
            contacts: a.contacts.map((c) => ({ ...c, id: generateId('ct') })),
            interactions: a.interactions.map((i) => ({ ...i, id: generateId('int') })),
          }));
        }
        set({
          users: [user],
          passwordMap: { [user.email]: simpleHash(password) },
          currentUser: user,
          isAuthenticated: true,
          setupCompleted: true,
          accounts,
          products: DEMO_PRODUCTS,
          selectedOwnerEmail: 'ALL',
          selectedOperation: 'ALL',
          searchQuery: '',
          channelConnections: [],
        });
      },

      createUser: ({ name, email, password, phone, role = 'executivo' }) => {
        const em = email.toLowerCase().trim();
        if (get().users.some((u) => u.email === em)) {
          return { ok: false, error: 'E-mail já cadastrado' };
        }
        if (!password || password.length < 4) {
          return { ok: false, error: 'Senha deve ter ao menos 4 caracteres' };
        }
        const user: PlatformUser = {
          id: generateId('user'),
          email: em,
          name: name.trim(),
          phone: phone || '',
          role,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        set((s) => ({
          users: [...s.users, user],
          passwordMap: { ...s.passwordMap, [em]: simpleHash(password) },
        }));
        return { ok: true };
      },

      login: async (email, password) => {
        const em = email.toLowerCase().trim();
        const user = get().users.find((u) => u.email === em);
        if (!user) return { ok: false, error: 'E-mail ou senha inválidos' };
        if (!user.isActive) return { ok: false, error: 'Usuário desativado' };
        const hash = get().passwordMap[em];
        if (!hash || hash !== simpleHash(password)) {
          return { ok: false, error: 'E-mail ou senha inválidos' };
        }
        set({
          currentUser: { ...user, lastLoginAt: new Date().toISOString() },
          isAuthenticated: true,
        });
        return { ok: true };
      },

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      loadDemoData: () => {
        const user = get().currentUser;
        if (!user) return;
        const accounts = DEMO_ACCOUNTS.map((a) => ({
          ...a,
          id: generateId('acc'),
          ownerEmail: user.email,
          ownerName: user.name,
          tasks: a.tasks.map((t) => ({
            ...t,
            id: generateId('task'),
            ownerEmail: user.email,
            ownerName: user.name,
          })),
          contacts: a.contacts.map((c) => ({ ...c, id: generateId('ct') })),
          interactions: a.interactions.map((i) => ({ ...i, id: generateId('int') })),
        }));
        set({ accounts });
      },

      addAccount: (data) => {
        const id = generateId('acc');
        const now = new Date().toISOString();
        const account: AccountOpportunity = {
          id,
          name: data.name,
          cityState: data.cityState || '',
          cnpj: data.cnpj,
          website: data.website,
          operation: data.operation || 'OP1',
          status: data.status || 'lead',
          stage: data.stage || 'nutricao',
          product: data.product || '',
          value: data.value || 0,
          ownerEmail: data.ownerEmail || get().currentUser?.email || '',
          ownerName: data.ownerName || get().currentUser?.name || '',
          origin: data.origin || 'Executivo',
          nextAction: data.nextAction || '',
          nextDate: data.nextDate || todayISO(),
          notes: data.notes || '',
          contacts: data.contacts || [],
          tasks: data.tasks || [],
          interactions: data.interactions || [],
          createdAt: now,
          updatedAt: now,
          agentStatus: data.agentStatus || 'idle',
          agentEnabled: data.agentEnabled ?? true,
          linkedinProfileUrl: data.linkedinProfileUrl,
        };
        set((s) => ({ accounts: [account, ...s.accounts] }));
        return id;
      },

      updateAccount: (id, patch) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
      },

      moveAccountStage: (id, direction) => {
        const account = get().accounts.find((a) => a.id === id);
        if (!account) return;
        const next =
          direction === 'next' ? getNextStage(account.stage) : getPrevStage(account.stage);
        if (!next) return;
        const patch: Partial<AccountOpportunity> = { stage: next };
        if (next === 'fechamento') patch.status = 'ativo';
        get().updateAccount(id, patch);
      },

      setAccountStage: (id, stage) => {
        const patch: Partial<AccountOpportunity> = { stage };
        if (stage === 'fechamento') patch.status = 'ativo';
        get().updateAccount(id, patch);
      },

      addTask: (accountId, task) => {
        const newTask: OpportunityTask = { ...task, id: generateId('task') };
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== accountId) return a;
            const tasks = [...a.tasks, newTask];
            const pending = tasks
              .filter((t) => !t.done)
              .sort((x, y) => x.dueDate.localeCompare(y.dueDate));
            return {
              ...a,
              tasks,
              nextAction: pending[0]?.title || a.nextAction,
              nextDate: pending[0]?.dueDate || a.nextDate,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      toggleTaskDone: (accountId, taskId) => {
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== accountId) return a;
            const tasks = a.tasks.map((t) =>
              t.id === taskId
                ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null }
                : t
            );
            const pending = tasks
              .filter((t) => !t.done)
              .sort((x, y) => x.dueDate.localeCompare(y.dueDate));
            return {
              ...a,
              tasks,
              nextAction: pending[0]?.title || a.nextAction,
              nextDate: pending[0]?.dueDate || a.nextDate,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addInteraction: (accountId, interaction) => {
        const newInt: InteractionLog = { ...interaction, id: generateId('int') };
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === accountId
              ? { ...a, interactions: [newInt, ...a.interactions], updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      addContact: (accountId, contact) => {
        const newContact: Contact = { ...contact, id: generateId('ct') };
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === accountId
              ? { ...a, contacts: [...a.contacts, newContact], updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      setAgentEnabled: (accountId, enabled) => {
        get().updateAccount(accountId, { agentEnabled: enabled });
      },

      setAgentStatus: (accountId, status) => {
        get().updateAccount(accountId, {
          agentStatus: status,
          lastAgentRunAt: new Date().toISOString(),
        });
      },

      requestHandoff: (accountId, notes) => {
        get().updateAccount(accountId, {
          agentStatus: 'handoff_ready',
          handoffRequestedAt: new Date().toISOString(),
          handoffNotes: notes,
        });
      },

      upsertChannelConnection: (conn) => {
        set((s) => {
          const exists = s.channelConnections.findIndex((c) => c.id === conn.id);
          if (exists >= 0) {
            const next = [...s.channelConnections];
            next[exists] = { ...conn, updatedAt: new Date().toISOString() };
            return { channelConnections: next };
          }
          return {
            channelConnections: [
              ...s.channelConnections,
              {
                ...conn,
                createdAt: conn.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      removeChannelConnection: (id) => {
        set((s) => ({
          channelConnections: s.channelConnections.filter((c) => c.id !== id),
        }));
      },

      setSelectedOwner: (email) => set({ selectedOwnerEmail: email }),
      setSelectedOperation: (op) => set({ selectedOperation: op }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      getFilteredAccounts: () => {
        const { accounts, selectedOwnerEmail, selectedOperation, searchQuery } = get();
        return accounts.filter((a) => {
          if (selectedOwnerEmail !== 'ALL' && a.ownerEmail !== selectedOwnerEmail) return false;
          if (selectedOperation !== 'ALL' && a.operation !== selectedOperation) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const hay = `${a.name} ${a.cityState} ${a.product} ${a.contacts.map((c) => c.name).join(' ')}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
      },

      getAccountById: (id) => get().accounts.find((a) => a.id === id),
    }),
    {
      name: 'ciamakers_crm_official_prod_db',
      partialize: (state) => ({
        accounts: state.accounts,
        products: state.products,
        users: state.users,
        passwordMap: state.passwordMap,
        channelConnections: state.channelConnections,
        setupCompleted: state.setupCompleted,
      }),
    }
  )
);
