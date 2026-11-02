import type { ChannelAdapter, SendMessagePayload, SendMessageResult } from './types';
import type { ChannelConnection } from '@/types/crm.types';

/**
 * Adapter Gmail — preparado para Google API (OAuth2).
 * Em produção: usar googleapis + refresh token.
 * Aqui deixamos o contrato e um modo "manual/demo".
 */
export const gmailApiAdapter: ChannelAdapter = {
  channel: 'gmail',
  provider: 'api',

  async isReady(connection) {
    return connection.status === 'connected' && !!connection.accessToken;
  },

  async sendMessage(connection, payload: SendMessagePayload): Promise<SendMessageResult> {
    // TODO: integrar com Gmail API
    // const gmail = google.gmail({ version: 'v1', auth });
    // await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });

    console.info('[GmailAPI] sendMessage mock', {
      from: connection.displayName,
      to: payload.to,
      subject: payload.subject,
    });

    return {
      success: true,
      externalId: `gmail-mock-${Date.now()}`,
      provider: 'api',
    };
  },

  async connect(userId) {
    // Em produção: gerar URL de OAuth Google
    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT&redirect_uri=...&scope=https://www.googleapis.com/auth/gmail.send&state=${userId}`,
    };
  },
};

/**
 * Adapter Gmail via Browser (Playwright / Puppeteer estilo humano)
 * Útil quando a API não está disponível ou para contas pessoais.
 */
export const gmailBrowserAdapter: ChannelAdapter = {
  channel: 'gmail',
  provider: 'browser',

  async isReady(connection) {
    return connection.status === 'connected' && !!connection.metadata?.sessionId;
  },

  async sendMessage(connection, payload): Promise<SendMessageResult> {
    // TODO: chamar backend que controla Playwright
    // await browserService.run('gmail-send', { sessionId, to, subject, body })
    console.info('[GmailBrowser] sendMessage mock', payload);
    return {
      success: true,
      externalId: `gmail-browser-${Date.now()}`,
      provider: 'browser',
    };
  },
};
