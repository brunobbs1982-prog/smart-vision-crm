import type { ChannelType, ChannelProvider, ChannelConnection } from '@/types/crm.types';
import type { ChannelAdapter, SendMessagePayload, SendMessageResult } from './types';
import { gmailApiAdapter, gmailBrowserAdapter } from './gmailAdapter';
import { whatsappApiAdapter, whatsappBrowserAdapter } from './whatsappAdapter';
import { linkedinApiAdapter, linkedinBrowserAdapter } from './linkedinAdapter';

const adapters: Record<string, ChannelAdapter> = {
  'gmail:api': gmailApiAdapter,
  'gmail:browser': gmailBrowserAdapter,
  'whatsapp:api': whatsappApiAdapter,
  'whatsapp:browser': whatsappBrowserAdapter,
  'linkedin:api': linkedinApiAdapter,
  'linkedin:browser': linkedinBrowserAdapter,
};

export function getAdapter(channel: ChannelType, provider: ChannelProvider): ChannelAdapter | null {
  return adapters[`${channel}:${provider}`] ?? null;
}

/**
 * Envia mensagem usando a conexão configurada do usuário.
 * Escolhe automaticamente o adapter correto (api | browser | connector).
 */
export async function sendViaConnection(
  connection: ChannelConnection,
  payload: SendMessagePayload
): Promise<SendMessageResult> {
  const adapter = getAdapter(connection.channel, connection.provider);
  if (!adapter) {
    return {
      success: false,
      error: `Adapter não encontrado para ${connection.channel}:${connection.provider}`,
      provider: connection.provider,
    };
  }

  const ready = await adapter.isReady(connection);
  if (!ready) {
    return {
      success: false,
      error: 'Conexão não está pronta (token/sessão inválida ou expirada).',
      provider: connection.provider,
    };
  }

  return adapter.sendMessage(connection, payload);
}

export * from './types';
export { gmailApiAdapter, gmailBrowserAdapter } from './gmailAdapter';
export { whatsappApiAdapter, whatsappBrowserAdapter } from './whatsappAdapter';
export { linkedinApiAdapter, linkedinBrowserAdapter } from './linkedinAdapter';
