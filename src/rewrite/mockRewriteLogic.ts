const CONVENTIONAL_COMMIT_PATTERN =
  /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<subject>.*)$/i;

export function parseConventionalCommit(text: string): {
  type: string;
  scope?: string;
  breaking?: string;
  subject: string;
} | undefined {
  const match = text.trim().match(CONVENTIONAL_COMMIT_PATTERN);
  if (!match?.groups) {
    return undefined;
  }

  return {
    type: match.groups.type,
    scope: match.groups.scope,
    breaking: match.groups.breaking,
    subject: match.groups.subject.trim(),
  };
}

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickVerb(verbs: string[], text: string): string {
  if (verbs.length === 0) {
    return 'rewrite';
  }

  const index = hashString(text) % verbs.length;
  return verbs[index];
}

export function buildSubject(originalSubject: string, verb: string): string {
  const trimmed = originalSubject.trim();
  if (!trimmed) {
    return verb;
  }

  const lowerVerb = verb.toLowerCase();
  const lowerSubject = trimmed.toLowerCase();

  if (lowerSubject.startsWith(`${lowerVerb} `)) {
    return trimmed;
  }

  return `${verb} ${trimmed}`;
}

export function buildMockRewriteMessage(
  text: string,
  emoji: string,
  verbs: string[],
  maxLength: number,
  truncate: (value: string, limit: number) => string,
): string {
  const parsed = parseConventionalCommit(text);
  const verb = pickVerb(verbs, text);
  const subject = buildSubject(parsed?.subject ?? text, verb);

  let message: string;
  if (parsed) {
    const scopePart = parsed.scope ? `(${parsed.scope})` : '';
    const breakingPart = parsed.breaking ? '!' : '';
    message = `${emoji} ${parsed.type}${scopePart}${breakingPart}: ${subject}`;
  } else {
    message = `${emoji} ${subject}`;
  }

  return truncate(message, maxLength);
}
