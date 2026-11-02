import type { ChannelType, ChannelProvider, ChannelConnection } from '@/types/crm.types';

export interface SendMessagePayload {
  to: string; // email, phone (E.164) or LinkedIn profile URL / URN
  subject?: string;
  body: string;
  accountId?: string;
  contactId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  success: boolean;
  externalId?: string;
  error?: string;
  provider: ChannelProvider;
}

export interface ProfileEnrichmentResult {
  success: boolean;
  data?: {
    name?: string;
    headline?: string;
    company?: string;
    location?: string;
    about?: string;
    profileUrl?: string;
    raw?: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Contrato que todo conector de canal deve implementar.
 * Permite trocar a implementação (API oficial, browser automation, connector externo)
 * sem mudar o resto do sistema.
 */
export interface ChannelAdapter {
  readonly channel: ChannelType;
  readonly provider: ChannelProvider;

  /** Verifica se a conexão está válida e pronta para uso */
  isReady(connection: ChannelConnection): Promise<boolean>;

  /** Envia mensagem */
  sendMessage(connection: ChannelConnection, payload: SendMessagePayload): Promise<SendMessageResult>;

  /** (Opcional) Lê perfil — especialmente útil para LinkedIn */
  enrichProfile?(
    connection: ChannelConnection,
    profileUrl: string
  ): Promise<ProfileEnrichmentResult>;

  /** Inicia fluxo de autenticação / autorização (OAuth ou browser login) */
  connect?(userId: string): Promise<{ authUrl?: string; sessionId?: string } | void>;

  /** Desconecta e limpa tokens/sessão */
  disconnect?(connection: ChannelConnection): Promise<void>;
}
