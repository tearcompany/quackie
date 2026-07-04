import { PersonaRegistry } from '../personas/PersonaRegistry';
import { getPersonaMaxLength, truncateToWordBoundary } from './personaLimits';
import {
  buildMockRewriteMessage,
} from './mockRewriteLogic';
import { RewriteService } from './RewriteService';
import { RewriteRequest } from './types';

export class MockRewriteService implements RewriteService {
  constructor(private readonly personaRegistry: PersonaRegistry) {}

  async rewrite(request: RewriteRequest): Promise<string> {
    const metadata = this.personaRegistry.getMetadata(request.persona);
    if (!metadata) {
      return request.text;
    }

    const verbs = this.extractVerbs(metadata.raw);
    const maxLength = getPersonaMaxLength(metadata);
    return buildMockRewriteMessage(
      request.text,
      metadata.emoji,
      verbs,
      maxLength,
      truncateToWordBoundary,
    );
  }

  private extractVerbs(raw: Record<string, unknown>): string[] {
    if (!Array.isArray(raw.verbs)) {
      return ['rewrite'];
    }

    return raw.verbs.filter((verb): verb is string => typeof verb === 'string');
  }
}
