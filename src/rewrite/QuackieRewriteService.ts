import { Configuration } from '../config/Configuration';
import { PersonaMetadata } from '../personas/types';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { InstallTokenClient } from './InstallTokenClient';
import { getPersonaMaxLength, truncateToWordBoundary } from './personaLimits';
import { RewriteService } from './RewriteService';
import { RewriteRequest } from './types';

const REQUEST_TIMEOUT_MS = 30_000;

interface QuackieApiRequestBody {
  persona: string;
  type: string;
  text: string;
  personaName?: string;
  personaEmoji?: string;
  personaSystemPrompt?: string;
  personaMetadata?: Record<string, unknown>;
}

interface QuackieApiResponseBody {
  text?: string;
  error?: string;
}

export class QuackieRewriteService implements RewriteService {
  constructor(
    private readonly personaRegistry: PersonaRegistry,
    private readonly configuration: Configuration,
    private readonly installTokenClient: InstallTokenClient,
  ) {}

  async rewrite(request: RewriteRequest): Promise<string> {
    const metadata = this.personaRegistry.getMetadata(request.persona);
    const apiUrl = this.configuration.getApiUrl();
    const body = this.buildRequestBody(request, metadata);

    let token = await this.installTokenClient.getToken();
    let response = await this.postRewrite(apiUrl, body, token);

    if (response.status === 401) {
      token = await this.installTokenClient.clearAndRefresh();
      response = await this.postRewrite(apiUrl, body, token);
    }

    const responseBody = (await response.json().catch(() => ({}))) as QuackieApiResponseBody;

    if (!response.ok) {
      throw new Error(responseBody.error ?? `Quackie API request failed (${response.status})`);
    }

    if (!responseBody.text) {
      throw new Error('Quackie API returned an empty rewrite');
    }

    const maxLength = getPersonaMaxLength(metadata);
    return truncateToWordBoundary(responseBody.text.trim(), maxLength);
  }

  private async postRewrite(
    apiUrl: string,
    body: QuackieApiRequestBody,
    token: string,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Quackie rewrite timed out. Check your connection and try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildRequestBody(
    request: RewriteRequest,
    metadata: PersonaMetadata | undefined,
  ): QuackieApiRequestBody {
    return {
      persona: request.persona,
      type: request.type,
      text: request.text,
      personaName: metadata?.name ?? request.persona,
      personaEmoji: metadata?.emoji ?? '',
      personaSystemPrompt: metadata?.systemPrompt ?? '',
      personaMetadata: metadata?.raw ?? {},
    };
  }
}
