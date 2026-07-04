import { Configuration } from '../config/Configuration';
import { PersonaMetadata } from '../personas/types';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { getPersonaMaxLength, truncateToWordBoundary } from './personaLimits';
import { RewriteService } from './RewriteService';
import { RewriteRequest } from './types';

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

/**
 * Calls Quackie's own backend, which holds the real model credentials and
 * forwards requests to the underlying rewrite model. The extension never
 * sees or stores any API key — see app/api/rewrite/route.ts in the
 * quackie-marketing-landing-page project for the server side.
 */
export class QuackieRewriteService implements RewriteService {
  constructor(
    private readonly personaRegistry: PersonaRegistry,
    private readonly configuration: Configuration,
  ) {}

  async rewrite(request: RewriteRequest): Promise<string> {
    const metadata = this.personaRegistry.getMetadata(request.persona);
    const apiUrl = this.configuration.getApiUrl();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildRequestBody(request, metadata)),
    });

    const body = (await response.json().catch(() => ({}))) as QuackieApiResponseBody;

    if (!response.ok) {
      throw new Error(body.error ?? `Quackie API request failed (${response.status})`);
    }

    if (!body.text) {
      throw new Error('Quackie API returned an empty rewrite');
    }

    const maxLength = getPersonaMaxLength(metadata);
    return truncateToWordBoundary(body.text.trim(), maxLength);
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
