// ============================================================
// SMART V.I.S.I.O.N. CRM — Core Types (v4.0 Autonomous Ready)
// ============================================================

export type OperationUnitCode = 'OP1' | 'OP2' | 'OP3';

export type AccountStatus = 'lead' | 'prospect' | 'ativo' | 'desativado';

export type FunnelStageId =
  | 'nutricao'
  | 'mapeamento'
  | 'abordagem'
  | 'apresentacao'
  | 'negociacao'
  | 'fechamento';

export type OpportunityOrigin =
  | 'Executivo'
  | 'IA'
  | 'LinkedIn Insight'
  | 'Evento'
  | 'Webinar'
  | 'Indicação'
  | 'Site';

export type DecisionRole = 'Decisor' | 'Influenciador' | 'Não definido';

export type TaskChannelType = 'Ligação' | 'E-mail' | 'Reunião' | 'WhatsApp' | 'Follow-up' | 'LinkedIn';

export type InteractionChannel = 'WhatsApp' | 'E-mail' | 'LinkedIn' | 'Reunião' | 'Ligação';

// --- Agent types (preparado para autonomia) ---
export type AgentStatus =
  | 'idle'
  | 'researching'
  | 'messaging'
  | 'waiting_response'
  | 'follow_up'
  | 'handoff_ready'
  | 'paused'
  | 'completed';

export type ChannelProvider = 'api' | 'browser' | 'connector' | 'manual';

export type ChannelType = 'gmail' | 'whatsapp' | 'linkedin';

// --- User & Auth ---
export interface PlatformUser {
  id: string;
  email: string;
  passwordHash?: string; // never store plain password
  name: string;
  phone?: string;
  role: 'admin' | 'executivo' | 'viewer';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface AuthSession {
  user: PlatformUser;
  token: string;
  expiresAt: string;
}

// --- Contact ---
export interface Contact {
  id: string;
  name: string;
  role: string;
  decisionRole: DecisionRole;
  email: string;
  phone: string;
  linkedin: string;
  instagram: string;
  notes: string;
}

// --- Task ---
export interface OpportunityTask {
  id: string;
  title: string;
  type: TaskChannelType;
  dueDate: string; // YYYY-MM-DD
  contactName: string;
  ownerEmail: string;
  ownerName: string;
  notes: string;
  done: boolean;
  completedAt?: string | null;
  createdByAgent?: boolean;
}

// --- Interaction Log ---
export interface InteractionLog {
  id: string;
  channel: InteractionChannel;
  outcome: string;
  date: string; // YYYY-MM-DD
  summary: string;
  nextAction?: string;
  nextDate?: string;
  done?: boolean;
  createdByAgent?: boolean;
  messageContent?: string;
  externalId?: string; // id da mensagem no canal (gmail message-id, whatsapp wamid, etc.)
}

// --- Account + Opportunity (núcleo) ---
export interface AccountOpportunity {
  id: string;
  name: string;
  cityState: string;
  cnpj?: string;
  website?: string;
  operation: OperationUnitCode;
  status: AccountStatus;
  stage: FunnelStageId;
  product: string;
  value: number;
  ownerEmail: string;
  ownerName: string;
  origin: OpportunityOrigin;
  nextAction: string;
  nextDate: string;
  notes: string;
  contacts: Contact[];
  tasks: OpportunityTask[];
  interactions: InteractionLog[];
  updatedAt: string;
  createdAt: string;

  // Agent fields
  agentStatus: AgentStatus;
  agentEnabled: boolean;
  lastAgentRunAt?: string;
  nextAgentCheckAt?: string;
  handoffRequestedAt?: string;
  handoffNotes?: string;
  linkedinProfileUrl?: string;
  lastEnrichedAt?: string;
}

// --- Product Catalog ---
export interface ProductCatalogItem {
  id: string;
  name: string;
  operation: OperationUnitCode;
  price: number;
  description: string;
}

// --- Knowledge Base Cards ---
export type KnowledgeBaseRuleId =
  | 'ALL'
  | 'FOCUS_LEAD_PROSPECT'
  | 'AT_RISK'
  | 'ACTIVE_FUNNEL'
  | 'MULTICHANNEL_READY'
  | 'DECISION_MAKER'
  | 'PRE_SCHEDULED_REVIEW';

export interface CustomAnalyticsCard {
  id: string;
  title: string;
  kbRule: KnowledgeBaseRuleId;
  ownerEmail: string | 'ALL';
  operation: OperationUnitCode | 'ALL';
  stage: FunnelStageId | 'ALL';
  origin: OpportunityOrigin | 'ALL';
  metric: 'SUM_VALUE' | 'WEIGHTED_FORECAST' | 'COUNT_ACCOUNTS' | 'PENDING_TASKS';
  chartType: 'STAGE_BARS' | 'OWNER_SPLIT' | 'TOP_ACCOUNTS';
  pinToHome: boolean;
}

// --- Channel Connection (preparado para API / Browser / Connector) ---
export interface ChannelConnection {
  id: string;
  userId: string;
  channel: ChannelType;
  provider: ChannelProvider; // 'api' | 'browser' | 'connector' | 'manual'
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'expired';
  displayName?: string; // ex: "bruno@empresa.com" ou "WhatsApp Business +55..."
  accessToken?: string; // encrypted in real backend
  refreshToken?: string;
  expiresAt?: string;
  metadata: Record<string, unknown>; // phone_number_id, browser_session_id, etc.
  lastUsedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Agent Run / Decision (auditoria) ---
export interface AgentDecision {
  id: string;
  timestamp: string;
  reasoning: string;
  action: 'send_message' | 'create_task' | 'advance_stage' | 'request_handoff' | 'wait' | 'enrich_profile';
  channel?: InteractionChannel;
  messageDraft?: string;
  executed: boolean;
  result?: string;
}

export interface AgentRun {
  id: string;
  accountId: string;
  startedAt: string;
  finishedAt?: string;
  status: AgentStatus;
  currentStep: string;
  decisions: AgentDecision[];
  summary?: string;
}

// --- Helper for funnel ---
export interface FunnelStageConfig {
  id: FunnelStageId;
  label: string;
  weight: number;
  avgDays: number;
  color: string;
}
