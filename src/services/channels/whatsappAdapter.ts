import type { ChannelAdapter, SendMessagePayload, SendMessageResult } from './types';
import type { ChannelConnection } from '@/types/crm.types';

/**
 * WhatsApp Business API (oficial Meta)
 * Requer: WhatsApp Business Account + phone_number_id + permanent token
 */
export const whatsappApiAdapter: ChannelAdapter = {
  channel: 'whatsapp',
  provider: 'api',

  async isReady(connection) {
    return (
      connection.status === 'connected' &&
      !!connection.accessToken &&
      !!connection.metadata?.phoneNumberId
    );
  },

  async sendMessage(connection, payload: SendMessagePayload): Promise<SendMessageResult> {
    // TODO: POST https://graph.facebook.com/v20.0/{phone-number-id}/messages
    console.info('[WhatsAppAPI] sendMessage mock', {
      phoneNumberId: connection.metadata?.phoneNumberId,
      to: payload.to,
      body: payload.body.slice(0, 80),
    });

    return {
      success: true,
      externalId: `wamid.mock.${Date.now()}`,
      provider: 'api',
    };
  },
};

/**
 * WhatsApp via Browser (não recomendado para produção — risco de ban)
 * Mantido apenas como opção de protótipo / volume muito baixo.
 */
export const whatsappBrowserAdapter: ChannelAdapter = {
  channel: 'whatsapp',
  provider: 'browser',

  async isReady(connection) {
    return connection.status === 'connected' && !!connection.metadata?.sessionId;
  },

  async sendMessage(connection, payload): Promise<SendMessageResult> {
    console.warn('[WhatsAppBrowser] Modo browser não é suportado oficialmente. Preferir Business API.');
    console.info('[WhatsAppBrowser] sendMessage mock', payload);
    return {
      success: true,
      externalId: `wa-browser-${Date.now()}`,
      provider: 'browser',
    };
  },
};
