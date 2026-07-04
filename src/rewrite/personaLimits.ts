import { PersonaMetadata } from '../personas/types';

const DEFAULT_MAX_LENGTH = 72;

export function getPersonaMaxLength(metadata: PersonaMetadata | undefined): number {
  const value = metadata?.raw.max_length;
  return typeof value === 'number' ? value : DEFAULT_MAX_LENGTH;
}

export function truncateToWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex <= 0) {
    return truncated.trimEnd();
  }

  return truncated.slice(0, lastSpaceIndex).trimEnd();
}
