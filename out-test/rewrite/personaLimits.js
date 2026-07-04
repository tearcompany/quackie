"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersonaMaxLength = getPersonaMaxLength;
exports.truncateToWordBoundary = truncateToWordBoundary;
const DEFAULT_MAX_LENGTH = 72;
function getPersonaMaxLength(metadata) {
    const value = metadata?.raw.max_length;
    return typeof value === 'number' ? value : DEFAULT_MAX_LENGTH;
}
function truncateToWordBoundary(text, maxLength) {
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
//# sourceMappingURL=personaLimits.js.map