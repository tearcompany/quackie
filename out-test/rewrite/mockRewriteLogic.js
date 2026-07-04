"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConventionalCommit = parseConventionalCommit;
exports.hashString = hashString;
exports.pickVerb = pickVerb;
exports.buildSubject = buildSubject;
exports.buildMockRewriteMessage = buildMockRewriteMessage;
const CONVENTIONAL_COMMIT_PATTERN = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<subject>.*)$/i;
function parseConventionalCommit(text) {
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
function hashString(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
}
function pickVerb(verbs, text) {
    if (verbs.length === 0) {
        return 'rewrite';
    }
    const index = hashString(text) % verbs.length;
    return verbs[index];
}
function buildSubject(originalSubject, verb) {
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
function buildMockRewriteMessage(text, emoji, verbs, maxLength, truncate) {
    const parsed = parseConventionalCommit(text);
    const verb = pickVerb(verbs, text);
    const subject = buildSubject(parsed?.subject ?? text, verb);
    let message;
    if (parsed) {
        const scopePart = parsed.scope ? `(${parsed.scope})` : '';
        const breakingPart = parsed.breaking ? '!' : '';
        message = `${emoji} ${parsed.type}${scopePart}${breakingPart}: ${subject}`;
    }
    else {
        message = `${emoji} ${subject}`;
    }
    return truncate(message, maxLength);
}
//# sourceMappingURL=mockRewriteLogic.js.map