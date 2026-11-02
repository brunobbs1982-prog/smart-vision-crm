import type {
  ChannelAdapter,
  SendMessagePayload,
  SendMessageResult,
  ProfileEnrichmentResult,
} from './types';
import type { ChannelConnection } from '@/types/crm.types';

/**
 * LinkedIn API oficial — escopos muito limitados para messaging.
 * Preferir para enriquecimento de perfil quando possível.
 */
export const linkedinApiAdapter: ChannelAdapter = {
  channel: 'linkedin',
  provider: 'api',

  async isReady(connection) {
    return connection.status === 'connected' && !!connection.accessToken;
  },

  async sendMessage(connection, payload: SendMessagePayload): Promise<SendMessageResult> {
    // A API oficial de messaging é restrita (Sales Navigator / partner programs).
    console.warn('[LinkedInAPI] Messaging via API oficial é limitado. Verifique escopos.');
    console.info('[LinkedInAPI] sendMessage mock', payload);
    return {
      success: false,
      error: 'LinkedIn Messaging API requer permissões especiais (não disponível na API pública padrão).',
      provider: 'api',
    };
  },

  async enrichProfile(connection, profileUrl): Promise<ProfileEnrichmentResult> {
    // Em produção: usar LinkedIn Profile API ou partner data.
    console.info('[LinkedInAPI] enrichProfile mock', profileUrl);
    return {
      success: true,
      data: {
        profileUrl,
        name: 'Nome (mock)',
        headline: 'Headline (mock)',
        about: 'Sobre (mock) — substituir por chamada real à API ou enriquecimento.',
      },
    };
  },
};

/**
 * LinkedIn via Browser Automation (estilo humano)
 * Alto risco de banimento se usado em volume.
 * Use apenas com limites rígidos, delays humanos e preferencialmente modo assistido.
 */
export const linkedinBrowserAdapter: ChannelAdapter = {
  channel: 'linkedin',
  provider: 'browser',

  async isReady(connection) {
    return connection.status === 'connected' && !!connection.metadata?.sessionId;
  },

  async sendMessage(connection, payload): Promise<SendMessageResult> {
    // Backend Playwright/Puppeteer faria:
    // 1. Abrir sessão persistente
    // 2. Navegar até o perfil / inbox
    // 3. Digitar com delay humano
    // 4. Enviar
    console.warn('[LinkedInBrowser] Automação de browser viola os Termos do LinkedIn em muitos casos.');
    console.info('[LinkedInBrowser] sendMessage mock', payload);
    return {
      success: true,
      externalId: `li-browser-${Date.now()}`,
      provider: 'browser',
    };
  },

  async enrichProfile(connection, profileUrl): Promise<ProfileEnrichmentResult> {
    console.info('[LinkedInBrowser] enrichProfile mock', profileUrl);
    return {
      success: true,
      data: {
        profileUrl,
        name: 'Perfil enriquecido via browser (mock)',
        headline: 'Headline capturada',
        location: 'Brasil',
        about: 'Texto extraído da página de perfil (mock).',
      },
    };
  },
};
