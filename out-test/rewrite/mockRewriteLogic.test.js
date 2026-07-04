"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mockRewriteLogic_js_1 = require("./mockRewriteLogic.js");
(0, node_test_1.describe)('parseConventionalCommit', () => {
    (0, node_test_1.it)('parses scoped conventional commits', () => {
        const parsed = (0, mockRewriteLogic_js_1.parseConventionalCommit)('feat(auth): add login');
        strict_1.default.deepEqual(parsed, {
            type: 'feat',
            scope: 'auth',
            breaking: undefined,
            subject: 'add login',
        });
    });
});
(0, node_test_1.describe)('buildSubject', () => {
    (0, node_test_1.it)('prefixes verb when missing', () => {
        strict_1.default.equal((0, mockRewriteLogic_js_1.buildSubject)('validation', 'convince'), 'convince validation');
    });
    (0, node_test_1.it)('does not duplicate an existing verb prefix', () => {
        strict_1.default.equal((0, mockRewriteLogic_js_1.buildSubject)('convince validation', 'convince'), 'convince validation');
    });
});
(0, node_test_1.describe)('pickVerb', () => {
    (0, node_test_1.it)('is deterministic for the same input', () => {
        const verbs = ['feed', 'convince', 'calm'];
        strict_1.default.equal((0, mockRewriteLogic_js_1.pickVerb)(verbs, 'fix validation'), (0, mockRewriteLogic_js_1.pickVerb)(verbs, 'fix validation'));
    });
});
(0, node_test_1.describe)('buildMockRewriteMessage', () => {
    (0, node_test_1.it)('builds a persona-styled conventional commit', () => {
        const message = (0, mockRewriteLogic_js_1.buildMockRewriteMessage)('fix: validation', '🐄', ['convince', 'feed'], 72, (value) => value);
        strict_1.default.match(message, /^🐄 fix: /);
        strict_1.default.ok(message.includes('validation'));
    });
});
//# sourceMappingURL=mockRewriteLogic.test.js.map