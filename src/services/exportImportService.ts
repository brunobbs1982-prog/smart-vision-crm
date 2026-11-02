import type { AccountOpportunity, PlatformUser, ChannelConnection, ProductCatalogItem } from '@/types/crm.types';

export const SCHEMA_VERSION = 4;

export interface CrmSnapshot {
  schemaVersion: number;
  exportedAt: string;
  accounts: AccountOpportunity[];
  products: ProductCatalogItem[];
  users?: Pick<PlatformUser, 'id' | 'email' | 'name' | 'role' | 'phone' | 'isActive' | 'createdAt'>[];
  channelConnections?: ChannelConnection[];
}

export function buildSnapshot(data: {
  accounts: AccountOpportunity[];
  products: ProductCatalogItem[];
  users: PlatformUser[];
  channelConnections: ChannelConnection[];
}): CrmSnapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    accounts: data.accounts,
    products: data.products,
    users: data.users.map(({ id, email, name, role, phone, isActive, createdAt }) => ({
      id,
      email,
      name,
      role,
      phone,
      isActive,
      createdAt,
    })),
    channelConnections: data.channelConnections,
  };
}

export function downloadSnapshot(snapshot: CrmSnapshot, filename = 'smart-vision-backup.json') {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Merge não destrutivo por id ou nome normalizado */
export function mergeAccountsNonDestructive(
  existing: AccountOpportunity[],
  incoming: AccountOpportunity[]
): AccountOpportunity[] {
  const byId = new Map(existing.map((a) => [a.id, a]));
  const byName = new Map(existing.map((a) => [a.name.toLowerCase().trim(), a]));

  for (const inc of incoming) {
    const match = byId.get(inc.id) || byName.get(inc.name.toLowerCase().trim());
    if (!match) {
      byId.set(inc.id, inc);
      continue;
    }
    const contactIds = new Set(match.contacts.map((c) => c.id));
    const taskIds = new Set(match.tasks.map((t) => t.id));
    const intIds = new Set(match.interactions.map((i) => i.id));
    const merged: AccountOpportunity = {
      ...match,
      ...inc,
      id: match.id,
      contacts: [
        ...match.contacts,
        ...inc.contacts.filter((c) => !contactIds.has(c.id)),
      ],
      tasks: [...match.tasks, ...inc.tasks.filter((t) => !taskIds.has(t.id))],
      interactions: [
        ...match.interactions,
        ...inc.interactions.filter((i) => !intIds.has(i.id)),
      ],
      updatedAt: new Date().toISOString(),
    };
    byId.set(match.id, merged);
  }
  return Array.from(byId.values());
}

export function normalizeAccount(raw: Partial<AccountOpportunity> & { name: string }): AccountOpportunity {
  const now = new Date().toISOString();
  return {
    id: raw.id || `acc-${Date.now()}`,
    name: raw.name,
    cityState: raw.cityState || '',
    cnpj: raw.cnpj,
    website: raw.website,
    operation: raw.operation || 'OP1',
    status: raw.status || 'lead',
    stage: raw.stage || 'nutricao',
    product: raw.product || '',
    value: Number(raw.value) || 0,
    ownerEmail: raw.ownerEmail || '',
    ownerName: raw.ownerName || '',
    origin: raw.origin || 'Executivo',
    nextAction: raw.nextAction || '',
    nextDate: raw.nextDate || now.slice(0, 10),
    notes: raw.notes || '',
    contacts: raw.contacts || [],
    tasks: raw.tasks || [],
    interactions: raw.interactions || [],
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    agentStatus: raw.agentStatus || 'idle',
    agentEnabled: raw.agentEnabled ?? true,
    linkedinProfileUrl: raw.linkedinProfileUrl,
    lastAgentRunAt: raw.lastAgentRunAt,
    nextAgentCheckAt: raw.nextAgentCheckAt,
    handoffRequestedAt: raw.handoffRequestedAt,
    handoffNotes: raw.handoffNotes,
  };
}
